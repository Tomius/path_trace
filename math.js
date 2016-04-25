makeViewMatrix = function(eye, ahead, up)
{
  var zaxis = ahead;
  zaxis.normalize();
  var xaxis = up.cross(zaxis);
  xaxis.normalize();
  var yaxis = zaxis.cross(xaxis);

	var m = new Matrix4(
		xaxis.x,  yaxis.x,  zaxis.x,  eye.x,
		xaxis.y,  yaxis.y,  zaxis.y,  eye.y,
		xaxis.z,  yaxis.z,  zaxis.z,  eye.z,
		0,        0,        0,        1);
	return m;
};

makePerspectiveMatrix = function(fovy, aspect, zn, zf)
{
	var yScale = 1.0 / Math.tan(fovy * 0.5);
	var xScale = yScale / aspect;
	return new Matrix4(
		xScale ,      0.0    ,   0.0             ,   0.0,
		0.0      ,    yScale ,   0.0             ,   0.0,
		0.0      ,    0.0    ,   zf/(zf-zn)      ,   1,
		0.0      ,    0.0    ,   -zn*zf/(zf-zn)  ,   0);
};
