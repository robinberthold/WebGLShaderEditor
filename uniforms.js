/**
 * UniformViewModel constructor.
 *
 * @class      Uniform (name)
 * @param      {String}   name          uniform name
 * @param      {String}   type          uniform type
 * @param      {glMatrx}  value         uniform value
 * @param      {Boolean}  mutable       is uniform mutable?
 */
function UniformViewModel(name, type, value, mutable) {
	var self = this;

	self.name = ko.observable(name);
	self.type = ko.observable(type);
	self.value = value;

	self.template = function() {
		if (self.mutable == true) {
			return "mutable-template";
		}
		return "immutable-template";
	}

	self.passableValue = toPassableValue(self.value(), self.type());
	self.readableValue = ko.observable(toReadable(toPassableValue(self.value(), self.type(), true), self.type()));

	self.mutable = mutable;

	self.subscription = self.value.subscribe(function(newValue) {
		self.passableValue = toPassableValue(self.value(), self.type());
		self.readableValue(toReadable(toPassableValue(self.value(), self.type(), true), self.type()));
	});
}


/**
 * Converts a uniform into a readable scalar, vector or matrix.
 *
 * @param      {Object}  value   Uniform as float or array
 * @param      {String}  type    Uniform type
 * @return     {String}  Readable scalar, vector or matrix
 */
function toReadable(value, type) {
	switch (type) {
		case 'float':
			return value;
		case 'vec2':
			return value[0] + '\n' + value[1];
		case 'vec3':
			return value[0] + '\n' + value[1] + '\n' + value[2];
		case 'vec4':
			return value[0] + '\n' + value[1] + '\n' + value[2] + '\n' + value[3];
		case 'mat2':
			return value[0    ] + "  " + value[1    ] + '\n'
				 + value[0 + 2] + "  " + value[1 + 2] + '\n';
		case 'mat3':
			return value[0    ] + "  " + value[1    ] + "  " + value[2    ] + '\n'
				 + value[0 + 3] + "  " + value[1 + 3] + "  " + value[2 + 3] + '\n'
				 + value[0 + 6] + "  " + value[1 + 6] + "  " + value[2 + 6] + '\n';
		case 'mat4':
			return value[0     ] + "  " + value[1     ] + "  " + value[2     ] + "  " + value[3     ] + '\n'
				 + value[0 +  4] + "  " + value[1 +  4] + "  " + value[2 +  4] + "  " + value[3 +  4] + '\n'
				 + value[0 +  8] + "  " + value[1 +  8] + "  " + value[2 +  8] + "  " + value[3 +  8] + '\n'
				 + value[0 + 12] + "  " + value[1 + 12] + "  " + value[2 + 12] + "  " + value[3 + 12] + '\n';
	}
}


/**
 * Massages uniform to be passable to the glContext.
 *
 * @param      {string}   value   The Uniform
 * @param      {Object}   type    Uniform type
 * @param      {boolean}  round   Round to 2 decimal places?
 * @return     {Object}   The uniform in passable format
 */
function toPassableValue(value, type, round) {
	switch (type) {
		case 'float':
			if (round == true) {
				return parseFloat(value).toFixed(2);
			}
			return parseFloat(value);
		case 'vec2':
		case 'vec3':
		case 'vec4':
		case 'mat2':
		case 'mat3':
		case 'mat4':
			if (isString(value)) {
				value = value.replace(/\[|\]|"| /g,'').split(',');
			}

		    var passableValue = new Array(value.length);
			for (i = 0; i < value.length; i++) {
				if (round == true) {
					passableValue[i] = parseFloat(value[i]).toFixed(2);
				} else {
					passableValue[i] = parseFloat(value[i]);
				}
			}
			return passableValue;
	}
}


/**
 * UniformsViewModel constructor.
 *
 * @class      UniformsViewModel (name)
 */
function UniformsViewModel() {
	var self = this;

	self.availableUniforms = ['float', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4']; 
	
	var uniforms = new Array();
	self.uniforms = ko.observableArray(uniforms);

	addDefaultUniforms(self);
}


function addDefaultUniforms(uniformsViewModel) {
	var uniforms = uniformsViewModel.uniforms;
	// uniforms.push(new UniformViewModel("modelMatrix", "mat4", modelMatrix, false));
	// uniforms.push(new UniformViewModel("viewMatrix", "mat4", viewMatrix, false));
	uniforms.push(new UniformViewModel("projectionMatrix", "mat4", projectionMatrix, false));
	uniforms.push(new UniformViewModel("modelViewMatrix", "mat4", modelViewMatrix, false));
	uniforms.push(new UniformViewModel("normalMatrix", "mat3", normalMatrix, false));
}