var container, camera, controls, cubeCameraC1, cubeCameraC2, cubeCameraS, scene, renderer;
var diamondUpper, diamondLower, sphere, display_plane01, display_plane02;
var touch_prev_dist;
var objects = [], plane;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
offset1 = new THREE.Vector3(),
INTERSECTED, SELECTED, mouseIndicatorD = false;

var fov = 70,
isUserInteracting = false,
onMouseDownMouseX = 0, onMouseDownMouseY = 0,
lon = 0, onMouseDownLon = 0,
lat = 0, onMouseDownLat = 0,
phi = 0, theta = 0;


init();
animate();

//} );
function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    // instantiate a loader
    var textureLoader = new THREE.TextureLoader();


    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 80000);
    camera.position.y = 100;
    /*				controls = new THREE.OrbitControls(camera);
                    controls.enableZoom = false;
                    controls.noPan = true;
                    controls.noRotate = false;
    */
    scene = new THREE.Scene();
    textureLoader.load(
    // resource URL
    'study_uv_sphere_map_coloured.jpg',
    // Function when resource is loaded
    function (texture) {
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 80, 40), new THREE.MeshBasicMaterial({ map: texture }));
        mesh.scale.x = -1;
        texture.mapping = THREE.UVMapping;


        scene.add(mesh);

    }
);

    var loader = new THREE.JSONLoader();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //	renderer.sortObjects = false;

    cubeCameraS = new THREE.CubeCamera(0.1, 10000, 256);
    //	cubeCameraS.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
    cubeCameraC1 = new THREE.CubeCamera(0.1, 10000, 128);
    cubeCameraC2 = new THREE.CubeCamera(0.1, 10000, 128);
    var pointLight = new THREE.PointLight(0xffffff, 10.0);
    pointLight.position.set(0.0, 400.0, 0.0);
    scene.add(pointLight);


    scene.add(cubeCameraS);
    scene.add(cubeCameraC1);
    scene.add(cubeCameraC2);

    //				document.body.appendChild( renderer.domElement );
    container.appendChild(renderer.domElement);
    var info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js 4</a> DatNet study';
    container.appendChild(info);

    
   var stoneTex1=textureLoader.load('6.jpg');


     var metalMaterial = new THREE.MeshBasicMaterial({ map: stoneTex1, envMap: cubeCameraS.renderTarget });
     metalMaterial.combine = THREE.AddOperation;
     metalMaterial.reflectivity = 1;

     sphere = new THREE.Mesh(new THREE.SphereGeometry(20, 30, 15), metalMaterial);

    scene.add(sphere);
    objects.push(sphere);



    var shader1 = THREE.FresnelShader;  //set shader variable to use three.fresnelshader
    uniforms1 = THREE.UniformsUtils.clone(shader1.uniforms);   //clone uniforms from fresnelshader
    var shader2 = THREE.FresnelShader;  //set shader variable to use three.fresnelshader
    uniforms2 = THREE.UniformsUtils.clone(shader2.uniforms);   //clone uniforms from fresnelshader

    /*
uniforms: {

"mRefractionRatio": { type: "f", value: 0.5 },
"mFresnelBias": { type: "f", value: 0.1 },
"mFresnelPower": { type: "f", value: 2.0 },
"mFresnelScale": { type: "f", value: 0.1 },
"tCube": { type: "t", value: null }

"mRefractionRatio": { type: "f", value: 1.02 },
"mFresnelBias": { type: "f", value: 0.1 },
"mFresnelPower": { type: "f", value: 2.0 },
"mFresnelScale": { type: "f", value: 1.0 },
"tCube": { type: "t", value: null }

},

    uniforms1["mRefractionRatio"].value = uniforms2["mRefractionRatio"].value = 0.2;
    uniforms1["mFresnelBias"].value = uniforms2["mFresnelBias"].value = 0.2;
    uniforms1["mFresnelPower"].value = uniforms2["mFresnelPower"].value = 2.0;
    uniforms1["mFresnelScale"].value = uniforms2["mFresnelScale"].value = 0.1;


*/				uniforms2["mRefractionRatio"].value = 1.545;
    uniforms2["mFresnelBias"].value = 0.1;
    uniforms2["mFresnelPower"].value = 2.0;
    uniforms2["mFresnelScale"].value = 1.0;
    uniforms1["mRefractionRatio"].value = 1.545;
    uniforms1["mFresnelBias"].value = 0.1;
    uniforms1["mFresnelPower"].value = 2.0;
    uniforms1["mFresnelScale"].value = 1.0;


    uniforms1["tCube"].value = cubeCameraC1.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget
    //define material parameters: shader/uniform
    parameters1 = { fragmentShader: shader1.fragmentShader, vertexShader: shader1.vertexShader, uniforms: uniforms1 };
    var glassMat1 = new THREE.ShaderMaterial(parameters1); // create shadermaterial with parameters
    //				glassMat1.shading = THREE.FlatShading
    /*				glassMat1.side = THREE.DoubleSide
                    parameters2 = { fragmentShader: shader2.fragmentShader, vertexShader: shader2.vertexShader, uniforms: uniforms2, envMap: cubeCameraC2.renderTarget };
                    var glassMat2 = new THREE.ShaderMaterial(parameters2); // create shadermaterial with parameters
                    glassMat2.shading = THREE.FlatShading
                    glassMat2.side = THREE.DoubleSide
    */
    loader.load("brilliant_sn.json", function (geometry) {
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
    //				glassMat2.shading = THREE.FlatShading
    //    				glassMat2.side = THREE.DoubleSide;
    loader.load("brilliant_fn.json", function (geometry) {
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

    display_plane01 = new THREE.Mesh(
        new THREE.PlaneGeometry(20,20),
        new THREE.MeshBasicMaterial({ map: cubeCameraC1.renderTarget})
    );
    scene.add(display_plane01);
    display_plane01.position.x = 10;

    display_plane02 = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshBasicMaterial({ map: cubeCameraC2.renderTarget })
    );
    scene.add(display_plane02);
    display_plane02.position.x = -10;

    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousewheel', onDocumentMouseWheel, false);
    renderer.domElement.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
    renderer.domElement.addEventListener("touchstart", onDocumentTouchDown, true);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

    window.addEventListener('resize', onWindowResized, false);

    sphere.position.x = 0;
    sphere.position.y = -50;
    sphere.position.z = 0;




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
    //			    controls.enabled = false;

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

            //			            controls.enabled = false;

            SELECTED = intersects[0].object;

            plane.position.copy(SELECTED.position);
            plane.lookAt(camera.position);




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
    //			    console.log('in the mouseMove event');
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //

    raycaster.setFromCamera(mouse, camera);

    if (SELECTED) {

        var intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            SELECTED.position.copy(intersects[0].point.sub(offset1))

        }
        //			        console.log('Pos: ' + SELECTED.position);
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
            plane.lookAt(camera.position);

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

        //

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
        //			        console.log('fov: ' + fov);
        camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);

    }

}
function onDocumentMouseUp(event) {
    event.preventDefault();
    //			    controls.enabled = true;

    if (INTERSECTED) {

        plane.position.copy(INTERSECTED.position);

        SELECTED = null;

    }

    container.style.cursor = 'auto';
    mouseIndicatorD = false;
}
function onDocumentTouchUp(event) {
    event.preventDefault();

    //			    controls.enabled = true;

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

    // WebKit

    if (event.wheelDeltaY) {

        fov -= event.wheelDeltaY * 0.05;

        // Opera / Explorer 9

    } else if (event.wheelDelta) {

        fov -= event.wheelDelta * 0.05;

        // Firefox

    } else if (event.detail) {

        fov += event.detail * 1.0;

    }
    //				console.log('w fov: ' + fov);

    camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);

}
function animate() {

    requestAnimationFrame(animate);
    render();

}
function render() {
    display_plane01.lookAt(camera.position);
    display_plane02.lookAt(camera.position);

    //			    controls.update();
    if (!mouseIndicatorD) {


        lon += .15;
    }
    //   console.log('Lon: ' + lon + '\n');
    lat = Math.max(-85, Math.min(85, lat));
    // console.log('lat: ' + lat + '\n');

    phi = THREE.Math.degToRad(90 - lat);
    theta = THREE.Math.degToRad(lon);

    diamondLower.position.copy(diamondUpper.position);

    sphere.rotation.x += 0.02;
    sphere.rotation.y += 0.03;
    // console.log('after sphere rot\n');

    diamondUpper.rotation.x += 0.02;
    diamondUpper.rotation.y += 0.03;
    diamondLower.rotation.x += 0.02;
    diamondLower.rotation.y += 0.03;

    //  console.log('after diamond rot\n');

    camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
    camera.position.y = 100 * Math.cos(phi);
    camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
    //    console.log('after cam pos.\n');

    camera.lookAt(scene.position);
    // console.log('after lookat\n');


    cubeCameraC1.position.copy(diamondUpper.position);// = objects[1].position;
    cubeCameraC2.position.copy(diamondLower.position);//
    cubeCameraS.position.copy(sphere.position);
    display_plane01.visible = false;
    display_plane02.visible = false;
    diamondUpper.visible = false; // *cough*
    cubeCameraC2.updateCubeMap(renderer, scene);
   diamondLower.visible = true; // *cough*
    cubeCameraC1.updateCubeMap(renderer, scene);
    diamondUpper.visible = true; // *cough*

    diamondLower.visible = false; // *cough*
    sphere.visible = false; // *cough*
    cubeCameraS.updateCubeMap(renderer, scene);

    sphere.visible = true; // *cough*
   display_plane01.material.map.needsUpdate = true;
    display_plane02.material.map.needsUpdate = true;
  display_plane01.material.needsUpdate = true;
  display_plane02.material.needsUpdate = true;
 
    display_plane01.needsUpdate = true;
   display_plane02.needsUpdate = true;
    display_plane01.visible = true;
    display_plane02.visible = true;
    renderer.render(scene, camera);

}
