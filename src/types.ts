export interface ICoordinate {
  x: number,
  y: number,
}
export interface IFingerprint {
  shape: [number, number];
  coords: ICoordinate[],
}

export interface IDerivedCoordinate extends ICoordinate {
  g: number,
  gmax: boolean,
  gmin: boolean,
  max: boolean,
  min: boolean,
};
export interface IDerivedFingerPrint extends IFingerprint {
  coords: IDerivedCoordinate[],
  hash: number,
  floatHash: number,
}