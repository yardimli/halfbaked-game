/*
TODO:

- dropdown with all scene objects, auto select and focus on dropdown selected object ....ok
- make objects fixed (mouse move wont work) .............................................ok
- edit name of scene objects save it to the mesh

- save scene to php => json file
- load scene from json file

- collision checkbox for items
- load one player into editor scene (allow to move around and enable/disable collision detection)

- popup json editor for light sources, camera and camera controls. background, add update button. save/load with scene






 */


var camera, // We need a camera.
  scene, // The camera has to see something.
  renderer, // Render our graphics.
  controls, // Our Orbit Controller for camera magic.
  transform_controls,
  container, // Our HTML container for the program.
  rotationPoint;  // The point in which our camera will rotate around.

var loader = new THREE.GLTFLoader();
var loaderTexture = new THREE.TextureLoader();

var characterSize = 30;
var outlineSize = characterSize * 0.05;

// Track all objects and collisions.
var objects = [];
var drag_objects = [];
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

var json_objects;

var IgnoreThisClick = false;

$(document).ready(function () {
  init();
  animate();
});


//------------------------------------------------------------------------------------------------------------------------------------------------
var HemisphereLight1;
var DirectionalLight1;
var DirectionalLight1Helper;
var PointLight1;
var PointLight1Helper;
var composer, effectFXAA, outlinePass, outlinePassSelected;

var Outline_mouse = new THREE.Vector2();
var Outline_selectedObjects = [];
var Outline_selectedObject_temp;

//------------------------------------------------------------------------------------------------------------------------------------------------
function makeXYZGUI(folder, vector3, onChangeFn) {
  folder.add(vector3, 'x', -500, 500).onChange(onChangeFn);
  folder.add(vector3, 'y', 0, 500).onChange(onChangeFn);
  folder.add(vector3, 'z', -500, 500).onChange(onChangeFn);
  folder.open();
}


//------------------------------------------------------------------------------------------------------------------------------------------------
class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }

  get value() {
    return `#${this.object[this.prop].getHexString()}`;
  }

  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------------
function updateLight() {
  DirectionalLight1.target.updateMatrixWorld();
  DirectionalLight1Helper.update();
  PointLight1Helper.update();
}

