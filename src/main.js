/**
 * Entry point: builds the scene and runs the render loop.
 *
 * Frame order matters, because every cube map is rendered from the scene:
 *   1. move things (camera orbit, spins, inner-stone placement)
 *   2. diamond cube maps (environment, then environment + inner stone)
 *   3. chrome ball cube map (sees the finished diamond)
 *   4. main render
 */

import { ASSETS, CAMERA, createParams } from './config.js';
import { DoubleRefractionDiamond } from './diamond.js';
import { ChromeBall, createRoom } from './environment.js';
import { createGui } from './gui.js';
import { Interaction } from './interaction.js';

const { THREE } = window;

const params = createParams();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    CAMERA.fov, window.innerWidth / window.innerHeight, CAMERA.near, CAMERA.far
);

const textureLoader = new THREE.TextureLoader();
createRoom(scene, textureLoader, ASSETS.roomTexture);
const ball = new ChromeBall(scene, textureLoader, ASSETS.ballTexture);
const diamond = new DoubleRefractionDiamond(scene);

const interaction = new Interaction(camera, renderer.domElement, scene);
interaction.addDraggable(ball.mesh);

diamond.applyParams(params);
diamond.load(ASSETS.diamondOuter, ASSETS.diamondInner)
    .then((outer) => interaction.addDraggable(outer))
    .catch((error) => console.error('Failed to load diamond models', error));

createGui(params, () => diamond.applyParams(params));

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function render() {
    interaction.update(params.rotateCamera);
    ball.update(params);
    diamond.update(camera, params);

    diamond.renderCubeMaps(renderer, params);
    ball.renderCubeMap(renderer);
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

animate();
