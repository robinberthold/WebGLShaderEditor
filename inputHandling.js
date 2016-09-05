var prevX, prevY, prevZoom;

// ------------------------------ Buttons

/**
 * Toggles model auto rotation.
 */
function toggleAutoRotate() {
	autoRotate = !autoRotate;
}


/**
 * Toggles between orthogonal and perspective projection matrices.
 */
function toggleProjection() {
	if (projectionMatrix() == perspMatrix) {
		btnProjection.innerHTML = "Perspective Projection";
		projectionMatrix(orthoMatrix);
	} else {
		btnProjection.innerHTML = "Orthogonal Projection"
		projectionMatrix(perspMatrix);
	}
}


/**
 * Adds a new uniform.
 */
function addUniform() {
	var uvm = new UniformViewModel(findUniformName(), "float", ko.observable(0), true);
	uniformsViewModel.uniforms.push(uvm);
}



/**
 * Counts uniforms and returns a fitting name for a new uniform.
 * 
 * @return     {string}  The name for the new uniform
 */
function findUniformName() {

	var nameFound = false;

	for (i = 0; i < uniformsViewModel.uniforms().length; i++) {
		if (uniformsViewModel.uniforms()[i].name() == "newUniform") {
			nameFound = true;
		}
	}

	if (nameFound == false) {
		return "newUniform";
	}

	var count = 1;

	for (i = 0; i < uniformsViewModel.uniforms().length; i++) {
		if (uniformsViewModel.uniforms()[i].name() == "newUniform" + count) {
			count++;
			i = 0;
		}
	}

	return "newUniform" + count;
}



/**
 * Deletes the specified uniform.
 *
 * @param      {UniformViewModel}  uniform  The uniform to delete
 */
function deleteUniform(uniform) {
	uniformsViewModel.uniforms.remove(uniform);

	// force shader reassembly
	linkShaders();
}


// ------------------------------ Combobox

/**
 * Changes the displayed model.
 */
function changeModel() {
	drawing = false;

	if (texture != undefined) {
		gl.deleteTexture(texture);
	}

	loadModel(selectModel.value);
	linkShaders();
}



// ------------------------------ Mouse & Touch


/**
 * Skips text selection on mouse move in canvas.
 */
function onMouseDown(params) {
	params.preventDefault();
}


/**
 * Zooms on mouse wheel.
 *
 * @param      {object}  params  Mouse wheel parameter
 */
function onMouseWheel(params) {
	yRotation -= params.deltaX / 100;
	cameraDistance -= params.deltaY / 100;
	
	if (cameraDistance > 25) {
		cameraDistance = 25;
	}
	if (cameraDistance < 1) {
		cameraDistance = 1;
	}
	
	params.returnValue = false;

	updateMatrices();
}



/**
 * Resets rotation offsets.
 */
function onPanStart() {
	prevX = xRotation;
	prevY = yRotation;
	dragging = true;
}


/**
 * Sets x- and yRotation depending on delta.
 *
 * @param      {object}  params  Touch/Mouse input parameters
 */
function onPanMove(params) {
	xRotation = prevX + 0.01 * params.deltaY;
	yRotation = prevY + 0.01 * params.deltaX;
	
	updateMatrices();
}


function onPanEnd() {
	dragging = false;
}


/**
 * Resets zoom offset.
 */
function onPinchStart() {
	prevZoom = cameraDistance;
}


/**
 * Sets cameraDistance depending on zoom delta.
 *
 * @param      {object}  params  Touch input parameters
 */
function onPinchMove(params) {
	if (params.additionalEvent == "pinchout") {
		cameraDistance = prevZoom - 0.2 * params.distance;
	}

	if (params.additionalEvent == "pinchin") {
		cameraDistance = prevZoom + 0.2 * params.distance;
	}

	updateMatrices();
}