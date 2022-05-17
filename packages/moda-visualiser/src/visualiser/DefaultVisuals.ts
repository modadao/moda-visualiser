import { IDerivedCoordinate, IDerivedFingerPrint } from "../types";
import { GradientSampler, ImgSampler } from "../utils";
import { Vector3, Mesh, Object3D, LineBasicMaterial, Line, Color, MathUtils, WebGLRenderer, PerspectiveCamera, OrthographicCamera } from "three";
import CircleLineGeometry from '../helpers/CircleLineGeometry';
import { ISettings } from "../visualiser";
import RingBar from "./RingBar";
import Spheres from "./Spheres";
import FeatureBeziers from "./FeatureBeziers";
import IAudioReactive from "./ReactiveObject";
import { IAudioFrame } from "./AudioAnalyser";
// import PlaybackHead from "./PlaybackHead";
import ProgressRing from "./ProgressRing";
import ShaderBackground from "./ShaderBackground";
import FFTTextureManager from "./FftTextureManager";
import ShaderRings from "./ShaderRings";
import { SuperNovaSpriteEmitter } from "./SuperNova";
import CameraController from "./CameraController";

export interface IVisualiserCoordinate extends IDerivedCoordinate {
  theta: number,
  pos: Vector3,
  scale: number,
  smoothhash: number,
  color: Color,
}

export default class DefaultVisuals extends Object3D implements IAudioReactive {
  points: Spheres|undefined;
  mainBezier: FeatureBeziers|undefined;
  secondaryBeziers: FeatureBeziers[] = [];
  rings: ShaderRings;
  innerRing: Line;
  barGraph: RingBar;
  floor: Mesh|undefined;
  // playbackHead: PlaybackHead;
  progressRing: ProgressRing;
  // bezierSpringPhysicsTextureManager = new SpringPhysicsTextureManager(512);
  fftTextureManager!: FFTTextureManager;
  bezierFftTextureManager!: FFTTextureManager;
  cameraController: CameraController;
  shaderBackground: ShaderBackground;

  particles: SuperNovaSpriteEmitter;

  showBackground = true;
  useCameraController = true;
  useParticles = true;
  animateBeziers = true;
  animatePoints = true;


  constructor(private camera: PerspectiveCamera|OrthographicCamera, private fingerprint: IDerivedFingerPrint, settings: ISettings) {
    super();
    this.name = 'RadialSpheres'
    this.fftTextureManager = new FFTTextureManager({
      ...settings.springPhysics.spheres,
    });
    this.bezierFftTextureManager = new FFTTextureManager({
      textureSize: 256,
      ...settings.springPhysics.beziers,
    });

    this.cameraController = new CameraController(camera);

    this.particles = new SuperNovaSpriteEmitter(8000);
    this.add(this.particles);

    this.shaderBackground = new ShaderBackground(new Color('#1B1D21'));
    // Add rings for flare
    const geo = new CircleLineGeometry(1, 512, fingerprint);
    const matWhite = new LineBasicMaterial({ color: 0xdddddd });
    const l = new Line(geo, matWhite);
    this.innerRing = l;
    l.rotateX(Math.PI / 2)
    l.scale.setScalar(1.2);
    this.add(l);

    // Inner bar graph
    this.barGraph = new RingBar(fingerprint);
    this.add(this.barGraph);

    // Outer rings 
    this.rings = new ShaderRings();
    this.rings.rotateX(Math.PI / 2);
    this.add(this.rings);

    // this.playbackHead = new PlaybackHead();
    // this.add(this.playbackHead)

    this.progressRing = new ProgressRing(3.170, 0.15);
    this.add(this.progressRing);

    this.points = new Spheres(fingerprint, this.fftTextureManager);
    this.add(this.points);

    // Bezier through feature points
    const featurePoints = fingerprint.coords.filter(p => p.featureLevel !== 0);
    // Generate main bezier
    this.mainBezier = new FeatureBeziers(fingerprint, featurePoints, this.bezierFftTextureManager, 0);
    this.add(this.mainBezier);

      
    // Generate random secondary beziers
    new Array(20).fill(0).forEach((_, i) => {
      const secondaryBeziers = new FeatureBeziers(fingerprint, featurePoints, this.bezierFftTextureManager, i + 1, {
        radialSegments: 3,
        radius: 0.01
      });
      this.add(secondaryBeziers);
      this.secondaryBeziers.push(secondaryBeziers);
    });
  }

