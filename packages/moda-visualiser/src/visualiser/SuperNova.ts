import { BoxBufferGeometry, BufferAttribute, BufferGeometry, MathUtils, Mesh, Object3D, Points, PointsMaterial, ShaderMaterial, ShaderMaterialParameters, Sprite, SpriteMaterial, TextureLoader, Vector3, } from "three";
import ProgressRingFrag from '../shaders/progress_ring_frag.glsl';
import ProgressRingVert from '../shaders/progress_ring_vert.glsl';
const imageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAr5QTFRFAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////0dICkAAAAOp0Uk5TAAECAwQFBgcICQoLDA0ODxAREhQVFhcTGBkaHB0bHyAiIyQhHiYoKissLSknJS4xMzQ2NTIwNzo8PkBBPzs5Lzg9RUhKS0xHREJNUVRXWVhWU09GXmFkZ2hmY2BcSV9la3BzdnVybmldTnl/goWG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';

const spriteTexture = new TextureLoader().load(imageDataUri)
const tempVector = new Vector3();

const glsl = (shader: TemplateStringsArray) => (shader.join());

const SuperNovaSpriteShader: ShaderMaterialParameters = {
  depthWrite: false,
  transparent: true,
  opacity: 1,
  uniforms: {
    u_map: { value: spriteTexture },
    u_time: { value: 0 },
    u_startTime: { value: 0 },
    u_lifetime: { value: 2 },
  },
  vertexShader: glsl`
    #define PI 3.1415926538

//	Classic Perlin 2D Noise 
//	by Stefan Gustavson
//
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

    uniform float u_time;
    attribute float opacity;
    varying float v_opacity;
    const float NOISE_SCALE = 0.5;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.); 
      vec3 altPos = vec3(
          cnoise(vec2(worldPos.x * NOISE_SCALE, u_time * 0.8 * NOISE_SCALE)),
          cnoise(vec2(worldPos.y * NOISE_SCALE, (u_time + 0.3) * NOISE_SCALE)),
          cnoise(vec2(worldPos.z * NOISE_SCALE, (u_time - 0.2) * 0.8 * NOISE_SCALE))
        );
      vec4 mPosition = modelMatrix * vec4( position + altPos, 1.0 );
      gl_Position = projectionMatrix * viewMatrix * mPosition;
      gl_PointSize = 10.;
      v_opacity = clamp(mPosition.y + 5., 0., 1.);
    }
  `,
  fragmentShader: glsl`
    uniform sampler2D u_map;
    varying float v_opacity;

    void main() {
      vec2 pUv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
      gl_FragColor = texture2D(u_map, pUv);
      // gl_FragColor.r = (u_time - u_startTime);
      // gl_FragColor.g = (u_time - u_startTime) / u_lifetime;
      gl_FragColor.a *= v_opacity;
    }
  `
}

export class SuperNovaSpriteEmitter extends Object3D {
  material: ShaderMaterial;
  geometry: BufferGeometry;
  mesh: Points<BufferGeometry, ShaderMaterial>;
  
  opacities: Float32Array;
  positions: Float32Array;
  accelerations: Float32Array;
  constructor(public count: number, disposeCallback: (sn: SuperNovaSpriteEmitter) => void) {
    super();
    const vertices = [];
    for ( let i = 0; i < count; i ++ ) {
      vertices.push( ...tempVector.random().subScalar(0.5).multiplyScalar(0.2).toArray());
    }
    this.accelerations = new Float32Array(vertices);
    this.positions = new Float32Array(vertices.map(() => 0));
    this.opacities = new Float32Array(new Array(count).fill(1));

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('opacity', new BufferAttribute(this.opacities, 1));

    this.material = new ShaderMaterial(SuperNovaSpriteShader);

    this.mesh = new Points(this.geometry, this.material);
    this.add(this.mesh);

    setTimeout(() => {
      disposeCallback(this);
    }, 2000);
    this.material.uniforms.u_lifetime.value = 2;
  }
  setStartTime = false;
  update(elapsed: number, delta: number) {
    for (let i = 0; i < this.count; i++) {
      const bufferI = i * 3;
      // Update acceleration
      this.accelerations[bufferI] *= 0.95;
      this.accelerations[bufferI + 1] *= 0.95;
      this.accelerations[bufferI + 1] -= 0.1 * delta;
      this.accelerations[bufferI + 2] *= 0.95;

      // Update position
      this.positions[bufferI] += this.accelerations[bufferI];
      this.positions[bufferI + 1] += this.accelerations[bufferI + 1];
      this.positions[bufferI + 2] += this.accelerations[bufferI + 2];
    }
    this.geometry.attributes.position.needsUpdate = true;
    
    const opacityDecay = 0.1 * delta;
    for (let i = 0; i < this.opacities.length; i++) {
      this.opacities[i] *= (1 - opacityDecay);
    }
    this.geometry.attributes.opacity.needsUpdate = true;

    this.material.uniforms.u_time.value = elapsed;
    if (!this.setStartTime) {
      this.setStartTime = true;
      this.material.uniforms.u_startTime.value = elapsed;
    }
  }
  dispose() {
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
  }
}

const geometry = new BoxBufferGeometry(1, 0.01, 1, 2, 1, 16);
const material = new ShaderMaterial({
  vertexShader: ProgressRingVert,
  fragmentShader: ProgressRingFrag,
  uniforms: {
    u_innerRadius: { value: 1 },
    u_thickness: { value: 0.02 },
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
    
    this.mesh.material.uniforms.u_innerRadius.value = this.size + (this.size + 0.5) * this.lifetime * 1000 / this.disposeDuration * 2;
    this.mesh.material.uniforms.u_opacity.value = 1 - this.lifetime * 1000 / this.disposeDuration;
  }

  dispose() {
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
  }
}
