import { IAudioFrame } from "./AudioAnalyser";
import FFTTextureManager from "./FftTextureManager";
import gui from "./gui";
import IAudioReactive from "./ReactiveObject";

type HistoryEl = {
  power: number,
  trigger: boolean,
}

export default class FFTDebug implements IAudioReactive {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  height = 200;
  historyHeight = 100;
  triggerThreshold = 0.5;
  fftTextureManager = new FFTTextureManager();
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    document.body.appendChild(this.canvas);
    this.canvas.style.position = 'fixed';
    this.canvas.style.right = '0';
    this.canvas.style.bottom = '0';

    gui.add(this, 'triggerThreshold', 0, 1, 0.01);
  }

  history = new Array<HistoryEl>(64);
  handleAudio(frame: IAudioFrame): void {
    this.fftTextureManager.handleAudio(frame);
    const barWidth = 4;
    if (this.canvas.width !== barWidth * frame.fft.length) {
      this.canvas.width = barWidth * frame.fft.length;
    }
    if (this.canvas.height !== this.height) {
      this.canvas.height = this.height + this.historyHeight;
    }
    const {ctx} = this;
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const {fft, _rawFFt, _maxFft, _minFft} = frame;

    ctx.fillStyle = 'white';
    fft.forEach((amp, i) => {
      const top = this.height - amp * this.height;
      ctx.fillRect(i * barWidth+1, top, barWidth, amp * this.height);
    })
    ctx.fillStyle = 'grey';
    _rawFFt.forEach((amp, i) => {
      const a = (amp / 255) * this.height;
      const top = this.height - a;
      ctx.fillRect(i * barWidth-1, top, 1, a);
    })
    _maxFft.forEach((amp, i) => {
      if (this.fftTextureManager.triggerStates[i][1]) {
        ctx.fillStyle = 'green';
      } else {
        ctx.fillStyle = 'red';
      }
      const top = this.height - amp / 255 * this.height;
      ctx.fillRect(i * barWidth-1, top - 4, barWidth-1, 4);
    })
    ctx.fillStyle = 'red';
    _minFft.forEach((amp, i) => {
      const top = this.height - amp / 255 * this.height;
      ctx.fillRect(i * barWidth-1, top - 4, barWidth-1, 4);
    })

    if (frame.power > this.triggerThreshold) {
      ctx.fillStyle = 'green';
      ctx.fillRect(this.canvas.width - 20, 0, 20, 20);
    }

    this.history.push({ power: frame.power, trigger: frame.trigger });
    if (this.history.length > 64) {
      this.history.splice(0, 1)
    }

    this.history.forEach((v, i) => {
      const top = this.height + this.historyHeight - v.power * this.historyHeight;
      if ( v.trigger) ctx.fillStyle = 'green';
      else ctx.fillStyle = 'red';
      ctx.fillRect(i * barWidth-1, top - 4, barWidth-1, 4);
    })
  }
}
