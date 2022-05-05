import { DoubleSide, Mesh, Object3D, PlaneBufferGeometry, ShaderMaterial } from "three";
import { ISettings } from ".";
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";
import ShaderRingsFrag from "../shaders/shader_rings_frag.glsl";
import ShaderRingsVert from "../shaders/shader_rings_vert.glsl";
import { IAudioFrame } from "./AudioAnalyser";
import SpringPhysicsTextureManager from "./SpringPhysicsTextureManager";

const DIMENSION = 20;
export default class ShaderRings extends Object3D implements IAudioReactive {
  mesh: Mesh<PlaneBufferGeometry, ShaderMaterial>;
  constructor(fingerprint: IDerivedFingerPrint, settings: ISettings, public fftTextureManager: SpringPhysicsTextureManager) {
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

  handleAudio(frame: IAudioFrame): void {
    this.mesh.material.uniforms.u_power.value = this.fftTextureManager.data[1];
  }
}
