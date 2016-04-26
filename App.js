var app;
var output;

var App = function(canvas, output)
{
  try {
  	this.canvas = canvas;
    this.canvas.width = 1024;
    this.canvas.height = 1024;

    //var opts = { alpha: false, depth: false, stencil: false, antialias: false, failIfMajorPerformanceCaveat: true };
    this.gl = WebGLUtils.setupWebGL(canvas);

  	this.quad = new Quad(this.gl, this.canvas.width, this.canvas.height);
  	this.camera = new Camera();
  	this.ownMouse = false;
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

lastTime = new Date();

App.prototype.update = function()
{
  if (!this.gl) {
    return;
  }
  try {
  	var time = new Date();
  	var dt = (time - lastTime) / 1000.0;
  	lastTime = time;
  	this.camera.update(dt);

  	this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

  	this.gl.clearColor(0.6, 0.0, 0.3, 1.0);
  	this.gl.clearDepth(1.0);
  	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.quad.draw(this.gl, this.camera, this.canvas.width, this.canvas.height, this.camera.framesSinceLastAction);

  	window.requestAnimationFrame(function (){ app.update();});
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

App.prototype.clicked = function(event) {
  try {
    if (this.canvas.requestPointerLock) {
      this.canvas.requestPointerLock();
    } else if (this.canvas.mozRequestPointerLock) {
  	  this.canvas.mozRequestPointerLock();
    }
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

App.prototype.pointerLockChange = function(event) {
  try {
	  this.ownMouse = (this.canvas == document.pointerLockElement) || (this.canvas == document.mozPointerLockElement);
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

App.prototype.keyDown = function(event) {
  try {
  	this.quad.keydown(event.keyCode);
    if (this.ownMouse)
      this.camera.keydown(event.keyCode);
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

App.prototype.keyUp = function(event) {
  try {
  	if (this.ownMouse)
      this.camera.keyup(event.keyCode);
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

App.prototype.mouseMove = function(event) {
  try {
  	if (!this.ownMouse)
  		return;
  	this.camera.mouseDelta.add( new Vector2(event.movementX, event.movementY));
  	event.preventDefault();
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

function start()
{
  try {
  	var canvas = document.getElementById("container");
  	output = document.getElementById("output");
  	app = new App(canvas, output);

    document.addEventListener('pointerlockchange', function(event){  app.pointerLockChange(event); }, false);
  	document.addEventListener('mozpointerlockchange', function(event){  app.pointerLockChange(event); }, false);
  	canvas.onclick = function(event) { app.clicked(event); } ;
  	document.onkeydown = function(event){  app.keyDown(event); };
  	document.onkeyup = function(event){  app.keyUp(event); };
  	document.onmousemove = function(event){  app.mouseMove(event); };

  	window.requestAnimationFrame(function (){ app.update();});
  } catch(err) {
    document.getElementById("output").innerHTML = err.message;
  }
}
