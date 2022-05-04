import { DataTexture, FloatType, RGBAFormat, } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import IAudioReactive from "./ReactiveObject";

export default class FFTTextureManager implements IAudioReactive {
  dataTexture: DataTexture;
  data: Float32Array;
  triggerStates: boolean[][] = [];
  constructor(public frameSize: number, public springConstant = 0.05, public inertia = 0.95, public threshold = 0.5) {
    this.dataTexture = new DataTexture(null, frameSize, 1, RGBAFormat, FloatType);
    this.data = new Float32Array(frameSize * 4).fill(0);
    this.triggerStates = new Array(frameSize).fill(0).map(() => [false, false]);
    console.log(this.triggerStates)
  }
  
  handleAudio(frame: IAudioFrame): void {
    const { fft } = frame;
    for (let i = 0; i < fft.length; i++) {
      const dataI = i * 4;
      const a = this.data[dataI + 1];
      // Update triggered state of current FFT band
      let trigger = this.triggerStates[i][0];
      let hasTriggered = this.triggerStates[i][1];
      if (!hasTriggered && fft[i] > this.threshold) {
        trigger = true;
        hasTriggered = true;
      } else if (hasTriggered && fft[i] < this.threshold) {
        trigger = false;
        hasTriggered = false;
      } else {
        trigger = false;
      }
      this.triggerStates[i] = [trigger, hasTriggered];

      // Copy FFT data into red channel
      this.data[dataI] = fft[i];
      // If trigger, apply a force to the spring equal to the power of the band
      if (trigger) {
        this.data[dataI + 2] += fft[i];
      }
      // Update spring acceleration (blue channel)
      this.data[dataI + 2] = this.data[dataI + 2] * this.inertia + -a * this.springConstant;
      // Update string positon (green channel)
      this.data[dataI + 1] += this.data[dataI + 2];
      // Store trigger state in alpha channel
      this.data[dataI + 3] = trigger ? 1 : 0;
    }

    const data = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      data[i] = this.data[i];
    }
    this.dataTexture.image = {
      // @ts-expect-error; Undefined valid behaviour
      data: data,
      width: this.frameSize,
      height: 1,
    }
    this.dataTexture.needsUpdate = true;
  }
}
