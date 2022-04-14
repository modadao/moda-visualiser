import { Camera, Scene, AudioListener, Audio, AudioAnalyser } from "three";

export interface IAudioFrame {
  ready: boolean,
  fft: Uint8Array,
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

  framesSinceGet = 0;
  fft: Uint8Array;
  handleAudioFrame() {
    this.framesSinceGet = 1;
    const newFFt = (this.analyser as AudioAnalyser).getFrequencyData();
    this.fft = this.fft.map((v, i) => Math.max(v, newFFt[i]));
  }

  getAudioFrame(): IAudioFrame {
    const ready = this.analyser !== undefined;
    if (this.framesSinceGet < 0) return {
      ready: false,
      fft: this.fft,
      avgFrequency: -1,
      power: -1,
      progress: -1,
    };
    const fft = this.fft.map((v) => v / this.framesSinceGet);
    this.framesSinceGet = 0;
    this.fft.fill(0);
    const avgFrequency = this.analyser ? this.analyser.getAverageFrequency() : -1;
    // @ts-expect-error; Incomplete types
    const power = fft.length > 0 ? (fft as Array<number>).reduce((acc: number, el: number) => acc + el, 0) : -1;
    let progress = -1;
    if (AudioManager.audio) {
      AudioManager.audio.currentTime
      const { duration, currentTime } = AudioManager.audio;
      progress = currentTime / duration;
    }

    return {
      ready,
      fft,
      avgFrequency,
      power,
      progress,
    }
  }

  dispose() {
    if (AudioManager.audio) {
      AudioManager.audio.pause();
      document.body.removeChild(AudioManager.audio);
      AudioManager.audio = undefined;
    }
    if (this.interval) window.clearInterval(this.interval);
  }
}
