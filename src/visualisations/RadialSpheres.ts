import { IDerivedFingerPrint } from "../types";
import { bezierVector, buildAttribute, chunk, createShaderControls, customRandom, pickRandom, preProcessTexture } from "../utils";
import { CatmullRomCurve3, Vector3, Mesh, Object3D, LineBasicMaterial, Scene, ShaderMaterial, SphereBufferGeometry, TextureLoader, BufferGeometry, Line, Vector2, BoxGeometry, BoxBufferGeometry, RepeatWrapping, SplineCurve, Camera, Shader, TubeGeometry, MeshBasicMaterial, CurvePath, QuadraticBezierCurve3, Curve, Float32BufferAttribute, Points, InstancedMesh, DynamicDrawUsage, InstancedBufferGeometry, InstancedBufferAttribute, IcosahedronBufferGeometry, Matrix4, TorusBufferGeometry, Quaternion, RawShaderMaterial, BackSide, MathUtils, CubicBezierCurve3, Vector, WebGLRenderer, WebGLRenderTarget, PlaneGeometry, OrthographicCamera, AdditiveBlending, Color } from "three";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import RingFragShader from '../shaders/v1_rings_frag.glsl';
import RingVertShader from '../shaders/v1_rings_vert.glsl';
import ColorSchemeImg from '../assets/color_scheme.jpg';
import CircleLineGeometry from '../helpers/CircleLineGeometry';
import CrossLineGeometry from "../helpers/CrossLineGeometry";
import RingBarGeometry from "../helpers/RingBarGeometry";
import FlagMesh from "../helpers/FlagMesh";
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
  points: Mesh[] = [];
  outlines: Mesh[] = [];
  mainLine: Mesh;
  flags: FlagMesh[] = [];
  extraLines: Mesh[] = [];
  rings: Line[] = [];
  barGraph: Line;
  floor: Mesh|undefined;
  folder: GUI;
  galaxyPointsMat: ShaderMaterial;
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
      ring.visible = false;
      this.rings.push(ring);
    })

    const { sin, cos, floor, max, pow } = Math;
    const [ width, height ] = fingerprint.shape;

    const scale = (500 + max(-pow(height, 0.8), -pow(height, 0.7)-100, -pow(height, 0.6)-150)) / 400 * 0.15
    console.log({scale})
    const g = new SphereBufferGeometry(1);
    const outlineM = new MeshBasicMaterial({
      color: 0xffffff,
      side: BackSide,
      depthWrite: false,
    })

    for (const p of fingerprint.coords) {
      // Build geometry 
      const m = new ShaderMaterial({
        fragmentShader: FragShader,
        vertexShader: VertShader,
        uniforms: {
          u_colorscheme: { value: colorSchemeTexture },
          u_hash: { value: fingerprint.hash },
          u_floatHash: { value: fingerprint.floatHash },
          u_noiseLambda: { value: 5 },
          u_noiseAlpha: { value: 0 },
          u_distMult: { value: 10 },
          u_distAdd: { value: 1 },
          u_logMult: { value: 0.5 },
          u_logAdd: { value: 0.2 },
          u_innerColorMultiplier: { value: 1.0, },
          u_outerColorMultiplier: { value: 1, },
          u_cameraDirection: { value: new Vector3() },
        }
      })
      const mesh = new Mesh(g, m);
      const outlineMesh = new Mesh(g, outlineM);
      outlineMesh.renderOrder = -1;

      // Position
      const theta = (p.x / height) * Math.PI * 2;
      const x = sin(theta);
      const z = cos(theta);
      const step = floor(theta / (Math.PI * 2));
      const amp = p.y / width * 2;
      const r = step + 1.0 + amp ;
      mesh.position.set(x * r, 0, z * r);
      outlineMesh.position.copy(mesh.position);

      // Size
      const d = (Math.abs(p.g - 0.5) + scale);
      mesh.scale.setScalar(d * scale);
      outlineMesh.scale.setScalar(d * scale + settings.featurePoints.outlineSize);
      mesh.material.uniforms.u_innerColorMultiplier.value = 1.2 + p.featureLevel;
      if (p.featureLevel !== 0) {
        mesh.visible = true;
        mesh.scale.setScalar(scaleSize(p.featureLevel).y);
        outlineMesh.scale.setScalar(scaleSize(p.featureLevel).y + settings.featurePoints.outlineSize);
        // m.uniforms.u_innerColorMultiplier.value = p.featureLevel + 1;
      }

      // Orbit rings
      if (p.featureLevel !== 0) {
        const flag = new FlagMesh(10, 0.02, 0.3);
        flag.position.set(0, scaleSize(p.featureLevel).y, 0);
        this.flags.push(flag);
        flag.visible = false;
        mesh.add(flag);
      }

      // Colour
      // const color = fingerprint.floatHash + sin(theta) * 0.15 + p.g * 0.3;
      const { baseVariation, velocityVariation } = settings.color;
      const color = (fingerprint.floatHash + sin(theta) * baseVariation + p.g * velocityVariation) % 1;
      m.uniforms.u_floatHash.value = color;

      mesh.layers.enable(1);
      this.add(mesh);
      this.add(outlineMesh);
      this.points.push(mesh);
      this.outlines.push(outlineMesh);
    }

    // Bezier through feature points
    const featurePoints = fingerprint.coords.filter(p => p.featureLevel !== 0);
    const featurePositions = featurePoints.map(p => {
      // Position
      const theta = (p.x / height) * Math.PI * 2;
      const x = sin(theta);
      const z = cos(theta);
      const step = floor(theta / (Math.PI * 2));
      const amp = p.y / width * 2;
      const r = step + 1.0 + amp ;
      return new Vector3(x * r, 0, z * r);
    });

    // Generate main bezier
    const center = new Vector3();
    const firstDir = featurePositions[0].clone().sub(center).normalize().multiplyScalar(-1);
    const { flareOut, flareIn, angleRandomness, verticalAngleRandomness } = settings.beziers;
    const [firstPoint, ...remainingPoints] = featurePositions;
    const traverseBeziers = (points: Vector3[], cur: Vector3, dir: Vector3, path: CurvePath<Vector3>, facingTowardsCenter: boolean, firstPoint?: Vector3, firstDir?: Vector3): CurvePath<Vector3> => {
      const isLast = points.length === 0;
      const targetDist = 2;
      const next = isLast 
        ? firstPoint as Vector3 
        : points.reduce((acc, el) => {
            return Math.abs(targetDist - cur.distanceTo(el)) < Math.abs(targetDist - cur.distanceTo(acc)) ? el : acc
          }, points[0])
      const remaining = points.filter(el => !el.equals(next));
      console.log(points.length, next, remaining);

      const nextDir = isLast
        ? (firstDir as Vector3).multiplyScalar(-1)
        : next.clone().sub(center).normalize()
          .applyAxisAngle(new Vector3(0, 1, 0), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
          .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2);
      if (facingTowardsCenter && !isLast) nextDir.multiplyScalar(-1);
      const dist = cur.distanceTo(next);
      const handleDist = facingTowardsCenter ? dist * flareIn : dist * flareOut;
      const anchor1 = cur.clone().add(dir.clone().multiplyScalar(handleDist))
      const anchor2 = next.clone().add(nextDir.clone().multiplyScalar(handleDist));
      
      path.add(new CubicBezierCurve3(cur, anchor1, anchor2, next));

      if (isLast) {
        return path;
      } else {
        return traverseBeziers(remaining, next, nextDir.multiplyScalar(-1), path, !facingTowardsCenter, firstPoint ?? cur, firstDir ?? dir);
      }
    }
    const curvePath = traverseBeziers(remainingPoints, firstPoint, firstDir, new CurvePath(), true);
    const tubeGeometry = new TubeGeometry( curvePath, 200, 0.01, 5, false );
    const material = new MeshBasicMaterial( { color : 0xffffff, wireframe: false, } );
    const curveObject = new Mesh( tubeGeometry, material );
    this.add(curveObject);
    this.mainLine = curveObject;


    // Generate random secondary beziers
    const secondaryMat = new MeshBasicMaterial({ color: 0xcccccc })
    const chunkedPoints = chunk(pickRandom(fingerprint.coords, 18), 6);
    console.log(chunkedPoints);
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
      const curvePath = traverseBeziers(remainingPoints, firstPoint, firstDir, new CurvePath(), true)
      const geo = new TubeGeometry(curvePath, 200, 0.005, 3, false);
      const mesh = new Mesh(geo, secondaryMat);
      this.add(mesh);
      mesh.visible = false;
      this.extraLines.push(mesh);
    });

    // Build particle background
    (() => {
      // const g = new CrossLineGeometry(1).getAttribute('position');
      const instances = 1000;
      const g = new InstancedBufferGeometry();
      g.setAttribute('position', new CrossLineGeometry(1).getAttribute('position'));
      const offsets: number[] = [];
      const scales: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const theta = customRandom.deterministic(i, 2) * Math.PI * 2;
        const radius = customRandom.deterministic(i) * 8 + 5;
        const x = sin(theta);
        const z = cos(theta);
        offsets.push(x * radius, 0, z * radius);
        scales.push(0.1 + customRandom.deterministic(i) * 0.1);
      }

      g.setAttribute('offset', new InstancedBufferAttribute(new Float32Array(offsets), 3));
      g.setAttribute('scale', new InstancedBufferAttribute(new Float32Array(scales), 1));

      const mat = new ShaderMaterial({
        vertexShader: ParticleVert,
        fragmentShader: ParticleFrag,
        uniforms: {
          u_time: {
            value: 0,
          }
        }
      })
      const l = new Line(g, mat)
      this.add(l);
      elementsFolder.add(l, 'visible').name('Galaxy points');
      this.galaxyPointsMat = mat;
    })();

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
          elementsFolder.add(m, 'visible').name('Reflection visible');
        });
      })()
    }, 1000)

    elementsFolder.add({ x: true}, 'x').name('Outlines').onChange(v => this.outlines.forEach(l => l.visible = v));
    elementsFolder.add(this.barGraph, 'visible').name('Circumference')
    elementsFolder.add(this.mainLine, 'visible').name('Main line')
    elementsFolder.add({ x: false}, 'x').name('Secondary lines').onChange(v => this.extraLines.forEach(l => l.visible = v));
    elementsFolder.add({ x: false}, 'x').name('Rings').onChange(v => this.rings.forEach(l => l.visible = v));
    elementsFolder.add({ x: false}, 'x').name('Flags').onChange(v => this.flags.forEach(l => l.visible = v));
  }

  update() {
    const dir = new Vector3();
    this.camera.updateMatrixWorld();
    this.camera.getWorldDirection(dir);
    this.points.forEach(m => {
      const mat = (m.material as ShaderMaterial)
      mat.uniforms.u_cameraDirection.value = dir;
    });
    this.galaxyPointsMat.uniforms.u_time.value += 0.1;
  }

  dispose() {
    this.folder.destroy();
  }

}