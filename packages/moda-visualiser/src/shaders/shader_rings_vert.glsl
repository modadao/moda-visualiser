uniform float u_dimension;

varying vec2 vUv;
varying vec2 vPos;

void main() {
  vec3 p = position;
  vec4 mPosition = modelMatrix * vec4( p, 1.0 );
  gl_Position = projectionMatrix * viewMatrix * mPosition;
  vUv = uv;
  vPos = (uv - 0.5) * u_dimension;
}
