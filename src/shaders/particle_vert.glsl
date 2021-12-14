#define PI 3.1415926538
uniform float u_time;
attribute vec3 offset;
attribute float scale;

#pragma glslify: snoise = require('glsl-noise/simplex/2d')

void main() {
  
  float t = u_time * 0.02;
  vec3 noiseOffset = vec3(
    snoise(vec2(offset.x, t)),
    0., 
    snoise(vec2(offset.z, t))
  );
  vec3 p = position * scale;
  vec4 mPosition = modelMatrix * vec4( p, 1.0 ) + vec4(offset, 0.) + vec4(noiseOffset, 0.);
  gl_Position = projectionMatrix * viewMatrix * mPosition;
}