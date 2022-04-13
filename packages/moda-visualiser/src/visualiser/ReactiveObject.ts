import { IAudioFrame } from "./AudioAnalyser";

export default interface IAudioReactive {
  handleAudio(frame: IAudioFrame): void
}
