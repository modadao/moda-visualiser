import { IDerivedCoordinate, IDerivedFingerPrint } from "../types";
import { chunk, GradientSampler, ImgSampler, pickRandom } from "../utils";
import { Vector3, Mesh, Object3D, LineBasicMaterial, Line, Camera, Color, MathUtils, WebGLRenderer } from "three";
import CircleLineGeometry from '../helpers/CircleLineGeometry';
import { ISettings } from "../visualiser";
import Rings from "./Rings";
import RingBar from "./RingBar";
import Spheres from "./Spheres";
import FeatureBeziers from "./FeatureBeziers";
import IAudioReactive from "./ReactiveObject";
import { IAudioFrame } from "./AudioAnalyser";
// import PlaybackHead from "./PlaybackHead";
import ProgressRing from "./ProgressRing";
import SpringPhysicsTextureManager from "./SpringPhysicsTextureManager";
import ShaderBackground from "./ShaderBackground";

export interface IVisualiserCoordinate extends IDerivedCoordinate {
  theta: number,
  pos: Vector3,
  scale: number,
  smoothhash: number,
  color: Color,
}

export default class RadialSphere extends Object3D implements IAudioReactive {
  points: Spheres|undefined;
  mainBezier: FeatureBeziers|undefined;
  secondaryBeziers: FeatureBeziers[] = [];
  rings: Rings;
  innerRing: Line;
  barGraph: RingBar;
  floor: Mesh|undefined;
  // playbackHead: PlaybackHead;
  progressRing: ProgressRing;
  bezierSpringPhysicsTextureManager = new SpringPhysicsTextureManager(512);
  shaderBackground: ShaderBackground;

  constructor(private camera: Camera, fingerprint: IDerivedFingerPrint, settings: ISettings) {
    super();
    this.name = 'RadialSpheres'

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
    this.barGraph.visible = settings.sceneElements.circumferenceGraph;
    this.add(this.barGraph);

    // Outer rings 
    this.rings = new Rings(fingerprint, settings);
    this.rings.rotateX(Math.PI / 2);
    this.add(this.rings);

    // this.playbackHead = new PlaybackHead();
    // this.add(this.playbackHead)

    this.progressRing = new ProgressRing(0, 1.2);
    this.add(this.progressRing);

    const colorSampler = settings.color.colorschemeMethod === 'gradient' ? new GradientSampler(settings.color.custom) : new ImgSampler(settings.color.colorTextureSrc);
    (async () => {
      const coords = await this.calculateCoords(fingerprint, settings, colorSampler);

      this.points = new Spheres(fingerprint, settings, coords, this.bezierSpringPhysicsTextureManager);
      this.add(this.points);

      // Bezier through feature points
      const featurePoints = coords.filter(p => p.featureLevel !== 0);
      // Generate main bezier
      this.mainBezier = new FeatureBeziers(fingerprint, settings, featurePoints, this.bezierSpringPhysicsTextureManager);
      this.add(this.mainBezier);
      console.log('Added main bezier')

      
      // Generate random secondary beziers
      new Array(20).fill(0).forEach(() => {
        const secondaryBeziers = new FeatureBeziers(fingerprint, settings, featurePoints, this.bezierSpringPhysicsTextureManager, {
          radialSegments: 3,
          radius: 0.01
        });
        this.add(secondaryBeziers);
        this.secondaryBeziers.push(secondaryBeziers);
      });

      const updateVisibility = () => {
        if (this.mainBezier) this.mainBezier.visible = settings.sceneElements.mainBezier;
        this.secondaryBeziers.forEach(l => l.visible = settings.sceneElements.extraBeziers);
        this.rings.visible = settings.sceneElements.rings;
        this.innerRing.visible = settings.sceneElements.rings;
        this.barGraph.visible = settings.sceneElements.circumferenceGraph;
      }
      updateVisibility();
    })().then(() => {
      this.bezierSpringPhysicsTextureManager.build();
    })

  }

  preRender(renderer: WebGLRenderer) {
    this.shaderBackground.render(renderer);
  }

  update(elapsed: number) {
    const dir = new Vector3();
    this.shaderBackground.update(elapsed);
    this.camera.updateMatrixWorld();
    this.camera.getWorldDirection(dir);
    if (this.points) {
      this.points.setCameraDirection(dir);
      this.points.update();
    }
    if (this.mainBezier) this.mainBezier.update();
    this.secondaryBeziers.forEach(b => b.update());
  }

  private async calculateCoords(fingerprint: IDerivedFingerPrint, settings: ISettings, colorSampler: ImgSampler|GradientSampler): Promise<IVisualiserCoordinate[]> {
    const { sin, cos, floor, max, pow } = Math;
    const [ width, height ] = fingerprint.shape;

    const fingerprintBaseVariation = MathUtils.mapLinear(sin(fingerprint.floatHash), 0, 1, 0.7, 1.2);
    const fingerprintVelocityVariation = MathUtils.mapLinear(sin(fingerprint.floatHash), 0, 1, 0.7, 1.2);

    const { baseVariation, velocityVariation } = settings.color;
    const variationScalar = baseVariation * fingerprintBaseVariation;
    const velocityScalar = velocityVariation * fingerprintVelocityVariation;
    if (colorSampler instanceof ImgSampler)
      await colorSampler.loading;

    const scale = (500 + max(-pow(height, 0.8), -pow(height, 0.7)-100, -pow(height, 0.6)-160)) / 400 * 0.15
    const coords = fingerprint.coords.map(p => {
      const theta = (p.x / width) * Math.PI * 2;
      const x = sin(theta);
      const z = cos(theta);
      const step = floor(theta / (Math.PI * 2));
      const amp = p.y / height * 1.5;
      const r = step + 1.5 + amp;

      const s = (Math.abs(p.g - 0.5) + scale) * scale;

      let smoothhash = (fingerprint.floatHash + sin(theta + fingerprint.floatHash * Math.PI) * variationScalar + p.g * velocityScalar) % 1;
      while(smoothhash < 0) smoothhash += 1;

      const color = colorSampler.getPixel(smoothhash);

      return {
        ...p,
        theta,
        pos: new Vector3(x * r, 0, z * r),
        scale: s,
        smoothhash,
        color,
      }
    })
    return coords;
  }

  rotationalVelocity = 0;
  handleAudio(frame: IAudioFrame): void {
    this.bezierSpringPhysicsTextureManager.handleAudio(frame);
    this.shaderBackground.handleAudio(frame);
    this.rings.handleAudio(frame);
    this.barGraph.handleAudio(frame);
    // this.playbackHead.handleAudio(frame);
    this.progressRing.handleAudio(frame);
    if (this.points) this.points.handleAudio(frame);
    if (this.mainBezier) this.mainBezier.handleAudio(frame);
    if (this.secondaryBeziers.length) this.secondaryBeziers.forEach((se) => se.handleAudio(frame));
  }

  dispose() {
    // this.folder.destroy();
  }

}
