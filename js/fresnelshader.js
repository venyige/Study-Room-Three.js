/**
 * Last modified by @author Mr&Mrs(2014)
 * Based  on work by alteredq / http://alteredqualia.com/
 * and derivative of Nvidia Cg tutorial
 */

THREE.FresnelShader2 = {

	uniforms: {

	    "mRefractionRatio": { type: "v3", value: new THREE.Vector3(0, 0, 0) },
	    "mHueGlow": { type: "v3", value: new THREE.Vector3(0, 0, 0) },
		"mFresnelBias": { type: "f", value: 0.1 },
		"mFresnelPower": { type: "f", value: 2.0 },
		"mFresnelScale": { type: "f", value: 1.0 },
		"tCube_reflect": { type: "t", value: null },
		"tCube_refract": { type: "t", value: null }

	},

	vertexShader: [

		"uniform vec3 mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",

		"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",
			
		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

			"vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

//			"vec3 worldNormal = normalize(mat3( modelMatrix)*normal) ;",

			"vec3 I = worldPosition.xyz - cameraPosition;",

			"vReflect = reflect( I, worldNormal );",
			"vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio[0] );",
			"vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio[1] );",
			"vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio[2] );",

			"vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower);",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform samplerCube tCube_reflect;",
		"uniform samplerCube tCube_refract;",
		"uniform vec3 mHueGlow;",

		"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",

		"void main() {",

			"vec4 reflectedColor = textureCube( tCube_reflect, vec3( vReflect.x, vReflect.yz ) );",
			"vec4 refractedColor = vec4( 1.0);",

		"refractedColor.r = clamp(textureCube( tCube_refract, vec3(vRefract[0].xyz ) ).r*mHueGlow[0], 0.0, 1.0);",
			"refractedColor.g = clamp(textureCube( tCube_refract, vec3(vRefract[1].xyz ) ).g*mHueGlow[1], 0.0, 1.0);",
			"refractedColor.b = clamp(textureCube( tCube_refract, vec3(vRefract[2].xyz ) ).b*mHueGlow[2], 0.0, 1.0);",
/*	
			"refractedColor.r = clamp(textureCube( tCube_refract, vRefract[0] ).r*mHueGlow[0], 0.0, 1.0);",
			"refractedColor.g = clamp(textureCube( tCube_refract, vRefract[1] ).g*mHueGlow[1], 0.0, 1.0);",
			"refractedColor.b = clamp(textureCube( tCube_refract, vRefract[2] ).b*mHueGlow[2], 0.0, 1.0);",
*/
			"gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );",
//			"gl_FragColor =  refractedColor;",

		"}"

	].join("\n")

};
THREE.FresnelShader_refract = {

    uniforms: {

        "mRefractionRatio": { type: "v3", value: new THREE.Vector3(0, 0, 0) },
        "mHueGlow": { type: "v3", value: new THREE.Vector3(0, 0, 0) },
        "mFresnelBias": { type: "f", value: 0.1 },
        "mFresnelPower": { type: "f", value: 2.0 },
        "mFresnelScale": { type: "f", value: 1.0 },
        "tCube": { type: "t", value: null }

    },

    vertexShader: [

		"uniform vec3 mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",

		"varying vec3 vRefract[3];",

		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

			"vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

			"vec3 I = worldPosition.xyz - cameraPosition;",

			"vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio[0] );",
			"vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio[1] );",
			"vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio[2] );",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

    ].join("\n"),

    fragmentShader: [

		"uniform samplerCube tCube;",
		"varying vec3 vRefract[3];",
		"uniform vec3 mHueGlow;",

		"void main() {",

			"vec4 refractedColor = vec4( 1.0);",

			"refractedColor.r = clamp(textureCube( tCube, vec3(vRefract[0].xyz ) ).r*mHueGlow[0], 0.0, 1.0);",
			"refractedColor.g = clamp(textureCube( tCube, vec3(vRefract[1].xyz ) ).g*mHueGlow[1], 0.0, 1.0);",
			"refractedColor.b = clamp(textureCube( tCube, vec3(vRefract[2].xyz ) ).b*mHueGlow[2], 0.0, 1.0);",

			"gl_FragColor = refractedColor;",

		"}"

    ].join("\n")

};
THREE.FresnelShader = {

    uniforms: {

        "mRefractionRatio": { type: "v3", value: new THREE.Vector3(0, 0, 0) },
        "mHueGlow": { type: "v3", value: new THREE.Vector3(0, 0, 0) },
        "mFresnelBias": { type: "f", value: 0.1 },
        "mFresnelPower": { type: "f", value: 2.0 },
        "mFresnelScale": { type: "f", value: 1.0 },
        "tCube": { type: "t", value: null }

    },

    vertexShader: [

		"uniform vec3 mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",

		"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",

		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

			"vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

			"vec3 I = worldPosition.xyz - cameraPosition;",

			"vReflect = reflect( I, worldNormal );",
			"vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio[0] );",
			"vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio[1] );",
			"vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio[2] );",
			"vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower);",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

    ].join("\n"),

    fragmentShader: [

		"uniform samplerCube tCube;",
		"uniform vec3 mHueGlow;",

		"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",

		"void main() {",

			"vec4 reflectedColor = textureCube( tCube, vec3( vReflect.x, vReflect.yz ) );",
			"vec4 refractedColor = vec4( 1.0);",

			"refractedColor.r = clamp(textureCube( tCube, vec3(vRefract[0].xyz ) ).r*mHueGlow[0], 0.0, 1.0);",
			"refractedColor.g = clamp(textureCube( tCube, vec3(vRefract[1].xyz ) ).g*mHueGlow[1], 0.0, 1.0);",
			"refractedColor.b = clamp(textureCube( tCube, vec3(vRefract[2].xyz ) ).b*mHueGlow[2], 0.0, 1.0);",

			"gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );",

		"}"

    ].join("\n")

};
