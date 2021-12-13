import { IDerivedFingerPrint } from "../types";
import { bezierVector, buildAttribute, createShaderControls } from "../utils";
import { CatmullRomCurve3, Vector3, Mesh, Object3D, LineBasicMaterial, Scene, ShaderMaterial, SphereBufferGeometry, TextureLoader, BufferGeometry, Line, Vector2, BoxGeometry, BoxBufferGeometry, RepeatWrapping, SplineCurve, Camera, Shader, TubeGeometry, MeshBasicMaterial, CurvePath, QuadraticBezierCurve3, Curve, Float32BufferAttribute, Points, InstancedMesh, DynamicDrawUsage, InstancedBufferGeometry, InstancedBufferAttribute, IcosahedronBufferGeometry, Matrix4, TorusBufferGeometry, Quaternion, RawShaderMaterial, BackSide, MathUtils, CubicBezierCurve3 } from "three";
import { GeometryUtils, hilbert3D } from "three/examples/jsm/utils/GeometryUtils";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import RingFragShader from '../shaders/v1_rings_frag.glsl';
import RingVertShader from '../shaders/v1_rings_vert.glsl';
import ColorSchemeImg from '../assets/color_scheme.jpg';
import CircleLineGeometry from '../helpers/CircleLineGeometry';
import CrossLineGeometry from "../helpers/CrossLineGeometry";
import RingBarGeometry from "../helpers/RingBarGeometry";
import FlagMesh from "../helpers/FlagMesh";
import PointsFragShader from '../shaders/points_frag.glsl';
import PointsVertShader from '../shaders/points_vert.glsl';

const OUTLINE_SIZE = 0.007;

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
    const geo = new CircleLineGeometry(1, 512, fingerprint);
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
    const outlineM = new MeshBasicMaterial({
      color: 0xffffff,
      side: BackSide,
      depthWrite: false,
    })

    // Billboarded outlines
    const billboardedPositions: Vector3[] = [];
    const billboardScales: number[] = [];
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
      billboardedPositions.push(mesh.position.clone());

      // Size
      const d = (Math.abs(p.g - 0.5) + scale);
      mesh.scale.setScalar(d * scale);
      outlineMesh.scale.setScalar(d * scale + OUTLINE_SIZE);
      mesh.material.uniforms.u_innerColorMultiplier.value = 1.2 + p.featureLevel;
      if (p.featureLevel !== 0) {
        mesh.visible = true;
        mesh.scale.setScalar(scaleSize(p.featureLevel).y);
        outlineMesh.scale.setScalar(scaleSize(p.featureLevel).y + OUTLINE_SIZE);
        // m.uniforms.u_innerColorMultiplier.value = p.featureLevel + 1;
      }
      billboardScales.push(mesh.scale.x);

      // Orbit rings
      if (p.featureLevel !== 0) {
        const flag = new FlagMesh(10, 0.02, 0.3);
        flag.position.set(0, scaleSize(p.featureLevel).y, 0);
        mesh.add(flag);
      }

      // Colour
      // const color = fingerprint.floatHash + sin(theta) * 0.15 + p.g * 0.3;
      const color = (fingerprint.floatHash + sin(theta) * 0.2 + p.g * 0.3) % 1;
      m.uniforms.u_floatHash.value = color;

      this.add(mesh);
      this.add(outlineMesh);
      this.points.push(mesh);
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

    const curvePath = new CurvePath();
    const center = new Vector3();
    const dir = featurePositions[0].clone().sub(center).normalize();
    let isFacingTowardsCenter = false;
    for (let i = 0; i < featurePositions.length; i ++) {
      const isLast = i === featurePositions.length - 1;
      const cur = featurePositions[i];
      const next = isLast
        ? featurePositions[0]
        : featurePositions[i + 1];
      const dir = cur.clone().sub(center).normalize();
      const nextDir = isLast
        ? curvePath.getPointAt(0).clone().sub(center).normalize() as Vector3
        : next.clone().sub(center).normalize();
      if (isFacingTowardsCenter || isLast) {
        nextDir.multiplyScalar(-1);
      }
      if (isFacingTowardsCenter) dir.multiplyScalar(-1)

      const dist = cur.distanceTo(next);
      const handleDist = isFacingTowardsCenter ? dist * 0.7 : dist * 2;
      console.log({ dist });
      const anchor1 = cur.clone().add(dir.clone().multiplyScalar(handleDist));
      const anchor2 = next.clone().add(nextDir.clone().multiplyScalar(handleDist));

      const temp = new CubicBezierCurve3(cur, anchor1, anchor2, next);
      const v1 = temp.getPointAt(0.99);
      const v2 = temp.getPointAt(1);

      v2.sub(v1);
      dir.copy(v2).normalize();
      console.log(dir);

      curvePath.add(temp);
      isFacingTowardsCenter = !isFacingTowardsCenter;
    }

    const tubeGeometry = new TubeGeometry( curvePath, 200, 0.01, 5, false );
    const material = new MeshBasicMaterial( { color : 0xffffff, wireframe: false, } );
    const curveObject = new Mesh( tubeGeometry, material );
    this.add(curveObject);

  }

  update() {
    const dir = new Vector3();
    this.camera.updateMatrixWorld();
    this.camera.getWorldDirection(dir);
    this.points.forEach(m => {
      const mat = (m.material as ShaderMaterial)
      mat.uniforms.u_cameraDirection.value = dir;
    });
  }

}