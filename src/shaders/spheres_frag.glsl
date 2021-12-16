uniform float u_innerColorMultiplier;
uniform float u_outerColorMultiplier;
uniform vec3 u_cameraDirection;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vColor2;

void main() {
  vec3 dir = normalize(cameraPosition - u_cameraDirection);
  float L = max(0., dot(vNormal, dir));
  vec3 c = mix(vColor * u_outerColorMultiplier, vColor2 * u_innerColorMultiplier, L);
  gl_FragColor = vec4(c, 1.);
}