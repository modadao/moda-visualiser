import { BufferAttribute, Color, CubicBezierCurve3, Curve, Mesh, Object3D, ShaderMaterial, Texture, TubeGeometry, Vector3 } from "three"
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";
import { ISettings } from ".";
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";
import { IVisualiserCoordinate } from "./RadialSpheres";
import { customRandom } from "../utils";
import TubeShaderFrag from '../shaders/tube_frag.glsl';
import TubeShaderVert from '../shaders/tube_vert.glsl';
import { IAudioFrame } from "./AudioAnalyser";
import SpringPhysicsTextureManager from "./SpringPhysicsTextureManager";
import gui from "./gui";

export interface IFeatureBezierOptions {
  segments: number;
  radius: number;
  radialSegments: number;
}

const defaultOptions: IFeatureBezierOptions = {
  segments: 40,
  radius: 0.01,
  radialSegments: 5,
}

type GenerateCurvesResult = {
  curve: Curve<Vector3>,
  cur: IVisualiserCoordinate,
  next: IVisualiserCoordinate,
}[]

let mat: ShaderMaterial|undefined;
const getMaterial = () => {
  if (!mat) {
    mat = new ShaderMaterial({
      vertexShader: TubeShaderVert,
      fragmentShader: TubeShaderFrag,
      uniforms: {
        u_springTexture: { value: Texture.DEFAULT_IMAGE },
        u_springTextureHeight: { value: 0 },
        u_triggerCount: { value: 0 },
        u_noiseDensity: { value: 0.2 },
        u_noiseScale: { value: 8 },
        u_noiseRamp: { value: 8 },
        u_noiseSpread: { value: 1 },
        u_rotationDensity: { value: 2 },
      }
    });

    gui.add(mat.uniforms.u_noiseDensity, 'value', 0, 5, 0.01).name('Noise Density');
    gui.add(mat.uniforms.u_noiseScale, 'value', 0, 15, 0.01).name('Noise Scale');
    gui.add(mat.uniforms.u_noiseRamp, 'value', 0, 15, 0.01).name('Noise Ramp');
    gui.add(mat.uniforms.u_noiseSpread, 'value', 0, 15, 0.01).name('Noise Spread');
    gui.add(mat.uniforms.u_rotationDensity, 'value', 0, 15, 0.01).name('Noise Rotation Density');
  }
  return mat;
}

export default class FeatureBeziers extends Object3D implements IAudioReactive {
  material: ShaderMaterial;
  uniformsSet = false;
  constructor(_fingerprint: IDerivedFingerPrint, public settings: ISettings, coords: IVisualiserCoordinate[], public springPhysTextureManager: SpringPhysicsTextureManager, options?: Partial<IFeatureBezierOptions>) {
    super();

    const opts = Object.assign({}, defaultOptions, options ?? {}) as IFeatureBezierOptions;
    this.material = getMaterial();
    const center = new Vector3();
    const { verticalIncidence } = settings.beziers;
    const firstDir = verticalIncidence 
      ? new Vector3(0, 1, 0)
      : coords[0].pos.clone().sub(center).normalize().multiplyScalar(-1);
    const [firstCoord, ...remainingPoints] = coords;

    const curves = this.generateCurves(remainingPoints, firstCoord, firstDir, true, []);

    const y = springPhysTextureManager.registerSpringPhysicsElement();
    const mainBezierCurves = this.generateTube(curves, opts.segments, opts.radius, opts.radialSegments, y);
    this.add(mainBezierCurves);
  }

