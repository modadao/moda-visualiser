#define PI 3.1415926538

uniform sampler2D tex0;
varying vec2 vUv;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}


void main() {
  vec4 color = texture2D(tex0, vUv);
  vec2 center = vec2(0.5, 0.5);
  vec3 center3 = vec3(0.5, 0.0, 0.5);
  vec2 diff = vUv - center;
  float dist = distance(vUv, center);

  vec3 camDir = cameraPosition;
  camDir.y = 0.;
  camDir = normalize(camDir);
  camDir *= -1.;

  vec3 shimmerDir = cross(camDir, vec3(0., 1., 0.));

  vec3 fragPos = vec3(vUv.x, 0., vUv.y);
  vec3 fragDir = normalize(fragPos - center3);
  float f1 = dot(fragDir, shimmerDir);
  float f2 = dot(-fragDir, shimmerDir);
  float f = max(f1, f2);

  // float otherCamAngle = acos(dot(normalize(cameraPosition.xz), vec2(0., 1.)));
  // vec2 rotatedDiff = rotate(diff, otherCamAngle);
  // float fragAngle = acos(dot(normalize(rotatedDiff), vec2(0., 1.))) / (PI * 2.);


  // vec3 perp = cross(normalize(cameraPosition), vec3(0., 1., 0.));
  // float camAngle = acos(dot(normalize(perp.xz), vec2(0., 1.)));

  // float multiplier = 1. - abs(0.5 - fragAngle);

  // float c = 1. - distance(fragDir, camDir);
  // float s = 1. - distance(fragDir, shimmerDir);
  // gl_FragColor = vec4(s, c, f,1.);
  // float innerRingGradient = smoothstep(0.15, 0.09, dist);
  // float holeMask = 1. - step(0.6, innerRingGradient);
  // float outerRingGradient = smoothstep(0.36, 0.41, dist);
  // float outerMask = 1. - step(0.6, outerRingGradient);
  // float diskMask = max(
  //   min(holeMask, innerRingGradient),
  //   min(outerMask, outerRingGradient)
  // );


  // gl_FragColor = color * smoothstep(0.5, 1.0, f) * 0.8 + diskMask;
  gl_FragColor = color * smoothstep(0.5, 1.0, f) * 0.8;
}