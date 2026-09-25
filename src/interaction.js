/**
 * Mouse / touch / pen input:
 *  - drag empty space to orbit the camera,
 *  - drag the diamond or the ball to move it in the camera plane,
 *  - wheel or pinch to zoom (changes the field of view).
 */

import { CAMERA } from './config.js';

const { THREE } = window;

const ORBIT_SPEED = 0.1; // degrees per pixel
const WHEEL_ZOOM_SPEED = 0.05; // degrees per wheel pixel
const PINCH_ZOOM_SPEED = 0.1; // degrees per pixel of pinch distance
const WHEEL_LINE_HEIGHT = 33; // px, for wheel events reported in lines
const ORIGIN = new THREE.Vector3(0, 0, 0);

export class Interaction {
    constructor(camera, element, scene) {
        this.camera = camera;
        this.element = element;
        this.draggables = [];

        this.lon = 0;
        this.lat = 0;
        this.fov = CAMERA.fov;

        this.pointers = new Map(); // pointerId -> {x, y}
        this.pinchDistance = 0;
        this.orbitStart = null; // {x, y, lon, lat}

        this.raycaster = new THREE.Raycaster();
        this.ndc = new THREE.Vector2();
        this.selected = null;
        this.dragOffset = new THREE.Vector3();

        // Invisible plane facing the camera that dragged objects slide along.
        this.dragPlane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        scene.add(this.dragPlane);

        element.style.touchAction = 'none';
        element.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        element.addEventListener('pointermove', (e) => this.onPointerMove(e));
        element.addEventListener('pointerup', (e) => this.onPointerUp(e));
        element.addEventListener('pointercancel', (e) => this.onPointerUp(e));
        element.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    addDraggable(object) {
        this.draggables.push(object);
    }

    /** True while the user is holding a pointer down (pauses auto-rotation). */
    get isActive() {
        return this.pointers.size > 0;
    }

    /** Advances auto-rotation and places the camera on its orbit. */
    update(autoRotate) {
        if (autoRotate && !this.isActive) this.lon += CAMERA.autoRotateSpeed;
        this.lat = THREE.Math.clamp(this.lat, -CAMERA.maxLatitude, CAMERA.maxLatitude);

        const phi = THREE.Math.degToRad(90 - this.lat);
        const theta = THREE.Math.degToRad(this.lon);
        const r = CAMERA.orbitRadius;
        this.camera.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
        this.camera.lookAt(ORIGIN);
    }

    setFov(fov) {
        this.fov = THREE.Math.clamp(fov, CAMERA.minFov, CAMERA.maxFov);
        this.camera.fov = this.fov;
        this.camera.updateProjectionMatrix();
    }

    // --- helpers -----------------------------------------------------------

    updateRay(event) {
        this.ndc.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        this.raycaster.setFromCamera(this.ndc, this.camera);
    }

    pickDraggable() {
        const hits = this.raycaster.intersectObjects(this.draggables);
        return hits.length > 0 ? hits[0].object : null;
    }

    intersectDragPlane() {
        const hits = this.raycaster.intersectObject(this.dragPlane);
        return hits.length > 0 ? hits[0].point : null;
    }

    currentPinchDistance() {
        const [a, b] = [...this.pointers.values()];
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    // --- event handlers ----------------------------------------------------

    onPointerDown(event) {
        event.preventDefault();
        this.element.setPointerCapture(event.pointerId);
        this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (this.pointers.size === 2) {
            // Second finger: switch from orbit/drag to pinch zoom.
            this.selected = null;
            this.orbitStart = null;
            this.pinchDistance = this.currentPinchDistance();
            return;
        }
        if (this.pointers.size > 2) return;

        this.updateRay(event);
        const target = this.pickDraggable();
        if (target) {
            this.selected = target;
            this.dragPlane.position.copy(target.position);
            this.dragPlane.rotation.copy(this.camera.rotation);
            const point = this.intersectDragPlane();
            if (point) this.dragOffset.copy(point).sub(this.dragPlane.position);
            this.element.style.cursor = 'move';
        } else {
            this.orbitStart = { x: event.clientX, y: event.clientY, lon: this.lon, lat: this.lat };
        }
    }

    onPointerMove(event) {
        if (this.pointers.has(event.pointerId)) {
            this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        if (this.pointers.size === 2) {
            const distance = this.currentPinchDistance();
            this.setFov(this.fov + (this.pinchDistance - distance) * PINCH_ZOOM_SPEED);
            this.pinchDistance = distance;
            return;
        }

        this.updateRay(event);

        if (this.selected) {
            const point = this.intersectDragPlane();
            if (point) this.selected.position.copy(point.sub(this.dragOffset));
            return;
        }

        if (this.orbitStart) {
            this.lon = (event.clientX - this.orbitStart.x) * ORBIT_SPEED + this.orbitStart.lon;
            this.lat = (event.clientY - this.orbitStart.y) * ORBIT_SPEED + this.orbitStart.lat;
        }

        if (event.pointerType === 'mouse' && !this.isActive) {
            this.element.style.cursor = this.pickDraggable() ? 'pointer' : 'auto';
        }
    }

    onPointerUp(event) {
        this.pointers.delete(event.pointerId);
        if (this.pointers.size === 0) {
            this.selected = null;
            this.orbitStart = null;
            this.element.style.cursor = 'auto';
        }
    }

    onWheel(event) {
        event.preventDefault();
        const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? event.deltaY * WHEEL_LINE_HEIGHT
            : event.deltaY;
        this.setFov(this.fov + delta * WHEEL_ZOOM_SPEED);
    }
}
