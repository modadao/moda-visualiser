#define PI 3.1415926538

uniform sampler2D u_springTexture;
uniform float u_springIndex;
uniform float u_springHeight;
uniform float u_pointIndex;
uniform float u_pointLength;

varying vec3 vColor;
varying vec3 vColor2;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vBrightness;

void main() {

  vColor = instanceColor;
  // vColor2 = texture2D(u_colorscheme, vec2(colorSampleP + 0.1, 0.5)).rgb;
  vColor2 = vColor;
  vNormal = normal;
  mat4 instMat = instanceMatrix;
  vBrightness = instMat[3][3];
  instMat[3][3] = 1.;
  vec3 newPos = position;
  vec4 c = texture2D(u_springTexture, vec2(u_pointIndex / ( u_pointLength - 0.5 ), vec2(u_springIndex / ( u_springHeight - 0.5 ))));
  vec4 mPosition = modelMatrix * instMat * vec4( newPos, 1.0 );
  mPosition.y += (c.r - 0.5);

  gl_Position = projectionMatrix * viewMatrix * mPosition ;
  vPosition = gl_Position.xyz;

}
