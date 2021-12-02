import { BufferAttribute, MathUtils, ShaderMaterial } from "three";
import gui from "./helpers/gui";
import { IDerivedFingerPrint, IFingerprint } from "./types";

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

export const deriveData = (fingerprint: IFingerprint): IDerivedFingerPrint => {
  console.log('Deriving data from fingerprint')
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

  const maxGradientIndex = gradients.findIndex(el => el === gradientMax);
  const minGradientIndex = gradients.findIndex(el => el === gradientMin);
  const maxVal = Math.max(...fingerprint.coords.map(el => el.x));
  const minVal = Math.min(...fingerprint.coords.map(el => el.x));

  const result =  { ...fingerprint,
    coords: fingerprint.coords.map((el, i) => ({
      x: el.x,
      y: el.y,
      g: gradients[i],
      gmax: i === maxGradientIndex,
      gmin: i === minGradientIndex,
      max: el.x === maxVal,
      min: el.x === minVal,
    })),
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