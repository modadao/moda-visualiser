import { IDerivedFingerPrint } from "../types";
import { buildAttribute } from "../utils";
import { AdditiveBlending, AxesHelper, BufferGeometry, CircleBufferGeometry, Line, LineBasicMaterial, Mesh, Object3D, Points, Scene, ShaderMaterial, TextureLoader } from "three";
import FragShader from '../shaders/v1_lines_frag.glsl';
import VertShader from '../shaders/v1_lines_vert.glsl';
import ColorSchemeImg from '../assets/color_scheme.jpg';

const tl = new TextureLoader();
export default class V1 extends Object3D {
  constructor(private scene: Scene, private fingerprint: IDerivedFingerPrint) {
    console.log('V1')
    super();

    const colorSchemeTexture = tl.load(ColorSchemeImg);

    const geometry = new BufferGeometry();
    // Generate vertex positions
    const positions = buildAttribute(fingerprint.coords.length, 3, (i) => {
      return [i * 0.01, fingerprint.coords[i].x * 0.001, fingerprint.coords[i].y * 0.001];
    })
    geometry.setAttribute('position', positions);

    const index = buildAttribute(fingerprint.coords.length, 1, i => {
      return [i]
    })
    geometry.setAttribute('index', index);

    const theta = buildAttribute(fingerprint.coords.length, 1, i => {
      const t = fingerprint.coords[i].y / fingerprint.shape[1] * Math.PI;
      return [t]
    })
    geometry.setAttribute('theta', theta);

    const gradients = buildAttribute(fingerprint.coords.length, 1, i => {
      return [fingerprint.coords[i].g]
    })
    geometry.setAttribute('gradient', gradients);
    console.log(gradients);

    const material = new ShaderMaterial({
      vertexShader: VertShader,
      fragmentShader: FragShader,
      transparent: true,
      uniforms: {
        u_colorscheme: { value: colorSchemeTexture },
        u_hash: { value: fingerprint.hash },
        u_floathash: { value: fingerprint.floatHash }
      }
    });
    const mesh = new Points(geometry, material)
    mesh.add(new AxesHelper(0.5));
    
    this.add(mesh);

    const circle = new CircleBufferGeometry(0.8, 32);
    const circleMat = new LineBasicMaterial({ color: 0x666666 });
    const circleMesh = new Line(circle, circleMat);
    circleMesh.rotateX(Math.PI / 2);
    this.add(circleMesh);
    const circle2 = circleMesh.clone();
    circle2.scale.setScalar(3.0);
    this.add(circle2);
    const circle3 = circleMesh.clone();
    circle3.scale.setScalar(5.0);
    this.add(circle3);
    const circle4 = circleMesh.clone();
    circle4.scale.setScalar(7.0);
    this.add(circle4);
  }
}