var vsQuadSrc =
`
	uniform mat4 viewDirMatrix;
	attribute vec2 vPosition;

	varying vec3 viewDirToNormalize;
	varying vec2 texCoord;


	void main(void) {
		vec4 position = vec4(vPosition, 0.99, 1);
		gl_Position = position;
		vec4 hViewDir =  position * viewDirMatrix;
		viewDirToNormalize = hViewDir.xyz / hViewDir.w;
		texCoord = (vPosition + vec2(1.0)) * vec2(0.5, -0.5);
	}
`
;
