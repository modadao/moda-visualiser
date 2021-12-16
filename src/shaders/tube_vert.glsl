attribute vec3 color;
varying vec4 vColor;
void main() {
  vec4 mPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mPosition ;

  vColor = vec4(color, 1.);
}