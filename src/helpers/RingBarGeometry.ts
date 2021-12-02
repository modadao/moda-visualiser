import { IDerivedCoordinate, IDerivedFingerPrint } from "@/types";
import { BufferAttribute, BufferGeometry, MathUtils, Vector3 } from "three";

export default class RingBarGeometry extends BufferGeometry {
  constructor(radius: number, fingerprint: IDerivedFingerPrint, amplitude: number) {
    super();
    const { PI, sin, cos } = Math;
    const [height, width] = fingerprint.shape;
    const points = fingerprint.coords.map((p) => {
      const theta = MathUtils.mapLinear(p.x / (width + 1), 0, 1, 0, 2 * PI);
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