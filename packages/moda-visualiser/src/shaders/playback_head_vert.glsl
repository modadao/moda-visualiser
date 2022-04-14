uniform float buffer[${BUFFER_LENGTH}];
varying float vertPower;
void main() {
  vec3 newPos = position;
  float a = position.y;
  int bIndex = int(a * float(${BUFFER_LENGTH}));
  vertPower = buffer[bIndex];
  /* newPos.z += bVal; */
  /* newPos.y += bVal; */
  newPos.z -= vertPower;

  

  vec4 mPosition = modelViewMatrix * vec4( newPos, 1.0 );

  gl_Position = projectionMatrix * mPosition ;
}
