import { DoubleSide, MathUtils, Mesh, Object3D, PlaneBufferGeometry, ShaderMaterial } from "three";
import ShaderRingsFrag from "../shaders/shader_rings_frag.glsl";
import ShaderRingsVert from "../shaders/shader_rings_vert.glsl";
import IAudioReactive from "../types";
import { IAudioFrame } from "./AudioAnalyser";

const DIMENSION = 20;
export default class ShaderRings extends Object3D implements IAudioReactive {
  mesh: Mesh<PlaneBufferGeometry, ShaderMaterial>;
  constructor() {
    super();

    const geo = new PlaneBufferGeometry(DIMENSION, DIMENSION);
    const mat = new ShaderMaterial({
      fragmentShader: ShaderRingsFrag,
      vertexShader: ShaderRingsVert,
      side: DoubleSide,
      uniforms: {
        u_dimension: { value: DIMENSION },
        u_time: { value: 0 },
        u_power: { value: 0 },
        u_noiseAmp: { value: 4 },
        u_noiseScale: { value: 0.7 },
        u_lineWidthMax: { value: 0.05 },
        u_brightness: { value: 0.4 },
        u_chromaticOffset: { value: 0.01 },
      },
      depthWrite: false,
      transparent: true,
    })
    const m = new Mesh(geo, mat);
    this.mesh = m;
    this.add(m);
  }

  update(elapsed: number) {
    this.mesh.material.uniforms.u_time.value = elapsed;
  }

  internalPower = 0;
  handleAudio(frame: IAudioFrame): void {
    const mixAmount = this.internalPower < frame.power ? 0.4 : 0.1;
    this.internalPower = MathUtils.lerp(this.internalPower, frame.power, mixAmount);
    this.mesh.material.uniforms.u_power.value = this.internalPower;
  }
}
