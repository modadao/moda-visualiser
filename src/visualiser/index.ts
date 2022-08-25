import { Clock, Color, MathUtils, OrthographicCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";

import { IDerivedCoordinate, IDerivedFingerPrint, IFingerprint, IVisuals, IVisualsConstructor } from "../types";
import { customRandom, ImgSampler } from "../utils";
import AudioManager from "./AudioAnalyser";
import FFTDebug from "./FFTDebug";

const COLOR_SCHEME_IMG = ' data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMACgcHCAcGCggICAsKCgsOGBAODQ0OHRUWERgjHyUkIh8iISYrNy8mKTQpISIwQTE0OTs+Pj4lLkRJQzxINz0+O//bAEMBCgsLDg0OHBAQHDsoIig7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O//AABEIAAoAgAMBIgACEQEDEQH/xAAYAAEBAQEBAAAAAAAAAAAAAAAEAwUBAv/EACAQAAIBAwUBAQAAAAAAAAAAAAABMQIDBAUREiEyQYH/xAAWAQEBAQAAAAAAAAAAAAAAAAAFBgT/xAAcEQACAwADAQAAAAAAAAAAAAAAMQIDBAEFM0H/2gAMAwEAAhEDEQA/APAqxKBi7Eonri8mjWxktkMoS5A8aENtz+BVoVaxVkuoIWS6gKmwDaRuB6pEXA9UmmhkppZyiS7S4EKPRaryWvW/A2LA5aXEwM1Sb+X5ZgZv0tMiNlLMTIQXbsXkegrkcgiiyGlp67G1g9OgZWBdz4SKTH68H//Z'
const FEATURE_POINT_COUNT = 7;
const FEATURE_POINT_EXTRA_PER = 3000;

export type VisualiserEvents = 'play'|'pause'|'loading'|'loaded';

export interface ISettings {
  /**
   * @description Controls for options relating to the audio analysis including "triggers" (moments of impact in the audio, used for effects).
   */
  audio: {
    /** @description The rate at which the FFT adjusts to the audio.  Higher normalize rate = more frequent triggers, lower normalize rate = less frequent triggers.  **/
    normalizeRate: number,
    /** @description How sensitive the FFT is to "triggering" (sudden jumps in audio power). **/
    triggerThreshold: number,
  },

  /**
   * @description Controls relating to the colouring of the fingerprint points
   */
  color: {
    /* @description Gradient texture to sample the point colours from */
    colorTextureSrc: string,
    /* @description The rotational variation (basically a rotational gradient) */
    baseVariation: number,
    /* @description The amount of variation depending on the fingerpint data of that specific point.  */
    velocityVariation: number,
  },

  /**
   * @description Show or hide a canvas used for displaying FFT/Audio information.  Useful for debugging.
   */
  showDebugMenu: boolean,
}

const defaults: ISettings = {
  color: {
    colorTextureSrc: COLOR_SCHEME_IMG,
    baseVariation: 0.2,
    velocityVariation: 0.3,
  },
  audio: {
    triggerThreshold: 0.5,
    normalizeRate: 60,
  },
  showDebugMenu: false,
}


const targetDims = new Vector2(10, 10);
const halfDims = targetDims.clone().multiplyScalar(0.5);

export default class ModaVisualiser {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;

  visuals?: IVisuals;
  settings: ISettings = defaults;
  lastFingerprint!: IDerivedFingerPrint;

  audioManager?: AudioManager;

  stopped = false;
  clock: Clock;

  fftDebug?: FFTDebug;
  colorSampler?: ImgSampler;

  constructor(public element: HTMLElement, public visualsConstructor: IVisualsConstructor) {
    this.renderer = new WebGLRenderer({
      antialias: true,
    })
    this.renderer.setSize(800, 800);
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(new Color('#1B1D21'))
    this.renderer.autoClear = false;
    this.element.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(-halfDims.x, halfDims.y, halfDims.x, -halfDims.y, 0.001, 100);
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);

    this.clock = new Clock(false);

    this.startAnimation();
  }

  private buildScene(fingerprint: IDerivedFingerPrint, settings: ISettings) {
    this.colorSampler = new ImgSampler(settings.color.colorTextureSrc);
    this.lastFingerprint = fingerprint;

    this.visuals = new this.visualsConstructor(this.camera, this.renderer, fingerprint);
    this.scene.add(this.visuals);

    this.settings = settings;
    if (settings.showDebugMenu && !this.fftDebug && import.meta.env.DEV) {
      this.fftDebug = new FFTDebug(settings);
    }
  }

  private startAnimation() {
    this.update = this.update.bind(this);
    this.update();
  }

  time = 0;
  private update() {
    if (this.stopped) return;
    this.renderer.clear();

    const deltaTime = Math.min(this.clock.getDelta(), 0.2);
    this.time += deltaTime;

    if (this.audioManager) {
      const audioFrame = this.audioManager.getAudioFrame(deltaTime);
      if (this.visuals !== undefined) {
        if (this.visuals.preRender) this.visuals.preRender(this.renderer);
        this.visuals.update(this.time, deltaTime);
        if (audioFrame.ready) this.visuals.handleAudio(audioFrame);
      }
      if (this.fftDebug) this.fftDebug.handleAudio(audioFrame);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.shouldExport) {
      const link = document.createElement("a");
      link.download = "Export.png";
      link.href = this.renderer.domElement.toDataURL("image/png", 1);
      link.target = "_blank";
      link.click();
      this.handleResize(); // Return to default resolution
      this.shouldExport = false;
      this.exportComplete = true;
    }

    window.requestAnimationFrame(this.update);
  }

  resizeTimeout: number | undefined;
  private handleResize(overrideBounds?: DOMRect) {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = window.setTimeout(() => {
      const bounds = overrideBounds || this.element.getBoundingClientRect();

      const dimensionScale = Math.max(bounds.height / bounds.width, 1);
      halfDims.set(10, 10).multiplyScalar(dimensionScale).divideScalar(2);
      const aspect = bounds.width / bounds.height;
      this.camera.left = -aspect * halfDims.x;
      this.camera.right = aspect * halfDims.x;
      this.camera.top = halfDims.y;
      this.camera.bottom = -halfDims.y;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(bounds.width, bounds.height);
      this.resizeTimeout = undefined;
    }, 200)
  }

  /**
   * @description Updates the visualisation with a new fingerprint
   */
  updateFingerprint(fingerprint: IFingerprint, audioPath: string): Promise<void> {
    return new Promise((res, rej) => {
      this.emitEvent('loading');
      this.scene.clear();
      if (this.visuals)
        this.visuals.dispose();
      this.colorSampler = new ImgSampler(this.settings.color.colorTextureSrc);
      if (this.audioManager) this.audioManager.dispose();
      this.audioManager = new AudioManager(this.camera, this.scene, 64, this.settings);
      this.deriveFingerprint(fingerprint).then((derivedFingerprint) => {
        this.buildScene(derivedFingerprint, this.settings);
      });
      this.audioManager.load(audioPath).then(() => {
        if (this.audioManager) {
          this.audioManager.play()
            .catch(rej)
            .then(() => res());
        } else throw new Error('Could not play audio, no AudioManager')
        this.clock = new Clock();
        this.clock.start();
        if (this.visuals) {
          this.visuals.paused = false;
        }
        this.emitEvent('loaded');
        this.emitEvent('play');
      });
    })
  }

  /**
   * @description Updates the visualisation to use new settings
   */
  updateSettings(settings: ISettings) {
    this.scene.clear();
    this.colorSampler = new ImgSampler(this.settings.color.colorTextureSrc);
    if (this.visuals)
      this.visuals.dispose();
    this.buildScene(this.lastFingerprint, settings);
  }

  /**
   * @description Use a texture as a colour gradient.  Only enabled when setColorschemeMethod is 'texture'.
   */
  setColorsTexture(src: string) {
    this.settings.color.colorTextureSrc = src;
    this.updateSettings(this.settings);
  }

  /**
   * @description Sets the colour variation around the visualisation.  (Rotational variation)
   */
  setColorBaseVariation(val = 0.2) {
    this.settings.color.baseVariation = val;
    this.updateSettings(this.settings);
  }

  /**
   * @description Sets the colour variation dependent on point velocity. (Radial variation)
   */
  setColorVelocityVariation(val = 0.3) {
    this.settings.color.velocityVariation = val;
    this.updateSettings(this.settings);
  }

  private deriveFingerprint(fingerprint: IFingerprint): Promise<IDerivedFingerPrint> {
    return new Promise((res) => {

      const coords = fingerprint.coords.x.map((x, i) => ({ x, y: fingerprint.coords.y[i] }))
      // Generate smoothed data
      const SMOOTH_RANGE = 40;
      const smoothedValues = coords.map((_, i) => {
        const startIndex = Math.max(0, i - SMOOTH_RANGE);
        const endIndex = Math.min(coords.length, i + SMOOTH_RANGE);
        let v = 0;
        for (let j = startIndex; j < endIndex; j++) {
          v += coords[j].y;
        }
        v /= endIndex - startIndex;
        return v;
      })

      // Get raw gradient
      let gradients = [] as number[];
      for (const i of Array(coords.length).keys()) {
        if (i === coords.length - 1) {
          gradients.push(0);
          break;
        }
        const el = coords[i];
        const nel = coords[i+1]; // Next element
        const dy = (el.y - nel.y)
        const dx = el.x - nel.x
        if (dx !== 0 && dy !== 0) {
          const m = (dy / dx);
          const dir = m < 0 ? -1 : 1;
          const v = Math.log(Math.abs(m)) * dir;
          gradients.push(v);
        } else {
          gradients.push(0);
        }
      }

      // Normalize it between 0-1
      const gradientMax = gradients.reduce((acc, el) => Math.max(acc, el), 0);
      const gradientMin = gradients.reduce((acc, el) => Math.min(acc, el), 0);
      gradients = gradients.map((el) => {
        return MathUtils.mapLinear(el, gradientMin, gradientMax, 0, 1);
      })

      // Create a hashed value
      let hash = 0;
      for (const el of coords) {
        hash = ((hash<<5)-hash)+ el.x - el.y;
        hash = hash & hash; // Convert to 32bit integer
      }
      const floatHash = (hash / 2_147_483_647) * 0.5 + 0.5;

      const targetNumberOfFeatures = FEATURE_POINT_COUNT + Math.floor(coords.length / FEATURE_POINT_EXTRA_PER);
      const features: number[] = [];
      const featureLevels: number[] = [];
      for (let i = 0; i < targetNumberOfFeatures; i++) {
        let targetFeatureIndex = 0;
        let j = 0;
        // Regenerate targetFeatureIndex until it's unique
        do {
          j += 1;
          targetFeatureIndex = Math.floor(customRandom.deterministic(i, floatHash, j) * coords.length);
        } while(features.includes(targetFeatureIndex))

        // Push 
        features.push(targetFeatureIndex)
        featureLevels.push(customRandom.deterministic(i, floatHash));
      }

      // Split the coords into segments
      const [ height, width ] = fingerprint.shape;
      const segmentSize = Math.floor(width / targetNumberOfFeatures + 1);
      const segmentedPoints: Array<Array<{x: number, y:number}>> = new Array(targetNumberOfFeatures).fill(0).map(() => []);
      coords.forEach(el => {
        const bucketIndex = Math.floor(el.x / ( segmentSize + 1 ));
        segmentedPoints[bucketIndex].push(el);
      });

      const distance2d = (v1: {x: number, y:number}, v2: {x: number, y: number}) => {
        return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
      }
      // Find the densest coord in each segment
      const maxDist = Math.max(segmentSize, height);
      let offset = 0;
      let mostDenseCoords = segmentedPoints.map(( points ) => {
        const densities = points.map(p => {
          const density = points.reduce((acc, el) => {
            return acc + (1 - distance2d(p, el) / maxDist);
          }, 0) / points.length;
          return density;
        })

        const mostDense = Math.max(...densities);
        const mostDenseIndex = densities.findIndex(el => el === mostDense);
        const res = { index: offset + mostDenseIndex, density: mostDense }
        offset += points.length;
        return res;
      }).filter(c => Number.isFinite(c.density)); // Filter out invalid points 

      // Normalize it between 0 and 1
      const minDense = Math.min(...mostDenseCoords.map(c => c.density));
      const maxDense = Math.max(...mostDenseCoords.map(c => c.density));
      mostDenseCoords = mostDenseCoords.map(c => {
        return {
          ...c,
          density: MathUtils.mapLinear(c.density, minDense, maxDense, 0.05, 1),
        }
      });

      const derivedCoords = coords.map((el, i) => {
        const featurePoint = mostDenseCoords.find(dc => dc.index === i);
        return {
          x: el.x,
          y: el.y,
          g: gradients[i],
          smoothed: smoothedValues[i],
          featureLevel: featurePoint ? featurePoint.density : 0,
        }
      });

      (async () => {

        const { sin, cos, floor, max, pow } = Math;
        const [ height, width ] = fingerprint.shape;

        const fingerprintBaseVariation = MathUtils.mapLinear(sin(floatHash), 0, 1, 0.7, 1.2);
        const fingerprintVelocityVariation = MathUtils.mapLinear(sin(floatHash), 0, 1, 0.7, 1.2);

        const { baseVariation, velocityVariation } = this.settings.color;
        const variationScalar = baseVariation * fingerprintBaseVariation;
        const velocityScalar = velocityVariation * fingerprintVelocityVariation;
        if (this.colorSampler && this.colorSampler.loading)
          await this.colorSampler.loading;

        const scale = (500 + max(-pow(height, 0.8), -pow(height, 0.7)-100, -pow(height, 0.6)-160)) / 400 * 0.15
        const visualiserCoords = derivedCoords.map(p => {
          const theta = (p.x / width) * Math.PI * 2;
          const x = sin(theta);
          const z = cos(theta);
          const step = floor(theta / (Math.PI * 2));
          const amp = p.y / height * 1.5;
          const r = step + 1.5 + amp;

          const s = (Math.abs(p.g - 0.5) + scale) * scale;

          let smoothhash = (floatHash + sin(theta + floatHash * Math.PI) * variationScalar + p.g * velocityScalar) % 1;
          while(smoothhash < 0) smoothhash += 1;

          if (!this.colorSampler) throw new Error('ModaVisualiser: ColorSampler not set');
          const color = this.colorSampler.getPixel(smoothhash);

          return {
            ...p,
            theta,
            pos: new Vector3(x * r, 0, z * r),
            scale: s,
            smoothhash,
            color,
          }
        }) as IDerivedCoordinate[];
        const result: IDerivedFingerPrint =  { 
          shape: fingerprint.shape as [number, number],
          coords: visualiserCoords,
          hash,
          floatHash,
        }
        res(result);
      })()
    })
  }

  /**
   * @description Cleans up scene elements, run this before component unmounts.
   * @returns
   */
  dispose() {
    this.stopped = true;
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
    this.stopped = true;
    if (this.audioManager) this.audioManager.dispose();
    if (this.visuals) this.visuals.dispose();
  }

  /**
   * @description Exports the next frame at a given dimension.
   */
  exportComplete = false;
  shouldExport = false;
  export(dimensions: number) {
    const dpr = window.devicePixelRatio;
    const bounds = new DOMRect(0, 0, dimensions / dpr, dimensions / dpr);
    const oldZoom = this.camera.zoom;
    const oldPosition = this.camera.position.clone();
    this.camera.zoom = 0.45;
    this.camera.position.set(0, 50, 0);
    this.handleResize(bounds);
    this.pause();

    setTimeout(() => {
      this.shouldExport = true;
    }, 200)

    const checkCompletionInterval = setInterval(() => {
      if (this.exportComplete) {
        this.exportComplete = false;
        this.camera.zoom = oldZoom;
        this.camera.position.copy(oldPosition);
        this.play();
        window.clearInterval(checkCompletionInterval);
      }
    })
    // Rest handled in the `update` loop.
  }

  play(): boolean {
    if (!this.visuals) return false;
    if (this.audioManager) this.audioManager.play();
    if (this.visuals) this.visuals.paused = false;
    this.clock.start();
    this.emitEvent('play');
    return true;
  }

  pause(): boolean {
    if (!this.visuals) return false;
    if (this.audioManager) this.audioManager.pause();
    if (this.visuals) this.visuals.paused = true;
    this.clock.stop();
    this.emitEvent('pause');
    return true;
  }

  mute(): boolean {
    if (this.audioManager) {
      return this.audioManager.mute();
    } else {
      return false;
    }
  }

  unmute(): boolean {
    if (this.audioManager) {
      return this.audioManager.unmute();
    } else {
      return false;
    }
  }

  callbacks: Record<VisualiserEvents, Array<() => void>> = {
    play: [],
    pause: [],
    loading: [],
    loaded: [],
  };

  addEventListener(name: VisualiserEvents, cb: () => void) {
    this.callbacks[name].push(cb);
  }

  private emitEvent(name: VisualiserEvents) {
    this.callbacks[name].forEach(cb => cb());
  }

  /**
   * Pass in an audio element that already has playback permissions, needed for
   * for working around browser autoplay audio / video prevention.
   * 
   * @param audio - 
   */
  static setAudioElement(audio: HTMLAudioElement) {
    AudioManager.audio = audio;
  }
}
