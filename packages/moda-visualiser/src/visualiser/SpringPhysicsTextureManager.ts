import { DataTexture, MathUtils, RGBAFormat, RGFormat, UnsignedByteType } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import gui from "./gui";
import IAudioReactive from "./ReactiveObject";

export default class SpringPhysicsTextureManager implements IAudioReactive {
  height = 0;
  dataTexture!: DataTexture;
  data!: Float32Array;
  imageData!: Uint8ClampedArray;

  impactRadius = 0.01;
  impactForce = 0.2;
  impactWaveFrequency = 8;
  constructor(public width: number, public springConstant: number, public inertia: number) {
    
    gui.add(this, 'springConstant', 0.01, 1, 0.01);
    gui.add(this, 'inertia', 0.01, 1, 0.01);
    gui.add(this, 'impactRadius', 0, 1, 0.01);
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

  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  build() {
    this.data = new Float32Array(new Array(this.width * this.height * 4).fill(1));
    this.dataTexture = new DataTexture(null, this.width, this.height, RGBAFormat, UnsignedByteType);
    this.dataTexture.needsUpdate = true;
    console.log('Building spring physics texture manager', this.width, this.height);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    document.body.appendChild(this.canvas);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error
  handleAudio(frame: IAudioFrame): void {
    // When frame triggers, apply a force to a section of the bezier
    if (frame.trigger) {
      const radius = this.impactRadius * this.data.length;
      const targetPos = Math.floor(Math.random() * this.width * 4);
      const impactForce = Math.random() * 2 - 1;
      // const targetPos = 200;
      for (let y = 0; y < this.height; y++) {
        const offset = Math.random() * 0.1 - 0.05;
        for (let x = 0; x < this.width * 4; x += 4) {
          const distance = offset + Math.abs(MathUtils.clamp(MathUtils.mapLinear(targetPos - x/2, -radius, radius, -1, 1), -1, 1));
          const impact = Math.cos(distance * this.impactWaveFrequency);
          this.data[y * this.width * 4 + x + 1] += (1 - distance) * impact * impactForce * frame.power * this.impactForce;
          this.data[y * this.width * 4 + x + 1] += (1 - distance) * impact * impactForce * frame.power * this.impactForce;
        }
      }
    }

    // Update the spring physics bounce each frame
    for (let i = 0; i < this.data.length; i += 4) {
      const p = this.data[i];
      this.data[i + 1] = this.data[i + 1] * this.inertia + -p * this.springConstant;
      this.data[i] += this.data[i + 1];
    }

    console.log(this.data[0].toFixed(2));
    const data = new Uint8ClampedArray(this.data.length);
    for (let i = 0; i < this.data.length; i+=4 ) {
      const v = this.data[i] * 127;
      data[i] = Math.floor(v + 127);
      data[i + 3] = 255;
    }
    console.log(data.slice(0, 4).toString())
    this.dataTexture.image = new ImageData(data, this.width, this.height);
    this.dataTexture.needsUpdate = true;

    this.ctx.putImageData(this.dataTexture.image, 0, 0);
  }
}

