import { BufferAttribute, Color, CubicBezierCurve3, Curve, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Object3D, Quaternion, ShaderMaterial, SphereBufferGeometry, TubeGeometry, Vector2, Vector3 } from "three"
import { ISettings } from ".";
import { IDerivedFingerPrint } from "../types";
import IAudioReactive from "./ReactiveObject";
import { IVisualiserCoordinate } from "./RadialSpheres";
import { customRandom } from "../utils";
import TubeShaderFrag from '../shaders/tube_frag.glsl';
import TubeShaderVert from '../shaders/tube_vert.glsl';

export interface IFeatureBezierOptions {
  segments: number;
  radius: number;
  radialSegments: number;
}

const defaultOptions: IFeatureBezierOptions = {
  segments: 50,
  radius: 0.01,
  radialSegments: 5,
}

export default class FeatureBeziers extends Object3D implements IAudioReactive {
  material: ShaderMaterial;
  constructor(_fingerprint: IDerivedFingerPrint, public settings: ISettings, coords: IVisualiserCoordinate[], options?: Partial<IFeatureBezierOptions>) {
    super();

    const opts = Object.assign({}, defaultOptions, options ?? {}) as IFeatureBezierOptions;
    this.material = new ShaderMaterial({
      vertexShader: TubeShaderVert,
      fragmentShader: TubeShaderFrag,
    });

    const center = new Vector3();
    const { verticalIncidence } = settings.beziers;
    const points = coords.map(c => c.pos);
    const firstDir = verticalIncidence 
      ? new Vector3(0, 1, 0)
      : points[0].clone().sub(center).normalize().multiplyScalar(-1);
    const [firstPoint, ...remainingPoints] = points;

    const curves = this.traverseBeziers(remainingPoints, firstPoint, firstDir, true);

    const mainBezierCurves = this.curvesToBezier(curves, coords, opts.segments, opts.radius, opts.radialSegments);
    this.add(...mainBezierCurves);
  }

  /**
   * @description Creates a bezier path (Curve<Vector3>) from an array of arbitrary points and an initial point/direction
   * @param points - Points to create beziers between
   * @param cur - Current / starting point
   * @param dir - Current / starting direction
   * @param facingTowardsCenter - Flag that flip flops to create the weaving style
   * @param curves - Return value that gets recursively appended to
   * @param firstPoint - Starting point, used to connect final bezier back to beginning
   * @param firstDir - Starting direction, used to connect final bezier back to beginning
   */
  private traverseBeziers (points: Vector3[], cur: Vector3, dir: Vector3, facingTowardsCenter: boolean, curves: Curve<Vector3>[] = [], firstPoint?: Vector3, firstDir?: Vector3): Curve<Vector3>[] {
    const center = new Vector3();
    const { flareOut, flareIn, angleRandomness, verticalAngleRandomness, verticalIncidence } = this.settings.beziers;
    const isLast = points.length === 0;
    const targetDist = 2;
    const next = isLast 
      ? firstPoint as Vector3 
      : points.reduce((acc, el) => {
        return Math.abs(targetDist - cur.distanceTo(el)) < Math.abs(targetDist - cur.distanceTo(acc)) ? el : acc
      }, points[0])
    const remaining = points.filter(el => !el.equals(next));

    const nextDir = isLast
      ? (firstDir as Vector3).multiplyScalar(-1)
      : verticalIncidence
        ? (facingTowardsCenter ? new Vector3(0, 1, 0) : new Vector3(0, -1, 0))
          .applyAxisAngle(new Vector3(0, 0, 1), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
          .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2)
        : next.clone().sub(center).normalize()
          .applyAxisAngle(new Vector3(0, 1, 0), customRandom.deterministic(cur.x, cur.y) * angleRandomness - angleRandomness / 2)
          .applyAxisAngle(new Vector3(1, 0, 0), customRandom.deterministic(cur.x, cur.y) * verticalAngleRandomness - verticalAngleRandomness / 2);
    if (facingTowardsCenter && !isLast) nextDir.multiplyScalar(-1);
    const dist = cur.distanceTo(next);
    const handleDist = verticalIncidence
      ? flareOut * 2 + dist
      : facingTowardsCenter ? dist * flareIn : dist * flareOut;
    const anchor1 = cur.clone().add(dir.clone().multiplyScalar(handleDist))
    const anchor2 = next.clone().add(nextDir.clone().multiplyScalar(handleDist));
        
    curves.push(new CubicBezierCurve3(cur, anchor1, anchor2, next))

    if (isLast) {
      return curves;
    } else {
      return this.traverseBeziers(remaining, next, nextDir.multiplyScalar(-1), !facingTowardsCenter, curves, firstPoint ?? cur, firstDir ?? dir);
    }
  }

  /**
   * @description Converts the Curve objects from traverseBeziers into threejs meshs 
   * @param curves - Curve object
   * @param featurePoints - Points used to colourise the beziers
   * @param segments - Number of segmeents per section
   * @param radius - Radius of TubeGeometry
   * @param radialSegments - Number of radial segments 
   * @returns 
   */
  private curvesToBezier (curves: Curve<Vector3>[], featurePoints: IVisualiserCoordinate[], segments: number, radius: number, radialSegments: number) {
    const retVal: Mesh[] = [];
    const tempColor = new Color();
    curves.forEach((curve) => {
      const tubeGeometry = new TubeGeometry( curve, segments, radius, radialSegments, false );
      const startPoint = curve.getPoint(0);
      const curFeaturePoint = featurePoints.find(fp => fp.pos.equals(startPoint)) ?? featurePoints
        .reduce((acc, cur) => cur.pos.distanceTo(startPoint) < acc.pos.distanceTo(startPoint) ? cur : acc, featurePoints[0] );
      const endPoint = curve.getPoint(1);
      const nextFeaturePoint = featurePoints.find(fp => fp.pos.equals(endPoint)) ?? featurePoints
        .reduce((acc, cur) => cur.pos.distanceTo(startPoint) < acc.pos.distanceTo(endPoint) ? cur : acc, featurePoints[0] );
      if (!curFeaturePoint || !nextFeaturePoint) {
        throw new Error(`Could not find startPoint ${startPoint.toArray()} or endPoint ${endPoint.toArray()}`);
      }

      const posAttributeLength = tubeGeometry.getAttribute('position').array.length
      const nVerts = posAttributeLength / 3;
      const colorsData: Array<number> = [];
      for (let i = 0; i < nVerts; i++) {
        const thisProgress = i / nVerts;
        tempColor.copy(curFeaturePoint.color);
        tempColor.lerp(nextFeaturePoint.color, thisProgress)
        colorsData.push(...tempColor.toArray());
      }
      tubeGeometry.setAttribute('color', new BufferAttribute(new Float32Array(colorsData), 3));
      const curveObject = new Mesh( tubeGeometry, this.material );
      retVal.push(curveObject);
    })
    return retVal;
  }

  // @ts-expect-error; 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleAudio(frame: IAudioFrame) { }
}
