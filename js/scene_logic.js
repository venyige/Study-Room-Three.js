var container, camera, controls, cubeCameraC1, cubeCameraC2, cubeCameraS, scene, renderer;
var diamondUpper=null, diamondLower, sphere;
var touch_prev_dist, info;
var altMmesh, bgMmesh;
var objects = [], plane;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
offset1 = new THREE.Vector3(),
INTERSECTED, SELECTED, mouseIndicatorD = false;
var dcDist, dlx, dly, dlz;
var fovFac = 0.63, distToCamera, dHue = 0x0044ff, dGlow = 0.5;

var fov = 70,
isUserInteracting = false,
onMouseDownMouseX = 0, onMouseDownMouseY = 0,
lon = 0, onMouseDownLon = 0,
lat = 0, onMouseDownLat = 0,
phi = 0, theta = 0;
var controlConfig = {
    "Refraction1": 0.80, "Refraction2": 1.4, 'Inner refr. magn.': (fovFac), 'Diamond hue': dHue, "Diamond glow": dGlow, 'Hue to glow': true,
    'Rotate camera': true, 'Rotate sphere': true, 'Rotate diamond': true, 'Inner refraction': true, 'Dispersion': 0.35, 'Sprite': false, "Box": false
};
var diamondWatcher;
init();
animate();

function setRR(refractU) {
    var baseR = refractU;
    var retV3 = new THREE.Vector3();
    retV3.x = (baseR);
    retV3.y = (baseR -(baseR - 1) * controlConfig["Dispersion"] / 2.0);
    retV3.z = (baseR -(baseR - 1) * controlConfig["Dispersion"]);

    var logger = document.createElement('div');
    return retV3
}

