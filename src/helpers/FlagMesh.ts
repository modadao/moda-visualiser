import { BoxBufferGeometry, Material, Mesh, MeshBasicMaterial, Object3D } from "three";

export default class FlagMesh extends Object3D {
  constructor(height: number, diameter: number, flagSize: number, mat: Material = new MeshBasicMaterial({color: 0xff0000})) {
    super();
    const pole = new BoxBufferGeometry(diameter, height, diameter);
    const flag = new BoxBufferGeometry(flagSize, flagSize, diameter);
    const poleM = new Mesh(pole, mat);
    poleM.position.set(0, height / 2, 0);
    const flagM = new Mesh(flag, mat);
    flagM.position.set(0, height, 0)
    this.add(poleM, flagM);
  }
}