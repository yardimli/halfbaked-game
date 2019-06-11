var camera, // We need a camera.
  scene, // The camera has to see something.
  renderer, // Render our graphics.
  controls, // Our Orbit Controller for camera magic.
  container, // Our HTML container for the program.
  rotationPoint;  // The point in which our camera will rotate around.

var loader = new THREE.GLTFLoader();
var loader_texture = new THREE.BasisTextureLoader();
var loaderTexture = new THREE.TextureLoader();

var characterSize = 30;
var outlineSize = characterSize * 0.05;

// Track all objects and collisions.
var objects = [];

// Track click intersects.
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// Store movements.
var movements = [];
var playerSpeed = 3;

// Watch for double clicks.
var clickTimer = null;

// The movement destination indicator.
var indicatorTop;
var indicatorBottom;

var collisions = [];
var main_player = null;

var other_players = [];

init();
animate();


//------------------------------------------------------------------------------------------------------------------------------------------------
function calculateCollisionPoints(mesh, scale, type = 'collision') {
  // Compute the bounding box after scale, translation, etc.
  var bbox = new THREE.Box3().setFromObject(mesh);

  var bounds = {
    type: type,
    xMin: bbox.min.x,
    xMax: bbox.max.x,
    yMin: bbox.min.y,
    yMax: bbox.max.y,
    zMin: bbox.min.z,
    zMax: bbox.max.z,
  };

  collisions.push(bounds);
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function detectCollisions() {
  if (main_player!==null) {
    // Get the user's current collision area.
    var bounds = {
      xMin: rotationPoint.position.x - main_player.geometry.parameters.width / 2,
      xMax: rotationPoint.position.x + main_player.geometry.parameters.width / 2,
      yMin: rotationPoint.position.y - main_player.geometry.parameters.height / 2,
      yMax: rotationPoint.position.y + main_player.geometry.parameters.height / 2,
      zMin: rotationPoint.position.z - main_player.geometry.parameters.width / 2,
      zMax: rotationPoint.position.z + main_player.geometry.parameters.width / 2,
    };

    // Run through each object and detect if there is a collision.
    for (var index = 0; index < collisions.length; index++) {

      if (collisions[index].type == 'collision') {
        if ((bounds.xMin <= collisions[index].xMax && bounds.xMax >= collisions[index].xMin) &&
          (bounds.yMin <= collisions[index].yMax && bounds.yMax >= collisions[index].yMin) &&
          (bounds.zMin <= collisions[index].zMax && bounds.zMax >= collisions[index].zMin)) {
          // We hit a solid object! Stop all movements.
          stopMovement();

          // Move the object in the clear. Detect the best direction to move.
          if (bounds.xMin <= collisions[index].xMax && bounds.xMax >= collisions[index].xMin) {
            // Determine center then push out accordingly.
            var objectCenterX = ((collisions[index].xMax - collisions[index].xMin) / 2) + collisions[index].xMin;
            var playerCenterX = ((bounds.xMax - bounds.xMin) / 2) + bounds.xMin;
            var objectCenterZ = ((collisions[index].zMax - collisions[index].zMin) / 2) + collisions[index].zMin;
            var playerCenterZ = ((bounds.zMax - bounds.zMin) / 2) + bounds.zMin;

            // Determine the X axis push.
            if (objectCenterX > playerCenterX) {
              rotationPoint.position.x -= 1;
            }
            else {
              rotationPoint.position.x += 1;
            }
          }
          if (bounds.zMin <= collisions[index].zMax && bounds.zMax >= collisions[index].zMin) {
            // Determine the Z axis push.
            if (objectCenterZ > playerCenterZ) {
              rotationPoint.position.z -= 1;
            }
            else {
              rotationPoint.position.z += 1;
            }
          }
        }
      }
    }
  }
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function createOtherCharacter(name, model_file, width, height, position, rotate, collidable) {

  var geometry = new THREE.PlaneGeometry(width, height, 2);
  var texture = new THREE.TextureLoader().load(model_file);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: texture});
  material.transparent = true;

  var new_player = new THREE.Mesh(geometry, material);

  new_player.rotation.set(THREE.Math.degToRad(rotate.x), THREE.Math.degToRad(rotate.y), THREE.Math.degToRad(rotate.z));

  new_player.position.x = position.x;				    //Position (x = right+ left-)
  new_player.position.y = position.y;				    //Position (y = up+, down-)
  new_player.position.z = position.z;				    //Position (z = front +, back-)

  if (collidable) {
    calculateCollisionPoints(new_player);
  }

//  other_players.push({xname:name, mesh:new_player});

  new_player.name = name;

  scene.add(new_player);
//    rotationPoint.add(main_player);

}


