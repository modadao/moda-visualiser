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
  /* @description x position in the fingerprint plot. */
  x: number,
  /* @description y position in the fingerprint plot. */
  y: number,
  /* @description gradient of this fingerprint coordinate (if it's moving up or down relative to previous point). */
  g: number,
  /* @description Smoothed version of the `y` coordinate. */
  smoothed: number,
  /* @description If this point is a feature point then this value will be > 0. */
  featureLevel: number,
  /* @description The theta (angle in radians) of this coordinate (so that it can be plotted in a circle). */
  theta: number,
  /* @description The 3d position of this coordinate (use this to keep the same point structure as the DefaultVisuals). */
  pos: Vector3,
  /* @description The scale of this point. */
  scale: number,
  /* @description Calculated off the floatHash of the entire fingerprint and then offset by theta and gradient, used to calculate colors.. */
  smoothhash: number,
  /* @description The color of the point (calculated from smoothhash). */
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
  new (camera: OrthographicCamera, renderer: WebGLRenderer, fingerprint: IDerivedFingerPrint): IVisuals;
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
