#define PI 3.1415926538

varying vec2 vUv;
void main() {
  vec4 mPosition = modelMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * viewMatrix * mPosition;
  /* gl_Position = projectionMatrix * viewMatrix * vec4(alteredPos, 1.); */
  vUv = uv;
}
