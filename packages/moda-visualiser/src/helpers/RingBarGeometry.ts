import { IDerivedFingerPrint } from "../types";
import { BufferAttribute, BufferGeometry } from "three";

export default class RingBarGeometry extends BufferGeometry {
  constructor(radius: number, fingerprint: IDerivedFingerPrint, amplitude: number, skip = 1) {
    super();
    const { sin, cos } = Math;
    const [width] = fingerprint.shape;
    const points = fingerprint.coords.map((p, i) => {
      if (i % skip !== 0) return [];
      const theta = (p.x / width) * Math.PI * 2;
      console.log(`t: ${theta}, i: ${i} ${p.x}/${width-1}`)
      const tx = sin(theta);
      const ty = cos(theta);
      return [
        tx * radius, ty * radius, 0, // Base point along ring
        tx * radius + tx * p.y * amplitude, ty * radius + ty * p.y * amplitude, 0, // Up to amplitude
        tx * radius, ty * radius, 0, // Back down to base
      ];
    });
    const verts = new Float32Array(([] as number[]).concat(...points));
    this.setAttribute( 'position', new BufferAttribute( verts, 3 ) );
  }
}
