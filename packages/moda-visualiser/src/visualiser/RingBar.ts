import { Line, LineBasicMaterial, Object3D } from "three"
import RingBarGeometry from "../helpers/RingBarGeometry";
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";

export default class RingBar extends Object3D implements IAudioReactive {
  rings: Line[] = [];
  constructor(fingerprint: IDerivedFingerPrint) {
    super();
    const matWhite = new LineBasicMaterial({ color: 0xdddddd });
    const ringBarGeo = new RingBarGeometry(3.22, fingerprint, 0.0013);
    const ringBarLine = new Line(ringBarGeo, matWhite);
    ringBarLine.rotateX(Math.PI / 2);
    this.add(ringBarLine);
  }

  handleAudio() {
    console.log('handling audio')
  }
}
