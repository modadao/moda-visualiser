import { BufferAttribute, BufferGeometry, Color, Line, LineBasicMaterial, MathUtils, Texture, Vector, Vector2, Vector3, WebGLRenderer } from "three";
import { ISettings } from "./visualiser";
import { IDerivedFingerPrint, IFingerprint } from "./types";
import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

export const buildAttribute = (length: number, itemSize: number, predicate: (i: number) => number[]): BufferAttribute => {
  const array = new Float32Array(length * itemSize);
  for (const i of Array(length).keys()) {
    const result = predicate(i);
    const ai = i * itemSize; // Attribute index
    let thisIndex = 0;
    while (thisIndex < itemSize) {
      array[ai + thisIndex] = result[thisIndex];
      thisIndex += 1;
    }
  }
  return new BufferAttribute(array, itemSize);
}
export const customRandom = {
  seed: 49734321,
  setSeed(seed: number) {
    customRandom.seed = seed;
  },
  deterministic(...seeds: number[]) {
    if (seeds) {
      seeds.forEach((val, i) => {
        if (i === 0) {
          customRandom.seed = ((val + 0x7ed55d16) + (val << 12)) & 0xffffffff
        } else {
          customRandom.seed = (customRandom.seed ^ 0xc761c23c ^ (customRandom.seed >>> 19) ^ val) & 0xffffffff
        }
      });
    }
    return customRandom.random();
  },
  random() {
    customRandom.seed = ((customRandom.seed + 0xd3a2646c) ^ (customRandom.seed << 9)) & 0xffffffff
    customRandom.seed = (customRandom.seed + 0xfd7046c5 + (customRandom.seed << 3)) & 0xffffffff
    return (customRandom.seed & 0xfffffff) / 0x10000000
  },
}

export const deriveData = (fingerprint: IFingerprint, settings: ISettings): IDerivedFingerPrint => {
  console.log('Deriving data from fingerprint')
  const coords = fingerprint.coords.x.map((x, i) => ({ x, y: fingerprint.coords.y[i] }))
  // Generate smoothed data
  const SMOOTH_RANGE = 40;
  const smoothedValues = coords.map((_, i) => {
    const startIndex = Math.max(0, i - SMOOTH_RANGE);
    const endIndex = Math.min(coords.length, i + SMOOTH_RANGE);
    let v = 0;
    for (let j = startIndex; j < endIndex; j++) {
      v += coords[j].y;
    }
    v /= endIndex - startIndex;
    return v;
  })

  // Get raw gradient
  let gradients = [] as number[];
  console.log(Array(coords.length -1).keys())
  for (const i of Array(coords.length).keys()) {
    if (i === coords.length - 1) {
      gradients.push(0);
      break;
    }
    const el = coords[i];
    const nel = coords[i+1]; // Next element
    const dy = (el.y - nel.y)
    const dx = el.x - nel.x
    if (dx !== 0 && dy !== 0) {
      const m = (dy / dx);
      const dir = m < 0 ? -1 : 1;
      const v = Math.log(Math.abs(m)) * dir;
      gradients.push(v);
    } else {
      gradients.push(0);
    }
  }
  // Normalize it between 0-1
  const gradientMax = gradients.reduce((acc, el) => Math.max(acc, el), 0);
  const gradientMin = gradients.reduce((acc, el) => Math.min(acc, el), 0);
  gradients = gradients.map((el) => {
    return MathUtils.mapLinear(el, gradientMin, gradientMax, 0, 1);
  })
  console.log({ gradients })

  // Create a hashed value
  let hash = 0;
  for (const el of coords) {
    hash = ((hash<<5)-hash)+ el.x - el.y;
    hash = hash & hash; // Convert to 32bit integer
  }
  const floatHash = (hash / 2_147_483_647) * 0.5 + 0.5;

  const targetNumberOfFeatures = settings.featurePoints.count + Math.floor(coords.length / settings.featurePoints.extraPer);
  console.log({targetNumberOfFeatures})
  let features: number[] = [];
  let featureLevels: number[] = [];
  for (let i = 0; i < targetNumberOfFeatures; i++) {
    let targetFeatureIndex = 0;
    let j = 0;
    // Regenerate targetFeatureIndex until it's unique
    do {
      j += 1;
      targetFeatureIndex = Math.floor(customRandom.deterministic(i, floatHash, j) * coords.length);
    } while(features.includes(targetFeatureIndex))

    // Push 
    features.push(targetFeatureIndex)
    featureLevels.push(customRandom.deterministic(i, floatHash));
  }

  // Split the coords into segments
  const height = Math.max(...fingerprint.coords.y);
  const width = Math.max(...fingerprint.coords.x);
  console.log(width, height);
  const segmentSize = Math.floor(width / targetNumberOfFeatures + 1);
  console.log(segmentSize)
  const segmentedPoints: Array<Array<{x: number, y:number}>> = new Array(targetNumberOfFeatures).fill(0).map(() => []);
  coords.forEach(el => {
    const bucketIndex = Math.floor(el.x / segmentSize);
    console.log(`${bucketIndex} / ${segmentedPoints.length}`)
    segmentedPoints[bucketIndex].push(el);
  });
  console.log(segmentedPoints);

  const distance2d = (v1: {x: number, y:number}, v2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
  }
  // Find the densest coord in each segment
  const maxDist = Math.max(segmentSize, height);
  let offset = 0;
  let mostDenseCoords = segmentedPoints.map(( points, i ) => {
    console.log(`Bucket ${i} has ${points.length} points`)
    const densities = points.map(p => {
      const density = points.reduce((acc, el) => {
        return acc + (1 - distance2d(p, el) / maxDist);
      }, 0) / points.length;
      return density;
    })

    const mostDense = Math.max(...densities);
    const mostDenseIndex = densities.findIndex(el => el === mostDense);
    console.log(`\tMaking the most dense point ${mostDenseIndex} at ${mostDense}`);
    const res = { index: offset + mostDenseIndex, density: mostDense }
    offset += points.length;
    return res;
  }).filter(c => Number.isFinite(c.density)); // Filter out invalid points 

  // Normalize it between 0 and 1
  const minDense = Math.min(...mostDenseCoords.map(c => c.density));
  const maxDense = Math.max(...mostDenseCoords.map(c => c.density));
  mostDenseCoords = mostDenseCoords.map(c => {
    return {
      ...c,
      density: MathUtils.mapLinear(c.density, minDense, maxDense, 0.05, 1),
    }
  })

  const result =  { ...fingerprint,
    coords: coords.map((el, i) => {
      const featurePoint = mostDenseCoords.find(dc => dc.index === i);
      return {
        x: el.x,
        y: el.y,
        g: gradients[i],
        smoothed: smoothedValues[i],
        featureLevel: featurePoint ? featurePoint.density : 0,
      }
    }),
    hash,
    floatHash,
  }

  return result;
}

