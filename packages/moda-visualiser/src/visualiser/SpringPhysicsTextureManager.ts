import { DataTexture, MathUtils, RGBAFormat, RGFormat, UnsignedByteType } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import gui from "./gui";
import IAudioReactive from "./ReactiveObject";

export default class SpringPhysicsTextureManager implements IAudioReactive {
  height = 0;
  dataTexture!: DataTexture;
  data!: Float32Array;
  imageData!: Uint8ClampedArray;

  impactRadius = 0.18;
  impactForce = 1;
  impactWaveFrequency = 8;
  constructor(public width: number, public springConstant: number, public inertia: number) {
    
    gui.add(this, 'springConstant', 0.01, 1, 0.01);
    gui.add(this, 'inertia', 0.01, 1, 0.01);
    gui.add(this, 'impactRadius', 0, 1, 0.01);
    gui.add(this, 'impactForce', 0, 2, 0.01);
    gui.add(this, 'impactWaveFrequency', 0, 16, 0.01);
  }

  /**
   * @returns The current y value of the row in the texture
   */
  registerSpringPhysicsElement() {
    console.warn('Registering spring physics element')
    const height = this.height;
    this.height += 1;
    return height;
  }

  build() {
    this.data = new Float32Array(new Array(this.width * this.height * 4).fill(0));
    this.imageData = new Uint8ClampedArray(new Array(this.width * this.height * 4).fill(0));
    this.dataTexture = new DataTexture(this.data, this.width, this.height, RGBAFormat, UnsignedByteType);
    this.dataTexture.needsUpdate = true;
    console.log('Building spring physics texture manager', this.data, this.imageData);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error
  handleAudio(frame: IAudioFrame): void {
    // When frame triggers, apply a force to a section of the bezier
    if (frame.trigger) {
      const targetPos = Math.floor(Math.random() * this.data.length);
      const radius = this.impactRadius * this.data.length;
      for (let i = 0; i < this.data.length; i += 4) {
        const distance = Math.abs(MathUtils.clamp(MathUtils.mapLinear(targetPos - i, -radius, +radius, -1, 1), -1, 1));
        const impact = Math.cos(distance * this.impactWaveFrequency);
        this.data[i + 2] += (1 - distance) * impact * frame.power * this.impactForce;
      }
      console.log(frame.power)
    }

    // Update the spring physics bounce each frame
    for (let i = 0; i < this.data.length; i += 4) {
      const p = this.data[i];
      this.data[i + 2] = this.data[i + 2] * this.inertia + -p * this.springConstant;
      this.data[i] += this.data[i + 2];
    }


    const data = new Uint8ClampedArray(this.data.length);
    for (let i = 0; i < this.data.length; i+=4 ) {
      data[i] = (this.data[i] * 127.5 + 127.5);
      data[i + 1] = Math.max(this.data[i], 1);
    }
    this.dataTexture.image = {
      data: data,
      width: this.width,
      height: this.height,
    }
    this.dataTexture.needsUpdate = true;
  }
}
