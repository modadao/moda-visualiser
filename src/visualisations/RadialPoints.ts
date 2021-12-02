import { IDerivedFingerPrint } from "../types";
import { buildAttribute, createShaderControls } from "../utils";
import { BufferGeometry, Object3D, Points, Scene, ShaderMaterial, TextureLoader } from "three";
import FragShader from '../shaders/v1_main_frag.glsl';
import VertShader from '../shaders/v1_main_vert.glsl';
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
        u_floatHash: { value: fingerprint.floatHash },
        u_noiseLambda: { value: 5 },
        u_noiseAlpha: { value: 0 },
        u_distMult: { value: 10 },
        u_distAdd: { value: 1 },
        u_logMult: { value: 0.5 },
        u_logAdd: { value: 0.2 },
      }
    });

    createShaderControls(material);

    const mesh = new Points(geometry, material)
    
    this.add(mesh);
  }
}