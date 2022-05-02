uniform float u_power;
uniform float u_time;
uniform vec3 u_backgroundColor;
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(u_backgroundColor, 1.);
  float mask = 1. - length( vUv - vec2(0.5, 0.5)) * 2.;

  vec3 c = vec3(0.);
  float l, t = u_time;
  for(int i = 0; i < 3; i++){ // calc rgb offset;
        vec2 uv, p = vUv;
        uv = p;
        p += vec2(-0.5, -0.5);
        l = length(p); // distance from 0 coord
        t += u_power * 0.1;

        /* uv += (sin(l * 4.8 - t)) * cos(l * 6.37659 - t);  */
        /* uv+= p*(sin(l*2. - t )+0.2)*(cos(l*2.37659 - t))/l; */
        /* c[i] = length(uv + float(i) / 3. * u_power) * u_power; */
        uv+= (sin(l*5. - t )+0.2)*(cos(l*5.)) + p+sin(u_time/2.);
        c[i] = .1/length(abs(mod(uv,1.)-.5))*u_power;
        /* c[i] = .05/length(abs(mod(uv,1.)-.5))*(0.01 + u_power/20.); */
    }
  gl_FragColor.rgb = mix(u_backgroundColor, c, mask);
}

