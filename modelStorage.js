var models;

/**
 * Loads models specified in index file.
 */
function loadModels() {
	var request = new XMLHttpRequest();
	try { request.responseType = 'text'; } catch(e) {}
	request.open("GET", "./models/index.json");
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			initModelStorage(JSON.parse(request.responseText));
		}
	}
	request.send();
}


/**
 * Initializes the model storage.
 *
 * @param      {Object}  indexFile  The index
 */
function initModelStorage(indexFile) {
	if (indexFile.models === undefined) {
		return;
	}

	for(var name in indexFile.models){
		var select = document.getElementById("selectModel");
		var entry = document.createElement("option");
		entry.text = name;
		entry.value = "./models/" + indexFile.models[name];
		select.add(entry);
	}

	changeModel();
}

/**
 * Loads a model from a given path.
 *
 * @param      {String}  path    The path to the model
 */
function loadModel(path) {
	var request = new XMLHttpRequest();
	request.open("GET", path);
	try { request.responseType = 'text'; } catch(e) {}
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			modelData = parseModel(JSON.parse(request.responseText));

			chkNormals.checked = modelData.hasNormals;
			chkColors.checked = modelData.hasColors;
			chkTexture.checked = modelData.hasUV;

            initModel(modelData);
		}
	}
	request.send();
}

/**
 * Initializes buffers from model data.
 *
 * @param      {<type>}  modelData  The model data
 */
function initModel(modelData) {
	var vertexBuffer = assembleVertexBuffer(modelData.buffers.vertex);
	var indexBuffer = assembleIndexBuffer(modelData.buffers.index);

    var colorBuffer = undefined;
    if (modelData.hasColors) {
        colorBuffer = assembleVertexBuffer(modelData.buffers.color);
    }

	var normalBuffer = undefined;
	if (modelData.hasNormals) {
		normalBuffer = assembleVertexBuffer(modelData.buffers.normal);
	}

	var uvBuffer = undefined;
	if (modelData.hasUV) {
		uvBuffer = assembleVertexBuffer(modelData.buffers.uv);
	}

	// keep track of vertex and index count
	var vertexCount = modelData.buffers.vertex.length / 3;
	var ibLen = modelData.buffers.index.length;

	model = {
		vb: vertexBuffer,
		ib: indexBuffer,
		cb: colorBuffer,
		nb: normalBuffer,
		uv: uvBuffer,
		vertexCount: vertexCount,
		ibLen: ibLen,
		primitiveType: gl.TRIANGLES
	};

	if (modelData.textureFile != "") {
		// try to load appropriate texture map
		var image = new Image();
		image.onload = function() {
			texture = writeToTexture(image, texture);
			drawing = true;
		}

		image.src = "./models/" +  modelData.textureFile;
	} else {
		// if no textures are to be loaded, we are ready to draw
		drawing = true;
	}
}