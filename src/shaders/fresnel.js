/**
 * Dispersive Fresnel shader.
 *
 * Derived from the Fresnel shader in the three.js examples
 * (alteredq / http://alteredqualia.com/, after the Nvidia Cg tutorial),
 * last modified by Mr&Mrs (2014).
 *
 * Differences from the original:
 *  - the refraction ratio is a vec3, one ratio per colour channel, so the
 *    R, G and B components are refracted by different amounts (dispersion);
 *  - the refracted colour is tinted per channel by `mHueGlow`;
 *  - reflection and refraction may sample two *different* cube maps, which is
 *    what makes the double-refraction trick in diamond.js possible.
 */

const { THREE } = window;

const vertexShader = /* glsl */ `
uniform vec3 mRefractionRatio;
uniform float mFresnelBias;
uniform float mFresnelScale;
uniform float mFresnelPower;

varying vec3 vReflect;
varying vec3 vRefract[3];
varying float vReflectionFactor;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);

    vec3 I = worldPosition.xyz - cameraPosition;
    vec3 dir = normalize(I);

    vReflect = reflect(I, worldNormal);
    vRefract[0] = refract(dir, worldNormal, mRefractionRatio[0]);
    vRefract[1] = refract(dir, worldNormal, mRefractionRatio[1]);
    vRefract[2] = refract(dir, worldNormal, mRefractionRatio[2]);
    vReflectionFactor = mFresnelBias + mFresnelScale * pow(1.0 + dot(dir, worldNormal), mFresnelPower);

    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
uniform samplerCube tCubeReflect;
uniform samplerCube tCubeRefract;
uniform vec3 mHueGlow;

varying vec3 vReflect;
varying vec3 vRefract[3];
varying float vReflectionFactor;

void main() {
    vec4 reflectedColor = textureCube(tCubeReflect, vReflect);
    vec4 refractedColor = vec4(1.0);

    refractedColor.r = clamp(textureCube(tCubeRefract, vRefract[0]).r * mHueGlow[0], 0.0, 1.0);
    refractedColor.g = clamp(textureCube(tCubeRefract, vRefract[1]).g * mHueGlow[1], 0.0, 1.0);
    refractedColor.b = clamp(textureCube(tCubeRefract, vRefract[2]).b * mHueGlow[2], 0.0, 1.0);

    gl_FragColor = mix(refractedColor, reflectedColor, clamp(vReflectionFactor, 0.0, 1.0));
}
`;

export const DispersiveFresnelShader = {
    uniforms: {
        mRefractionRatio: { type: 'v3', value: new THREE.Vector3() },
        mHueGlow: { type: 'v3', value: new THREE.Vector3() },
        mFresnelBias: { type: 'f', value: 0.1 },
        mFresnelPower: { type: 'f', value: 2.0 },
        mFresnelScale: { type: 'f', value: 1.0 },
        tCubeReflect: { type: 't', value: null },
        tCubeRefract: { type: 't', value: null },
    },
    vertexShader,
    fragmentShader,
};

/**
 * Creates a ShaderMaterial with its own copy of the uniforms.
 *
 * @param {object} options
 * @param {THREE.WebGLRenderTargetCube} options.reflectMap cube map sampled for reflection
 * @param {THREE.WebGLRenderTargetCube} options.refractMap cube map sampled for refraction
 * @param {{bias:number, scale:number, power:number}} options.fresnel
 */
export function createDispersiveFresnelMaterial({ reflectMap, refractMap, fresnel }) {
    const uniforms = THREE.UniformsUtils.clone(DispersiveFresnelShader.uniforms);
    uniforms.tCubeReflect.value = reflectMap;
    uniforms.tCubeRefract.value = refractMap;
    uniforms.mFresnelBias.value = fresnel.bias;
    uniforms.mFresnelScale.value = fresnel.scale;
    uniforms.mFresnelPower.value = fresnel.power;

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: DispersiveFresnelShader.vertexShader,
        fragmentShader: DispersiveFresnelShader.fragmentShader,
    });
}

/**
 * Per-channel refraction ratios. Red uses the base ratio; green and blue are
 * pulled towards 1.0 (no refraction) by `dispersion` / 2 and `dispersion`.
 */
export function refractionRatios(base, dispersion, target = new THREE.Vector3()) {
    const spread = (base - 1) * dispersion;
    return target.set(base, base - spread / 2, base - spread);
}

/**
 * Per-channel tint applied to the refracted colour.
 *
 * @param {THREE.Color} hue
 * @param {number} glow
 * @param {boolean} hueToGlow when true glow scales the hue, otherwise it adds white
 */
export function hueGlow(hue, glow, hueToGlow, target = new THREE.Vector3()) {
    return hueToGlow
        ? target.set(1 + hue.r * glow, 1 + hue.g * glow, 1 + hue.b * glow)
        : target.set(hue.r + glow, hue.g + glow, hue.b + glow);
}
