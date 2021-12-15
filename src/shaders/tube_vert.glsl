
uniform sampler2D u_colorscheme;
attribute float color;
varying vec4 vColor;
void main() {
  vec4 mPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mPosition ;

  vColor = texture2D(u_colorscheme, vec2(color, 0.5));
}