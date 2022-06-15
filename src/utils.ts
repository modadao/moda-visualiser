import { BufferAttribute, BufferGeometry, Color, Line, LineBasicMaterial, MathUtils, Vector, Vector3 } from "three";

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

export const fillArray = <T>(target: T[], source: T[]) => {
  const targetLength = target.length;
  const sourceLength = source.length;
  for (let i = 0; i < targetLength; i++) {
    const sourceI = i % sourceLength;
    target[i] = source[sourceI];
  }
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

/**
 * @template T - Type of array
 * @param arr - Array that you'd like chunked
 * @param size - The max size of each chunk
 * @returns 2d chunked array.
 */
export const chunk = <T,>(arr: T[], size: number): T[][] => (
  arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), [] as T[][])
);

export const pickRandom = <T>(arr: T[], count: number) => {
  const indices = [] as number[];
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

  getPixel(x: number) {
    if (this.loading) throw new Error('Cant get pixel as image is still loading.');
    if (!this.ctx) throw new Error('Image CTX not ready.')
    const sx = Math.floor(x * this.img.width);
    const sy = Math.floor(this.img.height / 2);
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


export const mod = (n: number, m: number) => {
  return ((n % m) + m) % m;
}
