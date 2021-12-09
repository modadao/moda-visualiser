import { BufferAttribute, MathUtils, ShaderMaterial, Vector } from "three";
import gui from "./helpers/gui";
import { IDerivedCoordinate, IDerivedFingerPrint, IFingerprint } from "./types";

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

export const deriveData = (fingerprint: IFingerprint): IDerivedFingerPrint => {
  console.log('Deriving data from fingerprint')
  // Generate smoothed data
  const SMOOTH_RANGE = 40;
  const smoothedValues = fingerprint.coords.map((c, i) => {
    const startIndex = Math.max(0, i - SMOOTH_RANGE);
    const endIndex = Math.min(fingerprint.coords.length, i + SMOOTH_RANGE);
    let v = 0;
    for (let j = startIndex; j < endIndex; j++) {
      v += fingerprint.coords[j].y;
    }
    v /= endIndex - startIndex;
    return v;
  })

  // Get raw gradient
  let gradients = [] as number[];
  console.log(Array(fingerprint.coords.length -1).keys())
  for (const i of Array(fingerprint.coords.length).keys()) {
    if (i === fingerprint.coords.length - 1) {
      gradients.push(0);
      break;
    }
    const el = fingerprint.coords[i];
    const nel = fingerprint.coords[i+1]; // Next element
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
  for (const el of fingerprint.coords) {
    hash = ((hash<<5)-hash)+ el.x - el.y;
    hash = hash & hash; // Convert to 32bit integer
  }
  const floatHash = (hash / 2_147_483_647) * 0.5 + 0.5;

  const selectedFeatures = [];
  let probabilityScaler = 1;
  let numberOfFeatures = 0;
  const targetNumberOfFeatures = 7 + Math.floor(fingerprint.coords.length / 3000);
  const result =  { ...fingerprint,
    coords: fingerprint.coords.map((el, i) => {
      let r = customRandom.deterministic(el.x, el.y, gradients[i]);
      const threshold = (1 - numberOfFeatures / targetNumberOfFeatures) * probabilityScaler / fingerprint.coords.length * probabilityScaler * 0.01;
      const isFeature = r < threshold;
      if (!isFeature) probabilityScaler += 0.1;
      else {
        console.log('Is feature')
        probabilityScaler = 1;
        numberOfFeatures += 1
      }
      return {
        x: el.x,
        y: el.y,
        g: gradients[i],
        smoothed: smoothedValues[i],
        featureLevel: isFeature ? customRandom.deterministic(el.x, el.y) : 0,
      }
    }),
    hash,
    floatHash,
  }

  console.log('Derived data result: ', result);
  return result;
}

export const createShaderControls = (mat: ShaderMaterial) => {
  const f = gui.addFolder('Shader');
  Object.keys(mat.uniforms).forEach(key => {
    const binding = mat.uniforms[key];
    if (typeof binding.value === 'number')
      f.add(binding, 'value', 0, 10, 0.01).name(`${key}`)
  })
}

export const bezierVector = <T extends Vector>(A: T, B: T, C: T, D: T, t: number): T => {
  const tv1 = A.clone().lerp(B, t);
  const tv2 = B.clone().lerp(C, t);
  const tv3 = C.clone().lerp(D, t);
  tv1.lerp(tv2, t);
  tv2.lerp(tv3, t);

  tv1.lerp(tv2, t);
  return tv1.clone() as T;
}