//------------------------------------------------------------------------------------------------------------------------------------------------
function createCharacter(model_file, width, height, position, rotate) {
  // var geometry = new THREE.BoxBufferGeometry(characterSize, characterSize, characterSize);

  var geometry = new THREE.PlaneGeometry(width, height, 2);
  var texture = new THREE.TextureLoader().load(model_file);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: texture});
  material.transparent = true;


  main_player = new THREE.Mesh(geometry, material);

  main_player.rotation.set(THREE.Math.degToRad(rotate.x), THREE.Math.degToRad(rotate.y), THREE.Math.degToRad(rotate.z));

//    main_player.position.x = position.x;				    //Position (x = right+ left-)
  main_player.position.y = position.y;				    //Position (y = up+, down-)
//    main_player.position.z = position.z;				    //Position (z = front +, back-)

  main_player.name = "main_player";

//    scene.add( main_player );
  rotationPoint.add(main_player);
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function loadGLTF(name, model_file, position, scale, rotate, collidable) {
  loader.load(model_file, function (gltf) {             // <<--------- Model Path
    var object = gltf.scene;
    gltf.scene.scale.set(scale.x, scale.y, scale.z);

    gltf.scene.rotation.set(THREE.Math.degToRad(rotate.x), THREE.Math.degToRad(rotate.y), THREE.Math.degToRad(rotate.z));

    gltf.scene.position.x = position.x;				    //Position (x = right+ left-)
    gltf.scene.position.y = position.y;				    //Position (y = up+, down-)
    gltf.scene.position.z = position.z;				    //Position (z = front +, back-)

  //  gltf.name = name;
    scene.add(gltf.scene);

    if (collidable) {
      calculateCollisionPoints(gltf.scene);
    }

    const root = gltf.scene;
    root.traverse((obj) => {
      if (obj.castShadow !== undefined) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

  });
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function createFloor() {
  //ground
  var groundTexture = loaderTexture.load('./threejs/examples/textures/terrain/grasslight-big.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(25, 25);
  groundTexture.anisotropy = 16;
  var groundMaterial = new THREE.MeshLambertMaterial({map: groundTexture});
  var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000), groundMaterial);
  plane.position.y = -1;
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  plane.name = "plane";

  scene.add(plane);
  objects.push(plane);
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function drawIndicator() {
  // Store variables.
  var topSize = 2;
  var bottomRadius = 3;

  // Create the top indicator.
  var geometry = new THREE.TetrahedronGeometry(topSize, 0);
  var material = new THREE.MeshToonMaterial({color: 0x00ccff, emissive: 0x00ccff});
  indicatorTop = new THREE.Mesh(geometry, material);
  indicatorTop.position.y = 50; // Flat surface so hardcode Y position for now.
  indicatorTop.position.x = movements[0].x; // Get the X destination.
  indicatorTop.position.z = movements[0].z; // Get the Z destination.
  indicatorTop.rotation.x = -0.97;
  indicatorTop.rotation.y = Math.PI / 4;
  indicatorTop.name = 'indicator_top';
  scene.add(indicatorTop);

  // Create the top indicator outline.
  var geometry = new THREE.TetrahedronGeometry(topSize + outlineSize, 0);
  var material = new THREE.MeshBasicMaterial({color: 0x0000000, side: THREE.BackSide});
  var outlineTop = new THREE.Mesh(geometry, material);
  indicatorTop.add(outlineTop);

  // Create the bottom indicator.
  var geometry = new THREE.TorusGeometry(bottomRadius, (bottomRadius * 0.25), 2, 12);
  geometry.dynamic = true;
  var material = new THREE.MeshToonMaterial({color: 0x00ccff, emissive: 0x00ccff});
  indicatorBottom = new THREE.Mesh(geometry, material);
  indicatorBottom.position.y = 3;
  indicatorBottom.position.x = movements[0].x;
  indicatorBottom.position.z = movements[0].z;
  indicatorBottom.rotation.x = -Math.PI / 2;
  indicatorBottom.name = 'indicator_bottom';
  scene.add(indicatorBottom);

  // Create the bottom outline.
  var geometry = new THREE.TorusGeometry(bottomRadius + outlineSize / 10, bottomRadius / 2.5, 2, 24);
  var material = new THREE.MeshBasicMaterial({color: 0x0000000, side: THREE.BackSide});
  var outlineBottom = new THREE.Mesh(geometry, material);
  outlineBottom.position.z = -2;
  outlineBottom.name = 'outlineBottom';
  indicatorBottom.add(outlineBottom);
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function onDocumentMouseDown(event, bypass = false) {
  event.preventDefault();
  stopMovement();
  // Grab the coordinates.
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // Use the raycaster to detect intersections.
  raycaster.setFromCamera(mouse, camera);

  // Grab all objects that can be intersected.
  var intersects = raycaster.intersectObjects(objects);
  if (intersects.length > 0) {

    connection.send(JSON.stringify({
      type: "userPosition",
      posX: intersects[0].point.x,
      posY: intersects[0].point.y,
      posZ: intersects[0].point.z
    }));

    movements.push(intersects[0].point);
  }
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function stopMovement() {
  movements = [];

  scene.remove(indicatorTop);
  scene.remove(indicatorBottom);
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function move(location, destination, speed = playerSpeed) {
  var moveDistance = speed;

  // Translate over to the position.
  var posX = location.position.x;
  var posZ = location.position.z;
  var newPosX = destination.x;
  var newPosZ = destination.z;

  // Set a multiplier just in case we need negative values.
  var multiplierX = 1;
  var multiplierZ = 1;

  // Detect the distance between the current pos and target.
  var diffX = Math.abs(posX - newPosX);
  var diffZ = Math.abs(posZ - newPosZ);
  var distance = Math.sqrt(diffX * diffX + diffZ * diffZ);

  // Use negative multipliers if necessary.
  if (posX > newPosX) {
    multiplierX = -1;
  }

  if (posZ > newPosZ) {
    multiplierZ = -1;
  }

  // Update the main position.
  location.position.x = location.position.x + (moveDistance * (diffX / distance)) * multiplierX;
  location.position.z = location.position.z + (moveDistance * (diffZ / distance)) * multiplierZ;

  // If the position is close we can call the movement complete.
  if ((Math.floor(location.position.x) <= Math.floor(newPosX) + 2.5 &&
    Math.floor(location.position.x) >= Math.floor(newPosX) - 2.5) &&
    (Math.floor(location.position.z) <= Math.floor(newPosZ) + 2.5 &&
      Math.floor(location.position.z) >= Math.floor(newPosZ) - 2.5)) {
    location.position.x = Math.floor(location.position.x);
    location.position.z = Math.floor(location.position.z);

    // Reset any movements.
    console.log("stop move");
    stopMovement();

    // Maybe move should return a boolean. True if completed, false if not.
  }
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function init() {
  // Build the container
  container = document.createElement('div');
  document.body.appendChild(container);

  // Create the scene.
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0xcce0ff);
  scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
  scene.add(new THREE.AmbientLight(0x666666));

  //lights
  var light = new THREE.DirectionalLight(0xdfebff, 1);
  light.position.set(30, 100, 100);
  light.position.multiplyScalar(1.3);
  light.castShadow = true;

  light.shadow.bias = -0.4;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  var d = 300;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.far = 1000;
  light.name = "light1";
  scene.add(light);

  const color = 0xFFFFFF;
  const intensity = 1;
  const light2 = new THREE.DirectionalLight(color, intensity);
  light2.castShadow = true;
  light2.position.set(-250, 800, -850);
  light2.target.position.set(-550, 40, -450);

  light2.shadow.bias = -0.004;
  light2.shadow.mapSize.width = 2048;
  light2.shadow.mapSize.height = 2048;

  light2.name = "light2";

  scene.add(light2);
  scene.add(light2.target);

  const cam = light2.shadow.camera;
  cam.near = 1;
  cam.far = 2000;
  cam.left = -1500;
  cam.right = 1500;
  cam.top = 1500;
  cam.bottom = -1500;

  // const dirLightHelper = new THREE.DirectionalLightHelper(light2, 1);
  // dirLightHelper.name = "light helper";
  // scene.add(dirLightHelper);


  //skybox
  var urls = ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'];
  var loaderCube = new THREE.CubeTextureLoader().setPath('./threejs/examples/textures/cube/skyboxsun25deg/');
  loaderCube.load(urls, function (texture) {
    scene.background = texture;
  });


  // Create a rotation point.
  rotationPoint = new THREE.Object3D();
  rotationPoint.position.set(0, 0, 0);
  scene.add(rotationPoint);

  // createCharacter('./character1.png', 35, 50, new THREE.Vector3(0, 20, 155), new THREE.Vector3(0, 0, 0));
  //
  // createOtherCharacter("char2", "./character2.png", 35, 50, new THREE.Vector3(155, 20, 5), new THREE.Vector3(0, 0, 0), true);
  // createOtherCharacter("char3", "./character3.png", 35, 50, new THREE.Vector3(-185, 20, 25), new THREE.Vector3(0, 0, 0), true);
  // createOtherCharacter("char4", "./character4.png", 35, 50, new THREE.Vector3(-255, 20, 115), new THREE.Vector3(0, 0, 0), true);
  // createOtherCharacter("char5", "./character5.png", 35, 50, new THREE.Vector3(255, 20, 55), new THREE.Vector3(0, 0, 0), true);
  // createOtherCharacter("char6", "./character6.png", 35, 50, new THREE.Vector3(305, 20, -25), new THREE.Vector3(0, 0, 0), true);

  createFloor();
  loadGLTF('SF_Prop_SignPost_01', './gltf_lib/sign/SF_Prop_SignPost_01.gltf', new THREE.Vector3(105, 0, 5), new THREE.Vector3(1000, 1000, 1000), new THREE.Vector3(0, 0, 0), true);
  loadGLTF('SF_Veh_HouseWagon_01', './gltf_lib/wagon2/SF_Veh_HouseWagon_01.gltf', new THREE.Vector3(145, 0, -255), new THREE.Vector3(1000, 1000, 1000), new THREE.Vector3(0, 90, 0), true);
  loadGLTF('SF_Bld_House_Windmill_01', './gltf_lib/windmill/SF_Bld_House_Windmill_01.gltf', new THREE.Vector3(-60, 0, -355), new THREE.Vector3(1000, 1000, 1000), new THREE.Vector3(0, 60, 0), true);


  loadGLTF('scene', './gltf_lib/scene/scene.gltf', new THREE.Vector3(0, 300, -1000), new THREE.Vector3(0.1, 0.1, 0.1), new THREE.Vector3(0, 0, 0), true);

  // Create the camera.
  camera = new THREE.PerspectiveCamera(
    30, // Angle
    window.innerWidth / window.innerHeight, // Aspect Ratio.
    1, // Near view.
    2000000 // Far view.
  );
  // Move the camera away from the center of the scene.
  camera.position.set(0, 100, 800);
  //    main_player.add(camera);


  // Build the renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  var element = renderer.domElement;
  container.appendChild(element);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaFactor = 3.2;

  // Build the controls.
  controls = new THREE.OrbitControls(camera, element);

  controls.maxPolarAngle = Math.PI * 0.5;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.maxDistance = 5000; // Set our max zoom out distance (mouse scroll)
  controls.minDistance = 300; // Set our min zoom in distance (mouse scroll)
  controls.target = new THREE.Vector3(0, 2, 0);

  //    controls.target.copy(new THREE.Vector3(0, 0, 0));
  // controls.target.copy(new THREE.Vector3(0, characterSize / 2, 0));


  $(document).dblclick(function (event) {
    onDocumentMouseDown(event);
  });

}


//------------------------------------------------------------------------------------------------------------------------------------------------
window.onresize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

//------------------------------------------------------------------------------------------------------------------------------------------------
function update() {
  camera.updateProjectionMatrix();
}

var WindMillRotation = 0;

//------------------------------------------------------------------------------------------------------------------------------------------------
function render() {
  renderer.render(scene, camera);

  // Don't let the camera go too low.
  // if (camera.position.y < 10) {
  //   camera.position.y = 10;
  // }

  scene.traverse(function (node) {
    if (node instanceof THREE.Mesh) {
//      console.log(node.name);
      if (node.name==="SF_Bld_House_Windmill_01") {
        WindMillRotation = WindMillRotation + 0.1;
        node.rotation.y = THREE.Math.degToRad(WindMillRotation);
      }
    }
  });

  // If any movement was added, run it!
  if (movements.length > 0) {
    // Set an indicator point to destination.
    if (scene.getObjectByName('indicator_top') === undefined) {
      drawIndicator();
    }
    else {
      if (indicatorTop.position.y > 2) {
        indicatorTop.position.y -= 2;
      }
      else {
        indicatorTop.position.y = 50;
      }
    }

    move(rotationPoint, movements[0]);
  }

  // Detect collisions.
  if (collisions.length > 0) {
    detectCollisions();
  }

}

//------------------------------------------------------------------------------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  update();
  render();
}
