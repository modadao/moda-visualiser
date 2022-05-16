import { Clock, Color, OrthographicCamera, Scene, Vector2, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { IDerivedFingerPrint, IFingerprint } from "../types";
import { deriveData } from "../utils";
import AudioManager from "./AudioAnalyser";
import FFTDebug from "./FFTDebug";
import RadialSphere from "./RadialSpheres";

const COLOR_SCHEME_IMG = ' data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMACgcHCAcGCggICAsKCgsOGBAODQ0OHRUWERgjHyUkIh8iISYrNy8mKTQpISIwQTE0OTs+Pj4lLkRJQzxINz0+O//bAEMBCgsLDg0OHBAQHDsoIig7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O//AABEIAAoAgAMBIgACEQEDEQH/xAAYAAEBAQEBAAAAAAAAAAAAAAAEAwUBAv/EACAQAAIBAwUBAQAAAAAAAAAAAAABMQIDBAUREiEyQYH/xAAWAQEBAQAAAAAAAAAAAAAAAAAFBgT/xAAcEQACAwADAQAAAAAAAAAAAAAAMQIDBAEFM0H/2gAMAwEAAhEDEQA/APAqxKBi7Eonri8mjWxktkMoS5A8aENtz+BVoVaxVkuoIWS6gKmwDaRuB6pEXA9UmmhkppZyiS7S4EKPRaryWvW/A2LA5aXEwM1Sb+X5ZgZv0tMiNlLMTIQXbsXkegrkcgiiyGlp67G1g9OgZWBdz4SKTH68H//Z'

export interface ISettings {
  points: {
    outlineSize: number,
    outlineMultiplier: number,
    outlineAdd: number,
    innerGlow: number,
  }
  featurePoints: {
    count: number,
    extraPer: number,
    sizeSmall: number,
    sizeMed: number,
    sizeMdLg: number,
    sizeLarge: number,
  },
  color: {
    colorschemeMethod: 'gradient'|'texture',
    colorTextureSrc: string,
    custom: Record<string, string>,
    baseVariation: number,
    velocityVariation: number,
  },
  beziers: {
    flareOut: number,
    flareIn: number,
    angleRandomness: number,
    verticalAngleRandomness: number,
    verticalIncidence: boolean,
  },
  sceneElements: {
    galaxyPoints: boolean,
    outlines: boolean,
    circumferenceGraph: boolean,
    mainBezier: boolean,
    extraBeziers: boolean,
    rings: boolean,
  }
}

const defaults: ISettings = {
  points: {
    outlineSize: 0.007,
    outlineAdd: 0.65,
    outlineMultiplier: 1,
    innerGlow: 1,
  },
  featurePoints: {
    count: 7,
    extraPer: 3000,
    sizeSmall: 0.1,
    sizeMed: 0.15,
    sizeMdLg: 0.2,
    sizeLarge: 0.3,
  },
  color: {
    colorschemeMethod: 'texture',
    colorTextureSrc: COLOR_SCHEME_IMG,
    custom: {
      '1': '#FF2F42',
      '2': '#FFA71F',
      '3': '#00F5C4',
      '4': '#B44CF8',
    },
    baseVariation: 0.2,
    velocityVariation: 0.3,
  },
  beziers: {
    flareOut: 2.5,
    flareIn: 0.5,
    angleRandomness: 1,
    verticalAngleRandomness: 1,
    verticalIncidence: false,
  },
  sceneElements: {
    galaxyPoints: false,
    outlines: true,
    circumferenceGraph: true,
    mainBezier: true,
    extraBeziers: true,
    rings: true,
  }
}


const targetDims = new Vector2(10, 10);
const halfDims = targetDims.clone().multiplyScalar(0.5);

export default class ModaVisualiser {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  orbitControls: OrbitControls;

  radialSpheres?: RadialSphere;
  settings: ISettings = defaults;
  lastFingerprint!: IDerivedFingerPrint;

  shouldExport = false;
  exportDimensions = 0;

  audioManager: AudioManager;

  stopped = false;
  clock: Clock;

  fftDebug = new FFTDebug();

  constructor(public element: HTMLElement) {
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

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    this.audioManager = new AudioManager(this.camera, this.scene);
    this.clock = new Clock(true);

    this.startAnimation();
  }

  private buildScene(fingerprint: IDerivedFingerPrint, settings: ISettings) {
    this.lastFingerprint = fingerprint;
    this.radialSpheres = new RadialSphere(this.camera, fingerprint, settings);
    this.settings = settings;
    this.scene.add(this.radialSpheres);
  }

  private startAnimation() {
    this.update = this.update.bind(this);
    this.update();
  }

  time = 0;
  private update() {
    if (this.stopped) return;
    this.renderer.clear();

    const deltaTime = this.clock.getDelta();
    this.time += deltaTime;
    this.orbitControls.update()

    const audioFrame = this.audioManager.getAudioFrame(deltaTime);
    if (this.radialSpheres) {
      this.radialSpheres.preRender(this.renderer);
      this.radialSpheres.update(this.time, deltaTime);
      if (audioFrame.ready) this.radialSpheres.handleAudio(audioFrame);
    }
    this.fftDebug.handleAudio(audioFrame);

    this.renderer.render(this.scene, this.camera);

    if (this.shouldExport) {
      const link = document.createElement("a");
      link.download = "Export.png";
      link.href = this.renderer.domElement.toDataURL("image/png", 1);
      link.target = "_blank";
      link.click();
      this.handleResize(); // Return to default resolution
      this.shouldExport = false;
      console.log('Exporting done')
    }
    if (!this.stopped) window.requestAnimationFrame(this.update);
  }

  resizeTimeout: number|undefined;
  private handleResize(overrideBounds?: DOMRect) {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = window.setTimeout(() => {
      console.log(overrideBounds);
      const bounds = overrideBounds || this.element.getBoundingClientRect();

      const dimensionScale = Math.max(bounds.height / bounds.width, 1);
      halfDims.set(10, 10).multiplyScalar(dimensionScale).divideScalar(2);
      console.log(`Resizing to ${bounds.width}x${bounds.height}`);
      const aspect = bounds.width / bounds.height;
      console.log(aspect);
      this.camera.left = -aspect * halfDims.x;
      this.camera.right = aspect * halfDims.x;
      this.camera.top = halfDims.y;
      this.camera.bottom = -halfDims.y;
      this.camera.updateProjectionMatrix();
      const {top, bottom, left, right} = this.camera;
      console.log({top, bottom, left, right})
      this.renderer.setSize(bounds.width, bounds.height);
      this.resizeTimeout = undefined;
    }, 200)
  }

  /**
   * @description Updates the visualisation with a new fingerprint
   */
  updateFingerprint(fingerprint: IFingerprint, audioPath: string) {
    this.scene.clear();
    if (this.radialSpheres)
      this.radialSpheres.dispose();
    const derivedFingerprint = deriveData(fingerprint, this.settings);
    this.buildScene(derivedFingerprint, this.settings);
    this.audioManager.load(audioPath);
  }

  /**
   * @description Updates the visualisation to use new settings
   */
  updateSettings(settings: ISettings) {
    this.scene.clear();
    if (this.radialSpheres)
      this.radialSpheres.dispose();
    this.buildScene(this.lastFingerprint, settings);
  }

  /**
   * @description Sets the outline width of all of the points.
   */
  setOutlineSize(val = 0.007) {
    this.settings.points.outlineSize = val;
    this.updateSettings(this.settings);
  }

  /**
   * @description Brighten or darken the outline color.  At 0 the outline will be the same colour as the feature point.
   */
  setOutlineColorBrightness(val = 0.65) {
    this.settings.points.outlineAdd = val;
    this.updateSettings(this.settings);
  }

  /**
   * @description Configure the amount of inner glow applied to the feature point spheres.
   */
  setSphereInnerGlow(val = 1) {
    this.settings.points.innerGlow = val;
    this.updateSettings(this.settings);
  }

  /**
   * @description Set the base number of feature points.
   */
  setFeaturePointBaseCount(val = 7) {
    this.settings.featurePoints.count = val;
    this.updateSettings(this.settings);
  }

  /**
   * @description Add an extra feature point for every x number of data points.
   */
  setFeaturePointExtraPer(val = 1000) {
    this.settings.featurePoints.extraPer = val;
    this.updateSettings(this.settings);
  }

  /**
   * @description Set the variation of feature point sizes.
   */
  setFeaturePointsSizes(sizes = {
    small: 0.25,
    medium: 0.3,
    large: 0.4,
    xlarge: 0.6
  }) {
    this.settings.featurePoints.sizeSmall = sizes.small;
    this.settings.featurePoints.sizeMed = sizes.medium;
    this.settings.featurePoints.sizeMdLg = sizes.large;
    this.settings.featurePoints.sizeLarge = sizes.xlarge;
    this.updateSettings(this.settings);
  }

  /**
   * @param  method Sets the colorscheme method to source colours from either a texture (setColorsTexture) or an array of colors (setColors).
   * @default 'texture'
   */
  setColorschemeMethod(method: 'texture'|'gradient') {
    this.settings.color.colorschemeMethod = method;
    this.updateSettings(this.settings);
  }

  /**
   * @description Set a custom colour scheme using an array of hex strings.
   */
  setColors(colors = ['#ff2f42', '#ffa71f', '#00f5c4', '#b44cf8']) {
    const custom = colors.reduce((acc: Record<string, string>, el: string, i: number) => {
      acc[i.toString()] = el;
      return acc;
    }, {} as Record<string, string>);
    this.settings.color.custom = custom;
    this.updateSettings(this.settings);
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

  setBeziersFlare(flareIn = 0.5, flareOut = 2.5) {
    this.settings.beziers.flareIn = flareIn;
    this.settings.beziers.flareOut = flareOut;
    this.updateSettings(this.settings);
  }

  setBeziersAngleVariation(horizontal = 1, vertical = 1) {
    this.settings.beziers.angleRandomness = horizontal;
    this.settings.beziers.verticalAngleRandomness = vertical;
    this.updateSettings(this.settings);
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
    this.audioManager.dispose();
    if (this.radialSpheres)
      this.radialSpheres.dispose();
  }

  /**
   * @description Exports the next frame at a given dimension.
   */
  export(dimensions: number) {
    const dpr = window.devicePixelRatio;
    const bounds = new DOMRect(0, 0, dimensions / dpr, dimensions / dpr);
    this.camera.zoom = 0.45;
    this.camera.position.set(0, 50, 0);
    this.handleResize(bounds);
    setTimeout(() => {
      this.shouldExport = true;
    }, 300)
    // Rest handled in the `update` loop.
  }

  play() {
    this.audioManager.play();
  }

  pause() {
    this.audioManager.pause();
  }
}