//------------------------------------------------------------------------------------------------------------------------------------------------
function AddLights() {

  const skyColor = 0xB1E1FF;  // light blue
  const groundColor = 0xB97A20;  // brownish orange
  const HemisphereLight_intensity = 1;

  HemisphereLight1 = new THREE.HemisphereLight(skyColor, groundColor, HemisphereLight_intensity);
  scene.add(HemisphereLight1);

  const color = 0xFFFFFF;
  const DirectionalLight_intensity = 1;
  DirectionalLight1 = new THREE.DirectionalLight(color, DirectionalLight_intensity);
  DirectionalLight1.position.set(0, 250, 0);
  DirectionalLight1.target.position.set(-5, 0, 0);
  scene.add(DirectionalLight1);
  scene.add(DirectionalLight1.target);

  DirectionalLight1Helper = new THREE.DirectionalLightHelper(DirectionalLight1);
  scene.add(DirectionalLight1Helper);


  const PointLight1_color = 0xFFFFFF;
  const PointLight1_intensity = 1;
  PointLight1 = new THREE.PointLight(PointLight1_color, PointLight1_intensity, 0, 2);
  PointLight1.position.set(0, 250, 0);
  PointLight1.castShadow = true;
  scene.add(PointLight1);

  PointLight1.shadow.mapSize.width = 512;  // default
  PointLight1.shadow.mapSize.height = 512; // default
  PointLight1.shadow.camera.near = 0.5;       // default
  PointLight1.shadow.camera.far = 1000;      // default

  PointLight1Helper = new THREE.PointLightHelper(PointLight1);
  scene.add(PointLight1Helper);

  if (1 == 2) {
    //light controls
    const gui = new dat.GUI();
    var folder = gui.addFolder("Lights");

    var person = {name: 'Hemisphere Light'};
    folder.add(person, 'name');

    folder.add(HemisphereLight1, 'intensity', 0, 2, 0.01);

    folder.addColor(new ColorGUIHelper(HemisphereLight1, 'color'), 'value').name('skyColor');
    folder.addColor(new ColorGUIHelper(HemisphereLight1, 'groundColor'), 'value').name('groundColor');

    var person = {name: 'Directional Light'};
    folder.add(person, 'name');

    folder.addColor(new ColorGUIHelper(DirectionalLight1, 'color'), 'value').name('color');
    folder.add(DirectionalLight1, 'intensity', 0, 2, 0.01);

    var person = {name: 'Directional Light Position'};
    folder.add(person, 'name');

    makeXYZGUI(folder, DirectionalLight1.position, updateLight);

    var person = {name: 'Directional Light Target'};
    folder.add(person, 'name');

    makeXYZGUI(folder, DirectionalLight1.target.position, updateLight);

    var person = {name: 'Point Light'};
    folder.add(person, 'name');

    folder.addColor(new ColorGUIHelper(PointLight1, 'color'), 'value').name('color');
    folder.add(PointLight1, 'intensity', 0, 2, 0.01);
    makeXYZGUI(gui, PointLight1.position, updateLight);

    gui.close();
  }

  updateLight();

}


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
  if (main_player !== null) {
    // Get the user's current collision area.
    var bounds = {
      xMin: main_player.position.x - main_player.geometry.parameters.width / 2,
      xMax: main_player.position.x + main_player.geometry.parameters.width / 2,
      yMin: main_player.position.y - main_player.geometry.parameters.height / 2,
      yMax: main_player.position.y + main_player.geometry.parameters.height / 2,
      zMin: main_player.position.z - main_player.geometry.parameters.width / 2,
      zMax: main_player.position.z + main_player.geometry.parameters.width / 2,
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
              main_player.position.x -= 1;
            }
            else {
              main_player.position.x += 1;
            }
          }
          if (bounds.zMin <= collisions[index].zMax && bounds.zMax >= collisions[index].zMin) {
            // Determine the Z axis push.
            if (objectCenterZ > playerCenterZ) {
              main_player.position.z -= 1;
            }
            else {
              main_player.position.z += 1;
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

  main_player.position.x = position.x;				    //Position (x = right+ left-)
  main_player.position.y = position.y;				    //Position (y = up+, down-)
  main_player.position.z = position.z;				    //Position (z = front +, back-)

  main_player.name = "main_player";

//  rotationPoint.position.set(position.x, position.y, position.z);

  scene.add(main_player);
  //rotationPoint.add(main_player);
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function loadGLTF(name, model_file, position, scale, rotate, collidable) {
  loader.load(model_file, function (gltf) {             // <<--------- Model Path
    var object = gltf.scene;

//    gltf.geometry.center();

    scene.add(gltf.scene);

    if (collidable) {
      calculateCollisionPoints(gltf.scene);
    }


    const root = gltf.scene;

    var AssignNameToFirst = true;
    root.traverse((obj) => {
      if (obj.isMesh) {
        drag_objects.push(obj);

        obj.scale.set(scale.x, scale.y, scale.z);
        obj.geometry.center();

        var box = new THREE.Box3().setFromObject(obj);
        var boxsize = new THREE.Vector3();
        box.getSize(boxsize);

        obj.position.x = position.x;				    //Position (x = right+ left-)
        obj.position.y = position.y + ((Math.round(boxsize.y * 10000) / 10000) / 2);				    //Position (y = up+, down-)
        obj.position.z = position.z;				    //Position (z = front +, back-)

        obj.rotation.x = THREE.Math.degToRad(rotate.x);
        obj.rotation.y = THREE.Math.degToRad(rotate.y);
        obj.rotation.z = THREE.Math.degToRad(rotate.z);

        obj.userData.canMove = "can_move";

        Outline_selectedObject_temp = obj;
        Outline_addSelectedObject(Outline_selectedObject_temp);
        // outlinePass.selectedObjects = Outline_selectedObjects;
        SelectObject();

      }

      if (obj.type === "Scene") {
        // if (obj.userData !== undefined) {
        //   if (AssignNameToFirst) {
        // console.log("!!!!!!!!!!!!!!");
        // console.log(name);
        // console.log(obj.uuid);
        obj.userData.object_name = name;
        AssignNameToFirst = false;
        // }
        // }
      }

      if (obj.castShadow !== undefined) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    logOnce = 1;

    $("#all_objects").find('option').remove();
    for (var i=0; i<drag_objects.length; i++) {
      $("#all_objects").append('<option value="' + drag_objects[i].id + '" data-userdata_name="' + drag_objects[i].userData.name + '" >' + drag_objects[i].userData.name + "(" + drag_objects[i].id+ ")" + '</option>');
    }
    SelectObject();



//    console.log(gltf.scene);

  });
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function createFloor() {
  var geo = new THREE.PlaneBufferGeometry(20000, 20000, 8, 8);
  var mat = new THREE.MeshBasicMaterial({color: 0x5A6450});
  var plane = new THREE.Mesh(geo, mat);
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
function Outline_addSelectedObject(object) {
  Outline_selectedObjects = [];

  if (object.userData.canMove !== "fixed") {
    Outline_selectedObjects.push(object);
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------------
function Outline_checkIntersection(event) {

  var x, y;
  if (event.changedTouches) {
    x = event.changedTouches[0].pageX;
    y = event.changedTouches[0].pageY;
  }
  else {
    x = event.clientX;
    y = event.clientY;
  }
  Outline_mouse.x = (x / (window.innerWidth - 250)) * 2 - 1;
  Outline_mouse.y = -(y / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(Outline_mouse, camera);
  var intersects = raycaster.intersectObjects(drag_objects, true);
  if (intersects.length > 0) {

    Outline_selectedObject_temp = intersects[0].object;
    Outline_addSelectedObject(Outline_selectedObject_temp);
    // outlinePass.selectedObjects = Outline_selectedObjects;
  }
  else {
    // console.log("set selected object to null");
    Outline_selectedObject_temp = null;
    Outline_selectedObjects = [];
  }
}


//------------------------------------------------------------------------------------------------------------------------------------------------
function Outline_onTouchMove(event) {

  var x, y;
  if (event.changedTouches) {
    x = event.changedTouches[0].pageX;
    y = event.changedTouches[0].pageY;
  }
  else {
    x = event.clientX;
    y = event.clientY;
  }
  Outline_mouse.x = (x / (window.innerWidth - 250)) * 2 - 1;
  Outline_mouse.y = -(y / window.innerHeight) * 2 + 1;
  Outline_checkIntersection();
}

function radians_to_degrees(radians) {
  var pi = Math.PI;
  return radians * (180 / pi);
}

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

function fitCameraToSelection(camera, controls, selection, fitOffset = 1.2) {

  const box = new THREE.Box3();

  for (const object of selection) box.expandByObject(object);

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

  const direction = controls.target.clone()
    .sub(camera.position)
    .normalize()
    .multiplyScalar(distance);

//  controls.maxDistance = distance * 10;
  controls.target.copy(center);

  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  camera.position.copy(controls.target).sub(direction);

  controls.update();
}


function updateSet(setName) {
  $("#object_file").find('option').remove();
  $("#object_group").find('option').remove();

  for (var key in sets) {
    if (sets[key].name === setName) {
      for (var key2 in sets[key].groups) {
        $("#object_group").append('<option value="' + sets[key].groups[key2].name + '">' + sets[key].groups[key2].name + '</option>');
//          console.log(sets[key].groups[key2].name);
      }
    }
  }
}

function updateSetGroup() {
  $("#object_file").find('option').remove();
  for (var key in sets) {
    if (sets[key].name === $("#object_set").val()) {

      for (var key2 in sets[key].groups) {
        if (sets[key].groups[key2].name === $("#object_group").val()) {
          // console.log(sets[key].groups[key2].name);
          // console.log(sets[key].groups[key2]);

          for (var key3 in sets[key].groups[key2].folders) {

            $("#object_file").append('<option value="' + sets[key].groups[key2].folders[key3] + '">' + sets[key].groups[key2].folders[key3] + '</option>');
            // console.log(sets[key].groups[key2].folders[key3]);
          }
        }
      }
    }
  }
}

function SelectObject() {
  if (Outline_selectedObject_temp !== null) {
    outlinePassSelected.selectedObjects = [];
    outlinePassSelected.selectedObjects = [Outline_selectedObject_temp];

    console.log("select object");

    $("#object_name").val(Outline_selectedObject_temp.userData.name);

    $('#all_objects option[value="'+Outline_selectedObject_temp.id+'"]').prop('selected', true);




    var position = new THREE.Vector3();
    position.setFromMatrixPosition(Outline_selectedObject_temp.matrixWorld);

    $("#position_x").val(Math.round(position.x * 10000) / 10000);
    $("#position_y").val(Math.round(position.y * 10000) / 10000);
    $("#position_z").val(Math.round(position.z * 10000) / 10000);


    var box = new THREE.Box3().setFromObject(Outline_selectedObject_temp);
//      console.log( box.min, box.max, box.getSize() );
    var boxsize = new THREE.Vector3();
    box.getSize(boxsize);


    $("#size_x").val(Math.round(Outline_selectedObject_temp.scale.x * 100) / 100);
    $("#size_y").val(Math.round(Outline_selectedObject_temp.scale.y * 100) / 100);
    $("#size_z").val(Math.round(Outline_selectedObject_temp.scale.z * 100) / 100);

    $("#size_x_hint").html(Math.round(boxsize.x * 10000) / 10000);
    $("#size_y_hint").html(Math.round(boxsize.y * 10000) / 10000);
    $("#size_z_hint").html(Math.round(boxsize.z * 10000) / 10000);


    $("#rotate_x").val(radians_to_degrees(Outline_selectedObject_temp.rotation.x));
    $("#rotate_y").val(radians_to_degrees(Outline_selectedObject_temp.rotation.y));
    $("#rotate_z").val(radians_to_degrees(Outline_selectedObject_temp.rotation.z));

    $('#object_fixed option[value="'+Outline_selectedObject_temp.userData.canMove+'"]').prop('selected', true);
  }
  else {
    outlinePassSelected.selectedObjects = [];
    outlinePass.selectedObjects = [];

    $("#object_name").val("");

    $("#position_x").val("");
    $("#position_y").val("");
    $("#position_z").val("");

    $("#size_x").val("");
    $("#size_y").val("");
    $("#size_z").val("");

    $("#size_x_hint").html("");
    $("#size_y_hint").html("");
    $("#size_z_hint").html("");

    $("#rotate_x").val("");
    $("#rotate_y").val("");
    $("#rotate_z").val("");

  }
}

//------------------------------------------------------------------------------------------------------------------------------------------------
function init() {
  // Build the container
  container = $("#GameContainer");
  // document.createElement('div');
  // document.body.appendChild(container);

  var width = window.innerWidth - 250;
  var height = window.innerHeight;

  renderer = new THREE.WebGLRenderer(); //{antialias: true}
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
//  renderer.gammaFactor = 3.2;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  container.append(renderer.domElement);

  // Create the scene.
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0xcce0ff);
  scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
  // scene.add(new THREE.AmbientLight(0x666666));


  const fov = 45;
  const aspect = (window.innerWidth - 250) / window.innerHeight; //2;  // the canvas default
  const near = 1; //1
  const far = 10000; //200000
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(300, 75, 600);
//  camera.lookAt(1500,200,500);
//    main_player.add(camera);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.maxDistance = 5000; // Set our max zoom out distance (mouse scroll)
  // controls.minDistance = 300; // Set our min zoom in distance (mouse scroll)

  controls.rotateSpeed = 0.05;

  controls.maxPolarAngle = Math.PI * 0.5;
  controls.enablePan = true;
  controls.panSpeed = 0.3;
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  controls.zoomSpeed = 0.6;

  controls.target = new THREE.Vector3(300, 2, 0);

  controls.update();

  AddLights();

  //skybox
  var urls = ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'];
  var loaderCube = new THREE.CubeTextureLoader().setPath('./threejs/examples/textures/cube/skyboxsun25deg/');
  loaderCube.load(urls, function (texture) {
    scene.background = texture;
  });


  // Create a rotation point.
  // rotationPoint = new THREE.Object3D();
  // rotationPoint.position.set(0, 0, 0);
  // scene.add(rotationPoint);

  // createCharacter('./character1.png', 35, 50, new THREE.Vector3(0, 20, 155), new THREE.Vector3(0, 0, 0));
  // createOtherCharacter("char2", "./character2.png", 35, 50, new THREE.Vector3(155, 20, 5), new THREE.Vector3(0, 0, 0), true);


  createFloor();

  $.ajax({
    type: "GET",
    url: "game_map.json",
    headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
    dataType: 'json',
    success: function (response) {
      for (var i = 0; i < response.length; i++) {
        var RepeatX = 0;
        var RepeatY = 0;
        var RepeatZ = 0;

        response[i].Repeat = 1;
        for (var j = 0; j < response[i].Repeat; j++) {

          loadGLTF(response[i].Name, response[i].FileName, new THREE.Vector3(response[i].Position[0] + RepeatX, response[i].Position[1] + RepeatY, response[i].Position[2] + RepeatZ), new THREE.Vector3(response[i].Scale[0], response[i].Scale[1], response[i].Scale[2]), new THREE.Vector3(response[i].Rotate[0], response[i].Rotate[1], response[i].Rotate[2]), response[i].Collision);

          RepeatX += response[i].RepeatSpacing[0];
          RepeatY += response[i].RepeatSpacing[1];
          RepeatZ += response[i].RepeatSpacing[2];
        }
      }
    }
  });

  // loadGLTF('Stall', './gltf_lib2/Stall/Stall.gltf', new THREE.Vector3(450, 0, 5), new THREE.Vector3(1000, 1000, 1000), new THREE.Vector3(0, 0, 0), true);
  // loadGLTF('scene', './gltf_lib/scene/scene.gltf', new THREE.Vector3(0, 300, -1000), new THREE.Vector3(0.1, 0.1, 0.1), new THREE.Vector3(0, 0, 0), true);


  // postprocessing
  composer = new THREE.EffectComposer(renderer);

  var renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new THREE.OutlinePass(new THREE.Vector2((window.innerWidth - 250), window.innerHeight), scene, camera);
  composer.addPass(outlinePass);

  outlinePass.edgeStrength = 3;
  outlinePass.edgeGlow = 1.0;
  outlinePass.edgeThickness = 1.0;
  outlinePass.pulsePeriod = 0;
  outlinePass.usePatternTexture = true;
  outlinePass.visibleEdgeColor.set('#ffffff');
  outlinePass.hiddenEdgeColor.set('#190a05');


  outlinePassSelected = new THREE.OutlinePass(new THREE.Vector2((window.innerWidth - 250), window.innerHeight), scene, camera);
  composer.addPass(outlinePassSelected);

  outlinePassSelected.edgeStrength = 1;
  outlinePassSelected.edgeGlow = 0.5;
  outlinePassSelected.edgeThickness = 1.0;
  outlinePassSelected.pulsePeriod = 2;
  outlinePassSelected.usePatternTexture = false;
  outlinePassSelected.visibleEdgeColor.set('#00ffff');
  outlinePassSelected.hiddenEdgeColor.set('#190a05');


  var onLoad = function (texture) {
    outlinePass.patternTexture = texture;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  };

  var loader2 = new THREE.TextureLoader();
  loader2.load('./threejs/examples/textures/tri_pattern.jpg', onLoad);
  effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
  effectFXAA.uniforms['resolution'].value.set(1 / (window.innerWidth - 250), 1 / window.innerHeight);
  composer.addPass(effectFXAA);

  window.addEventListener('resize', onWindowResize, false);

  // window.addEventListener('mousemove', Outline_onTouchMove);
  // window.addEventListener('touchmove', Outline_onTouchMove);
//  Outline_selectedObjects
  var dragControls = new THREE.DragControls(Outline_selectedObjects, camera, renderer.domElement);
  dragControls.addEventListener('dragstart', function () {
    if (Outline_selectedObject_temp!==null) {

      if (Outline_selectedObject_temp.userData.canMove === "fixed") {
        return false;
      }

    } else {
      return false;
    }
    IgnoreThisClick = true;
    controls.enabled = false;
  });

  dragControls.addEventListener('dragend', function (object) {
    console.log(object);
//    object.position.y=0;
    controls.enabled = true;
  });

  $(document).dblclick(function (event) {
    onDocumentMouseDown(event);
  });

  $("#rotate_camera").on('click',function () {
    if (controls.enableRotate) {
      $("#rotate_camera").html("Enable Rotate");
      controls.enableRotate = false;
    } else
    {
      $("#rotate_camera").html("Disable Rotate");
      controls.enableRotate = true;
    }
  });

  $("#object_set").on("change", function () {
    updateSet($(this).val());
    updateSetGroup();
  });

  $("#object_group").on("change", function () {
    updateSetGroup()
  });

  $("#all_objects").on("change", function () {
    console.log($(this).val());

    Outline_selectedObject_temp = scene.getObjectById( parseInt( $(this).val(),10), true );
    Outline_addSelectedObject(Outline_selectedObject_temp);
    // outlinePass.selectedObjects = Outline_selectedObjects;
    SelectObject();

  });

  updateSet("set1");
  updateSetGroup();

  $("#add_object").on("click", function () {
//    console.log("add new "+$("#object_file").val()+" "+$("#object_file option:selected").attr("id"));

    var scaleFactor = "";
    if ($("#object_set").val() === "set1") {
      scaleFactor = new THREE.Vector3(1000, 1000, 1000);
    }

    if ($("#object_set").val() === "set2") {
      scaleFactor = new THREE.Vector3(50, 50, 50);
    }

    if ($("#object_set").val() === "set3") {
      scaleFactor = new THREE.Vector3(0.5, 0.5, 0.5);
    }

    loadGLTF($("#object_file").val(), "./library/" + $("#object_set").val() + "/" + $("#object_group").val() + "/" + $("#object_file").val() + "/" + $("#object_file").val() + ".gltf", new THREE.Vector3(0, 0, 0), scaleFactor, new THREE.Vector3(0, 0, 0), true);

  });

  $("#object_fixed").on("change", function () {
    if (Outline_selectedObject_temp !== null) {
      Outline_selectedObject_temp.userData.canMove = $(this).val();
      console.log($(this).val());
    }
  });

  $("#object_name").on('change',function () {
    if (Outline_selectedObject_temp !== null) {
      Outline_selectedObject_temp.userData.name = $(this).val();
      $('#all_objects option[value="'+ Outline_selectedObject_temp.id +'"]').html($(this).val() + "(" +Outline_selectedObject_temp.id+")" );
    }
  });



    $(".edit_object_prop").TouchSpin({
    min: -10000000,
    max: 10000000,
    decimals: 2,
    stepinterval: 50,
    maxboostedstep: 10000000,
    buttondown_class: "btn btn-outline-info",
    buttonup_class: "btn btn-outline-info"
  });

  $("#focus_object").on('click', function () {

    console.log(outlinePassSelected.selectedObjects.length);
    if (outlinePassSelected.selectedObjects.length > 0) {
      fitCameraToSelection(camera, controls, outlinePassSelected.selectedObjects, 1.2);
    } else
    {
      controls.reset();
    }

    // var bb = new THREE.Box3();
    // bb.setFromObject(outlinePassSelected.selectedObjects[0]);
    // bb.center(controls.target);
  })

  $(".edit_object_prop").on('change', function () {

    var edit_id = $(this).attr('id');
    console.log($(this).attr('id') + " " + $(this).val());

    if (edit_id === "position_x") {
      outlinePassSelected.selectedObjects[0].position.x = parseFloat($(this).val());
    }
    if (edit_id === "position_y") {
      outlinePassSelected.selectedObjects[0].position.y = parseFloat($(this).val());
    }
    if (edit_id === "position_z") {
      outlinePassSelected.selectedObjects[0].position.z = parseFloat($(this).val());
    }

    if (edit_id === "size_x") {
      outlinePassSelected.selectedObjects[0].scale.x = parseFloat($(this).val());
    }
    if (edit_id === "size_y") {
      outlinePassSelected.selectedObjects[0].scale.y = parseFloat($(this).val());
    }
    if (edit_id === "size_z") {
      outlinePassSelected.selectedObjects[0].scale.z = parseFloat($(this).val());
    }

    if (edit_id === "rotate_x") {
      outlinePassSelected.selectedObjects[0].rotation.x = degrees_to_radians(parseFloat($(this).val()));
    }
    if (edit_id === "rotate_y") {
      outlinePassSelected.selectedObjects[0].rotation.y = degrees_to_radians(parseFloat($(this).val()));
    }
    if (edit_id === "rotate_z") {
      outlinePassSelected.selectedObjects[0].rotation.z = degrees_to_radians(parseFloat($(this).val()));
    }
  });


  $(document).click(function (event) {
    if (event.target.nodeName === "CANVAS") {
      if (!IgnoreThisClick) {
        Outline_checkIntersection(event);
        SelectObject();
      }
      IgnoreThisClick = false;
    }
  });


}


//------------------------------------------------------------------------------------------------------------------------------------------------
function onWindowResize() {

  var width = window.innerWidth - 250;
  var height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);

//  effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

}

//------------------------------------------------------------------------------------------------------------------------------------------------

var WindMillRotation = 0;
var logOnce = 1;


//------------------------------------------------------------------------------------------------------------------------------------------------
function update() {
//  camera.updateProjectionMatrix();
  controls.update();

  if (main_player !== null) {
    main_player.lookAt(camera.position);
//  main_player.quaternion.copy(camera.quaternion);
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------------
function render() {
//  renderer.render(scene, camera);
  composer.render();

  // Don't let the camera go too low.
  // if (camera.position.y < 10) {
  //   camera.position.y = 10;
  // }

  if (1 == 1) {
    scene.traverse(function (node) {
      if (node instanceof THREE.Mesh) {
        if (logOnce > 0) {
          console.log("---------------------");
          console.log(node);
          console.log(node.userData);
        }

        if (node.userData.name === "SF_Bld_House_Windmill_01") {
          WindMillRotation = WindMillRotation + 1;
          node.rotation.y = THREE.Math.degToRad(WindMillRotation);
        }
      }
    });

    logOnce--;

  }

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

    move(main_player, movements[0]);
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