  preRender(_renderer: WebGLRenderer) {
    if (this.showBackground) this.shaderBackground.render(_renderer);
  }

  elapsed = 0;
  update(elapsed: number, delta: number) {
    this.elapsed = elapsed;
    const dir = new Vector3();
    this.shaderBackground.update(elapsed);
    if (this.useCameraController) this.cameraController.update(elapsed);
    this.camera.updateMatrixWorld();
    this.camera.updateProjectionMatrix();
    this.camera.getWorldDirection(dir);
    this.rings.update(elapsed);
    this.particles.update(elapsed, delta);
    if (this.points) {
      this.points.setCameraDirection(dir);
      this.points.update(elapsed, delta);
    }
    if (this.mainBezier) this.mainBezier.update(elapsed);
    this.secondaryBeziers.forEach(b => b.update(elapsed));
  }

  rotationalVelocity = 0;
  handleAudio(frame: IAudioFrame): void {
    if (this.animatePoints) this.fftTextureManager.handleAudio(frame);
    else this.fftTextureManager.reset();
    if (this.animateBeziers) this.bezierFftTextureManager.handleAudio(frame);
    else this.bezierFftTextureManager.reset();
    // this.bezierSpringPhysicsTextureManager.handleAudio(frame);
    this.shaderBackground.handleAudio(frame);
    this.rings.handleAudio(frame);
    // this.playbackHead.handleAudio(frame);
    this.progressRing.handleAudio(frame);
    if (this.points && this.animatePoints) this.points.handleAudio(frame);
    if (this.mainBezier && this.animateBeziers) this.mainBezier.handleAudio(frame);
    if (this.secondaryBeziers.length && this.animateBeziers) this.secondaryBeziers.forEach((se) => se.handleAudio(frame));

    if (this.useParticles) {
      const {coords} = this.fingerprint;
      const capacity = (1 - this.particles.lastCount / this.particles.count);
      const scaledPower = MathUtils.smoothstep(frame.power, 0.2, 0.6);
      const particleGenerationMultiplier = MathUtils.mapLinear(capacity * scaledPower, 0, 1, 1.01, 6.);
      // console.log(`Capacity: ${capacity.toFixed(3)}, power: ${scaledPower} => mutliplier: ${particleGenerationMultiplier.toFixed(3)}`)
      const { data } = this.fftTextureManager;
      const toFFT = 1 / (Math.PI * 2) * (data.length / 4);
      for (let i = 0; i < coords.length; i++) {
        const { theta, pos, color } = coords[i];
        const fftI = Math.floor(theta * toFFT);
        const v = data[fftI * 4 + 3];
        const nParticles = Math.floor(Math.abs(v) * Math.random() * (particleGenerationMultiplier));
        if (nParticles) {
          this.particles.addParticles(nParticles, pos, color);
        }
      }
      // for (let i = 0; i < this.fftTextureManager)
      // this.fftTextureManager.da
      // const theta = Math.sin(frame.avgFrequency / 29);
      // this.coords.forEach(c => {
      //   const nParticles = Math.floor(Math.abs(theta - c.theta) * frame.power * c.scale * (4.0 + c.featureLevel));
      //   if (nParticles) {
      //     this.particles.addParticles(nParticles, c.pos, c.color);
      //   }
      // })
    }
  }

  dispose() {
    // this.folder.destroy();
  }

}
