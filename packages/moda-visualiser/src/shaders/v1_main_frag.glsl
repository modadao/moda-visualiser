varying vec3 vColor;
varying float vScale;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5, 0.5));
  float ringAlpha = max(1. - distance(d, 0.4) * vScale / 100., 0.);
  float bubbleAlpha = smoothstep(0.475, 0.45, d);

  if (d > 0.5) {
    discard;
  }

  gl_FragColor = vec4(1., 1., 1., ringAlpha);
}