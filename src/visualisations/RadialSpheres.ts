import { ICoordinate, IDerivedFingerPrint } from "../types";
import { bezierVector, buildAttribute, chunk, createShaderControls, customRandom, debugLine, ImgSampler, pickRandom, preProcessTexture } from "../utils";
import { CatmullRomCurve3, Vector3, Mesh, Object3D, LineBasicMaterial, Scene, ShaderMaterial, SphereBufferGeometry, TextureLoader, BufferGeometry, Line, Vector2, BoxGeometry, BoxBufferGeometry, RepeatWrapping, SplineCurve, Camera, Shader, TubeGeometry, MeshBasicMaterial, CurvePath, QuadraticBezierCurve3, Curve, Float32BufferAttribute, Points, InstancedMesh, DynamicDrawUsage, InstancedBufferGeometry, InstancedBufferAttribute, IcosahedronBufferGeometry, Matrix4, TorusBufferGeometry, Quaternion, RawShaderMaterial, BackSide, MathUtils, CubicBezierCurve3, Vector, WebGLRenderer, WebGLRenderTarget, PlaneGeometry, OrthographicCamera, AdditiveBlending, Color, BufferAttribute } from "three";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import RingFragShader from '../shaders/v1_rings_frag.glsl';
import RingVertShader from '../shaders/v1_rings_vert.glsl';
import ColorSchemeImg from '../assets/color_scheme.jpg';
import CircleLineGeometry from '../helpers/CircleLineGeometry';
import CrossLineGeometry from "../helpers/CrossLineGeometry";
import RingBarGeometry from "../helpers/RingBarGeometry";
import FlagMesh from "../helpers/FlagMesh";
import TubeShaderFrag from '../shaders/tube_frag.glsl';
import TubeShaderVert from '../shaders/tube_vert.glsl';
import ParticleVert from '../shaders/particle_vert.glsl';
import ParticleFrag from '../shaders/particle_frag.glsl';
import BackgroundFloorVert from '../shaders/background_floor_vert.glsl';
import BackgroundFloorFrag from '../shaders/background_floor_frag.glsl';
import { ISettings } from "@/main";
import gui from "../helpers/gui";
import GUI from "lil-gui";
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { ToonShader1 } from 'three/examples/jsm/shaders/ToonShader';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader';