  /**
   * @description Creates a bezier path (Curve<Vector3>) from an array of arbitrary points and an initial point/direction
   * @param points - Points to create beziers between
   * @param cur - Current / starting point
   * @param dir - Current / starting direction
   * @param facingTowardsCenter - Flag that flip flops to create the weaving style
   * @param result - Return value that gets recursively appended to
   * @param firstPoint - Starting point, used to connect final bezier back to beginning
   * @param firstDir - Starting direction, used to connect final bezier back to beginning
   */
  private generateCurves (points: IVisualiserCoordinate[], cur: IVisualiserCoordinate, dir: Vector3, facingTowardsCenter: boolean, result: GenerateCurvesResult, firstPoint?: IVisualiserCoordinate, firstDir?: Vector3): GenerateCurvesResult {
    const center = new Vector3();
    const { flareOut, flareIn, angleRandomness, verticalAngleRandomness, verticalIncidence } = this.settings.beziers;
    const isLast = points.length === 0;
    const targetDist = 2;
    const next = isLast 
      ? firstPoint as IVisualiserCoordinate
      : points.reduce((acc, el) => {
        return Math.abs(targetDist - cur.pos.distanceTo(el.pos)) < Math.abs(targetDist - cur.pos.distanceTo(acc.pos)) ? el : acc
      }, points[0])
    const remaining = points.filter(el => !el.pos.equals(next.pos));

    const nextDir = isLast
      ? (firstDir as Vector3).multiplyScalar(-1)
      : verticalIncidence
        ? (facingTowardsCenter ? new Vector3(0, 1, 0) : new Vector3(0, -1, 0))
          .applyAxisAngle(new Vector3(0, 0, 1), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
          .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2)
        : next.pos.clone().sub(center).normalize()
          .applyAxisAngle(new Vector3(0, 1, 0), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
          .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2);
    if (facingTowardsCenter && !isLast) nextDir.multiplyScalar(-1);
    const dist = cur.pos.distanceTo(next.pos);
    const handleDist = verticalIncidence
      ? flareOut * 2 + dist
      : facingTowardsCenter ? dist * flareIn : dist * flareOut;
    const anchor1 = cur.pos.clone().add(dir.clone().multiplyScalar(handleDist))
    const anchor2 = next.pos.clone().add(nextDir.clone().multiplyScalar(handleDist));
        
    result.push({
      curve: new CubicBezierCurve3(cur.pos, anchor1, anchor2, next.pos),
      next,
      cur,
    });

    if (isLast) {
      return result;
    } else {
      return this.generateCurves(remaining, next, nextDir.multiplyScalar(-1), !facingTowardsCenter, result, firstPoint ?? cur, firstDir ?? dir);
    }
  }

  /**
   * @description Converts the Curve objects from generateCurves into threejs meshs 
   * @param curves - Curve object
   * @param featurePoints - Points used to colourise the beziers
   * @param segments - Number of segmeents per section
   * @param radius - Radius of TubeGeometry
   * @param radialSegments - Number of radial segments 
   * @returns 
   */
  private generateTube (curves: GenerateCurvesResult, segments: number, radius: number, radialSegments: number, springTextureIndex: number) {
    const tempColor = new Color();
    const geometries = curves.map((el, i) => {
      const { cur, next, curve } = el;
      const scaledSegments = Math.floor(segments * curve.getLength());
      const tubeGeometry = new TubeGeometry(curve, scaledSegments, radius, radialSegments, false );

      const posAttributeLength = tubeGeometry.getAttribute('position').array.length
      const nVerts = posAttributeLength / 3;
      const colorsData: Array<number> = [];
      const progressAttribute = [];
      const baseProgress = i / (curves.length);
      const progressLength = 1 / (curves.length);
      for (let i = 0; i < nVerts; i++) {
        const thisProgress = Math.floor(i/radialSegments) / Math.floor(nVerts / radialSegments);
        tempColor.copy(cur.color);
        tempColor.lerp(next.color, thisProgress)
        colorsData.push(...tempColor.toArray());

        progressAttribute.push(baseProgress + thisProgress * progressLength);
      }
      tubeGeometry.setAttribute('color', new BufferAttribute(new Float32Array(colorsData), 3));
      tubeGeometry.setAttribute('springTextureIndex', new BufferAttribute(new Float32Array(progressAttribute.length).fill(springTextureIndex), 1));
      tubeGeometry.setAttribute('progress', new BufferAttribute(new Float32Array(progressAttribute), 1));
      return tubeGeometry;
    })
    const geometry = BufferGeometryUtils.mergeBufferGeometries([...geometries]);
    const tubeMesh = new Mesh(geometry, this.material);
    return tubeMesh;
  }

  update() {
    if (!this.uniformsSet && this.springPhysTextureManager.dataTexture) {
      console.log('Setting uniforms on featurebeziers')
      this.material.uniforms.u_springTexture.value = this.springPhysTextureManager.dataTexture;
      this.material.uniforms.u_springTextureHeight.value = this.springPhysTextureManager.height;
      this.material.needsUpdate = true;
      this.uniformsSet = true;
    }
  }
  // @ts-expect-error; 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleAudio(frame: IAudioFrame) { 
    if (frame.trigger) {
      this.material.uniforms.u_triggerCount = { value: this.material.uniforms.u_triggerCount.value + 1};
      console.log('Updating trigger count to ', this.material.uniforms.u_triggerCount.value)
    }
  }
}
