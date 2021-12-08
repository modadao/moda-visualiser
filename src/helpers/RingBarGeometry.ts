import { IDerivedCoordinate, IDerivedFingerPrint } from "@/types";
import { BufferAttribute, BufferGeometry, MathUtils, Vector3 } from "three";

export default class RingBarGeometry extends BufferGeometry {
  constructor(radius: number, fingerprint: IDerivedFingerPrint, amplitude: number, skip = 1) {
    super();
    const { PI, sin, cos } = Math;
    const [height, width] = fingerprint.shape;
    const points = fingerprint.coords.map((p, i) => {
      if (i % skip !== 0) return [];
      const theta = MathUtils.mapLinear(p.x / (width), 0, 1, 0, 2 * PI);
      const tx = sin(theta);
      const ty = cos(theta);
      return [
        tx * radius, ty * radius, 0, // Base point along ring
        tx * radius + tx * p.smoothed * amplitude, ty * radius + ty * p.smoothed * amplitude, 0, // Up to amplitude
        tx * radius, ty * radius, 0, // Back down to base
      ];
    });
    const verts = new Float32Array(([] as number[]).concat(...points));
    this.setAttribute( 'position', new BufferAttribute( verts, 3 ) );
  }
}