import { IDerivedFingerPrint } from "../types";
import { buildAttribute } from "../utils";
import { AdditiveBlending, AxesHelper, BufferGeometry, Line, Mesh, Object3D, Points, Scene, ShaderMaterial } from "three";
import FragShader from '../shaders/v1_lines_frag.glsl';
import VertShader from '../shaders/v1_lines_vert.glsl';

export default class V1 extends Object3D {
  constructor(private scene: Scene, private fingerprint: IDerivedFingerPrint) {
    console.log('V1')
    super();

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
    });
    const mesh = new Points(geometry, material)
    mesh.add(new AxesHelper(0.5));
    
    this.add(mesh);
  }
}