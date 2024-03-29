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
attribute float scale;

varying vec3 vColor;
varying float vScale;

#pragma glslify: noise = require('glsl-noise/simplex/3d')

void main() {


  float t = theta * 16.;
  float rotNoise = abs(noise(vec3(sin(t) / u_noiseLambda, cos(t) / u_noiseLambda, u_floatHash * 100.)));
  float r = 0.4 + floor(theta / PI * 2.) * 1.8 + position.y * 3. + rotNoise * u_noiseAlpha;
  vec3 newPosition = vec3(sin(t), 0, cos(t)) * r;

  float colorSampleP = sin(u_floatHash * 2. + gradient * 0.3 + sin(t));
  vColor = texture2D(u_colorscheme, vec2(colorSampleP, 0.5)).rgb;
  // vColor = mix(color1, color2, (-0.5 + gradient) * 2.);

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = (scale) * 400.;
  vScale = gl_PointSize;
  gl_Position = projectionMatrix * mvPosition;

}