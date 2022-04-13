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
    public scene: Scene
  ) {
    document.body.addEventListener('click', () => {
      console.log('Creating audio listener')
      this.listener = new AudioListener();
      this.song = new Audio(this.listener);
      this.camera.add(this.listener);
      this.scene.add(this.song);
    }, { once: true })
  }

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

      this.analyser = new AudioAnalyser(this.song, 128);
      audio.play();
    })
    audio.addEventListener('error', (e: ErrorEvent) => {
      console.error('Error loading audio: ', e)
    })
    audio.addEventListener('loadstart', () => console.log('started loading'))
    audio.addEventListener('loadedmetadata', (e: Event) => console.log('metadata loaded ', e))
    console.log('Loading audio now:w')
    audio.src = path;
  }

  getAudioFrame(): IAudioFrame {
    const ready = this.analyser !== undefined;
    const fft = this.analyser ? this.analyser.getFrequencyData() : new Uint8Array();
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
}
