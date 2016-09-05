/**
 * Saves the current state, code & uniforms to a json file
 */
function saveState(){
	var uniformStates = new Array();
	uniformsViewModel.uniforms().forEach(function(u) {
		if (u.mutable) {
			uniformStates.push( { name: u.name(), type: u.type(), value: u.value() });
		}
	})
	var fn = "shader";
	if (fileName.value != "") {
		fn = fileName.value;
	}
	var state = { name: fn, vs: vsEditor.getValue(), fs: fsEditor.getValue(), uniforms: uniformStates };
	var stateJson = JSON.stringify(state, null, "\t")

	var a = document.createElement('a');
	a.setAttribute('href', 'data:text/plain;charset=utf-u,' + encodeURIComponent(stateJson));
	a.setAttribute('download', fn + '.json');
	a.click()
}


/**
 * Loads the current state, code & uniforms from a json file
 */
function loadState(evt) {
	var files = evt.target.files;

	if (files.length != 1) {
		return;
	}

	var reader = new FileReader();
	reader.readAsText(files[0]);
	reader.onload = function(file) {
		var stateData;
		try {
			stateData = JSON.parse(file.target.result);
		}
		catch (e) {
			console.log("error: " + e);
			return;
		}

		if (stateData.name === undefined
			|| stateData.vs === undefined
			|| stateData.fs === undefined
			|| stateData.uniforms === undefined) {
			console.log("invalid state data");
			return;
		}

		fileName.value = stateData.name;
		vsEditor.setValue(stateData.vs, 1);
		fsEditor.setValue(stateData.fs, 1);

		uniformsViewModel.uniforms.removeAll();
		addDefaultUniforms(uniformsViewModel);

		stateData.uniforms.forEach(function(u) {
			var uniformValue = toPassableValue(u.value, u.type, false);
			uniformsViewModel.uniforms.push( new UniformViewModel(u.name, u.type, ko.observable(uniformValue), true) );
		});

		fileOpenDialog.value = "";
	}
}