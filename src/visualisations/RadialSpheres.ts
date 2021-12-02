import { IDerivedFingerPrint } from "../types";
import { buildAttribute, createShaderControls } from "../utils";
import { CatmullRomCurve3, Vector3, Mesh, Object3D, LineBasicMaterial, Scene, ShaderMaterial, SphereBufferGeometry, TextureLoader, BufferGeometry, Line } from "three";
import { hilbert3D } from "three/examples/jsm/utils/GeometryUtils";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import ColorSchemeImg from '../assets/color_scheme.jpg';
import CircleLineGeometry from '../helpers/CircleLineGeometry';

const tl = new TextureLoader();
export default class RadialSphere extends Object3D {
  constructor(private scene: Scene, private fingerprint: IDerivedFingerPrint) {
    console.log('V1')
    super();

    const colorSchemeTexture = tl.load(ColorSchemeImg);

    // Add rings for flare
    const geo = new CircleLineGeometry(1, 64);
    const mat = new LineBasicMaterial({ color: 0x666666 });
    const l = new Line(geo, mat);
    l.position.setY(-0.1);
    l.rotateX(Math.PI / 2)
    l.scale.setScalar(1.3);
    this.add(l);
    const l2 = l.clone();
    l2.scale.setScalar(2.3);
    this.add(l2);
    const l3 = l.clone();
    l3.scale.setScalar(3.3);
    this.add(l3);
    const l4 = l.clone();
    l4.scale.setScalar(0.3);
    this.add(l4);

    const { sin, cos, floor, max, pow } = Math;
    const [ width, height ] = fingerprint.shape;

    const scale = (500 + max(-pow(height, 0.8), -pow(height, 0.7)-100, -pow(height, 0.6)-150)) / 400 * 0.15
    console.log({scale})
    for (const p of fingerprint.coords) {
      // Build geometry 
      const g = new SphereBufferGeometry(1);
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
        }
      })
      const mesh = new Mesh(g, m);

      // Position
      const numberOfRings = 3;
      const theta = (p.y / width) * Math.PI * 2 * numberOfRings;
      const x = sin(theta);
      const z = cos(theta);
      const step = floor(theta / (Math.PI * 2));
      const amp = p.x / height * 0.5;
      const r = step + 0.5 + amp ;
      mesh.position.set(x * r, 0, z * r);

      // Size
      const d = (Math.abs(p.g - 0.5) + scale);
      mesh.scale.setScalar(d * scale);
      const scaleMultiplier = p.max 
        ? 3
        : p.gmax
          ? 2
          : p.min
            ? 1.5
            : p.gmin
              ? 1.2
              : 1;
      if (scaleMultiplier !== 1) {
        mesh.scale.multiplyScalar(scaleMultiplier);
      }

      // Orbit rings
      let repeatCount = (p.max || p.gmax) 
        ? 2
        : p.min || p.gmin
          ? 1
          : 0;
      let i = 0;
      while (i < repeatCount) {
        const points = hilbert3D( new Vector3( 0, 0, 0 ), 200.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );
        const spline = new CatmullRomCurve3( points );
        const samples = spline.getPoints( points.length * 3 );
        const ringMesh = new Line(
          new CircleLineGeometry(1, 32),
          new LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            linecap: 'round', //ignored by WebGLRenderer
            linejoin:  'round' //ignored by WebGLRenderer
          })
        )
        ringMesh.position.copy(mesh.position);
        ringMesh.scale.setScalar((d + 1.1) * 0.15 + 0.1 * i);
        ringMesh.rotateX(Math.PI / 2)
        this.add(ringMesh);
        i += 1;
      }

      // Colour
      const color = sin(theta + fingerprint.floatHash - (p.x / width) * 0.8)
      m.uniforms.u_floatHash.value = color < 0 ? color + 1 : color;

      this.add(mesh);
    }
  }
}