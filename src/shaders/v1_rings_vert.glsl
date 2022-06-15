#define PI 3.1415926538

uniform sampler2D u_bufferTex;

attribute float index;
attribute float normalizedTheta;
attribute float amplitude;

varying vec3 vColor;

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
}

void main() {

  vColor = vec3(0.6, 0.6, 0.6);
  vec4 mPosition = modelMatrix * vec4( position, 1.0 );
  vec3 alteredPos = mPosition.xyz;
  float a = length(texture2D(u_bufferTex, vec2(normalizedTheta, 0.5)));
  alteredPos.y += (-1. + a) * 8.;

  /* float l = length(alteredPos); */
  /* float n = (amplitude) * clamp(distance(l, 4.), 0., 2.) / 2.; */
  /* float lumin = 0.5 + (n * 0.3); */
  /* alteredPos += vec3(0., n + (-1. + a) * 8., 0.); */

  gl_Position = projectionMatrix * viewMatrix * vec4(alteredPos, 1.);
  /* gl_Position = projectionMatrix * viewMatrix * vec4(alteredPos, 1.); */
}
