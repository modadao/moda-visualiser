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
};
export interface IDerivedFingerPrint extends IFingerprint {
  coords: IDerivedCoordinate[]
}