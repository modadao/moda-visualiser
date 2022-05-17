import { DataTexture, FloatType, LinearFilter, MathUtils, RGBAFormat } from "three";
import IAudioReactive from "../types";
import { IAudioFrame } from "./AudioAnalyser";

export default class SpringPhysicsTextureManager implements IAudioReactive {
  height = 0;
  dataTexture!: DataTexture;
  data!: Float32Array;
  imageData!: Uint8ClampedArray;

  impactRadius = 0.005;
  impactForce = 1.2;
  impactWaveFrequency = 8;

  fakeSpringPhysics = false;
  fakeSpringPhysicsValue = 0;
  constructor(public width: number, public springConstant = 0.05, public inertia = 0.95) {
    
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

  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  build() {
    this.data = new Float32Array(new Array(this.width * this.height * 6).fill(1));
    this.dataTexture = new DataTexture(null, this.width, this.height, RGBAFormat, FloatType);
    this.dataTexture.minFilter = LinearFilter;
    this.dataTexture.magFilter = LinearFilter;
    this.dataTexture.needsUpdate = true;
    console.log('Building spring physics texture manager', this.width, this.height);

    // this.canvas = document.createElement('canvas');
    // this.canvas.width = this.width;
    // this.canvas.height = this.height;
    // this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    // document.body.appendChild(this.canvas);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleAudio(frame: IAudioFrame): void {
    // When frame triggers, apply a force to a section of the bezier
    if (frame.trigger) {
      const radius = this.impactRadius * this.data.length;
      const targetPos = Math.floor(Math.random() * this.width);
      const secondTargetPos = targetPos < this.width / 2 ? targetPos + this.width : targetPos - this.width ;
      // const targetPos = 200;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const distance = Math.abs(MathUtils.clamp(MathUtils.mapLinear(targetPos - x, -radius, radius, -1, 1), -1, 1));
          const secondDistance = Math.abs(MathUtils.clamp(MathUtils.mapLinear(secondTargetPos - x, -radius, radius, -1, 1), -1, 1));
          const impact = Math.cos(Math.max(distance, secondDistance) * this.impactWaveFrequency);
          const index = y * this.width * 6 + x * 6;
          this.data[index + 3] += (1 - distance) * impact * frame.power * this.impactForce;
          this.data[index + 4] += (1 - distance) * impact * frame.power * this.impactForce;
          this.data[index + 5] += (1 - distance) * impact * frame.power * this.impactForce;
        }
      }
    }

    // Update the spring physics bounce each frame
    for (let i = 0; i < this.data.length; i += 6) {
      const x = this.data[i];
      const y = this.data[i + 1];
      const z = this.data[i + 2];
      this.data[i+3] = this.data[i+3] * this.inertia + -x * this.springConstant; 
      this.data[i+4] = this.data[i+4] * this.inertia + -y * this.springConstant; 
      this.data[i+5] = this.data[i+5] * this.inertia + -z * this.springConstant; 
      this.data[i] += this.data[i+3];
      this.data[i+1] += this.data[i+4];
      this.data[i+2] += this.data[i+5];
    }

    if (this.fakeSpringPhysics) {
      for (let i = 0; i < this.data.length; i += 6) {
        this.data[i] = this.fakeSpringPhysicsValue;
        this.data[i+1] = this.fakeSpringPhysicsValue;
        this.data[i+2] = this.fakeSpringPhysicsValue;
      }
    }


    // Convert Float32Array to Uint8ClampedArray, with center point at 127
    const data = new Float32Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      const sourceIndex = i * 6;
      const outputIndex = i * 4;
      const x = this.data[sourceIndex];
      const y = this.data[sourceIndex + 1];
      const z = this.data[sourceIndex + 2];
      data[outputIndex] = x;
      data[outputIndex+1] = y;
      data[outputIndex+2] = z;
      data[outputIndex + 3] = 255;
    }
    // this.dataTexture.image = new ImageData(data, this.width, this.height);
    this.dataTexture.image = {
      // @ts-expect-error; Undefined valid behaviour
      data,
      width: this.width,
      height: this.height,
    }
    this.dataTexture.needsUpdate = true;

    // this.ctx.putImageData(this.dataTexture.image, 0, 0);
  }
}

