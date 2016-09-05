// the base frame of this function originates from https://github.com/mrdoob/three.js/wiki/JSON-Model-format-3
// it was modified and extended to assemble arrays that can be turned into vertex and index buffers


/**
 * Parses a json model file.
 *
 * @param      {Object}  json    The json model data
 * @return     {Model}   { the model }
 */
function parseModel( json ) {

	if ( json.metadata === undefined || json.metadata.formatVersion === undefined || json.metadata.formatVersion !== 3.1 ) {
		console.error( 'Deprecated file format.' );
		return;
	}

	function isBitSet( value, position ) {
		return (value & ( 1 << position )) != false;
	};
	
	var i, j, 

	offset, zLength,

	type,
	isQuad, 
	hasMaterial, 
	hasFaceUv, hasVertexUv,
	hasFaceNormal, hasVertexNormal,
	hasFaceColor, hasVertexColor,

	faces = json.faces,
	vertices = json.vertices,
	normals = json.normals,
	colors = json.colors,
	uvs = json.uvs,
	
	vertexBuffer = new Array(),
	indexBuffer = new Array(),
	colorBuffer,
	normalBuffer,
	uvBuffer,
	
	nUvLayers = 0,
	nTotalVertices = 0,
	
	model = new Model(),
	triangles = new Array();

	for ( i = 0; i < json.uvs.length; i++ ) {
        if ( json.uvs[ i ].length ) nUvLayers ++;
    }
	
	model.hasNormals = normals !== undefined && normals.length > 0;
	model.hasColors = colors !== undefined && colors.length > 0;
	model.hasUV = uvs !== undefined && uvs.length > 0 && uvs[0].length > 0;
	
	offset = 0;
	zLength = vertices.length;

	while ( offset < zLength ) {
		x = vertices[ offset ++ ];
		y = vertices[ offset ++ ];
		z = vertices[ offset ++ ];

		model.vertices.push( vec3.fromValues(x, y, z) );
	}
		
	if (model.hasColors) {
		colorBuffer = new Array();
		offset = 0;
		zLength = colors.length;
		
		while ( offset < zLength ) {
			r = colors [ offset ++ ];
			g = colors [ offset ++ ];
			b = colors [ offset ++ ];
			a = colors [ offset ++ ];

			model.colors.push( vec4.fromValues(r, g, b, a) );			
		}
	}
	
	if (model.hasNormals) {
		normalBuffer = new Array();
		offset = 0;
		zLength = normals.length;
		
		while ( offset < zLength ) {
			x = normals[ offset ++ ];
			y = normals[ offset ++ ];
			z = normals[ offset ++ ];

			model.normals.push( vec3.fromValues(x, y, z) );
		}
	}

	if (model.hasUV) {
		uvBuffer = new Array();
		offset = 0;
		zLength = uvs.length;

		while ( offset < zLength ) {
			u = uvs[ offset ++ ];
			v = uvs[ offset ++ ];

			model.uvs.push( vec2.fromValues(u, v) );
		}
	}

	offset = 0;
	zLength = faces.length;

	while ( offset < zLength ) {
		type = faces[ offset ++ ];

		isQuad				= isBitSet( type, 0 );
		hasMaterial			= isBitSet( type, 1 );
		hasFaceUv			= isBitSet( type, 2 );
		hasVertexUv			= isBitSet( type, 3 );
		hasFaceNormal		= isBitSet( type, 4 );
		hasVertexNormal		= isBitSet( type, 5 );
		hasFaceColor		= isBitSet( type, 6 );
		hasVertexColor		= isBitSet( type, 7 );

		if ( isQuad ) {
			nVertices = 4;
			
			var i1 = nTotalVertices ++;
			var i2 = nTotalVertices ++;
			var i3 = nTotalVertices ++;
			var i4 = nTotalVertices ++;
			
			indexBuffer.push( i1 );
			indexBuffer.push( i2 );
			indexBuffer.push( i3 );
			
			indexBuffer.push( i3 );
			indexBuffer.push( i4 );
			indexBuffer.push( i1 );
		} else {
			nVertices = 3;
			
			indexBuffer.push( nTotalVertices ++ );
			indexBuffer.push( nTotalVertices ++ );
			indexBuffer.push( nTotalVertices ++ );
		}
		
		for (i = 0; i < nVertices; i++) {
			var vIndex = faces[ offset ++ ];
			var vertex = model.vertices[ vIndex ];
			
			vertexBuffer.push(vertex[0]);
			vertexBuffer.push(vertex[1]);
			vertexBuffer.push(vertex[2]);
		}

		if ( hasMaterial ) {
			materialIndex = faces[ offset ++ ];
			// we don't care for materials
		}

		if ( hasFaceUv ) {
			for ( i = 0; i < nUvLayers; i++ ) {
				uvLayer = json.uvs[ i ];

				uvIndex = faces[ offset ++ ];

				u = uvLayer[ uvIndex * 2 ];
				v = uvLayer[ uvIndex * 2 + 1 ];

				for (i = 0; i < nVertices; i++) {
					uvBuffer.push(u);
					uvBuffer.push(v);
				}
			}
		}

		if ( hasVertexUv ) {
			for ( i = 0; i < nUvLayers; i++ ) {
				uvLayer = json.uvs[ i ];

				uvs = [];

				for ( j = 0; j < nVertices; j ++ ) {
					uvIndex = faces[ offset ++ ];

					u = uvLayer[ uvIndex * 2 ];
					v = uvLayer[ uvIndex * 2 + 1 ];

					uvBuffer.push(u);
					uvBuffer.push(v);
				}
			}
		}

		if ( model.hasNormals ) {
			if ( hasFaceNormal ) {
				normalIndex = faces[ offset ++ ];
				normal = model.normals[ normalIndex ];
				
				for (i = 0; i < nVertices; i++) {
					normalBuffer.push(normal[0]);
					normalBuffer.push(normal[1]);
					normalBuffer.push(normal[2]);
				}
			} else if ( hasVertexNormal ) {
				for ( i = 0; i < nVertices; i++ ) {
					normalIndex = faces[ offset ++ ];
					normal = model.normals[ normalIndex ];
					
					normalBuffer.push(normal[0]);
					normalBuffer.push(normal[1]);
					normalBuffer.push(normal[2]);
				}
			} else {
				for ( i = 0; i < nVertices; i++ ) {
					normalBuffer.push(0);
					normalBuffer.push(0);
					normalBuffer.push(0);
				}
			}
		}
		
		if ( model.hasColors ) {
			if ( hasFaceColor ) {
				colorIndex = faces[ offset ++ ];
				color = colors[ colorIndex ];
				
				for (i = 0; i < nVertices; i++) {
					colorBuffer.push(color[0]);
					colorBuffer.push(color[1]);
					colorBuffer.push(color[2]);
					colorBuffer.push(color[3]);
				}
			} else if ( hasVertexColor ) {
				for ( i = 0; i < nVertices; i++ ) {
					colorIndex = faces[ offset ++ ];
					color = colors[ colorIndex ];
					
					colorBuffer.push(color[0]);
					colorBuffer.push(color[1]);
					colorBuffer.push(color[2]);
					colorBuffer.push(color[3]);
				}
			} else {
				for ( i = 0; i < nVertices; i++ ) {
					colorBuffer.push(1);
					colorBuffer.push(1);
					colorBuffer.push(1);
					colorBuffer.push(1);
				}
			}
		}
	}

	if (model.hasUV && json.materials != undefined && json.materials.length > 0
	 && json.materials[0].mapDiffuse != undefined) {
		model.textureFile = json.materials[0].mapDiffuse;
	}

	model.buffers = { vertex:vertexBuffer, index:indexBuffer, color:colorBuffer, normal:normalBuffer, uv:uvBuffer };
	return model;
};

function Model () {
	this.hasColors = false;
	this.hasNormals = false;
	this.hasUV = false;
	
	this.vertices = new Array();
	this.colors = new Array();
	this.normals = new Array();
	this.uvs = new Array();
	
	this.buffers = { vertex:undefined, index:undefined, color:undefined, normal:undefined, uv:undefined }

	this.textureFile = "";
}