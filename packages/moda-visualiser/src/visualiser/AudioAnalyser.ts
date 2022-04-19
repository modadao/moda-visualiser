import { Camera, Scene, AudioListener, Audio, AudioAnalyser } from "three";

export interface IAudioFrame {
  ready: boolean,
  fft: number[],
  avgFrequency: number,
  power: number,
  progress: number,
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

  fftNormalizeRate = 2;
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
        fft: [],
        avgFrequency: -1,
        power: -1,
        progress: -1,
      };
    }
    const decay = this.fftNormalizeRate * deltaTime;
    this.minFft = this.minFft.map((el, i) => {
      return Math.min(el + decay, this.fft[i])
    })
    this.maxFft = this.maxFft.map((el, i) => {
      return Math.max(el - decay, this.fft[i], 1)
    })
    const fft = Array.from(this.fft).map((v, i) => {
      const upper = this.maxFft[i];
      const lower = this.minFft[i];
      const scaled = (v- lower) / (upper - lower);
      return scaled;
    });

    this.hasNewAudioFrame = false;
    this.fft.fill(0);
    const power = (fft as Array<number>).reduce((acc: number, el: number) => acc + el, 0) / this.fftSize;
    let progress = -1;
    if (AudioManager.audio) {
      AudioManager.audio.currentTime
      const { duration, currentTime } = AudioManager.audio;
      progress = currentTime / duration;
    }

    return {
      ready: true,
      fft,
      avgFrequency: this.avgFrequency,
      power,
      progress,
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
