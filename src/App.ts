import { Camera, Color, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { IDerivedFingerPrint, IFingerprint } from "./types";
import { deriveData } from "./utils";
import RadialSphere from "./visualisations/RadialSpheres";

export default class App {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  orbitControls: OrbitControls;
  constructor(public element: HTMLElement, fingerprint: IFingerprint) {
    this.renderer = new WebGLRenderer({
      antialias: true,
    })
    this.renderer.setSize(800, 800);
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(new Color('#1B1D21'))
    this.element.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(-5, 5, 5, -5, 0.001, 100);
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);


    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    const derivedFingerprint = deriveData(fingerprint);
    this.buildScene(derivedFingerprint);
    this.startAnimation();
  }

  buildScene(fingerprint: IDerivedFingerPrint) {
    this.scene.add(new RadialSphere(this.scene, fingerprint));
  }

  startAnimation() {
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    this.orbitControls.update()
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.update);
  }

  dispose() {
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
  }
}