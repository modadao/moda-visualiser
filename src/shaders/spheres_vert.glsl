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
varying vec3 vColor2;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {

  float colorSampleP = u_floatHash;
  vColor = texture2D(u_colorscheme, vec2(colorSampleP, 0.5)).rgb;
  // vColor2 = texture2D(u_colorscheme, vec2(colorSampleP + 0.1, 0.5)).rgb;
  vColor2 = vColor;
  vNormal = normal;
  vec4 mPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_Position = projectionMatrix * mPosition ;
  vPosition = gl_Position.xyz;

}