function setHG(dHueColor, dGlow) {
    if (controlConfig["Hue to glow"])
        var retV3 = new THREE.Vector3(1.0 + dHueColor.r * dGlow, 1.0 + dHueColor.g * dGlow, 1.0 + dHueColor.b * dGlow);
    else
        var retV3 = new THREE.Vector3(dHueColor.r + dGlow, dHueColor.g + dGlow, dHueColor.b + dGlow);
//    console.log('hue'+ controlConfig["Hue to glow"]);
    return retV3;

}
function init() {
    container = document.createElement('div');
    document.body.appendChild(container);
    var dHueColor = new THREE.Color(dHue);
    var textureLoader = new THREE.TextureLoader();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 80000);
    camera.position.y = 100;
    scene = new THREE.Scene();
    var bgTexture = textureLoader.load('https://venyige.github.io/Study-Room-Three.js/img/study_uv_sphere_map_coloured.jpg');
    bgMmesh = new THREE.Mesh(new THREE.SphereGeometry(500, 80, 40), new THREE.MeshBasicMaterial({ map: bgTexture }));
    bgMmesh.scale.x = -1;
    bgTexture.mapping = THREE.UVMapping;
    scene.add(bgMmesh);


    var loader = new THREE.JSONLoader();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //	renderer.sortObjects = false;



    cubeCameraS = new THREE.CubeCamera(0.1, 10000, 128);
    //	cubeCameraS.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
    cubeCameraC1 = new THREE.CubeCamera(0.1, 10000, 2048);
    cubeCameraC2 = new THREE.CubeCamera(0.1, 10000, 2048);
    var pointLight = new THREE.PointLight(0xffffff, 10.0);
    pointLight.position.set(0.0, 400.0, 0.0);
    scene.add(pointLight);


    scene.add(cubeCameraS);
    scene.add(cubeCameraC1);
    scene.add(cubeCameraC2);

    container.appendChild(renderer.domElement);
    info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '<h4><a href="http://threejs.org" target="_blank">three.js r74 </a> DatNet study </h4>'+
        '<a href="https://github.com/venyige/Study-Room-Three.js" target="_blank">GitHub repo</a><br />'+
        '<a href="https://www.venyige.com/" target="_blank">Home</a><br />';
    container.appendChild(info);
    var stoneTex1 = textureLoader.load('https://venyige.github.io/Study-Room-Three.js/img/worn.jpg');


    var metalMaterial = new THREE.MeshBasicMaterial({ map: stoneTex1, envMap: cubeCameraS.renderTarget });
    metalMaterial.combine = THREE.AddOperation;
    metalMaterial.reflectivity = 1;

    sphere = new THREE.Mesh(new THREE.SphereGeometry(20, 30, 15), metalMaterial);
    sphere.position.x = 0;
    sphere.position.y = -50;
    sphere.position.z = 0;

    scene.add(sphere);
    objects.push(sphere);

    var shader1 = THREE.FresnelShader2;  //set shader variable to use three.fresnelshader
    uniforms1 = THREE.UniformsUtils.clone(shader1.uniforms);   //clone uniforms from fresnelshader
    var shader2 = THREE.FresnelShader;  //set shader variable to use three.fresnelshader
    uniforms2 = THREE.UniformsUtils.clone(shader2.uniforms);   //clone uniforms from fresnelshader

    uniforms1["mRefractionRatio"].value = setRR(controlConfig["Refraction1"]);
    uniforms1["mFresnelBias"].value = 0.1;
    uniforms1["mFresnelPower"].value = 2.0;
    uniforms1["mFresnelScale"].value = 1.0;
    uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow);

    uniforms2["mRefractionRatio"].value = setRR(controlConfig["Refraction2"]);
    uniforms2["mFresnelBias"].value = 0.1;
    uniforms2["mFresnelPower"].value = 2.0;
    uniforms2["mFresnelScale"].value = 1.0;
    uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow);

    var guiControlContainer = new dat.GUI({ width: 400 });
    guiControlContainer.add(controlConfig, "Refraction1", 0.70, 1.00).onChange(function (v) { uniforms1["mRefractionRatio"].value = setRR(controlConfig["Refraction1"]); });
    guiControlContainer.add(controlConfig, "Refraction2", 1.00, 1.40).onChange(function (v) { uniforms2["mRefractionRatio"].value = setRR(controlConfig["Refraction2"]); });
    guiControlContainer.add(controlConfig, 'Inner refr. magn.', 0.00, 2.00).onChange(function (v) { fovFac = v; });
    guiControlContainer.addColor(controlConfig, 'Diamond hue').onChange(function (v) { dHueColor.setHex(v); uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow); uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow); });
    guiControlContainer.add(controlConfig, "Diamond glow", 0.0, 1.0).onChange(function (v) { dGlow = v; uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow); uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow); });
    guiControlContainer.add(controlConfig, "Dispersion", 0.0, 1.0).onChange(function (v) {uniforms1["mRefractionRatio"].value = setRR(controlConfig["Refraction1"]);uniforms2["mRefractionRatio"].value = setRR(controlConfig["Refraction2"]); });
    guiControlContainer.add(controlConfig, 'Hue to glow').onChange(function () { uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow); uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow); });
    guiControlContainer.add(controlConfig, 'Rotate camera');
    guiControlContainer.add(controlConfig, 'Rotate sphere');
    guiControlContainer.add(controlConfig, 'Rotate diamond');
    guiControlContainer.add(controlConfig, 'Inner refraction');
    guiControlContainer.add(controlConfig, 'Sprite');

    uniforms1["tCube_reflect"].value = cubeCameraC2.renderTarget;
    uniforms1["tCube_refract"].value = cubeCameraC1.renderTarget;
    //// uniforms1["tCube"].value = cubeCameraC1.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget

    parameters1 = { fragmentShader: shader1.fragmentShader, vertexShader: shader1.vertexShader, uniforms: uniforms1 };
    var glassMat1 = new THREE.ShaderMaterial(parameters1); // create shadermaterial with parameters

    var dummyMat = new THREE.MeshBasicMaterial({ color: 0x66aa22, map: stoneTex1, side: THREE.backSide });
    //glassMat1.side = THREE.BackSide;
  //  glassMat1.shading = THREE.FlatShading
    loader.load("https://venyige.github.io/Study-Room-Three.js/data/subdivided_brilliant_sn.json", function (geometry) {
        diamondUpper = new THREE.Mesh(geometry, glassMat1);
        diamondUpper.position.x = 0;
        diamondUpper.position.y = 50;
        diamondUpper.position.z = 0;
        scene.add(diamondUpper);
        objects.push(diamondUpper);
    });
    uniforms2["tCube"].value = cubeCameraC2.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget
    parameters2 = { fragmentShader: shader2.fragmentShader, vertexShader: shader2.vertexShader, uniforms: uniforms2 };
    var glassMat2 = new THREE.ShaderMaterial(parameters2); // create shadermaterial with parameters
    //		glassMat2.shading = THREE.FlatShading
    // 				glassMat2.side = THREE.BackSide;
    loader.load("https://venyige.github.io/Study-Room-Three.js/data/subdivided_brilliant_fn.json", function (geometry) {
        diamondLower = new THREE.Mesh(geometry, glassMat2);
        diamondLower.position.x = 0;
        diamondLower.position.y = 50;
        diamondLower.position.z = 0;
        scene.add(diamondLower);
    });


    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(plane);
 
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousewheel', onDocumentMouseWheel, false);
    renderer.domElement.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
    renderer.domElement.addEventListener("touchstart", onDocumentTouchDown, true);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    window.addEventListener('resize', onWindowResized, false);

    onWindowResized(null);

}
function onWindowResized(event) {

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
}
function onDocumentMouseDown(event) {
    //			    controls.enabled = false;
    event.preventDefault();
    mouseIndicatorD = true;
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {

        SELECTED = intersects[0].object;

        var intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {

            offset1.copy(intersects[0].point).sub(plane.position);
        }
        container.style.cursor = 'move';
    }
}
function onDocumentTouchDown(event) {
    event.preventDefault();
    mouseIndicatorD = true;
    if (event.touches.length === 1) {
        onPointerDownPointerX = event.touches[0].pageX;
        onPointerDownPointerY = event.touches[0].pageY;
        mouse.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
            SELECTED = intersects[0].object;
            plane.position.copy(SELECTED.position);
            plane.rotation.copy(camera.rotation);
            var intersects = raycaster.intersectObject(plane);

            if (intersects.length > 0) {
                offset1.copy(intersects[0].point).sub(plane.position);
            }
        }
    } else {
        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        touch_prev_dist = Math.sqrt(dx * dx + dy * dy);
    }
    renderer.domElement.addEventListener("touchmove", onDocumentTouchMove, false);
    renderer.domElement.addEventListener("touchend", onDocumentTouchUp, false);
}
function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (SELECTED) {

        var intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            SELECTED.position.copy(intersects[0].point.sub(offset1))
        }
        return;
    } else {
        if (mouseIndicatorD) {
            lon = (event.clientX - onPointerDownPointerX) * 0.1 + onPointerDownLon;
            lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        }
    }
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            INTERSECTED = intersects[0].object;
            plane.position.copy(INTERSECTED.position);
            plane.rotation.copy(camera.rotation);
        }

        container.style.cursor = 'pointer';
    } else {
        INTERSECTED = null;
        container.style.cursor = 'auto';
    }
}
function onDocumentTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        mouse.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (SELECTED) {
            var intersects = raycaster.intersectObject(plane);
            if (intersects.length > 0) {
                SELECTED.position.copy(intersects[0].point.sub(offset1));
            }
            return;
        } else {
            lon = (event.touches[0].pageX - onPointerDownPointerX) * 0.1 + onPointerDownLon;
            lat = (event.touches[0].pageY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        }

    } else {
        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        fov += (touch_prev_dist - distance) * 0.1;
        touch_prev_dist = distance;
        camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
    }
}
function onDocumentMouseUp(event) {
    event.preventDefault();
    if (INTERSECTED) {
        plane.position.copy(INTERSECTED.position);
        SELECTED = null;
    }
    container.style.cursor = 'auto';
    mouseIndicatorD = false;
}
function onDocumentTouchUp(event) {
    event.preventDefault();
    if (SELECTED) {
        plane.position.copy(SELECTED.position);
        SELECTED = null;
    }
    mouseIndicatorD = false;
    document.removeEventListener("touchend", onDocumentTouchUp, false);
    document.removeEventListener("touchmove", onDocumentTouchMove, false);
}
function onDocumentMouseWheel(event) {
    event.preventDefault();
    if (event.wheelDeltaY) {
        fov -= event.wheelDeltaY * 0.05;
    } else if (event.wheelDelta) {
        fov -= event.wheelDelta * 0.05;
    } else if (event.detail) {
        fov += event.detail * 1.0;
    }
    camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
}
function animate() {
    requestAnimationFrame(animate);
    render();
}
function render() {
    info.ontimeupdate = 1;
    if (!mouseIndicatorD && controlConfig["Rotate camera"]) {
        lon += .15;
    }
    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.Math.degToRad(90 - lat);
    theta = THREE.Math.degToRad(lon);


    if (controlConfig["Rotate sphere"]) {
        sphere.rotation.x += 0.02;
        sphere.rotation.y += 0.03;
    }
    // console.log('after sphere rot\n');
    if (controlConfig["Rotate diamond"]) {
        diamondUpper.rotation.x += 0.02;
        diamondUpper.rotation.y += 0.03;
        diamondLower.rotation.x += 0.02;
        diamondLower.rotation.y += 0.03;
    }

    //     diamondLower.rotation.x = diamondUpper.rotation.x + Math.PI;
    // diamondLower.rotation.y = -diamondUpper.rotation.y
    //   diamondLower.rotation.x -= 0.02;
    //   diamondLower.rotation.y -= 0.03;
    //  console.log('after diamond rot\n');
        camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
        camera.position.y = 100 * Math.cos(phi);
        camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(scene.position);
    //     diamondWatcher.lookAt(diamondUpper);
    //     diamondWatcher.updateMatrixWorld(true);

    //    console.log('after cam pos.\n');
    /*    diamondLower.position.copy(diamondUpper.position);*/
    dlx = diamondUpper.position.x - camera.position.x;
    dly = diamondUpper.position.y - camera.position.y;
    dlz = diamondUpper.position.z - camera.position.z;
    dcDist = Math.sqrt(dlx * dlx + dly * dly + dlz * dlz);
    distToCamera = camera.position.distanceTo(diamondUpper.position);
    diamondLower.position.x = fovFac * distToCamera * dlx / dcDist + diamondUpper.position.x;
    diamondLower.position.y = fovFac * distToCamera * dly / dcDist + diamondUpper.position.y;
    diamondLower.position.z = fovFac * distToCamera * dlz / dcDist + diamondUpper.position.z;
    // console.log('after lookat\n');


    //   altMmesh.visible = false;
    //    bgMmesh.visible = true;

    cubeCameraC1.position.copy(diamondUpper.position);// = objects[1].position;
    cubeCameraC2.position.copy(diamondUpper.position);//
    cubeCameraS.position.copy(sphere.position);
    if (controlConfig["Sprite"])
        diamondLower.visible = false;

    diamondUpper.visible = false; // *cough*
    cubeCameraC2.updateCubeMap(renderer, scene);
    if (controlConfig["Inner refraction"])
        diamondLower.visible = true;
    cubeCameraC1.updateCubeMap(renderer, scene);
    if (controlConfig["Sprite"]) {
        if (!controlConfig["Inner refraction"])
            diamondLower.visible = true;

    } else {
    diamondUpper.visible = true;

    diamondLower.visible = false;

    }
    sphere.visible = false; // *cough*
    cubeCameraS.updateCubeMap(renderer, scene);

    sphere.visible = true; // *cough*
    //    altMmesh.visible = true;
    //    bgMmesh.visible = false;
    renderer.render(scene, camera);

}
