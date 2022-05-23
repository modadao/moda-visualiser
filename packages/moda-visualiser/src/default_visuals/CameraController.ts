import { MathUtils, Object3D, OrthographicCamera, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const INTRO_TIME = 10;

export default class CameraController {
  orbitControls: OrbitControls;
  usingManualControls = false;
  constructor(private camera: OrthographicCamera, private renderer: WebGLRenderer) {
    camera.position.set(0, 50, 0);
    camera.zoom = 0.45;
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    // this.orbitControls.dampingFactor = 0.95;
    this.orbitControls.minZoom = 0.0001;
    this.orbitControls.maxZoom = 0.8;
    this.orbitControls.addEventListener('start', () => {
      this.usingManualControls = true;
    })
    this.orbitControls.addEventListener('end', () => {
      this.usingManualControls = false;
      this.lastChanged = this.lastElapsed + 10;
    })
  }

  startTime = 10;
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
      const distanceScalar = (20 / this.camera.position.length()) - 1;
      cameraPos.multiplyScalar(cameraDistance + distanceScalar * 3 * autoPilotPower);

      const targetZoom = MathUtils.mapLinear(Math.sin(elapsed * 0.1), -1, 1, 0.45, 0.8);
      const cam = this.camera as OrthographicCamera;
      cam.zoom += (targetZoom - cam.zoom) * delta * 10 * autoPilotPower;
    }

    this.camera.position.lerp(cameraPos, 0.02);
    this.camera.lookAt(new Vector3());
  }

  dispose() {
    this.orbitControls.dispose();
  }
}
