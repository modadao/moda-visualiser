#define pi 3.1415926538

varying float vertPower;
void main() {
  gl_FragColor = vec4(vertPower, 1.-vertPower, 1.-vertPower, 1.);
}
