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


vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 rgb) {
 	float Cmax = max(rgb.r, max(rgb.g, rgb.b));
 	float Cmin = min(rgb.r, min(rgb.g, rgb.b));
 	float delta = Cmax - Cmin;

 	vec3 hsv = vec3(0., 0., Cmax);

 	if (Cmax > Cmin) {
 		hsv.y = delta / Cmax;

 		if (rgb.r == Cmax)
 			hsv.x = (rgb.g - rgb.b) / delta;
 		else {
 			if (rgb.g == Cmax)
 				hsv.x = 2. + (rgb.b - rgb.r) / delta;
 			else
 				hsv.x = 4. + (rgb.r - rgb.g) / delta;
 		}
 		hsv.x = fract(hsv.x / 6.);
 	}
 	return hsv;
}

void main() {

  vNormal = normal;
  mat4 instMat = instanceMatrix;
  vBrightness = instMat[3][3];
  instMat[3][3] = 1.;

  float theta = fract((u_pointIndex) / ( u_pointLength - 0.5 ));
  vec4 c = texture2D(u_springTexture, vec2(theta, 0.5));

  vec3 newPos = position;
  vec4 mPosition = modelMatrix * instMat * vec4( newPos, 1.0 );
  mPosition.y += (c.g * 0.2);

  gl_Position = projectionMatrix * viewMatrix * mPosition ;
  vPosition = gl_Position.xyz;

  vec3 hsl = rgb2hsv(instanceColor);
  hsl.r += c.g * 0.02;
  vColor = hsv2rgb(hsl);

  /* vColor = instanceColor */
  vColor2 = vColor;
}
