import { BackSide, InstancedMesh, Line, Matrix4, MeshBasicMaterial, Object3D, Quaternion, ShaderMaterial, SphereBufferGeometry, Vector2, Vector3 } from "three"
import { ISettings } from ".";
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import { IVisualiserCoordinate } from "./RadialSpheres";
import { bezierVector } from "../utils";

export default class Spheres extends Object3D implements IAudioReactive {
  points: InstancedMesh;
  outlines: InstancedMesh;
  constructor(_fingerprint: IDerivedFingerPrint, settings: ISettings, coords: IVisualiserCoordinate[]) {
    super();
    const { sizeSmall, sizeMed, sizeMdLg, sizeLarge } = settings.featurePoints
    const sizeBezierPoints = [
      new Vector2(0, sizeSmall),
      new Vector2(0.25, sizeMed),
      new Vector2(0.5, sizeMdLg),
      new Vector2(1, sizeLarge),
    ];
    const scaleSize = (t: number) => {
      const [a, b, c, d] = sizeBezierPoints;
      return bezierVector(a,b,c,d,t)
    }
    const outlineM = new MeshBasicMaterial({
      color: 0xffffff,
      side: BackSide,
      depthWrite: false,
    })

    // Build geometry 
    const g = new SphereBufferGeometry(1);
    const m = new ShaderMaterial({
      fragmentShader: FragShader,
      vertexShader: VertShader,
      uniforms: {
        u_innerColorMultiplier: { value: 2.0, },
        u_outerColorMultiplier: { value: 1, },
        u_cameraDirection: { value: new Vector3() },
      }
    })

    const points = new InstancedMesh(g, m, coords.length);
    const outlines = new InstancedMesh(g, outlineM, coords.length);

    const mat4 = new Matrix4();
    const rot = new Quaternion();
    const scale = new Vector3();

    const { outlineSize, outlineMultiplier, outlineAdd, innerGlow } = settings.points;
    coords.forEach((p, i) => {
      // Set transform of point
      if (p.featureLevel === 0) {
        scale.setScalar(p.scale);
      } else {
        scale.setScalar(scaleSize(p.featureLevel).y);
      }
      mat4.compose(p.pos, rot, scale);
      mat4.elements[15] = p.featureLevel * innerGlow;
      points.setMatrixAt(i, mat4);
      // Set transfomr of outline
      scale.setScalar(scale.x + outlineSize);
      mat4.compose(p.pos, rot, scale);
      outlines.setMatrixAt(i, mat4);

      // Set colour of point
      points.setColorAt(i, p.color);
      outlines.setColorAt(i, p.color.clone().multiplyScalar(outlineMultiplier).addScalar(outlineAdd));
    })

    this.points = points;
    this.outlines = outlines;
    this.add(this.points, this.outlines);
  }

  setCameraDirection(v: Vector3) {
    (this.points.material as ShaderMaterial).uniforms.u_cameraDirection.value = v;
  }

  handleAudio() {
    console.log('handling audio')
  }
}
