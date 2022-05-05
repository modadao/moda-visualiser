import { DataTexture, Line, Object3D, RedFormat, ShaderMaterial, UnsignedByteType } from "three"
import { ISettings } from ".";
import { IDerivedFingerPrint } from "../types";
import CircleLineGeometry from "../helpers/CircleLineGeometry";
import RingFragShader from '../shaders/v1_rings_frag.glsl';
import RingVertShader from '../shaders/v1_rings_vert.glsl';
import { IAudioFrame } from "./AudioAnalyser";
import IAudioReactive from "./ReactiveObject";

export default class Rings extends Object3D implements IAudioReactive {
  rings: Line[] = [];

  leftBuffer = new Array(512).fill(0);
  rightBuffer = new Array(512).fill(0);

  bufferTexture: DataTexture;
  
  constructor(fingerprint: IDerivedFingerPrint, settings: ISettings) {
    super();
    this.bufferTexture = new DataTexture(null, 512, 1, RedFormat, UnsignedByteType);

    const geo = new CircleLineGeometry(1, 512, fingerprint);
    const ringShaderMat = new ShaderMaterial({
      vertexShader: RingVertShader,
      fragmentShader: RingFragShader,
      uniforms: {
        u_bufferTex: { value: this.bufferTexture },
      }
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

  handleAudio(frame: IAudioFrame) {
    const currentIndex = Math.floor(frame.progress * 512);
    this.leftBuffer[currentIndex] += frame.power;
    this.rightBuffer[currentIndex] += frame.power;

    (() => {
      let prevVal = this.leftBuffer[0] * 0.99;
      for (let i = 1; i < this.leftBuffer.length; i++) {
        const thisVal = this.leftBuffer[i];
        this.leftBuffer[i] = prevVal;
        prevVal = thisVal * 0.990;
      }
      this.leftBuffer[0] = prevVal;
    })();

    (() => {
      let prevVal = this.rightBuffer[511] * 0.99;
      for (let i = this.rightBuffer.length - 1; i >= 0; i--) {
        const thisVal = this.rightBuffer[i];
        this.rightBuffer[i] = prevVal;
        prevVal = thisVal * 0.990;
      }
      this.rightBuffer[511] = prevVal;
    })();

    const data = new Uint8ClampedArray(512);
    for (let i = 0; i < data.length; i++) {
      data[i] = (this.leftBuffer[i] + this.rightBuffer[i]) * 128;
    }
    this.bufferTexture.image = {
      data,
      width: 512,
      height: 1
    }
    this.bufferTexture.needsUpdate = true;
  }
}
