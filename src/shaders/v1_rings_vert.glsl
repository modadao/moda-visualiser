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


  vColor = vec3(0.5, 0.5, 0.5);

  vec4 mPosition = modelMatrix * vec4( position, 1.0 );
  vec3 alteredPos = mPosition.xyz;

  float l = length(alteredPos);
  float n = (noise(alteredPos / l * 3.)) * clamp(l - 4., 0., 10.) / 10.;

  gl_Position = projectionMatrix * viewMatrix * vec4(alteredPos + vec3(0., n, 0.), 1.);

}