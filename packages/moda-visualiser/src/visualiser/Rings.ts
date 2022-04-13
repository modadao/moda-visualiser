import { Line, Object3D, ShaderMaterial } from "three"
import { ISettings } from ".";
import CircleLineGeometry from "../helpers/CircleLineGeometry";
import RingFragShader from '../shaders/v1_rings_frag.glsl';
import RingVertShader from '../shaders/v1_rings_vert.glsl';
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";

export default class Rings extends Object3D implements IAudioReactive {
  rings: Line[] = [];
  constructor(fingerprint: IDerivedFingerPrint, settings: ISettings) {
    super();
    const geo = new CircleLineGeometry(1, 512, fingerprint);
    const ringShaderMat = new ShaderMaterial({
      vertexShader: RingVertShader,
      fragmentShader: RingFragShader,
    })
    const greyRing = new Line(geo, ringShaderMat);
    new Array(20).fill(0).forEach((_, i) => {
      const ring = greyRing.clone()
      ring.scale.setScalar(4.0 + i * 0.3);
      this.add(ring);
      ring.visible = settings.sceneElements.rings;
      this.rings.push(ring);
    })
  }

  handleAudio() {
    console.log('handling audio')
  }
}
