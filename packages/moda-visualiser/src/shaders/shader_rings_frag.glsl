#define PI 3.1415926538

//	Classic Perlin 2D Noise 
//	by Stefan Gustavson
//
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

uniform float u_power;
uniform float u_time;

varying vec2 vPos;

const float sine_scale = 20.;
const float edge_size = 0.1;
const float inner_radius = 4. - PI / 180.;
const float outer_radius = 9.;

const float bottom_edge = 0.985;
const float upper_edge = 0.99;

void main() {
  float noiseScale = cnoise(vPos * 0.5 + vec2(u_time, -u_time));
  float realD = length(vPos);
  vec2 pos = vec2(
    vPos.x + cnoise(vec2(vPos.x * 0.2 - u_time, u_time) * u_power * noiseScale * 0.05 * clamp(realD - inner_radius, 0., 1.)),
    vPos.y + cnoise(vec2(vPos.y * 0.2 + u_time, -u_time) * u_power * noiseScale * 0.05 * clamp(realD - inner_radius, 0., 1.))
  );

  float d = length(pos);
  // Generate the greater mask
  float m1 = smoothstep(inner_radius, inner_radius+edge_size, d);
  float m2 = 1. - smoothstep(outer_radius, outer_radius+edge_size, d);
  float m = min(m1, m2);

  float a = sin((d - inner_radius) * sine_scale);
  float a2 = smoothstep(bottom_edge, upper_edge, a) * m;
  gl_FragColor = vec4(0.5, 0.5, 0.5, a2);
}
