#define PI 3.1415926538

#define PI 3.1415926538

float hash(vec3 p)  // replace this by something better
{
    p  = fract( p*0.3183099+.1 );
	  p *= 17.0;
    return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

float noise( in vec3 x )
{
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
	
    return mix(mix(mix( hash(i+vec3(0,0,0)), 
                        hash(i+vec3(1,0,0)),f.x),
                   mix( hash(i+vec3(0,1,0)), 
                        hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix( hash(i+vec3(0,0,1)), 
                        hash(i+vec3(1,0,1)),f.x),
                   mix( hash(i+vec3(0,1,1)), 
                        hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}

uniform float u_power;
uniform float u_time;
uniform float u_noiseAmp;
uniform float u_noiseScale;
uniform float u_brightness;
uniform float u_chromaticOffset;
uniform float u_lineWidthMax;

varying vec2 vPos;

const float sine_scale = 20.;
const float edge_size = 0.1;
const float inner_radius = 4. - PI / 180.;
const float outer_radius = 9.;

const float bottom_edge = 0.985;
const float upper_edge = 0.99;

void main() {
  float noiseScale = noise(vec3(vPos.xy * 0.3, u_time * 0.2)) * 2.;
  noiseScale *= noise(vec3(vPos.yx * 0.3, -u_time * 0.2)) * 2.;
  noiseScale = clamp(1. - noiseScale, 0., 1.) * u_power * 2.;
  float realD = length(vPos);
  float distScale = clamp(realD - inner_radius, 0., 1.);

  vec2 noise = vec2(
    (noise(vec3(vPos.x * u_noiseScale, vPos.y * u_noiseScale, -u_time + u_power * 2.)) - 0.5) * u_power * distScale * u_noiseAmp,
    (noise(vec3(vPos.y * u_noiseScale, vPos.x * u_noiseScale, u_time + u_power * 2.)) - 0.5) * u_power * distScale * u_noiseAmp
  );

  vec3 c = vec3(0.5);
  for(int i = 0; i < 3; i++){ // calc rgb offset;
    vec2 pos = vPos + noise * length(noise) + noise * float(i) * length(noise) * u_chromaticOffset;
    float d = length(pos);
    // Generate the greater mask
    float m1 = smoothstep(inner_radius, inner_radius+edge_size, d);
    float m2 = 1. - smoothstep(outer_radius, outer_radius+edge_size, d);
    float m = min(m1, m2);
    float a = smoothstep(bottom_edge - length(noise) * u_lineWidthMax, upper_edge, sin((d - inner_radius) * sine_scale)) * m;
    c[i] = a * 0.5 + a * length(noise) * u_brightness;
  }


  float a2 = length(c) * 2.;
  /* float a2 = smoothstep(bottom_edge - noiseScale , upper_edge, a) * m; */
  gl_FragColor = vec4(c.rgb, a2);
}
