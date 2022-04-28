import { Camera, Scene, AudioListener, Audio, AudioAnalyser } from "three";
import gui from "./gui";

export interface IAudioFrame {
  ready: boolean,
  trigger: boolean,
  fft: number[],
  avgFrequency: number,
  power: number,
  progress: number,
  _rawFFt: number[],
  _maxFft: number[],
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
    this.minFft = new Array(fftSize).fill(100);
    this.maxFft = new Array(fftSize).fill(200);
    gui.add(this, 'fftNormalizeRate', 0, 100);
    gui.add(this, 'triggerThreshold', 0, 1, 0.01);
    gui.add(this, 'useMedian');
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
      this.song.setMediaElementSource(audio);

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
      };
    }
    const decay = this.fftNormalizeRate * deltaTime;
    this.maxFft = this.maxFft.map((el, i) => {
      return Math.max(el - decay, this.fft[i], 1)
    })
    const fft = Array.from(this.fft).map((v, i) => {
      const upper = this.maxFft[i];
      const scaled = (v) / (upper);
      return scaled;
    });

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
