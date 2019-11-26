var container, camera, controls, cubeCameraC1, cubeCameraC2, cubeCameraS, scene, renderer;
var diamondUpper, diamondLower, sphere;
var touch_prev_dist, info;
var altMmesh, bgMmesh;
var objects = [], plane;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
offset1 = new THREE.Vector3(),
INTERSECTED, SELECTED, mouseIndicatorD = false;
var dcDist, dlx, dly, dlz, fovFac = 1.0, distToCamera, dHue = 0x84a5ff, dGlow = 0.5, dRefract = 2.2;

var fov = 70,
isUserInteracting = false,
onMouseDownMouseX = 0, onMouseDownMouseY = 0,
lon = 0, onMouseDownLon = 0,
lat = 0, onMouseDownLat = 0,
phi = 0, theta = 0;
var controlConfig = { Refraction: dRefract, 'Sprite dist.': fovFac, 'Diamond hue': dHue, "Diamond glow": dGlow };
var diamondWatcher;
init();
animate();

//} );
function setRR(rR, upperLimit) {    
    var baseR = 1.0 + (upperLimit - 1) / 1.4 * (rR - 1);
    var retV3 = new THREE.Vector3();//(baseR), (baseR * (1 - (baseR - 1) / (10.0 * upperLimit))), (baseR * (1 - (baseR - 1) / (5.0 * upperLimit))));
    retV3.x=(baseR);
    retV3.y=(baseR * (1 - (baseR - 1) / (5.0 * upperLimit)));
    retV3.z=(baseR * (1 - (baseR - 1) / (2.5 * upperLimit)));
    var logger = document.createElement('div');
    return retV3
}
function setHG(dHueColor, dGlow) {
//    var retV3 = new THREE.Vector3(1 + dHueColor.r * dGlow, 1 + dHueColor.g * dGlow, 1 + dHueColor.b * dGlow);
    var retV3 = new THREE.Vector3(dHueColor.r + dGlow, dHueColor.g + dGlow, dHueColor.b + dGlow);
    return retV3;
}
function init() {
    diamondWatcher = new THREE.Object3D();
    container = document.createElement('div');
    document.body.appendChild(container);
    var dHueColor = new THREE.Color(dHue);
    // instantiate a loader
    var textureLoader = new THREE.TextureLoader();


    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 80000);
    camera.position.y = 100;
    /*				controls = new THREE.OrbitControls(camera);
                    controls.enableZoom = false;
                    controls.noPan = true;
                    controls.noRotate = false;
    */
        camera.add(diamondWatcher);
    //camera.up = new THREE.Vector3(0, 0, 1);
    scene = new THREE.Scene();
    var bgTexture = textureLoader.load('study_uv_sphere_map_coloured.jpg');
    bgMmesh = new THREE.Mesh(new THREE.SphereGeometry(500, 80, 40), new THREE.MeshBasicMaterial({ map: bgTexture }));
    bgMmesh.scale.x = -1;
    bgTexture.mapping = THREE.UVMapping;
    scene.add(bgMmesh);


    var loader = new THREE.JSONLoader();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //	renderer.sortObjects = false;



    cubeCameraS = new THREE.CubeCamera(0.1, 10000, 256);
    //	cubeCameraS.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
    cubeCameraC1 = new THREE.CubeCamera(0.1, 10000, 512);
    cubeCameraC2 = new THREE.CubeCamera(0.1, 10000, 512);
    var pointLight = new THREE.PointLight(0xffffff, 10.0);
    pointLight.position.set(0.0, 400.0, 0.0);
    scene.add(pointLight);


    scene.add(cubeCameraS);
    scene.add(cubeCameraC1);
    scene.add(cubeCameraC2);

    //				document.body.appendChild( renderer.domElement );
    container.appendChild(renderer.domElement);
    info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js r74 </a> DatNet study';
    container.appendChild(info);
   var stoneTex1=textureLoader.load('6.jpg');


     var metalMaterial = new THREE.MeshBasicMaterial({ map: stoneTex1, envMap: cubeCameraS.renderTarget });
     metalMaterial.combine = THREE.AddOperation;
     metalMaterial.reflectivity = 1;

     sphere = new THREE.Mesh(new THREE.SphereGeometry(20, 30, 15), metalMaterial);

    scene.add(sphere);
    objects.push(sphere);



    var shader1 = THREE.FresnelShader2;  //set shader variable to use three.fresnelshader
    uniforms1 = THREE.UniformsUtils.clone(shader1.uniforms);   //clone uniforms from fresnelshader
    var shader2 = THREE.FresnelShader;  //set shader variable to use three.fresnelshader
    uniforms2 = THREE.UniformsUtils.clone(shader2.uniforms);   //clone uniforms from fresnelshader

    

    uniforms1["mRefractionRatio"].value = setRR(dRefract, 1.15);
   uniforms1["mFresnelBias"].value = 0.1;
    uniforms1["mFresnelPower"].value = 2.0;
    uniforms1["mFresnelScale"].value = 1.0;
uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow);

    uniforms2["mRefractionRatio"].value = setRR(dRefract, 1.35);
   uniforms2["mFresnelBias"].value = 0.1;
    uniforms2["mFresnelPower"].value = 2.0;
    uniforms2["mFresnelScale"].value = 1.0;
    uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow);


    var guiControlContainer = new dat.GUI({width: 400});
    guiControlContainer.add(controlConfig, "Refraction", 1.0, 2.4).onChange(function (v) {
        uniforms2["mRefractionRatio"].value = setRR(v, 1.35); uniforms1["mRefractionRatio"].value = setRR(v, 1.15);

    });
    guiControlContainer.add(controlConfig, "Sprite dist.", 0.0, 1.0).onChange(function (v) {fovFac = v;});
    
    guiControlContainer.addColor(controlConfig, 'Diamond hue').onChange(function (v) { dHueColor.setHex(v); uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow); uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow); });
    guiControlContainer.add(controlConfig, "Diamond glow", 0.0, 1.0).onChange(function (v) { dGlow = v; uniforms1["mHueGlow"].value = setHG(dHueColor, dGlow); uniforms2["mHueGlow"].value = setHG(dHueColor, dGlow); });


       uniforms1["tCube_reflect"].value = cubeCameraC2.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget
      uniforms1["tCube_refract"].value = cubeCameraC1.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget
  //   uniforms1["tCube"].value = cubeCameraC1.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget
    //define material parameters: shader/uniform
    parameters1 = { fragmentShader: shader1.fragmentShader, vertexShader: shader1.vertexShader, uniforms: uniforms1 };
    var glassMat1 = new THREE.ShaderMaterial(parameters1); // create shadermaterial with parameters
   //glassMat1.shading = THREE.FlatShading
 //   diamondUpper = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 10), glassMat1);
    loader.load("brilliant_fn.json", function (geometry) {
        diamondUpper = new THREE.Mesh(geometry, glassMat1);
        diamondUpper.position.x = 0;
        diamondUpper.position.y = 50;
        diamondUpper.position.z = 0;
        //        diamondLower.geometry.scale(10, 10, 10);
        scene.add(diamondUpper);
        objects.push(diamondUpper);
    });
    uniforms2["tCube"].value = cubeCameraC2.renderTarget;  //set uniform value cube-texture to use refractsphereCamera.renderTarget
    parameters2 = { fragmentShader: shader2.fragmentShader, vertexShader: shader2.vertexShader, uniforms: uniforms2 };
    var glassMat2 = new THREE.ShaderMaterial(parameters2); // create shadermaterial with parameters
   	//		glassMat2.shading = THREE.FlatShading
    // 				glassMat2.side = THREE.BackSide;
   	//			diamondLower = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 10), glassMat2);
   				loader.load("brilliant_fnp.json", function (geometry) {
   				    diamondLower = new THREE.Mesh(geometry, glassMat2);
   				    diamondLower.position.x = 0;
   				    diamondLower.position.y = 50;
   				    diamondLower.position.z = 0;

 //  				   diamondLower.rotation.x = Math.PI;
//   				    diamondLower.rotation.y = Math.PI;

   				    //        diamondLower.geometry.scale(10, 10, 10);
   				    scene.add(diamondLower);
   				});


    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(plane);
/*    var altBasicMat = new THREE.MeshBasicMaterial({ color: 0, envMap: cubeCameraC1.renderTarget });
    altBasicMat.combine = THREE.AddOperation;
    altBasicMat.reflectivity = 1;
    altMmesh = new THREE.Mesh(new THREE.SphereGeometry(20, 80, 40), altBasicMat);
    altMmesh.scale.x = -1;
    scene.add(altMmesh);
    */

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
         //   plane.lookAt(camera.position);
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
            plane.rotation.copy(camera.rotation);
     //       plane.lookAt(camera.position);


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
    info.ontimeupdate = 1 ;
    //			    controls.update();
    if (!mouseIndicatorD) {


        lon += .15;
    }
    //   console.log('Lon: ' + lon + '\n');
    lat = Math.max(-85, Math.min(85, lat));
    // console.log('lat: ' + lat + '\n');

    phi = THREE.Math.degToRad(90 - lat);
    theta = THREE.Math.degToRad(lon);


    sphere.rotation.x += 0.02;
    sphere.rotation.y += 0.03;
    // console.log('after sphere rot\n');

       diamondUpper.rotation.x += 0.02;
       diamondUpper.rotation.y += 0.03;
       diamondLower.rotation.x += 0.02;
       diamondLower.rotation.y += 0.03;
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
    diamondUpper.visible = false; // *cough*
//    diamondLower.visible = false; // *cough*
    cubeCameraC2.updateCubeMap(renderer, scene);
   diamondLower.visible = true; // *cough*
    cubeCameraC1.updateCubeMap(renderer, scene);
   diamondUpper.visible = true; // *cough*

    diamondLower.visible = false; // *cough*
    sphere.visible = false; // *cough*
    cubeCameraS.updateCubeMap(renderer, scene);

    sphere.visible = true; // *cough*
//    altMmesh.visible = true;
//    bgMmesh.visible = false;
    renderer.render(scene, camera);

}
