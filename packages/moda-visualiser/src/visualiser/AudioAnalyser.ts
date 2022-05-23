import { Camera, Scene, AudioListener, Audio, AudioAnalyser, MathUtils } from "three";
import { ISettings } from ".";

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
  static audio: HTMLAudioElement;
  song: Audio|undefined;
  listener: AudioListener|undefined;

  analyser: AudioAnalyser|undefined;
  triggerThreshold = 0.5;
  fftNormalizeRate = 60;

  constructor(
    public camera: Camera,
    public scene: Scene,
    public fftSize = 64,
    settings: ISettings,
  ) {
    this.triggerThreshold = settings.audio.triggerThreshold;
    this.fftNormalizeRate = settings.audio.normalizeRate;

    document.body.addEventListener('click', () => {
      this.setup();
    }, { once: true })

    this.fft = new Uint8Array(fftSize).fill(0);
    this.minFft = new Array(fftSize).fill(0);
    this.maxFft = new Array(fftSize).fill(200);

    if (!AudioManager.audio) {
      const existingAudio = document.getElementById('moda-visualiser-audio-source') as HTMLAudioElement;
      if (existingAudio) {
        AudioManager.audio = existingAudio;
      } else {
        AudioManager.audio = document.createElement('audio');
      }

      AudioManager.audio.classList.add('Moda-Visualiser-Audio-Source')
      AudioManager.audio.id = 'moda-visualiser-audio-source';
      // mediaElement.setAttribute('crossorigin', 'anonymous');
      AudioManager.audio.style.display = 'none';
      document.body.appendChild(AudioManager.audio);
    }
  }

  hasSetup = false;
  setup() {
    if (this.hasSetup) return;
    this.listener = new AudioListener();
    this.song = new Audio(this.listener);
    this.camera.add(this.listener);
    this.scene.add(this.song);
    this.hasSetup = true;
  }

  interval: number|undefined;
  load(path: string): Promise<void> {
    const {audio} = AudioManager;
    const promise: Promise<void> = new Promise((res, rej) => {
      if (!this.listener || !this.song) {
        this.setup();
      }

      audio.addEventListener('canplaythrough', () => {
        if (!this.song) throw new Error('song audio object not initialised');
        try {
          this.song.setMediaElementSource(audio);
        } catch(e) {
          console.warn(`There was an error setting the media source but usually it works anyway. \n\n`, e)
        }

        this.analyser = new AudioAnalyser(this.song, this.fftSize * 2);
        if (this.interval) window.clearInterval(this.interval);
        this.interval = window.setInterval(() => {
          this.handleAudioFrame();
        }, 5);
        audio.play();
        res();
      })
      audio.addEventListener('error', (e: ErrorEvent) => {
        console.error('Error loading audio: ', e)
        rej(e);
      })
    })
    audio.src = path;
    audio.load();
    return promise;
  }

  private hasTriggered = false
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

    const shouldTrigger = power > this.triggerThreshold;

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
      return true;
    }
    return false;
  }

  pause() {
    if (AudioManager.audio) {
      AudioManager.audio.pause();
      return true;
    }
    return false;
  }

  mute() {
    if (AudioManager.audio) {
      AudioManager.audio.setAttribute('muted', '');
      return true;
    }
    return false;
  }

  unmute() {
    if (AudioManager.audio) {
      AudioManager.audio.removeAttribute('muted');
      return true;
    }
    return false;
  }

  dispose() {
    if (AudioManager.audio) {
      AudioManager.audio.pause();
      document.body.removeChild(AudioManager.audio);
    }
    if (this.interval) window.clearInterval(this.interval);
    if (this.song) this.song.disconnect();
  }
}
