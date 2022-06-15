import { IDerivedFingerPrint } from "../types";
import { BufferAttribute, BufferGeometry, MathUtils, Vector3 } from "three";

export default class CircleLineGeometry extends BufferGeometry {
  constructor(radius: number, segments: number, fingerprint?: IDerivedFingerPrint) {
    super();
    const { PI, sin, cos } = Math;
    const step = (PI * 2) / ( segments - 1 );
    const points = new Array(segments).fill(0).map((_, i) => {
      return new Vector3(sin(i * step) * radius, cos(i * step) * radius, 0).toArray();
    });
    const verts = new Float32Array(([] as number[]).concat(...points));
    this.setAttribute( 'position', new BufferAttribute( verts, 3 ) );

    const thetas = new Float32Array(segments).fill(0).map((_, i) => i / segments);
    this.setAttribute( 'normalizedTheta', new BufferAttribute(thetas, 1));

    if (fingerprint) {
      const [width] = fingerprint.shape;
      const dist = (v1: number, v2: number) => Math.abs(v1 - v2);
      const amplitudes = new Array(segments).fill(0).map((_, i) => {
        const alpha = MathUtils.mapLinear(i, 0, segments, 0, width)
        const nearestPoint = fingerprint.coords.reduce((acc, p) => dist(alpha, p.x) < dist(alpha, acc.x) ? p : acc, );
        return nearestPoint.smoothed;
      });
      const avg = amplitudes.reduce((acc, el) => acc + el, 0) / amplitudes.length;
      const max = Math.max(...amplitudes);
      const min = Math.min(...amplitudes);
      const averagedAmplitudes = amplitudes.map((el, i) => i === 0 || i == segments-1 ? 0 : MathUtils.mapLinear(el - avg, min - avg, max - avg, -1, 1));
      const a = new Float32Array(averagedAmplitudes);
      this.setAttribute('amplitude', new BufferAttribute(a, 1));
    }
  }
}
