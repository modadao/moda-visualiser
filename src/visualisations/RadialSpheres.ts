import { IDerivedFingerPrint } from "../types";
import { bezierVector, buildAttribute, createShaderControls } from "../utils";
import { CatmullRomCurve3, Vector3, Mesh, Object3D, LineBasicMaterial, Scene, ShaderMaterial, SphereBufferGeometry, TextureLoader, BufferGeometry, Line, Vector2, BoxGeometry, BoxBufferGeometry, RepeatWrapping, SplineCurve, Camera, Shader, TubeGeometry, MeshBasicMaterial, CurvePath, QuadraticBezierCurve3, Curve } from "three";
import { hilbert3D } from "three/examples/jsm/utils/GeometryUtils";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import RingFragShader from '../shaders/v1_rings_frag.glsl';
import RingVertShader from '../shaders/v1_rings_vert.glsl';
import ColorSchemeImg from '../assets/color_scheme.jpg';
import CircleLineGeometry from '../helpers/CircleLineGeometry';
import CrossLineGeometry from "../helpers/CrossLineGeometry";
import RingBarGeometry from "../helpers/RingBarGeometry";

const tl = new TextureLoader();
export default class RadialSphere extends Object3D {
  points: Mesh[] = [];
  constructor(private scene: Scene, private camera: Camera, private fingerprint: IDerivedFingerPrint) {
    super();

    const sizeBezierPoints = [
      new Vector2(0, 0.05),
      new Vector2(0.25, 0.1),
      new Vector2(0.5, 0.3),
      new Vector2(1, 0.5),
    ];
    const scaleSize = (t: number) => {
      const [a, b, c, d] = sizeBezierPoints;
      return bezierVector(a,b,c,d,t)
    }

    const colorSchemeTexture = tl.load(ColorSchemeImg);
    colorSchemeTexture.wrapS = RepeatWrapping;
    colorSchemeTexture.wrapT = RepeatWrapping;

    // Add rings for flare
    const geo = new CircleLineGeometry(1, 128);
    const matGrey = new LineBasicMaterial({ color: 0x666666 });
    const matWhite = new LineBasicMaterial({ color: 0xdddddd });
    const l = new Line(geo, matWhite);
    l.position.setY(-0.1);
    l.rotateX(Math.PI / 2)
    l.scale.setScalar(0.9);
    this.add(l);

    const ringBarGeo = new RingBarGeometry(3.3, fingerprint, 0.001);
    const ringBarLine = new Line(ringBarGeo, matWhite);
    ringBarLine.rotateX(Math.PI / 2);
    this.add(ringBarLine);


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
    })

    const { sin, cos, floor, max, pow } = Math;
    const [ width, height ] = fingerprint.shape;

    const scale = (500 + max(-pow(height, 0.8), -pow(height, 0.7)-100, -pow(height, 0.6)-150)) / 400 * 0.15
    console.log({scale})
    const g = new SphereBufferGeometry(1);
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
          u_innerColorMultiplier: { value: 1.5, },
          u_outerColorMultiplier: { value: 1, },
          u_cameraDirection: { value: new Vector3() },
        }
      })
      const mesh = new Mesh(g, m);

      // Position
      const theta = (p.y / width) * Math.PI * 2;
      const x = sin(theta);
      const z = cos(theta);
      const step = floor(theta / (Math.PI * 2));
      const amp = p.x / height * 2;
      const r = step + 1.0 + amp ;
      mesh.position.set(x * r, 0, z * r);

      // Size
      const d = (Math.abs(p.g - 0.5) + scale);
      mesh.scale.setScalar(d * scale);
      if (p.featureLevel !== 0) {
        mesh.scale.setScalar(scaleSize(p.featureLevel).y);
        // m.uniforms.u_innerColorMultiplier.value = p.featureLevel + 1;
      }

      // Orbit rings
      if (p.featureLevel !== 0) {
        const featureGeometry = p.featureLevel > 0.7
            ? new CircleLineGeometry(1, 16)
            : p.featureLevel > 0.2
              ? new CrossLineGeometry(2)
              : new SphereBufferGeometry(1, 2, 2);

        const ringMesh = new Line(
          featureGeometry,
          new LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            linecap: 'round', //ignored by WebGLRenderer
            linejoin:  'round' //ignored by WebGLRenderer
          })
        )
        ringMesh.position.copy(mesh.position);
        ringMesh.scale.setScalar((mesh.scale.x + 0.1));
        ringMesh.rotateX(Math.PI / 2)
        this.add(ringMesh);
      }

      // Colour
      const color = fingerprint.floatHash + sin(theta) * 0.15 + p.g * 0.3;
      m.uniforms.u_floatHash.value = color < 0 ? color + 1 : color;

      this.add(mesh);
    }

    // Bezier through feature points
    const featurePoints = fingerprint.coords.filter(p => p.featureLevel !== 0);
    const featurePositions = featurePoints.map(p => {
      const theta = (p.y / width) * Math.PI * 2;
      const x = sin(theta);
      const z = cos(theta);
      const step = floor(theta / (Math.PI * 2));
      const amp = p.x / height * 2;
      const r = step + 1.0 + amp ;
      return new Vector3(x * r, 0, z * r);
    });

    const curvePath = new CurvePath();
    for (let i = 1; i < featurePositions.length - 2; i ++) {
      const prev = featurePositions[i - 1];
      const cur = featurePositions[i];
      const next = featurePositions[i + 1];
      const final = featurePositions[i + 2];

      const temp = new QuadraticBezierCurve3(cur, next, final);
      const anchor = temp.getPointAt(0.25);
      temp.v0 = cur;
      temp.v1 = anchor;
      temp.v2 = next;
      curvePath.add(temp);
    }

    const curve = new CatmullRomCurve3(featurePositions, false, 'catmullrom', 5.);
    const tubeGeometry = new TubeGeometry( curve, 200, 0.01, 5, false );
    const material = new MeshBasicMaterial( { color : 0xffffff, wireframe: false, } );
    const curveObject = new Mesh( tubeGeometry, material );
    this.add(curveObject);
  }

  update() {
    const dir = new Vector3();
    this.camera.updateMatrixWorld();
    this.camera.getWorldDirection(dir);
    console.log(dir);
    this.points.forEach(m => {
      const mat = (m.material as ShaderMaterial)
      mat.uniforms.u_cameraDirection.value = dir;
    });
  }

}