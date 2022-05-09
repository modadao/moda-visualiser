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
import SuperNova, { SuperNovaSprite, SuperNovaSpriteEmitter } from "./SuperNova";

export default class Spheres extends Object3D implements IAudioReactive {
  points: InstancedMesh;
  outlines: InstancedMesh;
  dataTextureSet = false;
  material: ShaderMaterial;
  outlineMaterial: ShaderMaterial;
  sprites: SuperNovaSpriteEmitter[] = [];
  constructor(fingerprint: IDerivedFingerPrint, settings: ISettings, public coords: IVisualiserCoordinate[], public fftTextureManager: FFTTextureManager) {
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
    g.center();
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

    this.disposeSuperNova = this.disposeSuperNova.bind(this);
    this.disposeSuperNovaSprites = this.disposeSuperNovaSprites.bind(this);
  }

  setCameraDirection(v: Vector3) {
    (this.points.material as ShaderMaterial).uniforms.u_cameraDirection.value = v;
  }

  update(elapsed: number, delta: number) {
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

    this.superNovas.forEach(sn => sn.update(delta));
    this.sprites.forEach(sn => sn.update(elapsed, delta));
  }

  superNovas: SuperNova[] = [];
  handleAudio(frame: IAudioFrame) {
    if (frame.trigger) {
      this.material.uniforms.u_triggerCount = { value: this.material.uniforms.u_triggerCount.value + 1};
    }
    const { data } = this.fftTextureManager;
    for (let i = 0; i < frame.fft.length; i++) {
      const dataI = i * 4;
      if (data[dataI + 3] > 0.5) {
        const a = data[dataI + 1];
        
        const sn = new SuperNova(this.coords[i].featureLevel * 2, this.disposeSuperNova);
        sn.position.copy(this.coords[i].pos);
        sn.position.y += a * 0.2;
        this.superNovas.push(sn);
        this.add(sn);
        
        const s = new SuperNovaSpriteEmitter(10, this.disposeSuperNovaSprites);
        s.position.copy(sn.position);
        this.add(s);
        this.sprites.push(s);
      }
    }
  }

  disposeSuperNovaSprites(toRemove: SuperNovaSpriteEmitter) {
    const toRemoveArray = this.sprites.filter(sn => sn.id === toRemove.id);
    toRemoveArray.forEach((sn) => {
      sn.dispose();
      this.remove(sn);
    })
    this.sprites = this.sprites.filter(sn => sn.id !== toRemove.id);
  }

  disposeSuperNova(toRemove: SuperNova) {
    const toRemoveArray = this.superNovas.filter(sn => sn.id === toRemove.id);
    toRemoveArray.forEach((sn) => {
      sn.dispose();
      this.remove(sn);
    })
    this.superNovas = this.superNovas.filter(sn => sn.id !== toRemove.id);
  }
}
