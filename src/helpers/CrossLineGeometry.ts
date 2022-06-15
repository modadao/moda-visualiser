import { BufferAttribute, BufferGeometry, Vector3 } from "three";

export default class CrossLineGeometry extends BufferGeometry {
  constructor(length: number) {
    super();
    const points = [
      new Vector3(-length, 0, 0),
      new Vector3(+length, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, -length, 0),
      new Vector3(0, +length, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -length),
      new Vector3(0, 0, +length),
    ]
    const verts = new Float32Array(([] as number[]).concat(...points.map(el => el.toArray())));
    // const indexes = new Float32Array([0, 1, 2, 3, 4, 5]);
    this.setAttribute( 'position', new BufferAttribute( verts, 3 ) );
  }
}