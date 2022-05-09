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

varying vec2 vPos;

const float sine_scale = 20.;
const float edge_size = 0.1;
const float inner_radius = 4. - PI / 180.;
const float outer_radius = 9.;

const float bottom_edge = 0.985;
const float upper_edge = 0.99;

void main() {
  /* float noiseScale = noise(vec3(vPos.xy * 0.5, u_time)) * 2.; */
  float noiseScale = 0.5;
  float realD = length(vPos);
  vec2 pos = vec2(
    vPos.x + noise(vec3(vPos.x * 0.2, vPos.x * 0.2, -u_time) * u_power * noiseScale * clamp(realD - inner_radius, 1., 0.)),
    vPos.y + noise(vec3(vPos.y * 0.2, vPos.y * 0.2, u_time) * u_power * noiseScale * clamp(realD - inner_radius, 1., 0.))
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
