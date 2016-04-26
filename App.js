var app;
var output;

var App = function(canvas, output)
{
	this.canvas = canvas;

  var opts = { alpha: false, depth: false, stencil: false, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true };
	this.gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
	if (this.gl == null) {
		output.textContent = ">>> No WebGL support <<<";
		return;
	}

	this.canvas.width = 1024;
	this.canvas.height = 1024;

	this.quad = new Quad(this.gl, this.canvas.width, this.canvas.height);

	this.camera = new Camera();
	this.ownMouse = false;
}

lastTime = new Date();

App.prototype.update = function()
{
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
}

App.prototype.clicked = function(event) {
	this.canvas.requestPointerLock();
}

App.prototype.pointerLockChange = function(event) {
	this.ownMouse = (this.canvas == document.pointerLockElement);
}

App.prototype.keyDown = function(event) {
	this.quad.keydown(event.keyCode);
  if (this.ownMouse)
    this.camera.keydown(event.keyCode);
}

App.prototype.keyUp = function(event) {
	if (this.ownMouse)
    this.camera.keyup(event.keyCode);
}

App.prototype.mouseMove = function(event) {
	if (!this.ownMouse)
		return;
	this.camera.mouseDelta.add( new Vector2(event.movementX, event.movementY));
	event.preventDefault();
}

function start()
{
	var canvas = document.getElementById("container");
	output = document.getElementById("output");
	app = new App(canvas, output);

	document.addEventListener('pointerlockchange', function(event){  app.pointerLockChange(event); }, false);
	canvas.onclick = function(event) { app.clicked(event); } ;
	document.onkeydown = function(event){  app.keyDown(event); };
	document.onkeyup = function(event){  app.keyUp(event); };
	document.onmousemove = function(event){  app.mouseMove(event); };

	window.requestAnimationFrame(function (){ app.update();});
}
