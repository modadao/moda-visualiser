#define PI 3.1415926538

uniform float u_innerRadius;
uniform float u_thickness;
uniform float u_progress;

void main() {
  vec3 newPos = position;

  float theta = position.z * u_progress;

  newPos.x = sin(theta) * (u_innerRadius + position.x * u_thickness);
  newPos.z = cos(theta) * (u_innerRadius + position.x * u_thickness);

  vec4 mPosition = modelViewMatrix * vec4( newPos, 1.0 );
  gl_Position = projectionMatrix * mPosition ;
}
