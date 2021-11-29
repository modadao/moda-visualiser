#define PI 3.1415926538

uniform sampler2D u_colorscheme;
uniform float u_floatHash;

attribute float index;
attribute float theta;
attribute float gradient;

varying vec3 vColor;

void main() {

  float t = theta * 16.;
  float r = floor(theta / PI * 2.) * 1.5 + 0.8 + position.y * 3.;
  vec3 newPosition = vec3(sin(t), position.y * 2.5, cos(t)) * r;

  vec3 color1 = vec3(0.997,0.989,0.901);
  vec3 color2 = vec3(0.338,0.649,0.414);

  vColor = texture2D(u_colorscheme, vec2(u_floatHash + 0.5 + gradient, 0.5)).rgb;
  // vColor = mix(color1, color2, (-0.5 + gradient) * 2.);

  vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );

  gl_PointSize = pow(distance(gradient, 0.5) + 0.2, 1.2) * 50.;

  gl_Position = projectionMatrix * mvPosition;

}