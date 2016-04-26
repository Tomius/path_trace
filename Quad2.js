var Quad = function(gl, width, height)
{
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array( [
               -1.0, -1.0,
               -1.0, +1.0,
               +1.0, -1.0,
               +1.0, +1.0 ] ),
                gl.STATIC_DRAW);

    this.vertexBuffer.itemSize = 2;
    this.vertexBuffer.numItems = 4;
    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vertexShader, vsQuadSrc);
    gl.compileShader(this.vertexShader);
    output.textContent += gl.getShaderInfoLog(this.vertexShader);

    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fragmentShader, fsTraceSrc);
    gl.compileShader(this.fragmentShader);
    output.textContent +=
            gl.getShaderInfoLog(this.fragmentShader);

    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    gl.linkProgram(this.program);
    output.textContent += gl.getProgramInfoLog(this.program);
} // Quad constructor ends



Quad.prototype.draw = function(gl, camera, width, height, framesSinceLastAction)  {
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray( this.positionAttributeIndex);
    gl.vertexAttribPointer( this.positionAttributeIndex,
          2, gl.FLOAT,
          false, 0,
          0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

