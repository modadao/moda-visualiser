import { Camera, CubicBezierCurve3, Curve, OrthographicCamera, Vector3 } from "three";

export enum CameraTracks {
  ENTRY = 'entry',
  ROTATE = 'rotate',
  SWOOP_IN = 'swoop_in',
}

const tracks: Record<CameraTracks, (pos: Vector3) => Curve<Vector3>> = {
  [CameraTracks.ENTRY]: () => new CubicBezierCurve3(
    new Vector3(0, 50, 0),
    new Vector3(0, 0, 0),
    new Vector3(0, 0, 0),
    new Vector3(30, 10, 0)
  ),
  [CameraTracks.ROTATE]: (pos) => {
    const axis = new Vector3(0, 1, 0);
    const step = Math.PI / 8;

    const finalPoint = pos.clone().normalize().multiplyScalar(50).applyAxisAngle(axis, 4 * step);
    const handle1 = pos.clone().lerp(finalPoint, 0.25).normalize().multiplyScalar(50);
    const handle2 = pos.clone().lerp(finalPoint, 0.75).normalize().multiplyScalar(50);
    console.log(pos, handle1, handle2, finalPoint);

    return new CubicBezierCurve3(
      pos,
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
      pos,
      handle1,
      handle2,
      finalPoint,
    )
  },

}


export default class CameraController {
  activeTrack!: Curve<Vector3>;
  constructor(public camera: Camera) {
    this.switchTrack(CameraTracks.ENTRY, 8);
  }


  elapsed = 0;
  trackStartTime = 0;
  trackDuration = 4;
  update(elapsed: number) {
    this.elapsed = elapsed;
    const mix = (elapsed - this.trackStartTime) / this.trackDuration;
    const p = this.activeTrack.getPoint(mix);
    this.camera.position.copy(p);
    (this.camera as OrthographicCamera).zoom = 50 / this.camera.position.length() * 0.45;
    console.log(mix, p.toArray());
    this.camera.lookAt(new Vector3());
    if (mix > 1) {
      const tracksArray = Object.keys(tracks);
      const nextTrackIndex = Math.max(Math.floor(Math.random() * tracksArray.length), 1);
      this.switchTrack(tracksArray[nextTrackIndex] as CameraTracks, 8);
    }
  }

  switchTrack(track: CameraTracks, duration: number) {
    console.log('Switching to ', track)
    this.trackStartTime = this.elapsed;
    this.activeTrack = tracks[track](this.camera.position);
    this.trackDuration = duration;
  }
}
