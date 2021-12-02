#define PI 3.1415926538

uniform sampler2D u_colorscheme;
uniform float u_floatHash;

uniform float u_noiseLambda;
uniform float u_noiseAlpha;

attribute float index;
attribute float theta;

varying vec3 vColor;

#pragma glslify: noise = require('glsl-noise/simplex/3d')

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

void main() {


  float t = atan2(position.y, position.x);
  float rotNoise = abs(noise(vec3(sin(t) / u_noiseLambda, cos(t) / u_noiseLambda, u_floatHash * 100.)));
  float r = 0.1 + floor(theta / PI * 2.) * 1.8 + rotNoise * u_noiseAlpha;
  vec3 newPosition = vec3(sin(t), 0, cos(t)) * r;

  float colorSampleP = sin(u_floatHash + sin(t) * 0.3);
  vColor = texture2D(u_colorscheme, vec2(colorSampleP, 0.5)).rgb;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_Position = projectionMatrix * mvPosition;

}