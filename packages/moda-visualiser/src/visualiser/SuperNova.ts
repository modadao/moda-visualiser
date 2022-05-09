import SimplexNoise from "simplex-noise";
import { AdditiveBlending, BoxBufferGeometry, BufferAttribute, BufferGeometry, Color, MathUtils, Mesh, Object3D, Points, PointsMaterial, ShaderMaterial, ShaderMaterialParameters, Sprite, SpriteMaterial, TextureLoader, Vector3, } from "three";
import ProgressRingFrag from '../shaders/progress_ring_frag.glsl';
import ProgressRingVert from '../shaders/progress_ring_vert.glsl';
import { fillArray } from "../utils";
const imageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAr5QTFRFAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////0dICkAAAAOp0Uk5TAAECAwQFBgcICQoLDA0ODxAREhQVFhcTGBkaHB0bHyAiIyQhHiYoKissLSknJS4xMzQ2NTIwNzo8PkBBPzs5Lzg9RUhKS0xHREJNUVRXWVhWU09GXmFkZ2hmY2BcSV9la3BzdnVybmldTnl/goWG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';

const spriteTexture = new TextureLoader().load(imageDataUri)
const tempVector = new Vector3();

const glsl = (shader: TemplateStringsArray) => (shader.join());

const SuperNovaSpriteShader: ShaderMaterialParameters = {
  depthWrite: false,
  transparent: true,
  blending: AdditiveBlending,
  opacity: 1,
  uniforms: {
    u_map: { value: spriteTexture },
    u_time: { value: 0 },
    u_startTime: { value: 0 },
    u_lifetime: { value: 2 },
  },
  vertexShader: glsl`
    #define PI 3.1415926538

float hash(vec3 p)  // replace this by something better
{
    p  = fract( p*0.3183099+.1 );
	  p *= 17.0;
    return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

float noise( in vec3 x )
{
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
	
    return mix(mix(mix( hash(i+vec3(0,0,0)), 
                        hash(i+vec3(1,0,0)),f.x),
                   mix( hash(i+vec3(0,1,0)), 
                        hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix( hash(i+vec3(0,0,1)), 
                        hash(i+vec3(1,0,1)),f.x),
                   mix( hash(i+vec3(0,1,1)), 
                        hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}

    uniform float u_time;
    attribute float opacity;
    attribute vec3 color;
    varying float v_opacity;
    varying vec3 v_color;
    const float NOISE_SCALE = 0.5;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.); 
      float t = u_time * 0.5;
      vec3 altPos = vec3(
          noise(vec3(worldPos.x * NOISE_SCALE, worldPos.y, t * 0.8 * NOISE_SCALE)),
          noise(vec3(worldPos.y * NOISE_SCALE, worldPos.z, (t + 0.3) * NOISE_SCALE)),
          noise(vec3(worldPos.z * NOISE_SCALE, worldPos.x, (t - 0.2) * 0.8 * NOISE_SCALE))
        );
      vec4 mPosition = modelMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * viewMatrix * mPosition;
      float pointSize = 15.;
      gl_PointSize = pointSize - distance(cameraPosition, mPosition.xyz) / pointSize;
      v_color = color * 1.2;
      v_opacity = clamp(mPosition.y + 5., 0., 1.);
    }
  `,
  fragmentShader: glsl`
    uniform sampler2D u_map;
    varying float v_opacity;
    varying vec3 v_color;

    void main() {
      vec2 pUv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
      vec4 c = texture2D(u_map, pUv);
      c.rgb *= v_color;
      gl_FragColor = c;
      // gl_FragColor.r = (u_time - u_startTime);
      // gl_FragColor.g = (u_time - u_startTime) / u_lifetime;
      gl_FragColor.a *= v_opacity;
    }
  `
}

interface ISuperNovaSpriteEmitterOptions {
  color: Color,
}

const snseDefaults: ISuperNovaSpriteEmitterOptions = {
  color: new Color(0xffffff),
}

const simplex = new SimplexNoise();
console.log(simplex.noise3D(1, 1, 1))

export class SuperNovaSpriteEmitter extends Object3D {
  material: ShaderMaterial;
  geometry: BufferGeometry;
  mesh: Points<BufferGeometry, ShaderMaterial>;
  
  opacities: Float32Array;
  positions: Float32Array;
  accelerations: Float32Array;
  constructor(public count: number, disposeCallback: (sn: SuperNovaSpriteEmitter) => void, opts = snseDefaults) {
    super();
    const vertices = [];
    const { sin, cos, random } = Math;
    for ( let i = 0; i < count * 3; i += 3 ) {
      const theta = i / (count * 3) * 4;
      // temp2.randomDirection();
      // temp.add(temp2).normalize().multiplyScalar(0.1);
      // vertices.push(...temp.toArray());
      vertices.push((sin(theta) - 0.5) * 0.2);
      vertices.push(random() * 0.3);
      vertices.push((sin(theta + 0.5) - 0.5) * 0.2);
    }
    this.accelerations = new Float32Array(vertices);
    this.positions = new Float32Array(vertices.map(() => 0));
    this.opacities = new Float32Array(new Array(count).fill(1));

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('opacity', new BufferAttribute(this.opacities, 1));
    this.opacities = new Float32Array(new Array(count).fill(1));
    
    const colors = new Array(count * 3);
    fillArray(colors, opts.color.toArray());
    this.geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

    this.material = new ShaderMaterial(SuperNovaSpriteShader);

    this.mesh = new Points(this.geometry, this.material);
    this.add(this.mesh);

    setTimeout(() => {
      disposeCallback(this);
    }, 2000);
    this.material.uniforms.u_lifetime.value = 2;
  }
  setStartTime = false;

  private static readonly NOISE_SCALE = 0.55;
  private static readonly FLOW_SPEED = 0.05;
  update(elapsed: number, delta: number) {
    const { NOISE_SCALE, FLOW_SPEED } = SuperNovaSpriteEmitter;
    for (let i = 0; i < this.count; i++) {
      const bufferI = i * 3;
      // Update acceleration
      const [x, y, z] = this.positions.slice(bufferI, bufferI + 3);
      this.accelerations[bufferI] *= 0.9;
      this.accelerations[bufferI] += (simplex.noise3D(x * NOISE_SCALE, y * NOISE_SCALE, z * NOISE_SCALE) * FLOW_SPEED);
      this.accelerations[bufferI + 1] += 0.03 * delta;

      this.accelerations[bufferI + 2] *= 0.9;
      this.accelerations[bufferI + 2] += (simplex.noise3D(y * NOISE_SCALE, z * NOISE_SCALE, x * NOISE_SCALE) * FLOW_SPEED);

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
