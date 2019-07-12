<!DOCTYPE html>
<html>
<head>
  <title>Halfbaked Game Viewer</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <style>

    body {
      margin: 0;
      background-color: #000;
      color: #fff;
      /*font-family: Monospace;*/
      /*font-size: 13px;*/
      /*line-height: 24px;*/
    }

    a {
      color: #ff0;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    button {
      cursor: pointer;
    }

    canvas {
      display: block;
    }

    #info {
      position: absolute;
      top: 0px;
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      text-align: center;
      z-index: 1; /* TODO Solve this in HTML */
    }

    .dg.ac {
      z-index: 2 !important; /* TODO Solve this in HTML */
    }

    .edit_object_prop {
    }


    /*body {*/
    /*  margin: 0;*/
    /*  overflow: hidden;*/
    /*  padding: 0;*/
    /*}*/

  </style>

  <script type="text/javascript" src="threejs/build/three.js"></script>

  <script type="text/javascript" src="threejs/examples/js/controls/OrbitControls.js"></script>
  <script type="text/javascript" src="threejs/examples/js/loaders/OBJLoader.js"></script>
  <script type="text/javascript" src="threejs/examples/js/loaders/GLTFLoader.js"></script>
  <script type="text/javascript" src="threejs/examples/js/loaders/BasisTextureLoader.js"></script>

  <!--<script src="threejs/examples/js/controls/TransformControls.js"></script>-->


  <script type="text/javascript" src="threejs/examples/js/WebGL.js"></script>

  <script type="text/javascript" src="threejs/examples/js/shaders/CopyShader.js"></script>
  <script type="text/javascript" src="threejs/examples/js/shaders/FXAAShader.js"></script>
  <script type="text/javascript" src="threejs/examples/js/postprocessing/EffectComposer.js"></script>
  <script type="text/javascript" src="threejs/examples/js/postprocessing/RenderPass.js"></script>
  <script type="text/javascript" src="threejs/examples/js/postprocessing/ShaderPass.js"></script>
  <script type="text/javascript" src="threejs/examples/js/postprocessing/OutlinePass.js"></script>


  <script type="text/javascript" src="js/jquery-3.4.1.js"></script>
  <script type="text/javascript" src="js/dat.gui.js"></script>
  <script type="text/javascript" src="viewer_3d.js"></script>

  <link rel="stylesheet" href="css/bootstrap.css">
  <script src="js/bootstrap.bundle.js"></script>
  <script src="js/jquery.bootstrap-touchspin.js"></script>
  <link rel="stylesheet" href="css/jquery.bootstrap-touchspin.css">

  <?php
  function getDirContents( $dir, &$results = array() ) {
    $files = scandir( $dir );

    foreach ( $files as $key => $value ) {
      $path = realpath( $dir . DIRECTORY_SEPARATOR . $value );
      if ( ! is_dir( $path ) ) {
        //$results[] = $path;
      } else if ( $value != "." && $value != ".." ) {
        getDirContents( $path, $results );
        $results[] = $path;
      }
    }

    return $results;
  }

  ?>

</head>
<body>


<div id="GameContainer">

</div>
<div
  style="position: fixed; right:0px; top:0px; width:250px; height: 100%; background-color: white; border-color: black; border-radius: 1px; color:black; padding: 5px; box-sizing: border-box; overflow-y: auto; overflow-x: hidden;">

  <button id="load_scene_dialog_button" class="form-control btn-dark" style="margin-bottom: 3px;">Load Scene</button>
</div>


<!-- Modal -->
<div class="modal fade" id="loadSceneModal" tabindex="-1" role="dialog" aria-labelledby="loadSceneModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="loadSceneModalTitle">Load scene</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div id="scene_list"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal -->
<div class="modal fade" id="deleteObjectModal" tabindex="-1" role="dialog" aria-labelledby="deleteObjectModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="deleteObjectModalTitle">Delete Object</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        Are you sure?
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" id="deleteObjectButton">Yes, Delete</button>
      </div>
    </div>
  </div>
</div>


<!-- Modal -->
<div class="modal fade" id="saveSceneModal" tabindex="-1" role="dialog" aria-labelledby="saveSceneModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="saveSceneModalTitle">Save scene</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <input type="text" class="form-control" id="saveSceneName" placeholder="Scene name">
          <small id="emailHelp" class="form-text text-muted">If file already exists it will be overwritten.</small>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" id="saveSceneButton">Save scene</button>
      </div>
    </div>
  </div>
</div>

</body>
</html>