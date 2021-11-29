import { Camera, Color, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import example from './data/example.json';
import { IFingerprint } from "./types";
import { deriveData } from "./utils";
import V1 from "./visualisations/v1";

export default class App {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  orbitControls: OrbitControls;
  constructor(public element: HTMLElement) {
    this.renderer = new WebGLRenderer({
      antialias: true,
    })
    this.renderer.setSize(800, 800);
    this.renderer.setClearColor(new Color('#1B1D21'))
    this.element.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(-5, 5, 5, -5, 0.001, 100);
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);

    const derivedFingerprint = deriveData(example as IFingerprint);
    this.scene.add(new V1(this.scene, derivedFingerprint));

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    this.startAnimation();
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
}