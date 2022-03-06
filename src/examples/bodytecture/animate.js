// Import libraries
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@7.11.1/rhino3dm.module.js";
import { RhinoCompute } from "https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js";
import { Rhino3dmLoader } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js";

const definitionName = "CLOTH_18.gh";

// Set up sliders
const radius_slider = document.getElementById("PINCH_RADIUS");
radius_slider.addEventListener("mouseup", onSliderChange, false);
radius_slider.addEventListener("touchend", onSliderChange, false);

const count_slider = document.getElementById("FALLOFF");
count_slider.addEventListener("mouseup", onSliderChange, false);
count_slider.addEventListener("touchend", onSliderChange, false);

const POINTS_slider = document.getElementById("POINTS");
POINTS_slider.addEventListener("mouseup", onSliderChange, false);
POINTS_slider.addEventListener("touchend", onSliderChange, false);

const GROUP_slider = document.getElementById("GROUP");
GROUP_slider.addEventListener("mouseup", onSliderChange, false);
GROUP_slider.addEventListener("touchend", onSliderChange, false);

const MAX_SCALE_slider = document.getElementById("MAX_SCALE");
MAX_SCALE_slider.addEventListener("mouseup", onSliderChange, false);
MAX_SCALE_slider.addEventListener("touchend", onSliderChange, false);

const MIN_SCALE_slider = document.getElementById("MIN_SCALE");
MIN_SCALE_slider.addEventListener("mouseup", onSliderChange, false);
MIN_SCALE_slider.addEventListener("touchend", onSliderChange, false);

const BODY = document.getElementById('BODY');
BODY.addEventListener( 'change', onSliderChange, false )

const NECKLACEEE = document.getElementById('NECKLACEEE');
NECKLACEEE.addEventListener( 'change', onSliderChange, false )

const DRESSSS = document.getElementById('DRESSSS');
DRESSSS.addEventListener( 'change', onSliderChange, false )

const BRACELET = document.getElementById('BRACELET');
BRACELET.addEventListener( 'change', onSliderChange, false )


const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
  //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.

  RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.

  // load a grasshopper file!

  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

  init();
  compute();
});

async function compute() {
  const param1 = new RhinoCompute.Grasshopper.DataTree("PINCH_RADIUS");
  param1.append([0], [radius_slider.valueAsNumber]);

  const param2 = new RhinoCompute.Grasshopper.DataTree("FALLOFF");
  param2.append([0], [count_slider.valueAsNumber]);

  const param3 = new RhinoCompute.Grasshopper.DataTree("POINTS");
  param3.append([0], [POINTS_slider.valueAsNumber]);

  const param4 = new RhinoCompute.Grasshopper.DataTree("GROUP");
  param4.append([0], [GROUP_slider.valueAsNumber]);

  const param5 = new RhinoCompute.Grasshopper.DataTree("MAX_SCALE");
  param5.append([0], [MAX_SCALE_slider.valueAsNumber]);

  const param6 = new RhinoCompute.Grasshopper.DataTree("MIN_SCALE");
  param6.append([0], [MIN_SCALE_slider.valueAsNumber]);

  const param7 = new RhinoCompute.Grasshopper.DataTree('BODY')
  param7.append([0], [BODY.checked])

  const param8 = new RhinoCompute.Grasshopper.DataTree('NECKLACEEE')
  param8.append([0], [NECKLACEEE.checked])

  const param9 = new RhinoCompute.Grasshopper.DataTree('DRESSSS')
  param9.append([0], [DRESSSS.checked])

  const param10 = new RhinoCompute.Grasshopper.DataTree('BRACELET')
  param10.append([0], [BRACELET.checked])

  const downloadButton = document.getElementById("downloadButton")
  downloadButton.onclick = download

  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);
  trees.push(param3);
  trees.push(param4);
  trees.push(param5);
  trees.push(param6);
  trees.push(param7);
  trees.push(param8);
  trees.push(param9);
  trees.push(param10);
  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );


  //console.log(res);

  doc = new rhino.File3dm();

  // hide spinner
  document.getElementById("loader").style.display = "none";

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);
        doc.objects().add(rhinoObject, null);
      }
    }
  }



  // go through the objects in the Rhino document

  let objects = doc.objects();
  for ( let i = 0; i < objects.count; i++ ) {
  
    const rhinoObject = objects.get( i );


     // asign geometry userstrings to object attributes
    if ( rhinoObject.geometry().userStringCount > 0 ) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
      
    }
  }


  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {

    // go through all objects, check for userstrings and assing colors

    object.traverse((child) => {
      if (child.isMesh) {

        if (child.userData.attributes.geometry.userStringCount > 0 && child.userData.attributes.userStrings[0][0] == "PRICE") {
           
            //console.log(child.userData.attributes.userStrings[0][1])
          
          const PRICE = child.userData.attributes.userStrings[0];
          

          document.getElementById('PRICE').innerText = ` ${PRICE} ` ;

         console.log();

        }
      }
    });

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}



function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}


// THREE BOILERPLATE //
let scene, camera, renderer, controls;

function init() {
  // create a scene and a camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 400;

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 3;
  directionalLight.position.set(400,40,400)
  directionalLight.innerHeight = 200;
  directionalLight. innerWidth = 1000;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function download () {
  let buffer = doc.toByteArray()
  let blob = new Blob([ buffer ], { type: "application/octect-stream" })
  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'CLOTH_18.3dm'
  link.click()
}

function onWindowResize() {
  camera.aspect = window.innerWidth  / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}