const tl = new TextureLoader();
export default class RadialSphere extends Object3D {
  points: Mesh|undefined;
  outlines: Mesh|undefined;
  mainLines: Mesh[] = [];
  flags: FlagMesh[] = [];
  extraLines: Mesh[] = [];
  rings: Line[] = [];
  barGraph: Line;
  floor: Mesh|undefined;
  folder: GUI;
  constructor(private scene: Scene, private camera: Camera, renderer: WebGLRenderer, private fingerprint: IDerivedFingerPrint, settings: ISettings) {
    super();

    const elementsFolder = gui.addFolder('Scene Elements');
    this.folder = elementsFolder;

    const { sizeSmall, sizeMed, sizeMdLg, sizeLarge } = settings.featurePoints
    const sizeBezierPoints = [
      new Vector2(0, sizeSmall),
      new Vector2(0.25, sizeMed),
      new Vector2(0.5, sizeMdLg),
      new Vector2(1, sizeLarge),
    ];
    const scaleSize = (t: number) => {
      const [a, b, c, d] = sizeBezierPoints;
      return bezierVector(a,b,c,d,t)
    }

    const colorSchemeTexture = tl.load(ColorSchemeImg);
    colorSchemeTexture.wrapS = RepeatWrapping;
    colorSchemeTexture.wrapT = RepeatWrapping;

    // Add rings for flare
    const geo = new CircleLineGeometry(1, 512, fingerprint);
    const matGrey = new LineBasicMaterial({ color: 0x666666 });
    const matWhite = new LineBasicMaterial({ color: 0xdddddd });
    const l = new Line(geo, matWhite);
    l.position.setY(-0.1);
    l.rotateX(Math.PI / 2)
    l.scale.setScalar(0.9);
    this.add(l);

    const ringBarGeo = new RingBarGeometry(3.22, fingerprint, 0.0013);
    const ringBarLine = new Line(ringBarGeo, matWhite);
    ringBarLine.rotateX(Math.PI / 2);
    this.add(ringBarLine);
    this.barGraph = ringBarLine;
    this.barGraph.visible = settings.sceneElements.circumferenceGraph;


    const greyRing = l.clone();
    const ringShaderMat = new ShaderMaterial({
      vertexShader: RingVertShader,
      fragmentShader: RingFragShader,
    })
    // @ts-ignore
    greyRing.material = ringShaderMat;
    new Array(20).fill(0).forEach((_, i) => {
      const ring = greyRing.clone()
      ring.scale.setScalar(4.0 + i * 0.3);
      this.add(ring);
      ring.visible = settings.sceneElements.rings;
      this.rings.push(ring);
    })

    const { sin, cos, floor, max, pow } = Math;
    const [ width, height ] = fingerprint.shape;
    const colorSampler = new ImgSampler(ColorSchemeImg);
    (async () => {

      await colorSampler.loading;

      const scale = (500 + max(-pow(height, 0.8), -pow(height, 0.7)-100, -pow(height, 0.6)-150)) / 400 * 0.15
      const coords = fingerprint.coords.map(p => {
        const theta = (p.x / height) * Math.PI * 2;
        const x = sin(theta);
        const z = cos(theta);
        const step = floor(theta / (Math.PI * 2));
        const amp = p.y / width * 2;
        const r = step + 1.0 + amp;

        const s = (Math.abs(p.g - 0.5) + scale) * scale;

        const { baseVariation, velocityVariation } = settings.color;
        const smoothhash = (fingerprint.floatHash + sin(theta) * baseVariation + p.g * velocityVariation) % 1;

        const c = colorSampler.getPixel(smoothhash, 0.5);
        const pixels = Float32Array.from(c.data).map(v => v/255);

        return {
          ...p,
          theta,
          pos: new Vector3(x * r, 0, z * r),
          scale: s,
          smoothhash,
          color: new Color(...pixels),
        }
      });

      // Build main points, feature points, outlines
      (async () => {
        console.log(' ~~~ Building main points + outlines ~~~')
        const outlineM = new MeshBasicMaterial({
          color: 0xffffff,
          side: BackSide,
          depthWrite: false,
        })

        // Build geometry 
        const g = new SphereBufferGeometry(1);
        const m = new ShaderMaterial({
          fragmentShader: FragShader,
          vertexShader: VertShader,
          uniforms: {
            u_innerColorMultiplier: { value: 2.0, },
            u_outerColorMultiplier: { value: 1, },
            u_cameraDirection: { value: new Vector3() },
          }
        })

        const points = new InstancedMesh(g, m, coords.length);
        const outlines = new InstancedMesh(g, outlineM, coords.length);

        const mat4 = new Matrix4();
        const rot = new Quaternion();
        const scale = new Vector3();

        const { outlineSize, outlineMultiplier, outlineAdd, innerGlow } = settings.points;
        coords.forEach((p, i) => {
          // Set transform of point
          if (p.featureLevel === 0) {
            scale.setScalar(p.scale);
          } else {
            scale.setScalar(scaleSize(p.featureLevel).y);
          }
          mat4.compose(p.pos, rot, scale);
          mat4.elements[15] = p.featureLevel * innerGlow;
          points.setMatrixAt(i, mat4);
          // Set transfomr of outline
          scale.setScalar(scale.x + outlineSize);
          mat4.compose(p.pos, rot, scale);
          outlines.setMatrixAt(i, mat4);

          // Set colour of point
          points.setColorAt(i, p.color);
          outlines.setColorAt(i, p.color.clone().multiplyScalar(outlineMultiplier).addScalar(outlineAdd));
        })

        this.points = points;
        this.outlines = outlines;
        this.add(this.points, this.outlines);
        console.log(points, outlines)
      })();
      // for (const p of coords) {
      //   const mesh = new Mesh(g, m);
      //   const outlineMesh = new Mesh(g, outlineM);
      //   outlineMesh.renderOrder = -1;

      //   // Position
      //   mesh.position.copy(p.pos);
      //   outlineMesh.position.copy(p.pos);

      //   // Size
      //   const { scale } = p;
      //   mesh.scale.setScalar(scale);
      //   outlineMesh.scale.setScalar(scale + settings.featurePoints.outlineSize);
      //   mesh.material.uniforms.u_innerColorMultiplier.value = 1.2 + p.featureLevel;
      //   if (p.featureLevel !== 0) {
      //     mesh.visible = true;
      //     mesh.scale.setScalar(scaleSize(p.featureLevel).y);
      //     outlineMesh.scale.setScalar(scaleSize(p.featureLevel).y + settings.featurePoints.outlineSize);
      //     // m.uniforms.u_innerColorMultiplier.value = p.featureLevel + 1;
      //   }

      //   // Orbit rings
      //   if (p.featureLevel !== 0) {
      //     const flag = new FlagMesh(10, 0.02, 0.3);
      //     flag.position.set(0, scaleSize(p.featureLevel).y, 0);
      //     this.flags.push(flag);
      //     flag.visible = false;
      //     mesh.add(flag);
      //   }

      //   // Colour
      //   const { color } = p;
      //   m.uniforms.u_floatHash.value = color;

      //   mesh.layers.enable(1);
      //   this.add(mesh);
      //   this.add(outlineMesh);
      //   this.points.push(mesh);
      //   this.outlines.push(outlineMesh);
      //   outlineMesh.visible = settings.sceneElements.outlines;
      // }

      // Bezier through feature points
      const featurePoints = coords.filter(p => p.featureLevel !== 0);
      const featurePositions = featurePoints.map(p => p.pos );

      // Generate main bezier
      const center = new Vector3();
      const { flareOut, flareIn, angleRandomness, verticalAngleRandomness, verticalIncidence } = settings.beziers;
      const firstDir = verticalIncidence 
        ? new Vector3(0, 1, 0)
        : featurePositions[0].clone().sub(center).normalize().multiplyScalar(-1);
      const [firstPoint, ...remainingPoints] = featurePositions;
      const traverseBeziers = (points: Vector3[], cur: Vector3, dir: Vector3, facingTowardsCenter: boolean, curves: Curve<Vector3>[] = [], firstPoint?: Vector3, firstDir?: Vector3): Curve<Vector3>[] => {
        const isLast = points.length === 0;
        const targetDist = 2;
        const next = isLast 
          ? firstPoint as Vector3 
          : points.reduce((acc, el) => {
              return Math.abs(targetDist - cur.distanceTo(el)) < Math.abs(targetDist - cur.distanceTo(acc)) ? el : acc
            }, points[0])
        const remaining = points.filter(el => !el.equals(next));

        const nextDir = isLast
          ? (firstDir as Vector3).multiplyScalar(-1)
          : verticalIncidence
            ? (facingTowardsCenter ? new Vector3(0, 1, 0) : new Vector3(0, -1, 0))
              .applyAxisAngle(new Vector3(0, 0, 1), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
              .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2)
            : next.clone().sub(center).normalize()
              .applyAxisAngle(new Vector3(0, 1, 0), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
              .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2);
        if (facingTowardsCenter && !isLast) nextDir.multiplyScalar(-1);
        const dist = cur.distanceTo(next);
        const handleDist = verticalIncidence
          ? flareOut * 2 + dist
          : facingTowardsCenter ? dist * flareIn : dist * flareOut;
        const anchor1 = cur.clone().add(dir.clone().multiplyScalar(handleDist))
        const anchor2 = next.clone().add(nextDir.clone().multiplyScalar(handleDist));
        
        curves.push(new CubicBezierCurve3(cur, anchor1, anchor2, next))

        if (isLast) {
          return curves;
        } else {
          return traverseBeziers(remaining, next, nextDir.multiplyScalar(-1), !facingTowardsCenter, curves, firstPoint ?? cur, firstDir ?? dir);
        }
      }
      const curves = traverseBeziers(remainingPoints, firstPoint, firstDir, true);

      const material = new ShaderMaterial({
        vertexShader: TubeShaderVert,
        fragmentShader: TubeShaderFrag,
        uniforms: {
          u_colorScheme: {
            value: ColorSchemeImg,
          }
        }
      });

      const curvesToBezier = (curves: Curve<Vector3>[], featurePoints: any, segments: number, radius: number, radialSegments: number) => {
        const retVal: Mesh[] = [];
        curves.forEach((curve, i) => {
          const tubeGeometry = new TubeGeometry( curve, segments, radius, radialSegments, false );
          const points = curve.getPoints(20);
          const curFeaturePoint = featurePoints[i];
          const nextFeaturePoint = i === featurePoints.length - 1 ? featurePoints[0] : featurePoints[i + 1];
          const colors = points.map((p, j) => {
            return MathUtils.mapLinear(j, 0, points.length, curFeaturePoint.color, nextFeaturePoint.color);
          })

          const posAttributeLength = tubeGeometry.getAttribute('position').array.length
          const colorsAttributeData = new Float32Array(posAttributeLength / 3);
          for (let i = 0; i < posAttributeLength / 3; i++) {
            const thisProgress = i / colorsAttributeData.length;
            const coloursIndex = Math.floor(thisProgress * colors.length);
            colorsAttributeData[i] = colors[coloursIndex]; 
          }
          tubeGeometry.setAttribute('color', new BufferAttribute(colorsAttributeData, 1));
          const curveObject = new Mesh( tubeGeometry, material );
          retVal.push(curveObject);
        })
        return retVal;
      }
      

      const mainBezierCurves = curvesToBezier(curves, featurePoints, 50, 0.01, 5);
      this.mainLines.push(...mainBezierCurves);
      this.add(...mainBezierCurves);

      // // Generate random secondary beziers
      (() => {
        const chunkedPoints = chunk(pickRandom(coords, 18), 6);
        chunkedPoints.forEach(points => {
          if (points.length < 4) return;
          const positions = points.map(p => {
            // Position
            const theta = (p.x / height) * Math.PI * 2;
            const x = sin(theta);
            const z = cos(theta);
            const step = floor(theta / (Math.PI * 2));
            const amp = p.y / width * 2;
            const r = step + 1.0 + amp ;
            return new Vector3(x * r, 0, z * r);
          });
          const [firstPoint, ...remainingPoints] = positions;
          const firstDir = positions[0].clone().sub(center).normalize().multiplyScalar(-1);
          const curves = traverseBeziers(remainingPoints, firstPoint, firstDir, true)
          const curvesMesh = curvesToBezier(curves, points, 50, 0.005, 3);
          this.add(...curvesMesh);
          this.extraLines.push(...curvesMesh);
        });
      })()

      // Build render target and background
      setTimeout(() => {
        (() => {
          const rtCam = new OrthographicCamera(-4, 4, 4, -4, 0.001, 100);
          rtCam.position.y = 10;
          rtCam.lookAt(0, 0, 0);
          rtCam.layers.enable(1)
          rtCam.layers.disable(0)
          const oldClearColor = new Color();
          renderer.getClearColor(oldClearColor);
          renderer.setClearColor(new Color(0x000000))

          const size = new Vector2();
          renderer.getSize(size);
          const rt = new WebGLRenderTarget(size.width, size.height)
          renderer.setRenderTarget(rt);
          renderer.render(scene, rtCam);
          renderer.setRenderTarget(null);
          const t = rt.texture;
          console.log(t);

          renderer.setClearColor(oldClearColor);

          preProcessTexture(renderer, t, [
            new ShaderPass(HorizontalBlurShader),
            new ShaderPass(VerticalBlurShader),
          ]).then(bloomMap => {
            const geo = new PlaneGeometry(8, 8)
            const mat = new ShaderMaterial({
              fragmentShader: BackgroundFloorFrag,
              vertexShader: BackgroundFloorVert,
              uniforms: {
                tex0: {
                  value: bloomMap,
                }
              },
              depthWrite: false,
              blending: AdditiveBlending,
            })
            const m = new Mesh(geo, mat);
            m.rotateX(-Math.PI / 2)
            m.position.y = -0.5;
            this.add(m);
            this.floor = m;
            m.visible = settings.sceneElements.reflection;
          });
        })()
      }, 1000)

      const updateVisibility = () => {
        if (this.floor) {
          this.floor.visible = settings.sceneElements.reflection;
        }
        if (this.outlines)
          this.outlines.visible = settings.sceneElements.outlines;
        
        this.mainLines.forEach(l => l.visible = settings.sceneElements.mainBezier);
        this.extraLines.forEach(l => l.visible = settings.sceneElements.extraBeziers);
        this.rings.forEach(r => r.visible = settings.sceneElements.rings);
        this.flags.forEach(f => f.visible = settings.sceneElements.flags);
        this.barGraph.visible = settings.sceneElements.circumferenceGraph;
      }
      updateVisibility();

      elementsFolder.onChange(updateVisibility);
      elementsFolder.add(settings.sceneElements, 'outlines').name('Outlines');
      elementsFolder.add(settings.sceneElements, 'circumferenceGraph').name('Circumference Graph')
      elementsFolder.add(settings.sceneElements, 'mainBezier').name('Main Bezier')
      elementsFolder.add(settings.sceneElements, 'extraBeziers').name('Secondary Beziers');
      elementsFolder.add(settings.sceneElements, 'rings').name('Rings');
      elementsFolder.add(settings.sceneElements, 'flags').name('Flags');
      elementsFolder.add(settings.sceneElements, 'reflection').name('Reflection');
    })()
  }

  update() {
    const dir = new Vector3();
    this.camera.updateMatrixWorld();
    this.camera.getWorldDirection(dir);
    if (this.points)
      (this.points.material as ShaderMaterial).uniforms.u_cameraDirection.value = dir;
  }

  dispose() {
    this.folder.destroy();
  }

}