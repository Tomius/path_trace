var fsTraceSrc =
`
  precision highp float;
  varying vec3 viewDirToNormalize;
  varying vec2 texCoord;
  uniform vec3 eye;
  uniform mat4 quadrics[32];
  uniform vec4 materials[16];
  uniform int framesSinceLastAction;
  uniform sampler2D tex;

  void main() {
    gl_FragColor = vec4(vec3(0.0), 1.0);
  }

`
;

