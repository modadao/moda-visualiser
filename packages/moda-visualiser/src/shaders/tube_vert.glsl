uniform float springTextureHeight;
uniform sampler2D springTexture;
attribute float springTextureIndex;
attribute float progress;
attribute vec3 color;
varying vec4 vColor;
void main() {
  vec3 newPos = position;
  vec4 c = texture2D(springTexture, vec2(progress, springTextureIndex / springTextureHeight));
  newPos.xyz += (vec3(-0.5, -0.5, -0.5) + c.xyz) * 2.;
  vec4 mPosition = modelViewMatrix * vec4( newPos, 1.0 );
  gl_Position = projectionMatrix * mPosition;

  vColor = vec4(color, 1.);
}
