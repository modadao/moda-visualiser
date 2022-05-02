import { Color, ShaderMaterial, WebGLRenderer } from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { IAudioFrame } from './AudioAnalyser';
import IAudioReactive from "./ReactiveObject";

import BackgroundVert from '../shaders/background_vert.glsl';
import BackgroundFrag from '../shaders/background_frag.glsl';

export default class ShaderBackground implements IAudioReactive {
  mat: ShaderMaterial;
  quad: FullScreenQuad;
  constructor(backgroundColor: Color) {
    this.mat = new ShaderMaterial({
      fragmentShader: BackgroundFrag,
      vertexShader: BackgroundVert,
      uniforms: {
        u_backgroundColor: { value: backgroundColor },
        u_power: { value: 0 },
        u_time: { value: 0 }
      },
      depthWrite: false,
    })

    this.quad = new FullScreenQuad(this.mat);
  }

  update(elapsed: number) {
    console.log({elapsed});
    this.mat.uniforms.u_time.value = elapsed;
  }

  render(renderer: WebGLRenderer) {
    this.quad.render(renderer);
  }

  handleAudio(frame: IAudioFrame): void {
    this.mat.uniforms.u_power.value = frame.power;
  }
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('updated: count is now ', newModule)
  })
}
