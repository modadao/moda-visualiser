import { BoxBufferGeometry, Mesh, Object3D, ShaderMaterial, } from "three";
import ProgressRingFrag from '../shaders/progress_ring_frag.glsl';
import ProgressRingVert from '../shaders/progress_ring_vert.glsl';

const geometry = new BoxBufferGeometry(1, 0.01, 1, 2, 1, 16);
const material = new ShaderMaterial({
  vertexShader: ProgressRingVert,
  fragmentShader: ProgressRingFrag,
  uniforms: {
    u_innerRadius: { value: 1 },
    u_thickness: { value: 0.1 },
    u_progress: { value: Math.PI * 2 },
    u_opacity: { value: 1 },
  },
  transparent: true,
  depthWrite:false,
})

export default class SuperNova extends Object3D {
  mesh: Mesh<BoxBufferGeometry, ShaderMaterial>;
  constructor(public size: number, disposeCallback: (sn: SuperNova) => void, public disposeDuration = 200) {
    super();
    const mat = material.clone();
    mat.uniforms.u_innerRadius.value = size;
    this.mesh = new Mesh(geometry, mat);
    this.mesh.rotateX(Math.PI * 90)
    this.add(this.mesh);

    setTimeout(() => {
      disposeCallback(this);
    }, disposeDuration);
  }

  lifetime = 0;
  update(delta: number) {
    this.lifetime += delta;
    
    this.mesh.material.uniforms.u_innerRadius.value = this.size + (this.size) * this.lifetime * 1000 / this.disposeDuration * 2;
    this.mesh.material.uniforms.u_opacity.value = 1 - this.lifetime * 1000 / this.disposeDuration;
  }

  dispose() {
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
  }
}
