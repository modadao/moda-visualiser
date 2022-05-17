import { Color, Vector3 } from "three";

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
  shape: [number, number],
  coords: IDerivedCoordinate[],
  hash: number,
  floatHash: number,
}
