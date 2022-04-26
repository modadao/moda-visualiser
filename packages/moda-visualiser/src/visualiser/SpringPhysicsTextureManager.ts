import { DataTexture } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import IAudioReactive from "./ReactiveObject";

export default class SpringPhysicsTextureManager implements IAudioReactive {
  height = 0;
  dataTexture!: DataTexture;
  constructor(public width: number) {
    
  }

  /**
   * @returns The current y value of the row in the texture
   */
  registerSpringPhysicsElement() {
    const height = this.height;
    this.height += 1;
    return height;
  }

  build() {
    const data = new Uint16Array(this.width * this.height * 2);
    this.dataTexture = new DataTexture(data, this.width, this.height)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error
  handleAudio(frame: IAudioFrame): void {
    console.log(this.dataTexture.image.data)
  }
}
