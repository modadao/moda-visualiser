#define pi 3.1415926538

uniform float u_opacity;
void main() {
  gl_FragColor = vec4(1., 1., 1., u_opacity);
}
