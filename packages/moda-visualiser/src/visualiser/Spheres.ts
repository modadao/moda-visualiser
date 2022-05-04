import { BackSide, InstancedMesh, Matrix4, MeshBasicMaterial, Object3D, Quaternion, ShaderMaterial, SphereBufferGeometry, Texture, Vector2, Vector3 } from "three"
import { ISettings } from ".";
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";
import FragShader from '../shaders/spheres_frag.glsl';
import VertShader from '../shaders/spheres_vert.glsl';
import { IVisualiserCoordinate } from "./RadialSpheres";
import { bezierVector } from "../utils";
import { IAudioFrame } from "./AudioAnalyser";
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'
import FFTTextureManager from "./FftTextureManager";

export default class Spheres extends Object3D implements IAudioReactive {
  points: InstancedMesh;
  outlines: InstancedMesh;
  dataTextureSet = false;
  material: ShaderMaterial;
  outlineMaterial: ShaderMaterial;
  constructor(fingerprint: IDerivedFingerPrint, settings: ISettings, coords: IVisualiserCoordinate[], public fftTextureManager: FFTTextureManager) {
    super();
    this.name = 'Spheres';
    console.log(fingerprint, coords);
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

    // Build geometry 
    const g = new SphereBufferGeometry(1);
    const m = new ShaderMaterial({
      fragmentShader: FragShader,
      vertexShader: VertShader,
      uniforms: {
        u_innerColorMultiplier: { value: 2.0, },
        u_outerColorMultiplier: { value: 1, },
        u_cameraDirection: { value: new Vector3() },
        u_time: { value: 0 },
        u_pointIndex: { value: 0 },
        u_pointLength: { value: fingerprint.coords.length },
        u_springTexture: { value: new Texture() },
        u_triggerCount: { value: 0 },
      }
    })
    this.outlineMaterial = m.clone();
    this.outlineMaterial.side = BackSide;
    this.material = m;

    const points = new InstancedUniformsMesh(g, m, coords.length);
    const outlines = new InstancedUniformsMesh(g, this.outlineMaterial, coords.length);

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
      points.setUniformAt('u_pointIndex', i, i);
      // Set transfomr of outline
      scale.setScalar(scale.x + outlineSize);
      mat4.compose(p.pos, rot, scale);
      outlines.setMatrixAt(i, mat4);

      // Set colour of point
      points.setColorAt(i, p.color);
      outlines.setColorAt(i, p.color.clone().multiplyScalar(outlineMultiplier).addScalar(outlineAdd));
      outlines.setUniformAt('u_pointIndex', i, i);
    })

    this.points = points;
    this.outlines = outlines;
    this.add(this.points, this.outlines);
  }

  setCameraDirection(v: Vector3) {
    (this.points.material as ShaderMaterial).uniforms.u_cameraDirection.value = v;
  }

  update(elapsed: number) {
    this.material.uniforms.u_time.value = elapsed;
    this.outlineMaterial.uniforms.u_time.value = elapsed;
    if (!this.dataTextureSet && this.fftTextureManager.dataTexture) {
      this.material.uniforms.u_springTexture.value = this.fftTextureManager.dataTexture;
      this.material.needsUpdate = true;
      this.outlineMaterial.uniforms.u_springTexture.value = this.fftTextureManager.dataTexture;
      this.outlineMaterial.needsUpdate = true;
      this.dataTextureSet = true;
      console.log('Set sphere data tex')
    }
  }

  handleAudio(frame: IAudioFrame) {
    if (frame.trigger) {
      this.material.uniforms.u_triggerCount = { value: this.material.uniforms.u_triggerCount.value + 1};
    }
  }
}
