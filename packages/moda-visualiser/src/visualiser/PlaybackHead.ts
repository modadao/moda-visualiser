import { CylinderBufferGeometry, Mesh, MeshBasicMaterial, Object3D } from "three";
import { IAudioFrame } from "./AudioAnalyser";
import IAudioReactive from "./ReactiveObject";

export default class PlaybackHead extends Object3D implements IAudioReactive {
  needle: Mesh;
  constructor() {
    super();

    const geo = new CylinderBufferGeometry(0.001, 0.001, 4);
    geo.translate(0, 2, 0);
    const line = new Mesh(
      geo,
      new MeshBasicMaterial({
        color: 0xffffff
      })
    );
    this.add(line);
    this.needle = line;
    this.needle.rotateX(Math.PI / 2);
  }

  handleAudio(frame: IAudioFrame): void {
    this.needle.rotation.z = frame.progress * Math.PI * 2;
    this.needle.scale.x = (frame.power / 500);
    this.needle.scale.z = (frame.power / 500);
  }
}
