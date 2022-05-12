import { Camera, Scene, AudioListener, Audio, AudioAnalyser, MathUtils } from "three";
import gui, { fftControls } from "./gui";

export interface IAudioFrame {
  ready: boolean,
  trigger: boolean,
  fft: number[],
  avgFrequency: number,
  power: number,
  progress: number,
  _rawFFt: number[],
  _maxFft: number[],
  _minFft: number[],
}

export default class AudioManager {
  static audio: HTMLAudioElement|undefined;
  song: Audio|undefined;
  listener: AudioListener|undefined;

  analyser: AudioAnalyser|undefined;
  constructor(
    public camera: Camera,
    public scene: Scene,
    public fftSize = 64
  ) {
    document.body.addEventListener('click', () => {
      console.log('Creating audio listener')
      this.listener = new AudioListener();
      this.song = new Audio(this.listener);
      this.camera.add(this.listener);
      this.scene.add(this.song);
    }, { once: true })

    this.fft = new Uint8Array(fftSize).fill(0);
    this.minFft = new Array(fftSize).fill(0);
    this.maxFft = new Array(fftSize).fill(200);
    fftControls.add(this, 'fftNormalizeRate', 0, 100);
    fftControls.add(this, 'triggerThreshold', 0, 1, 0.01);
    fftControls.add(this, 'useMedian');
  }

  interval: number|undefined;
  load(path: string) {
    if (!this.listener || !this.song) {
      console.warn('click on page first')
      return;
    }

    if (!AudioManager.audio) {
      AudioManager.audio = document.createElement('audio');
      AudioManager.audio.classList.add('Moda-Visualiser-Audio-Source')
      AudioManager.audio.style.display = 'none';
      document.body.appendChild(AudioManager.audio);
    }
    const {audio} = AudioManager;
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio loaded, playing song', audio)
      if (!this.song) throw new Error('song audio object not initialised');
      try {
        this.song.setMediaElementSource(audio);
      } catch(e) {
        console.warn(`There was an error setting the media source but usually it works anyway. \n\n`, e)
      }

      this.analyser = new AudioAnalyser(this.song, this.fftSize * 2);
      console.log( this.analyser.analyser);
      audio.play();
      if (this.interval) window.clearInterval(this.interval);
      this.interval = window.setInterval(() => {
        this.handleAudioFrame();
      }, 5);
    })
    audio.addEventListener('error', (e: ErrorEvent) => {
      console.error('Error loading audio: ', e)
    })
    audio.addEventListener('loadstart', () => console.log('started loading'))
    audio.addEventListener('loadedmetadata', (e: Event) => console.log('metadata loaded ', e))
    console.log('Loading audio now:w')
    audio.src = path;
  }

  useMedian = false;
  triggerThreshold = 0.5;
  private hasTriggered = false
  fftNormalizeRate = 60;
  hasNewAudioFrame = false;
  minFft: number[];
  maxFft: number[];
  fft: Uint8Array;
  avgFrequency = 0;

  handleAudioFrame() {
    this.hasNewAudioFrame = true;
    const analyser = this.analyser as AudioAnalyser;
    const newFFt = analyser.getFrequencyData();
    this.avgFrequency = analyser.getAverageFrequency();
    this.fft = this.fft.map((v, i) => Math.max(v, newFFt[i]));
  }

  getAudioFrame(deltaTime: number): IAudioFrame {
    if (!this.hasNewAudioFrame || this.analyser === undefined) {
      return {
        ready: false,
        trigger: false,
        fft: [],
        avgFrequency: -1,
        power: -1,
        progress: -1,
        _rawFFt: [],
        _maxFft: [],
        _minFft: [],
      };
    }
    const decay = this.fftNormalizeRate * deltaTime;
    const { length } = this.maxFft;
    for (let i = 0; i < length; i++) {
      this.maxFft[i] = Math.max(this.maxFft[i] - decay, MathUtils.lerp(this.fft[i], this.fft[i] * 1.1, 0.5), 1);
    }
    for (let i = 0; i < length; i++) {
      this.minFft[i] = Math.min(this.minFft[i] + decay, MathUtils.lerp(this.fft[i], this.fft[i] * 0.9, 0.5), 255);
    }

    const fft = new Array(length);
    for (let i = 0; i < length; i++) {
      const upper = this.maxFft[i];
      const lower = this.minFft[i];
      fft[i] = ( this.fft[i] - lower ) / ( upper - lower );
    }

    const _rawFFt = Array.from(this.fft);
    this.hasNewAudioFrame = false;
    this.fft.fill(0);
    const power = (fft as Array<number>).reduce((acc: number, el: number) => acc + el, 0) / this.fftSize;

    const shouldTrigger = this.useMedian 
      ? fft.filter((v) => v > this.triggerThreshold).length > fft.length / 2
      : power > this.triggerThreshold;

    let trigger = false;
    if (!this.hasTriggered && shouldTrigger) {
      trigger = true;
      this.hasTriggered = true;
    } else if (this.hasTriggered && !shouldTrigger) {
      this.hasTriggered = false;
    }
    let progress = -1;
    if (AudioManager.audio) {
      AudioManager.audio.currentTime
      const { duration, currentTime } = AudioManager.audio;
      progress = currentTime / duration;
    }

    return {
      ready: true,
      fft,
      trigger,
      avgFrequency: this.avgFrequency,
      power,
      progress,
      _rawFFt,
      _maxFft: this.maxFft,
      _minFft: this.minFft,
    }
  }

  play() {
    if (AudioManager.audio) {
      AudioManager.audio.play();
    }
  }

  pause() {
    if (AudioManager.audio) {
      AudioManager.audio.pause();
    }
  }

  dispose() {
    if (AudioManager.audio) {
      AudioManager.audio.pause();
      document.body.removeChild(AudioManager.audio);
      AudioManager.audio = undefined;
    }
    if (this.interval) window.clearInterval(this.interval);
    if (this.song) this.song.disconnect();
  }
}
