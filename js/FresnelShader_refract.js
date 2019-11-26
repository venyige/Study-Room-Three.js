/**
 * Last modified by @author Mr&Mrs(2014)
 * Based  on work by alteredq / http://alteredqualia.com/
 * and derivative of Nvidia Cg tutorial
 */

THREE.FresnelShader_refract = {

	uniforms: {

		"mRefractionRatio": { type: "f", value: 1.01 },
		"mFresnelBias": { type: "f", value: 0.1 },
		"mFresnelPower": { type: "f", value: 2.0 },
		"mFresnelScale": { type: "f", value: 1.0 },
		"tCube": { type: "t", value: null }

	},

	vertexShader: [

		"uniform float mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",

		"varying vec3 vRefract[3];",
			
		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

			"vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

			"vec3 I = worldPosition.xyz - cameraPosition;",

			"vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio );",
			"vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio *0.99 );",
			"vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio *0.98 );",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform samplerCube tCube;",
		"varying vec3 vRefract[3];",

		"void main() {",

			"vec4 refractedColor = vec4( 1.0);",

			"refractedColor.r = clamp(textureCube( tCube, vec3( vRefract[0].x, vRefract[0].yz ) ).r*1.0, 0.0, 1.0);",
			"refractedColor.g = clamp(textureCube( tCube, vec3( vRefract[1].x, vRefract[1].yz ) ).g*1.1, 0.0, 1.0);",
			"refractedColor.b = clamp(textureCube( tCube, vec3(vRefract[2].x, vRefract[2].yz ) ).b*1.5, 0.0, 1.0);",

			"gl_FragColor = refractedColor;",

		"}"

	].join("\n")

};
