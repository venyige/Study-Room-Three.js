/**
 * Static configuration: asset paths and scene constants.
 *
 * Paths are relative so the demo works from any host (GitHub Pages, a fork,
 * or a local static server) without cross-origin texture errors.
 */

export const ASSETS = {
    roomTexture: 'assets/textures/study-room-equirect.jpg',
    ballTexture: 'assets/textures/worn-metal.jpg',
    // Outer shell of the brilliant cut: the surface the viewer actually sees.
    diamondOuter: 'assets/models/brilliant-outer.json',
    // Inner "virtual" stone, only ever rendered into the refraction cube map.
    diamondInner: 'assets/models/brilliant-inner.json',
};

export const CAMERA = {
    fov: 70,
    minFov: 10,
    maxFov: 120,
    near: 1,
    far: 1100,
    orbitRadius: 100,
    autoRotateSpeed: 0.15, // degrees of longitude per frame
    maxLatitude: 85,
};

export const SCENE = {
    roomRadius: 500,
    ballRadius: 20,
    ballPosition: [0, -50, 0],
    diamondPosition: [0, 50, 0],
    spinPerFrame: { x: 0.02, y: 0.03 },
};

export const CUBE_MAP = {
    near: 0.1,
    far: 10000,
    diamondResolution: 2048,
    ballResolution: 128,
};

export const FRESNEL = {
    bias: 0.1,
    scale: 1.0,
    power: 2.0,
};

/**
 * Tweakable parameters exposed in the dat.GUI panel.
 * Mutated in place by the GUI and read every frame by the render loop.
 */
export function createParams() {
    return {
        // Ratio n1/n2 used when light enters the outer surface.
        entryRefraction: 0.80,
        // Ratio n1/n2 used on the inner stone (light leaving the diamond).
        exitRefraction: 1.40,
        // How far behind the outer stone the inner stone is placed,
        // as a fraction of the camera-to-diamond distance.
        innerOffset: 0.63,
        // 0 = no dispersion; 1 = blue channel is refracted not at all.
        dispersion: 0.35,
        hue: 0x0044ff,
        glow: 0.5,
        // true: tint = 1 + hue * glow (glow scales the hue);
        // false: tint = hue + glow (glow adds white).
        hueToGlow: true,

        rotateCamera: true,
        rotateBall: true,
        rotateDiamond: true,
        innerRefraction: true,
        // Debug view: show the inner stone instead of the outer one.
        showInnerOnly: false,
    };
}
