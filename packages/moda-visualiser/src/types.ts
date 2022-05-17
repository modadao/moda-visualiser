import { Color, Object3D, OrthographicCamera, PerspectiveCamera, Vector3, WebGLRenderer } from "three";
import { IAudioFrame } from "./visualiser/AudioAnalyser";

export interface IPayloadCoordinates {
  x: number[],
  y: number[],
}

export interface IFingerprint {
  shape: number[];
  coords: IPayloadCoordinates,
}

export interface IDerivedCoordinate {
  x: number,
  y: number,
  g: number,
  smoothed: number,
  featureLevel: number,
  theta: number,
  pos: Vector3,
  scale: number,
  smoothhash: number,
  color: Color,
}

export interface IDerivedFingerPrint {
  /*
   * @description Outer dimensions of the fingerprint [width, height]
   */
  shape: [number, number],

  /*
   * @description Coordinate data with extra derived data added to each element.
   */
  coords: IDerivedCoordinate[],

  /*
   * @description Random hash associated with the fingerprint (-MAX INT -> +MAX INT)
   */
  hash: number,

  /*
   * @description Random hash associated with the fingerprint (0 - 1)
   */
  floatHash: number,
}

export default interface IAudioReactive {

  /*
   * @description Called once per frame after the update event.  This is where you add audioreactivity
   */
  handleAudio(frame: IAudioFrame): void;
}

export interface IVisualsConstructor {
  new (camera: OrthographicCamera|PerspectiveCamera, renderer: WebGLRenderer, fingerprint: IDerivedFingerPrint): IVisuals;
}

export interface IVisuals extends IAudioReactive, Object3D {
  /*
   * @description Optional function called before rendering the scene, can be used to add a background.
   */
  preRender?: (renderer: WebGLRenderer) => void;
  /*
   * @description Called once per frame.
   */
  update(elapsed: number, delta: number): void;
  
  /*
   * @description Dispose function should clean up any GPU resources, unbinds any event listeners etc.  This is called when the visualiser is stopping.
   */
  dispose():void;
}

declare const IVisuals: IVisualsConstructor;
