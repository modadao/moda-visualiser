import { Camera, Color, OrthographicCamera, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gui from "./helpers/gui";
import { ISettings } from "./main";

import { IDerivedFingerPrint, IFingerprint } from "./types";
import { deriveData } from "./utils";
import RadialSphere from "./visualisations/RadialSpheres";

const targetDims = new Vector2(10, 10);
const halfDims = targetDims.clone().multiplyScalar(0.5);
export default class App {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  orbitControls: OrbitControls;

  radialSpheres: RadialSphere;
  constructor(public element: HTMLElement, fingerprint: IFingerprint, settings: ISettings) {
    this.renderer = new WebGLRenderer({
      antialias: true,
    })
    this.renderer.setSize(800, 800);
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(new Color('#1B1D21'))
    this.element.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(-halfDims.x, halfDims.y, halfDims.x, -halfDims.y, 0.001, 100);
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    const derivedFingerprint = deriveData(fingerprint, settings);
    this.buildScene(derivedFingerprint, settings);
    this.startAnimation();
  }

  buildScene(fingerprint: IDerivedFingerPrint, settings: ISettings) {
    this.radialSpheres = new RadialSphere(this.scene, this.camera, this.renderer, fingerprint, settings);
    this.scene.add(this.radialSpheres);
  }

  startAnimation() {
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    this.orbitControls.update()
    this.renderer.render(this.scene, this.camera);
    this.radialSpheres.update();
    window.requestAnimationFrame(this.update);
  }

  refresh(fingerprint: IFingerprint, settings: ISettings) {
    this.scene.clear();
    this.radialSpheres.dispose();
    const derivedFingerprint = deriveData(fingerprint, settings);
    this.buildScene(derivedFingerprint, settings);
  }

  dispose() {
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
    this.radialSpheres.dispose();
  }

  resizeTimeout: number|undefined;
  handleResize() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = setTimeout(() => {
      const bounds = this.element.getBoundingClientRect();
      const aspect = bounds.width / bounds.height;
      console.log(aspect);
      this.camera.left = -aspect * halfDims.x;
      this.camera.right = aspect * halfDims.x;
      this.camera.top = halfDims.y;
      this.camera.bottom = -halfDims.y;
      this.camera.updateProjectionMatrix();
      const {top, bottom, left, right} = this.camera;
      console.log({top, bottom, left, right})
      this.renderer.setSize(bounds.width, bounds.height);
      this.resizeTimeout = undefined;
    }, 200)
  }
}
