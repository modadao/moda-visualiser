#version 300 es
precision mediump sampler2DArray;
#define attribute in
#define varying out
#define texture2D texture
precision highp float;
precision highp int;
#define HIGH_PRECISION
#define SHADER_NAME ShaderMaterial
#define VERTEX_TEXTURES
#define GAMMA_FACTOR 2
#define MAX_BONES 0
#define BONE_TEXTURE
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;

attribute mat4 instanceMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
#ifdef USE_TANGENT
	attribute vec4 tangent;
#endif
#if defined( USE_COLOR_ALPHA )
	attribute vec4 color;
#elif defined( USE_COLOR )
	attribute vec3 color;
#endif
#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )
	attribute vec3 morphTarget0;
	attribute vec3 morphTarget1;
	attribute vec3 morphTarget2;
	attribute vec3 morphTarget3;
	#ifdef USE_MORPHNORMALS
		attribute vec3 morphNormal0;
		attribute vec3 morphNormal1;
		attribute vec3 morphNormal2;
		attribute vec3 morphNormal3;
	#else
		attribute vec3 morphTarget4;
		attribute vec3 morphTarget5;
		attribute vec3 morphTarget6;
		attribute vec3 morphTarget7;
	#endif
#endif
#ifdef USE_SKINNING
	attribute vec4 skinIndex;
	attribute vec4 skinWeight;
#endif

#define GLSLIFY 1

void main(){
  mat4 mvMatrix = modelViewMatrix * instanceMatrix;
  mvMatrix[0][0] = length(vec3(instanceMatrix[0]));
  mvMatrix[0][1] = 0.;
  mvMatrix[0][2] = 0.;

  mvMatrix[1][0] = 0.;
  mvMatrix[1][1] = length(vec3(instanceMatrix[1]));
  mvMatrix[1][2] = 0.;

  mvMatrix[2][0] = 0.;
  mvMatrix[2][1] = 0.;
  mvMatrix[2][2] = 1.;

  gl_Position = projectionMatrix * mvMatrix * vec4(position, 1.);

}