uniform float u_rotationDensity;
uniform float u_noiseSpread;
uniform float u_noiseDensity;
uniform float u_noiseScale;
uniform float u_noiseRamp;
uniform float u_springTextureHeight;
uniform float u_triggerCount;
uniform float u_time;
uniform sampler2D u_springTexture;
attribute float springTextureIndex;
attribute float progress;
attribute vec3 color;
varying vec4 vColor;

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

float cubicOut(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}

void main() {
  vec3 newPos = position;
  float springY = (springTextureIndex / u_springTextureHeight);
  float noiseYModifier = cubicOut(springY);
  float noiseY = (springY * noiseYModifier) * 2. - 1.;
  vec4 c = texture2D(u_springTexture, vec2(progress + u_time, springY));
  vec3 offset = c.xyz;
  /* float noiseY = rotation * offset.y + offset.y * offset.y; */
  /* float xnoise = (cnoise(vec2(rotation + noiseY + position.x * u_noiseDensity + offset.y * u_noiseRamp * springY, noiseY + position.x * u_noiseDensity)) ) * u_noiseScale * offset.y * offset.y; */
  /* float ynoise = (cnoise(vec2(-rotation + noiseY - position.y * u_noiseDensity + offset.y * u_noiseRamp * springY, noiseY + position.y * u_noiseDensity)) ) * u_noiseScale * offset.y * offset.y; */
  /* float znoise = (cnoise(vec2(rotation - noiseY + position.z * u_noiseDensity + offset.y * u_noiseRamp * springY, noiseY + position.z * u_noiseDensity)) ) * u_noiseScale * offset.y * offset.y; */

  float rotation = noise(vec3(sin(progress * PI) + u_time, u_triggerCount, noiseY)) * u_rotationDensity;
  vec3 noiseCoords = position.xyz * u_noiseDensity + vec3(1., 2., 3.);
  float xnoise = (noise(vec3(noiseCoords.x - noiseY + rotation, noiseCoords.y + noiseY, noiseCoords.z + offset.y * u_noiseRamp)) - 0.5) * noiseY * u_noiseScale * offset.y;
  float ynoise = (noise(vec3(noiseCoords.y - noiseY + rotation, noiseCoords.z + noiseY, noiseCoords.x + offset.y * u_noiseRamp)) - 0.5) * noiseY * u_noiseScale * offset.y;
  float znoise = (noise(vec3(noiseCoords.z - noiseY + rotation, noiseCoords.x + noiseY, noiseCoords.y + offset.y * u_noiseRamp)) - 0.5) * noiseY * u_noiseScale * offset.y;

  newPos.xyz += vec3(xnoise, ynoise, znoise);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.);

  vColor = vec4(color, 1.);
}
