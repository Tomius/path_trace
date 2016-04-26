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

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

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

    gl.useProgram(this.program);
    this.positionAttributeIndex =
        gl.getAttribLocation(this.program, 'vPosition');

    this.viewDirMatrixLocation =
        gl.getUniformLocation(this.program, 'viewDirMatrix');
    this.eyeLocation = gl.getUniformLocation(this.program, 'eye');
    this.spacePressed = false;

    this.quadricsLocation = gl.getUniformLocation(this.program, 'quadrics');
    this.materialsLocation = gl.getUniformLocation(this.program, 'materials');
    this.framesSinceLastActionLocation = gl.getUniformLocation(this.program, 'framesSinceLastAction');
    gl.uniform1i(gl.getUniformLocation(this.program, 'quadrics'), 1);

    this.quadricData = new Float32Array(16*32);
    this.materialData = new Float32Array(16*4);

    var A = this.makeSphere();
    A.copyIntoArray(this.quadricData, 0*16);

    var B = this.makeSphere();
    scaler = new Matrix4();
    scaler.setIdentity();
    scaler.setDiagonal(new Vector4(0.5, 2.0, 0.9, 1));
    B.multiply(scaler);
    scaler.transpose();
    B = scaler.mult(B);
    B.copyIntoArray(this.quadricData, 1*16);

    var A = this.makeSphere();
    scaler = new Matrix4();
    scaler.setIdentity();
    scaler.setDiagonal(new Vector4(2, 2, 2, 1));
    A.multiply(scaler);
    scaler.transpose();
    A = scaler.mult(A);
    A.copyIntoArray(this.quadricData, 2*16);

    this.makeNoClip().copyIntoArray(this.quadricData, 3*16);

    this.materialData[0] = 1.15;
    this.materialData[1] = 1.15;
    this.materialData[2] = 0.05;
    this.materialData[3] = 0.0;

    this.materialData[4] = 0.75;
    this.materialData[5] = 1.0;
    this.materialData[6] = 1.0;
    this.materialData[7] = 0.0;
} // Quad constructor ends

Quad.prototype.makeSphere = function(){
    return new Matrix4( 1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.0, 0.0,-1.0);
}

Quad.prototype.makeNoClip = function(){
    return new Matrix4( 0.0, 0.0, 0.0, 0.0,
                        0.0, 0.0, 0.0, 0.0,
                        0.0, 0.0, 0.0, 0.0,
                        0.0, 0.0, 0.0, 0.0);
}

Quad.prototype.makePlane = function(){
    return new Matrix4( 0.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 0.0, 0.0,
                        0.0, 0.0, 0.0, -0.001);
}

Quad.prototype.keydown = function(keyCode) {
    if(keyboardMap[keyCode] == 'SPACE') this.spacePressed = !this.spacePressed;
}

Quad.prototype.draw = function(gl, camera, width, height, framesSinceLastAction)  {
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray( this.positionAttributeIndex);
    gl.vertexAttribPointer( this.positionAttributeIndex,
          2, gl.FLOAT,
          false, 0,
          0);

    viewDirMatrixData = new Float32Array(16);
    camera.viewDirMatrix.copyIntoArray(viewDirMatrixData, 0);
    gl.uniformMatrix4fv(this.viewDirMatrixLocation, false, viewDirMatrixData);

    gl.uniform3f(this.eyeLocation, camera.position.x, camera.position.y, camera.position.z);
    gl.uniformMatrix4fv(this.quadricsLocation, false, this.quadricData);
    gl.uniform4fv(this.materialsLocation, this.materialData);
    gl.uniform1i(this.framesSinceLastActionLocation, framesSinceLastAction);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, width, height, 0);
}

