import { BufferAttribute, BufferGeometry, CircleBufferGeometry, Vector3 } from "three";

export default class CircleLineGeometry extends BufferGeometry {
  constructor(radius: number, segments: number) {
    super();
    const { PI, sin, cos } = Math;
    const step = (PI * 2) / ( segments - 1 );
    const points = new Array(segments).fill(0).map((_, i) => {
      return new Vector3(sin(i * step) * radius, cos(i * step) * radius, 0).toArray();
    });
    const verts = new Float32Array(([] as number[]).concat(...points));
    this.setAttribute( 'position', new BufferAttribute( verts, 3 ) );
  }
}