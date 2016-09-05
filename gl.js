
/**
 * sends texture data to the graphics hardware
 *
 * @param      {ImageData}  image   The source image
 * @return     {WebGLTexture}     { The target texture }
 */
function writeToTexture(image) {
	var texture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);

	return texture;
}


/**
 * sends vertex data to the graphics hardware
 *
 * @param      {byte[]}  bufferData  the vertex data
 * @return     {WebGLBuffer}    { WebGLBuffer storing vertex data }
 */
function assembleVertexBuffer(bufferData) {
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);
	return buffer;
}


/**
 * sends index data to the graphics hardware
 *
 * @param      {WebGLBuffer}  bufferData  The buffer data
 * @return     {WebGLBuffer}    { WebGLBuffer storing index data }
 */
function assembleIndexBuffer(bufferData) {
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bufferData), gl.STATIC_DRAW);
	return buffer;
}


/**
 * compiles vertex shader from vsEditor
 */
function compileVS() {
	linkFeedback.innerHTML = "";

	vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vsEditor.getValue());
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		vsFeedback.style.color = "#F00";
		vsFeedback.innerHTML = gl.getShaderInfoLog(vertexShader);
		return;
	} else {
		vsFeedback.style.color = "#0F0";
		vsFeedback.innerHTML = "Vertex shader compilation successful";
	}

	linkShaders();
}


/**
 * compiles fragment shader from fsEditor
 */
function compileFS() {
	linkFeedback.innerHTML = "";

	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fsEditor.getValue());
	gl.compileShader(fragmentShader);

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		fsFeedback.style.color = "#F00";
		fsFeedback.innerHTML = gl.getShaderInfoLog(fragmentShader);
		return;
	} else {
		fsFeedback.style.color = "#0F0";
		fsFeedback.innerHTML = "Fragment shader compilation successful";
	}

	linkShaders();
}


/**
 * Links shaders and gets uniform locations
 */
function linkShaders() {
	if (vertexShader === undefined || !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)
	|| fragmentShader === undefined || !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		return;
	}

	var newShaderProgram = gl.createProgram();
	gl.attachShader(newShaderProgram, vertexShader);
	gl.attachShader(newShaderProgram, fragmentShader);
	gl.linkProgram(newShaderProgram);

	if (!gl.getProgramParameter(newShaderProgram, gl.LINK_STATUS)) {
		linkFeedback.style.color = "#F00";
		linkFeedback.innerHTML = "Failed to initialize shaders.";
		return;
	} else {
		linkFeedback.style.color = "#0F0";
		linkFeedback.innerHTML = "Shader linking successful.";
	}
	
	shaderProgram = newShaderProgram;

	// collect the positions of all vertex attributes
	shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aPosition");
	shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "aColor");
	shaderVertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aNormal");
	shaderVertexTextureCoordinateAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
}


/**
 * draws the object
 */
function draw() {
	if (shaderProgram === undefined || model === undefined || drawing == false) {
		requestAnimationFrame(draw);
	} else {
		gl.clearColor(.25, .25, .25, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);

		gl.useProgram(shaderProgram);

		passAttributes();

		if (autoRotate && !dragging) {
			autoYRotation += 0.025;
			updateMatrices();
		}

		var matrixUniforms = uniformsViewModel.uniforms();
		matrixUniforms.forEach(passUniform);

		gl.drawElements(model.primitiveType, model.ibLen, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(draw);
	}
}

function passAttributes() {
		// vertex pos has 3 components per vertex    \ /
		bind(shaderVertexPositionAttribute, model.vb, 3)

		if (model.cb !== undefined && shaderVertexColorAttribute != -1) {
			bind(shaderVertexColorAttribute, model.cb, 4);
		}

		if (model.nb !== undefined && shaderVertexNormalAttribute != -1) {
			bind(shaderVertexNormalAttribute, model.nb, 3);
		}

		if (model.uv != undefined && shaderVertexTextureCoordinateAttribute != -1) {
			bind(shaderVertexTextureCoordinateAttribute, model.uv, 2);
			passTexture();
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ib);
}

function updateMatrices() {
	mat4.fromTranslation(viewMatrix(), [0, 0, -cameraDistance]);
	mat4.fromXRotation(modelMatrix(), xRotation);
	modelMatrix(mat4.rotateY(modelMatrix(), modelMatrix(), yRotation + autoYRotation));
	modelViewMatrix(mat4.multiply(modelViewMatrix(), viewMatrix(), modelMatrix()));
	normalMatrix(mat3.normalFromMat4(normalMatrix(), modelViewMatrix()));
}


function passTexture() {
	if (texture === undefined) {
		return;
	}

	var location = gl.getUniformLocation(shaderProgram, "uSampler");

	if (location == null) {
		return;
	}

 	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, 0);
}

function passUniform(uniform, index, uniforms) {
	var uName = uniform.name();
	var location = gl.getUniformLocation(shaderProgram, uName);

	if (location == null) {
		return;
	}

	try {
		switch (uniform.type()) {
			case 'float':
				gl.uniform1f(location, uniform.passableValue);
			break;
			case 'vec2':
				gl.uniform2fv(location, uniform.passableValue);
			break;
			case 'vec3':
				gl.uniform3fv(location, uniform.passableValue);
			break;
			case 'vec4':
				gl.uniform4fv(location, uniform.passableValue);
			break;
			case 'mat2':
				gl.uniformMatrix2fv(location, false, uniform.passableValue);
			break;
			case 'mat3':
				gl.uniformMatrix3fv(location, false, uniform.passableValue);
			break;
			case 'mat4':
				gl.uniformMatrix4fv(location, false, uniform.passableValue);
			break;
		}
	}
	catch(ex) {
		var z = 3;
	}
}


/**
 * binds value to shader attribute 
 *
 * @param      {GLuint}  shaderAttribute  The shader attribute
 * @param      {WebGLBuffer}  buffer           The buffer
 * @param      {GLint}  itemsPerVertex   The items per vertex
 */
function bind(shaderAttribute, buffer, itemsPerVertex) {
	gl.enableVertexAttribArray(shaderAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(shaderAttribute, itemsPerVertex, gl.FLOAT, false, 0, 0);
}