// export const createShaderControls = (mat: ShaderMaterial) => {
//   const f = gui.addFolder('Shader');
//   Object.keys(mat.uniforms).forEach(key => {
//     const binding = mat.uniforms[key];
//     if (typeof binding.value === 'number')
//       f.add(binding, 'value', 0, 10, 0.01).name(`${key}`)
//   })
// }

export const bezierVector = <T extends Vector>(A: T, B: T, C: T, D: T, t: number): T => {
  const tv1 = A.clone().lerp(B, t);
  const tv2 = B.clone().lerp(C, t);
  const tv3 = C.clone().lerp(D, t);
  tv1.lerp(tv2, t);
  tv2.lerp(tv3, t);

  tv1.lerp(tv2, t);
  return tv1.clone() as T;
}

export const chunk = <T,>(arr: T[], size: number): T[][] => (
  arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), [] as T[][])
);

export const pickRandom = <T>(arr: T[], count: number) => {
  let indices = [] as number[];
  for (let i = 0; i < count; i++) {
    let j = 0;
    let index = 0;
    do {
      j += 1;
      index = Math.floor(customRandom.deterministic(i, j) * arr.length);
    } while(indices.includes(index))
    indices.push(index);
  }

  return indices.map(index => arr[index]);
}

export const preProcessTexture = (renderer: WebGLRenderer, tex: Texture, passes: Pass[]): Promise<Texture> => {
  return new Promise(res => {
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(window.devicePixelRatio);
    composer.addPass(new TexturePass(tex));
    const s = new Vector2()
    renderer.getSize(s)
    s.multiplyScalar(window.devicePixelRatio);
    composer.addPass(new UnrealBloomPass(s, 1, 0.2, 0.2))
    composer.addPass(new ShaderPass(HorizontalBlurShader))
    composer.addPass(new ShaderPass(VerticalBlurShader))
    passes.forEach(p => {
      composer.addPass(p);
    })
    console.log(composer.passes)
    setTimeout(() => {
      composer.render(0.1);
      res(composer.readBuffer.texture);
    }, 1000)
  })
}

const mat = new LineBasicMaterial({
  color: 0xff0000,
})
export const debugLine = (v1: Vector3, v2: Vector3) => {
  const points = [v1, v2];
  const geo = new BufferGeometry().setFromPoints(points);
  const l = new Line(geo, mat);
  return l;
}

export class ImgSampler {
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D|undefined;
  loading: Promise<void>|undefined;
  constructor(src: string) {
    this.img = new Image();
    this.canvas = document.createElement('canvas');
    this.loading = new Promise((res) => {
      this.img.onload = () => {
        this.canvas.width = this.img.width;
        this.canvas.height = this.img.height;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height);
        res();
      }
      this.img.src = src;
    })
    this.loading.then(() => {
      this.loading = undefined;
    })
  }

  getPixel(x: number, y: number) {
    if (this.loading) throw new Error('Cant get pixel as image is still loading.');
    if (!this.ctx) throw new Error('Image CTX not ready.')
    const sx = Math.floor(x * this.img.width);
    const sy = Math.floor(y * this.img.height);
    const d = this.ctx.getImageData(sx, sy, 1, 1);
    const pixels = Float32Array.from(d.data).map(v => v/255);
    return new Color(...pixels);
  }
}

export class GradientSampler {
  colours: Color[];
  constructor(srcGradient: Record<string,string>) {
    this.colours = Object.values(srcGradient).map(c => new Color(c));
  }

  getPixel(x: number) {
    const wrappedColours = this.colours.map(v => v.clone());
    wrappedColours.push(wrappedColours[0]);
    let scaledX = (x % 1);
    scaledX *= wrappedColours.length - 1;
    const lowerIndex = Math.floor( scaledX );
    const upperIndex = lowerIndex + 1;
    const mix = MathUtils.mapLinear(scaledX, lowerIndex, upperIndex, 0, 1);
    return wrappedColours[lowerIndex].clone().lerp(wrappedColours[upperIndex], mix);
  }
}
