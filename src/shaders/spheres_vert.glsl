#define PI 3.1415926538

uniform sampler2D u_colorscheme;
uniform float u_floatHash;

uniform float u_distMult;
uniform float u_distAdd;
uniform float u_logMult;
uniform float u_logAdd;

uniform float u_noiseLambda;
uniform float u_noiseAlpha;

attribute float index;
attribute float theta;
attribute float gradient;

varying vec3 vColor;

void main() {

  float colorSampleP = u_floatHash;
  vColor = texture2D(u_colorscheme, vec2(colorSampleP, 0.5)).rgb;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_Position = projectionMatrix * mvPosition;

}