import { Camera, Clock, CubicBezierCurve3, Curve, MathUtils, Matrix3, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export enum CameraTracks {
  ENTRY = 'entry',
  // ROTATE = 'rotate',
  SWOOP_IN = 'swoop_in',
}

const tracks: Record<CameraTracks, (pos: Vector3, prevCurve: Curve<Vector3>) => Curve<Vector3>> = {
  [CameraTracks.ENTRY]: () => new CubicBezierCurve3(
    new Vector3(0, 50, 0),
    new Vector3(0, 40, 0),
    new Vector3(0, 20, 10),
    new Vector3(0, 5, 20)
  ),
  // [CameraTracks.ROTATE]: (pos, prevCurve) => {
  //   const axis = new Vector3(0, 1, 0);
  //   const step = Math.PI / 8;
  //
  //   const finalPoint = pos.clone().normalize().multiplyScalar(30).applyAxisAngle(axis, 4 * step);
  //   const dir = prevCurve.getPoint(1).clone().sub(prevCurve.getPoint(0.99)).normalize().multiplyScalar(3);
  //   const handle1 = pos.clone().add(dir);
  //   const handle2 = pos.clone().lerp(finalPoint, 0.75).normalize().multiplyScalar(30);
  //
  //   return new CubicBezierCurve3(
  //     pos.clone(),
  //     handle1,
  //     handle2,
  //     finalPoint,
  //   )
  // },
  [CameraTracks.SWOOP_IN]: (pos, prevCurve) => {
    const step = Math.PI / 4;
    const handle2Temp = new Vector2(pos.x, pos.z).normalize();
    handle2Temp.rotateAround(new Vector2(), step);
    const handle3Temp = new Vector2(pos.x, pos.z).normalize();
    handle3Temp.rotateAround(new Vector2(), step * 2);

    const dir = prevCurve.getPoint(1).clone().sub(prevCurve.getPoint(0.99)).normalize().multiplyScalar(5);
    const handle1 = pos.clone().add(dir);
    const handle2 = new Vector3(handle2Temp.x, 0.4, handle2Temp.y).normalize().multiplyScalar(20);
    const finalPoint = new Vector3(handle3Temp.x, 0.4, handle3Temp.y).normalize().multiplyScalar(30);
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
const INTRO_TIME = 10;

export default class CameraController {
  activeTrack!: Curve<Vector3>;
  clock = new Clock();
  orbitControls: OrbitControls;
  startTime = 0;
  usingManualControls = false;
  constructor(private camera: OrthographicCamera, private renderer: WebGLRenderer) {
    camera.position.set(0, 50, 0);
    camera.zoom = 0.45;
    this.startTime = this.clock.getElapsedTime() + 10;
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.addEventListener('start', () => {
      this.usingManualControls = true;
    })
    this.orbitControls.addEventListener('end', () => {
      console.log('Orbit controls change');
      this.usingManualControls = false;
      this.lastChanged = this.lastElapsed + 10;
    })
  }

  lastChanged = 0;
  lastElapsed = 0;
  tempObj = new Object3D();
  update(elapsed: number, delta: number) {
    this.lastElapsed = elapsed;

    this.orbitControls.update();

    const autoPilotPower = this.usingManualControls ? 0 : MathUtils.clamp((elapsed - this.lastChanged) / 5, 0, 1);

    const cameraPos = this.camera.position.clone().normalize();
    const cameraDistance = this.camera.position.length();

    if (elapsed - this.startTime < INTRO_TIME) {
      const a = Math.max((elapsed - this.startTime) / INTRO_TIME, 0);
      if (a == 0) return;
      const targetY = 0.3;
      const diffY = targetY - cameraPos.y;
      cameraPos.applyAxisAngle(new Vector3(-1, 0, 0), diffY * delta * 20 * autoPilotPower)
      const targetZoom = MathUtils.mapLinear(a, 0, 1, 0.45, 0.8);
      const cam = this.camera as OrthographicCamera;
      console.log(a)
      cam.zoom += (targetZoom - cam.zoom) * delta * 8 * autoPilotPower;
      const targetDist = MathUtils.mapLinear(a, 0, 1, 50, 25);
      const newDist = cameraDistance + (targetDist / cameraDistance - 1) * 4 * autoPilotPower;
      cameraPos.multiplyScalar(newDist);
    } else {
      const targetY = 0.5;
      const lookAt = cameraPos.clone();
      const amountToMove = Math.sin(elapsed * 0.3) * 10 * delta;
      const sinPower = (0.5 - Math.min(Math.abs((lookAt.y + amountToMove * 0.2) - targetY), 0.5)) * 2;
      lookAt.y += amountToMove * sinPower * autoPilotPower;

      const diff = targetY - lookAt.y;
      lookAt.y += diff * delta * 10 * autoPilotPower;

      this.tempObj.lookAt(lookAt);
      const rotationScale = 1.1 - Math.abs(cameraPos.y)
      this.tempObj.rotateY(delta * 4 * rotationScale * autoPilotPower);
      const dir = new Vector3();
      this.tempObj.getWorldDirection(dir);

      cameraPos.copy(dir);
      const distanceScalar = (25 / this.camera.position.length()) - 1;
      cameraPos.multiplyScalar(cameraDistance + distanceScalar * 3 * autoPilotPower);

      const targetZoom = MathUtils.mapLinear(Math.sin(elapsed * 0.1), -1, 1, 0.45, 0.8);
      const cam = this.camera as OrthographicCamera;
      cam.zoom += (targetZoom - cam.zoom) * delta * 10 * autoPilotPower;
    }

    this.camera.position.lerp(cameraPos, 0.02);
    this.camera.lookAt(new Vector3());
  }
}
