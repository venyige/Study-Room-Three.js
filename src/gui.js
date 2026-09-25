/**
 * dat.GUI control panel.
 */

const { dat } = window;

/**
 * @param {object} params mutable parameter object from config.createParams()
 * @param {() => void} onMaterialChange called when a shader-related value changes
 */
export function createGui(params, onMaterialChange) {
    const gui = new dat.GUI({ width: 400 });

    const optics = gui.addFolder('Optics');
    optics.add(params, 'entryRefraction', 0.70, 1.00).name('Entry refraction').onChange(onMaterialChange);
    optics.add(params, 'exitRefraction', 1.00, 1.40).name('Exit refraction').onChange(onMaterialChange);
    optics.add(params, 'dispersion', 0.0, 1.0).name('Dispersion').onChange(onMaterialChange);
    optics.add(params, 'innerOffset', 0.0, 2.0).name('Inner refr. magn.');
    optics.add(params, 'innerRefraction').name('Inner refraction');
    optics.open();

    const colour = gui.addFolder('Colour');
    colour.addColor(params, 'hue').name('Diamond hue').onChange(onMaterialChange);
    colour.add(params, 'glow', 0.0, 1.0).name('Diamond glow').onChange(onMaterialChange);
    colour.add(params, 'hueToGlow').name('Hue to glow').onChange(onMaterialChange);
    colour.open();

    const motion = gui.addFolder('Motion & debug');
    motion.add(params, 'rotateCamera').name('Rotate camera');
    motion.add(params, 'rotateBall').name('Rotate sphere');
    motion.add(params, 'rotateDiamond').name('Rotate diamond');
    motion.add(params, 'showInnerOnly').name('Show inner stone only');
    motion.open();

    return gui;
}
