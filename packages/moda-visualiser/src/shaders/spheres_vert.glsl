#define PI 3.1415926538

uniform float u_time;
uniform sampler2D u_springTexture;
uniform float u_pointIndex;
uniform float u_pointLength;

varying vec3 vColor;
varying vec3 vColor2;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vBrightness;

void main() {

  vNormal = normal;
  mat4 instMat = instanceMatrix;
  vBrightness = instMat[3][3];
  instMat[3][3] = 1.;

  float theta = fract(u_pointIndex / ( u_pointLength - 0.5 ) + u_time * 0.01 );
  vec4 c = texture2D(u_springTexture, vec2(theta, 0.5));

  vec3 newPos = position;
  vec4 mPosition = modelMatrix * instMat * vec4( newPos, 1.0 );
  mPosition.y += (c.g * 0.2);

  gl_Position = projectionMatrix * viewMatrix * mPosition ;
  vPosition = gl_Position.xyz;

  vColor = instanceColor;
  vColor2 = vColor;

  if (c.a > 0.5) {
    vColor2 = vec3(1.);
  }
}
