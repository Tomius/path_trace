var Camera = function(gl)
{
    this.framesSinceLastAction = -1;
    this.position = new Vector3(-1.2, 2.7, 2.2);
    this.yaw = -3.67;
    this.pitch = 0.85;
    this.fov = 0.5;
    this.aspect = 1.0;
    this.nearPlane = 0.1;
    this.farPlane = 1000.0;

    this.speed = 1;

    this.lastMousePosition = new Vector2(0.0, 0.0);
    this.mouseDelta = new Vector2(0.0, 0.0);

    this.wPressed = false;
    this.aPressed = false;
    this.sPressed = false;
    this.dPressed = false;
    this.qPressed = false;
    this.ePressed = false;

    this.projMatrix = makePerspectiveMatrix(this.fov, this.aspect, this.nearPlane, this.farPlane).transpose();
    this.update(0);
}

Camera.prototype.keydown = function(keyCode) {
    if(keyboardMap[keyCode] == 'W') this.wPressed = true;
    if(keyboardMap[keyCode] == 'A') this.aPressed = true;
    if(keyboardMap[keyCode] == 'S') this.sPressed = true;
    if(keyboardMap[keyCode] == 'D') this.dPressed = true;
    if(keyboardMap[keyCode] == 'E') this.ePressed = true;
    if(keyboardMap[keyCode] == 'Q') this.qPressed = true;
}

Camera.prototype.keyup = function(keyCode) {
    if(keyboardMap[keyCode] == 'W') this.wPressed = false;
    if(keyboardMap[keyCode] == 'A') this.aPressed = false;
    if(keyboardMap[keyCode] == 'S') this.sPressed = false;
    if(keyboardMap[keyCode] == 'D') this.dPressed = false;
    if(keyboardMap[keyCode] == 'E') this.ePressed = false;
    if(keyboardMap[keyCode] == 'Q') this.qPressed = false;
}


Camera.prototype.update = function(dt) {
    this.yaw += this.mouseDelta.x * 0.002;
    this.pitch += this.mouseDelta.y * 0.002;
    if(this.pitch > 3.14/2.0)
        this.pitch = 3.14/2.0;
    if(this.pitch < -3.14/2.0)
        this.pitch = -3.14/2.0;

  if (this.mouseDelta.x != 0.0 || this.mouseDelta.y != 0.0)
    this.framesSinceLastAction = -1;

	var up = new Vector3(0, 1, 0);
    this.mouseDelta = new Vector2(0.0, 0.0);
    this.ahead = new Vector3(
        Math.sin(this.yaw)*Math.cos(this.pitch),
        -Math.sin(this.pitch),
        Math.cos(this.yaw)*Math.cos(this.pitch));
    this.right = up.cross(this.ahead);
    this.right.normalize();

    if(this.wPressed) {
        this.position.add(this.ahead.scaled( this.speed * dt ));
        this.framesSinceLastAction = -1;
    }
    if(this.sPressed) {
        this.position.sub(this.ahead.scaled( this.speed * dt ));
        this.framesSinceLastAction = -1;
    }
    if(this.aPressed) {
        this.position.sub(this.right.scaled( this.speed * dt ));
        this.framesSinceLastAction = -1;
    }
    if(this.dPressed) {
        this.position.add(this.right.scaled( this.speed * dt ));
        this.framesSinceLastAction = -1;
    }
    if(this.qPressed) {
        this.position.sub(up.scaled( this.speed * dt ));
        this.framesSinceLastAction = -1;
    }
    if(this.ePressed) {
        this.position.add(up.scaled( this.speed * dt ));
        this.framesSinceLastAction = -1;
    }

    var lookAt = this.position.clone();
    lookAt.add(this.ahead);
    this.viewMatrix = makeViewMatrix(this.position,  lookAt,  new Vector3(0.0, 1.0, 0.0)).transpose();
    this.viewDirMatrix = makeViewMatrix(new Vector3(0.0, 0.0, 0.0),  this.ahead,  new Vector3(0.0, 1.0, 0.0)).transpose();
    this.viewDirMatrix.multiply(this.projMatrix);
    this.viewDirMatrix.invert();
    this.framesSinceLastAction += 1;
}


