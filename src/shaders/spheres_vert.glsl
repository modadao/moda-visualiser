#define PI 3.1415926538

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
  vec4 mPosition = modelMatrix * instMat * vec4( position, 1.0 );

  gl_Position = projectionMatrix * viewMatrix * mPosition ;
  vPosition = gl_Position.xyz;

}