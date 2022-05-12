import { DataTexture, FloatType, RepeatWrapping, RGBAFormat, } from "three";
import { mod } from "../utils";
import { IAudioFrame } from "./AudioAnalyser";
import IAudioReactive from "./ReactiveObject";

export interface IFFTTextureManagerOptions {
  frameSize: number,
  textureSize: number,
  impactVelocity: number,
  springConstant: number,
  inertia: number,
  threshold: number,
  blurRadius: number,
}

const defaultOptions: IFFTTextureManagerOptions = {
  frameSize: 64,
  textureSize: 128,
  impactVelocity: 0.2,
  springConstant: 0.025,
  inertia: 0.95,
  threshold: 0.8,
  blurRadius: 3,
}

export default class FFTTextureManager implements IAudioReactive {
  dataTexture: DataTexture;
  data: Float32Array;
  triggerStates: boolean[][] = [];
  opts: IFFTTextureManagerOptions;

  texture2fft: number;
  constructor(opts?: Partial<IFFTTextureManagerOptions>) {

    this.opts = Object.assign({}, defaultOptions, opts || {});
    console.log('FFTTextureManager opts: ', this.opts)
    const { frameSize, textureSize } = this.opts;
    this.texture2fft = frameSize / textureSize;

    this.dataTexture = new DataTexture(null, textureSize, 1, RGBAFormat, FloatType);
    this.dataTexture.wrapS = RepeatWrapping;
    this.dataTexture.wrapT = RepeatWrapping;
    this.data = new Float32Array(textureSize * 4).fill(0);
    this.triggerStates = new Array(textureSize).fill(0).map(() => [false, false]);
  }

  handleAudio(frame: IAudioFrame): void {
    const { fft } = frame;
    const { threshold, blurRadius, inertia, springConstant, textureSize, impactVelocity } = this.opts;
    for (let i = 0; i < textureSize; i++) {
      const fftI = Math.floor(this.texture2fft * i);

      // Calculate if band is triggered
      let trigger = this.triggerStates[i][0];
      let hasTriggered = this.triggerStates[i][1];
      if (!hasTriggered && fft[fftI] > threshold) {
        trigger = true;
        hasTriggered = true;
      } else if (hasTriggered && fft[fftI] < threshold) {
        trigger = false;
        hasTriggered = false;
      } else {
        trigger = false;
      }
      this.triggerStates[i] = [trigger, hasTriggered];

      const texI = i * 4;

      // Apply force if trigger
      if (trigger) {
        for (let k = -blurRadius; k < blurRadius; k++) {
          const realI = mod(i + k, textureSize) * 4;
          const alpha = 1 - Math.abs(k / blurRadius);
          this.data[realI + 2] += fft[fftI] * impactVelocity * alpha;
          // if (realI > textureSize * 4 || this.data[realI + 2] === undefined) {
          //   debugger;
          // }
        }
      }

      // Update spring acceleration (blue channel)
      const a = this.data[texI + 1];
      this.data[texI + 2] = this.data[texI + 2] * inertia + -a * springConstant;
      // Update string positon (green channel)
      this.data[texI + 1] += this.data[texI + 2];
      // Store trigger state in alpha channel
      this.data[texI + 3] = trigger ? 1 : 0;
    }

    const data = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      data[i] = this.data[i];
    }
    this.dataTexture.image = {
      // @ts-expect-error; Undefined valid behaviour
      data: data,
      width: textureSize,
      height: 1,
    }
    this.dataTexture.needsUpdate = true;
  }
}
