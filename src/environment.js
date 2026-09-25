/**
 * The study room panorama and the chrome ball that reflects it.
 */

import { CUBE_MAP, SCENE } from './config.js';

const { THREE } = window;

export function createRoom(scene, textureLoader, url) {
    const texture = textureLoader.load(url);
    texture.mapping = THREE.UVMapping;

    const room = new THREE.Mesh(
        new THREE.SphereGeometry(SCENE.roomRadius, 80, 40),
        new THREE.MeshBasicMaterial({ map: texture })
    );
    // Flip the sphere inside out so the panorama is seen from within.
    room.scale.x = -1;
    scene.add(room);
    return room;
}

export class ChromeBall {
    constructor(scene, textureLoader, url) {
        this.scene = scene;
        this.cubeCamera = new THREE.CubeCamera(CUBE_MAP.near, CUBE_MAP.far, CUBE_MAP.ballResolution);
        scene.add(this.cubeCamera);

        // A worn texture added on top of a perfect mirror.
        const material = new THREE.MeshBasicMaterial({
            map: textureLoader.load(url),
            envMap: this.cubeCamera.renderTarget,
            combine: THREE.AddOperation,
            reflectivity: 1,
        });

        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(SCENE.ballRadius, 30, 15), material);
        this.mesh.position.fromArray(SCENE.ballPosition);
        scene.add(this.mesh);
    }

    update(params) {
        if (params.rotateBall) {
            this.mesh.rotation.x += SCENE.spinPerFrame.x;
            this.mesh.rotation.y += SCENE.spinPerFrame.y;
        }
        this.cubeCamera.position.copy(this.mesh.position);
    }

    renderCubeMap(renderer) {
        this.mesh.visible = false;
        this.cubeCamera.updateCubeMap(renderer, this.scene);
        this.mesh.visible = true;
    }
}
