
declare module 'three-instanced-uniforms-mesh' {
  import type { Color, InstancedMesh, Matrix3, Matrix4, Quaternion, Vector2, Vector3, Vector4 } from "three"
  import * as tium from 'three-instanced-uniforms-mesh';
  
  export class InstancedUniformsMesh extends InstancedMesh {
    /**
     * Set the value of a shader uniform for a single instance.
     * @param name - the name of the shader uniform
     * @param index - the index of the instance to set the value for
     * @param value - the uniform value for this instance
     */
    setUniformAt (name: string, index: number, value: number|Vector2|Vector3|Vector4|Color|Array<number>|Matrix3|Matrix4|Quaternion): void;
  }
  export default tium;
}
