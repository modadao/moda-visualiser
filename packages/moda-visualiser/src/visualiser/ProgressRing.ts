import { BoxBufferGeometry, MathUtils, Mesh, ShaderMaterial } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import ProgressRingFrag from '../shaders/progress_ring_frag.glsl';
import ProgressRingVert from '../shaders/progress_ring_vert.glsl';
import IAudioReactive from "../types";

class ProgressRing extends Mesh implements IAudioReactive {
  constructor(innerRadius: number, thickness: number, segments = 64) {
    const geometry = new BoxBufferGeometry(1, 0.01, 1, 2, 1, segments);
    geometry.translate(0.5, 0.005, 0.5);
    console.log(geometry.getAttribute('position'));

    const mat = new ShaderMaterial({
      vertexShader: ProgressRingVert,
      fragmentShader: ProgressRingFrag,
      uniforms: {
        u_innerRadius: { value: innerRadius },
        u_thickness: { value: thickness },
        u_progress: { value: 0 },
      },
    })
    super(geometry, mat);
  }

  handleAudio(frame: IAudioFrame): void {
    (this.material as ShaderMaterial).uniforms.u_progress = { value: MathUtils.degToRad(frame.progress * 360) };
      
  }
}

export default ProgressRing;
