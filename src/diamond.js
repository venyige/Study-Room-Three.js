/**
 * The double-refraction diamond.
 *
 * A real diamond sparkles because light refracts twice: once entering the
 * stone and once leaving it through the back facets. A single cube-map
 * refraction shader only models the first bend, so the stone looks like
 * solid glass.
 *
 * The trick used here fakes the second bend with a second mesh:
 *
 *   1. `reflectCamera` renders the environment without any diamond.
 *   2. An *inner* stone is placed behind the visible one, on the line from the
 *      camera through the diamond. It refracts `reflectCamera`'s map using the
 *      exit ratio (> 1, light leaving the dense medium).
 *   3. `refractCamera` renders the environment *with* that inner stone.
 *   4. The visible *outer* stone reflects map (1) and refracts map (3), using
 *      the entry ratio (< 1).
 *
 * So whatever you see through the outer stone has already been bent by
 * another stone, and the inner stone is never drawn in the main pass.
 */

import { CUBE_MAP, FRESNEL, SCENE } from './config.js';
import { createDispersiveFresnelMaterial, hueGlow, refractionRatios } from './shaders/fresnel.js';

const { THREE } = window;

function loadGeometry(loader, url) {
    return new Promise((resolve, reject) => {
        loader.load(url, (geometry) => resolve(geometry), undefined, reject);
    });
}

export class DoubleRefractionDiamond {
    constructor(scene) {
        this.scene = scene;
        this.outer = null;
        this.inner = null;
        this.hue = new THREE.Color();

        this.reflectCamera = new THREE.CubeCamera(CUBE_MAP.near, CUBE_MAP.far, CUBE_MAP.diamondResolution);
        this.refractCamera = new THREE.CubeCamera(CUBE_MAP.near, CUBE_MAP.far, CUBE_MAP.diamondResolution);
        scene.add(this.reflectCamera);
        scene.add(this.refractCamera);

        this.outerMaterial = createDispersiveFresnelMaterial({
            reflectMap: this.reflectCamera.renderTarget,
            refractMap: this.refractCamera.renderTarget,
            fresnel: FRESNEL,
        });
        this.innerMaterial = createDispersiveFresnelMaterial({
            reflectMap: this.reflectCamera.renderTarget,
            refractMap: this.reflectCamera.renderTarget,
            fresnel: FRESNEL,
        });
    }

    get isReady() {
        return this.outer !== null && this.inner !== null;
    }

    /** Loads both meshes; resolves with the outer (visible, draggable) mesh. */
    async load(outerUrl, innerUrl) {
        const loader = new THREE.JSONLoader();
        const [outerGeometry, innerGeometry] = await Promise.all([
            loadGeometry(loader, outerUrl),
            loadGeometry(loader, innerUrl),
        ]);

        this.outer = new THREE.Mesh(outerGeometry, this.outerMaterial);
        this.outer.position.fromArray(SCENE.diamondPosition);

        this.inner = new THREE.Mesh(innerGeometry, this.innerMaterial);
        this.inner.position.copy(this.outer.position);
        // Hidden until the refraction pass. Also keeps the inner material from
        // being drawn into the cube map it samples (a GL feedback loop).
        this.inner.visible = false;

        this.scene.add(this.outer);
        this.scene.add(this.inner);
        return this.outer;
    }

    /** Pushes the current GUI parameters into the shader uniforms. */
    applyParams(params) {
        const outer = this.outerMaterial.uniforms;
        const inner = this.innerMaterial.uniforms;

        refractionRatios(params.entryRefraction, params.dispersion, outer.mRefractionRatio.value);
        refractionRatios(params.exitRefraction, params.dispersion, inner.mRefractionRatio.value);

        this.hue.setHex(params.hue);
        hueGlow(this.hue, params.glow, params.hueToGlow, outer.mHueGlow.value);
        inner.mHueGlow.value.copy(outer.mHueGlow.value);
    }

    update(camera, params) {
        if (!this.isReady) return;

        if (params.rotateDiamond) {
            this.outer.rotation.x += SCENE.spinPerFrame.x;
            this.outer.rotation.y += SCENE.spinPerFrame.y;
            this.inner.rotation.copy(this.outer.rotation);
        }

        // Push the inner stone away from the camera along the view ray:
        // inner = outer + k * (outer - camera)
        this.inner.position
            .subVectors(this.outer.position, camera.position)
            .multiplyScalar(params.innerOffset)
            .add(this.outer.position);

        this.reflectCamera.position.copy(this.outer.position);
        this.refractCamera.position.copy(this.outer.position);
    }

    /** Renders both cube maps and leaves visibility set up for the main pass. */
    renderCubeMaps(renderer, params) {
        if (!this.isReady) return;

        // Pass 1: environment only.
        this.outer.visible = false;
        this.inner.visible = false;
        this.reflectCamera.updateCubeMap(renderer, this.scene);

        // Pass 2: environment as seen through the inner stone.
        this.inner.visible = params.innerRefraction;
        this.refractCamera.updateCubeMap(renderer, this.scene);

        // Main pass: normally the outer stone only.
        this.outer.visible = !params.showInnerOnly;
        this.inner.visible = params.showInnerOnly;
    }
}
