import { Camera, Clock, CubicBezierCurve3, Curve, OrthographicCamera, Vector3 } from "three";

export enum CameraTracks {
  ENTRY = 'entry',
  ROTATE = 'rotate',
  SWOOP_IN = 'swoop_in',
}

const tracks: Record<CameraTracks, (pos: Vector3) => Curve<Vector3>> = {
  [CameraTracks.ENTRY]: () => new CubicBezierCurve3(
    new Vector3(0, 50, 0),
    new Vector3(0, 40, 0),
    new Vector3(10, 20, 0),
    new Vector3(20, 5, 0)
  ),
  [CameraTracks.ROTATE]: (pos) => {
    const axis = new Vector3(0, 1, 0);
    const step = Math.PI / 8;

    const finalPoint = pos.clone().normalize().multiplyScalar(30).applyAxisAngle(axis, 4 * step);
    const handle1 = pos.clone().lerp(finalPoint, 0.25).normalize().multiplyScalar(30);
    const handle2 = pos.clone().lerp(finalPoint, 0.75).normalize().multiplyScalar(30);

    return new CubicBezierCurve3(
      pos.clone(),
      handle1,
      handle2,
      finalPoint,
    )
  },
  [CameraTracks.SWOOP_IN]: (pos) => {
    const axis = new Vector3(0, 1, 0);
    const step = Math.PI / 4;

    const handle1 = pos.clone().applyAxisAngle(axis, step * 0.5).multiplyScalar(0.5);
    const handle2 = pos.clone().applyAxisAngle(axis, step * 2.5).multiplyScalar(0.5);
    const finalPoint = pos.clone().applyAxisAngle(axis, step * 3);
    console.log(pos, handle1, handle2, finalPoint);

    return new CubicBezierCurve3(
      pos.clone(),
      handle1,
      handle2,
      finalPoint,
    )
  },

}

// const { cos, PI } = Math;
// function easeInOutSine(x: number): number {
//   return -(cos(PI * x) - 1) / 2;
// }

export default class CameraController {
  activeTrack!: Curve<Vector3>;
  clock = new Clock();
  constructor(public camera: Camera) {
    this.switchTrack(CameraTracks.ENTRY, 2, this.clock.getElapsedTime());
  }


  elapsed = 0;
  trackStartTime = 0;
  trackLength = 4;
  trackDuration = 4;
  trackSpeed = 0;
  update(elapsed: number) {
    this.elapsed = elapsed;
    const mix = ((elapsed - this.trackStartTime) / this.trackLength * this.trackSpeed);
    // const eased = easeInOutSine(mix);
    const p = this.activeTrack.getPoint(mix);
    this.camera.position.lerp(p, 0.02);
    (this.camera as OrthographicCamera).zoom = 50 / this.camera.position.length() * 0.45;
    // console.log(mix, p.toArray());
    this.camera.lookAt(new Vector3());
    if (mix > 1) {
      const tracksArray = Object.keys(tracks);
      const nextTrackIndex = Math.max(Math.floor(Math.random() * tracksArray.length), 1);
      console.log(tracksArray.length, nextTrackIndex);
      this.switchTrack(tracksArray[nextTrackIndex] as CameraTracks, 2, elapsed);
    }
  }

  switchTrack(track: CameraTracks, speed = 2, elapsed: number) {
    this.trackStartTime = elapsed;
    this.activeTrack = tracks[track](this.camera.position);
    this.trackLength = this.activeTrack.getLength();
    this.trackSpeed = speed;
  }
}
