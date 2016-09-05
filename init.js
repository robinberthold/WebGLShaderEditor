var orthoMatrix, perspMatrix, projectionMatrix,
	viewMatrix, modelMatrix, modelViewMatrix, normalMatrix,

	canvas,
	vsEditor, fsEditor,
	vsInput, fsInput,
	vsFeedback, fsFeedback, linkFeedback,

	gl,
	vertexShader, fragmentShader, shaderProgram,

	shaderProjectionMatrixUniform, shaderModelViewMatrixUniform, shaderNormalMatrixUniform,
	shaderVertexColorAttribute, shaderVertexPositionAttribute, shaderVertexNormalAttribute,
	shaderVertexTextureCoordinateAttribute,

	model,
	texture,
	drawing = false,
	
	dragging = false,
	autoRotate = false,
	xRotation = 0, yRotation = 0, autoYRotation = 0,
	cameraDistance = 5.2,
	
	sampleFactor = 1,

	uniformsViewModel;

/**
 * Initializes pretty much everything.
 */
function init() {
	canvas = document.getElementById("renderCanvas");
	vsInput = document.getElementById("vsInput");
	fsInput = document.getElementById("fsInput");
	vsFeedback = document.getElementById("vsFeedback");
	fsFeedback = document.getElementById("fsFeedback");
	linkFeedback = document.getElementById("linkFeedback");

	// prevent touch and wheel scrolling
	document.body.addEventListener('touchmove', function(event) { event.preventDefault(); }, false); 
	window.onwheel = function(){ return false; }

	initCanvas();
	initEditors();
	initMatrices();
	initWebGL();
	loadModels();

	window.addEventListener("resize", resizeCanvas);

	uniformsViewModel = new UniformsViewModel();
	ko.applyBindings(uniformsViewModel);

	compileVS();
	compileFS();
	
    draw();

    document.getElementById('fileOpenDialog').addEventListener('change', loadState, false);
}


/**
 * Initializes vs and fs ace editors.
 */
function initEditors() {
	vsEditor = ace.edit("vsInput");
	initEditor(vsEditor);
	vsEditor.getSession().on('change', compileVS);
	vsInput.style.fontSize = '15px';
	setEditorTextFromFile("./vertexShader", vsEditor);

	fsEditor = ace.edit("fsInput");
	initEditor(fsEditor);
	fsEditor.getSession().on('change', compileFS);
	fsInput.style.fontSize = '15px';
	setEditorTextFromFile("./fragmentShader", fsEditor);
}


/**
 * Initializes specified ace editor.
 *
 * @param      {Object}  editor  The ace editor to be initialized
 */
function initEditor(editor) {
	editor.setTheme("ace/theme/monokai");
	editor.getSession().setMode("ace/mode/glsl");
	editor.getSession().on('change', compileVS);
	editor.setHighlightActiveLine(false);
	editor.setShowPrintMargin(false);
	editor.commands.removeCommands(["gotoline", "find"]);

	editor.commands.addCommand({
		name: 'commentLineCommand',
		bindKey: { win: 'Ctrl-M', mac: 'Command-M' },
		exec: function (e) {
			e.toggleCommentLines();
		},
		readOnly: false
	});
}


/**
 * Requests file contents and puts them into editor.
 *
 * @param      {String}  fileName  The source file
 * @param      {aceEditor}  editor The target editor
 */
function setEditorTextFromFile(fileName, editor) {
	var request = new XMLHttpRequest();
	try { request.responseType = 'text'; } catch(e) {}
	request.open("GET", fileName, true);
	request.onreadystatechange = function() {
	  if (request.readyState === 4) {
	  	editor.setValue(request.responseText, 1);
	  }
	}
	request.send();
}


/**
 * Initializes model, view and projection matrices.
 */
function initMatrices() {
	modelMatrix = ko.observable(mat4.create());
	modelMatrix(mat4.identity(modelMatrix()));

	viewMatrix = ko.observable(mat4.create());
	modelViewMatrix = ko.observable(mat4.create());

	normalMatrix = ko.observable(mat3.create());

	projectionMatrix = ko.observable(mat4.create());
	orthoMatrix = mat4.create();
	perspMatrix = mat4.create();

	updateMatrices();
}


/**
 * Initializes WebGL context.
 */
function initWebGL() {
	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	} catch (e) {
		alert("WebGL not supported by your setup");
		return;
	}

	resizeCanvas();
}


/**
 * Initializes touch, mouse and wheel inputs.
 */
function initCanvas() {
	canvas.addEventListener("mousedown", onMouseDown, false);
	canvas.addEventListener("wheel", onMouseWheel, true);


	var mc = new Hammer(canvas);
	mc.add(new Hammer.Pinch({ threshold: 0}));
	mc.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));

	mc.on('panstart', onPanStart);
	mc.on('panmove', onPanMove);
	mc.on('panend', onPanEnd);

	mc.on('pinchstart', onPinchStart);
	mc.on('pinchmove', onPinchMove);
}


/**
 * Resizes the WebGL canvas according to the window size.
 */
function resizeCanvas() {
	// Lookup the size the browser is displaying the canvas.
	var displayWidth = canvas.clientWidth * sampleFactor;
	var displayHeight = canvas.clientHeight * sampleFactor;
	var ratio = displayWidth / displayHeight;

	// Check if the canvas is not the same size.
	if (canvas.width != displayWidth || canvas.height != displayHeight) {
		// Make the canvas the same size
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}

	gl.viewport(0, 0, displayWidth, displayHeight);

	mat4.ortho(orthoMatrix, -ratio * 2, ratio * 2, -2, 2, 0.1, 1000);
	mat4.perspective(perspMatrix, Math.PI / 4, ratio, 0.1, 1000);

	projectionMatrix(perspMatrix);
}

/**
 * Determines if parameter is number.
 *
 * @param      {<type>}   o		The object to be tested
 * @return     {boolean}  True if number, False otherwise.
 */
function isNumber(o) {
    return typeof o == "number" || (typeof o == "object" && o.constructor === Number);
}


/**
 * Determines if parameter is string.
 *
 * @param      {Object}   o		The object to be tested
 * @return     {boolean}  True if string, False otherwise.
 */
function isString(o) {
	return typeof o == "string" || (typeof o == "object" && o.constructor === String);
}


/**
 * Determines if parameter is observable.
 *
 * @param      {Object}   o		The object to be tested
 * @return     {boolean}  True if observable, False otherwise.
 */
function isObservable(o) {
	return typeof o == "observable" || (typeof o == "object" && o.constructor === ko.observable);
}