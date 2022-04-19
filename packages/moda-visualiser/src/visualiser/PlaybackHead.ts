import { CylinderBufferGeometry, Mesh, Object3D, ShaderMaterial } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import IAudioReactive from "./ReactiveObject";

import PlaybackFrag from '../shaders/playback_head_frag.glsl';
import PlaybackVert from '../shaders/playback_head_vert.glsl';

export default class PlaybackHead extends Object3D implements IAudioReactive {
  needle: Mesh;
  constructor() {
    super();

    const geo = new CylinderBufferGeometry(0.01, 0.01, 1, 4, 64);
    geo.translate(0, 0.5, 0);
    const line = new Mesh(
      geo,
      new ShaderMaterial({
        vertexShader: PlaybackVert.replaceAll('${BUFFER_LENGTH}', '64'),
        fragmentShader: PlaybackFrag,
        uniforms: {
          buffer: { value: new Array(64).fill(0) }
        }
      })
    );
    line.scale.y = 4;
    this.add(line);
    this.needle = line;
    this.needle.rotateX(Math.PI / 2);
  }

  handleAudio(frame: IAudioFrame): void {
    this.needle.rotation.z = -frame.progress * Math.PI * 2;
    this.needle.scale.x = frame.power;
    (this.needle.material as ShaderMaterial).uniforms.buffer.value = frame.fft;
  }
}
