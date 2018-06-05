// Variables which the user can edit via dat.GUI
let springs = new function() {
  this.numSamples = 65;
  this.nodesPerLine = 150;
  this.springHeight = 14;
  this.springPhase = 13;
}

let spiral = new function() {
  this.inOutScale = 1.8;
  this.phase = 5.7;
}

let segments = new function() {
  this.segBrightness = 34;
  this.segBaseRadius = 40;
}

//The presets loaded into dat GUI.
const presetJSON = {
  "preset": "Segments Only",
  "remembered": {
    "Default": {
      "0": {
        "numSamples": 65,
        "nodesPerLine": 150,
        "springPhase": 13,
        "springHeight": 14
      },
      "1": {
        "inOutScale": 1.599332944113884,
        "phase": 5.186617184989917
      },
      "2": {
        "segBrightness": 37.146978910639895,
        "segBaseRadius": 40
      }
    },
    "Triangles": {
      "0": {
        "numSamples": 65,
        "nodesPerLine": 150,
        "springPhase": 100,
        "springHeight": 37.775509121533496
      },
      "1": {
        "inOutScale": 0.5102239600941513,
        "phase": 20.81918149097012
      },
      "2": {
        "segBrightness": 37.146978910639895,
        "segBaseRadius": 48.148079759324055
      }
    },
    "Flower": {
      "0": {
        "numSamples": 219.01266597081658,
        "nodesPerLine": 144.96275848037894,
        "springPhase": 83.36825087263828,
        "springHeight": 18.171547409178306
      },
      "1": {
        "inOutScale": 0.6191348584961245,
        "phase": 31.061206381095083
      },
      "2": {
        "segBrightness": 0,
        "segBaseRadius": 0
      }
    },
    "Segments Only": {
      "0": {
        "numSamples": 256,
        "nodesPerLine": 1,
        "springPhase": 0.1,
        "springHeight": 1
      },
      "1": {
        "inOutScale": 0.1,
        "phase": 1
      },
      "2": {
        "segBrightness": 50.34829992906089,
        "segBaseRadius": 49.24818984419248
      }
    }
  },
  "closed": true,
  "folders": {
    "Springs": {
      "preset": "Default",
      "closed": true,
      "folders": {}
    },
    "Spiral": {
      "preset": "Default",
      "closed": true,
      "folders": {}
    },
    "Segments": {
      "preset": "Default",
      "closed": true,
      "folders": {}
    }
  }
}

let gui = new dat.GUI({
  load: presetJSON,
  preset: 'Default'
});

gui.remember(springs);
gui.remember(spiral);
gui.remember(segments);

//Creating the folder structure to display all the GUI elements.
let f1 = gui.addFolder('Springs');
let numSamplesController = f1.add(springs,'numSamples',0,256).name("Number");
let nodesPerLineController = f1.add(springs,'nodesPerLine',1,300).name("Smoothness");
f1.add(springs,'springPhase',0.1,100).name("Springiness");
f1.add(springs,'springHeight',1,100).name("Height");

let f2 = gui.addFolder('Spiral');
f2.add(spiral,'inOutScale',0.1,10).name("Move In/Out");
f2.add(spiral,'phase',1,50).name("Phase");

let f3 = gui.addFolder('Segments');
let segBrightnessController = f3.add(segments,'segBrightness',0,100).name("Brightness");
let segBaseRadiusController = f3.add(segments,'segBaseRadius',0,100).name("Radius");

//Declaring the controllers which trigger reset of the visualisers arrays.
numSamplesController.onChange(function(val) {
  resetArrays();
});
nodesPerLineController.onChange(function(val) {
  resetArrays();
});
segBrightnessController.onChange(function(val) {
  resetArrays();
});
segBaseRadiusController.onChange(function(val) {
  resetArrays();
});

//Code begins for WebAudioAPI.
let context = new (window.AudioContext || window.webkitAudioContext)();
let analyser = context.createAnalyser();
let soundDataArray;

const MAX_SOUND_VALUE = 256;

//When the user chooses audio to visualise, this function is called.
//It starts playing the music, hides the input, and calls createAudioObjects.
audioInput.onchange = function() {
  let sound = document.getElementById("sound");
  let reader = new FileReader();
  reader.onload = function(e) {
    sound.src = this.result;
    sound.controls = true;
    sound.play();
  };
  reader.readAsDataURL(this.files[0]);
  createAudioObjects();
  document.getElementById('audioInput').style.visibility = 'hidden';
  document.getElementById('audioInputLabel').style.visibility = 'hidden';
};

//Connects the audio source to the analyser and creating a suitably sized array to hold the frequency data.
function createAudioObjects() {
  source = context.createMediaElementSource(document.getElementById("sound"));
  source.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 1024; //128, 256, 512, 1024 and 2048 are valid values.
  let bufferLength = analyser.frequencyBinCount;
  soundDataArray = new Uint8Array(bufferLength);
}

//Returns the overall average sound of the soundDataArray, normalized between 0 and 1;
function getAverageOfDataArray(soundDataArray){
  let sum = 0;
  for (let i = 0; i < soundDataArray.length; i++){
    sum += soundDataArray[i];
  }
  let average = sum / soundDataArray.length;
  return average / MAX_SOUND_VALUE; 
}

//Returns the average of a small sample of the array. Index declares which sample you want, ideal for iteration.
function getSampleOfSoundData(index, noSampleSections, soundDataArray){
  let sampleSize = Math.floor((soundDataArray.length/2) / noSampleSections); 
  //Note division by 2. I think I accidently initalize the soundDataArray as twice as long as it needs to be?
  let minBound = index * sampleSize; 
  let maxBound = (index + 1) * sampleSize;
  let sum = 0;
  
  for (let i = minBound; i < maxBound; i++){
    sum += soundDataArray[i];
  }
  let average = sum / sampleSize;
  
  return average / MAX_SOUND_VALUE;
}

//Code begins for THREE js scene setup.
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let controls = new THREE.OrbitControls(camera); 
//Note that I use a customised THREE.OrbitControls class, which can be found at https://codepen.io/jhancock532/pen/VdLmvN
//I commented out the line event.preventDefault(); in the mouse down function, fixing select preset for the dat.GUI (See line 661)
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.005;
controls.target = new THREE.Vector3(0,10,0);
controls.enableDamping = true;
controls.enableKeys = false;
controls.enablePan = false;
controls.maxDistance = 400;

let renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.z = 0;
camera.position.y = 60;
controls.update();

//Creation of the geometry, material and line arrays
let springMaterialArray = []; 
let springGeometryArray = [];
let springsArray = [];
let segmentGeometryArray = [];
let segmentMaterialArray = [];
let segmentsArray = [];
setUpAllArrays();
createSkybox();

//Makes a subtle grey background.
function createSkybox(){
  let sphereBox = new THREE.SphereGeometry( 500, 32, 32 );
  let sphereMaterial = new THREE.MeshBasicMaterial( {color: 0x111111, side: 2} );
  let sphere = new THREE.Mesh( sphereBox, sphereMaterial );
  scene.add( sphere );
}

//Creates all the geometries, materials and meshes, properties of which are animated later.
function setUpAllArrays() {
  for (let i = 0; i < springs.numSamples; i++){
    segmentGeometryArray.push(new THREE.CircleGeometry(segments.segBaseRadius, 64, i*2*Math.PI/springs.numSamples, 2*Math.PI/springs.numSamples));
    springGeometryArray.push(new THREE.Geometry()); //Vertices are added iteratively.
    
    springMaterialArray.push(new THREE.LineBasicMaterial({
	    color: getRainbowColour(i,springs.numSamples, 50)
    }));
    
    segmentMaterialArray.push(new THREE.MeshBasicMaterial( {
      color: getRainbowColour(i,springs.numSamples, segments.segBrightness), 
      side: 2
    }));
    
    let XBaseline = getSpiralPosition("X",i);
    let ZBaseline = getSpiralPosition("Z",i);
    //The height (y value) of the vertices is determined by audio data, so we don't have to worry about it here.
    for (let j = 0; j < springs.nodesPerLine; j++){
      springGeometryArray[i].vertices.push(new THREE.Vector3(XBaseline, 0, ZBaseline));
    }
    
    //Combine together the geometry and material to create the mesh, store this in the global array.
    springsArray.push(new THREE.Line( springGeometryArray[i], springMaterialArray[i]));
    segmentsArray.push(new THREE.Mesh(segmentGeometryArray[i], segmentMaterialArray[i]));
    segmentsArray[i].rotateX( Math.PI / 2 ); //A circle is initally created in the wrong plane, so we rotate it here.
    //We add the contents of the global arrays into the scene.
    scene.add(springsArray[i]); 
    scene.add(segmentsArray[i]);
  }
}

//A small mathematical function to give X and Z coords of a spiral.
function getSpiralPosition(axis, i){
  let t = 1.5 + i*Math.PI*spiral.phase/(springs.numSamples); 
  //1.5 is an offset to stop a spiral being created at 0,0.
  if (axis == "X"){
    return t * spiral.inOutScale * Math.cos(t);
  } else {
    return t * spiral.inOutScale * Math.sin(t);
  }
}

//Creates a clean slate and repopulates all arrays with new values. Resets the scene as well, while creating a new skybox.
function resetArrays() {
  springMaterialArray = [];
  springGeometryArray = [];
  springsArray = [];
  segmentGeometryArray = [];
  segmentMaterialArray = [];
  segmentsArray = [];
  
  //Code to remove all children from a scene.
  for(var i = scene.children.length - 1; i >= 0; i--){
     obj = scene.children[i];
     scene.remove(obj);
  }
  
  createSkybox();
  setUpAllArrays();
}

//Returns a rainbow spectrum when iterated through with i, going from 0 to maxValue, with brightness as specified.
function getRainbowColour(i, maxValue, brightness){
  return new THREE.Color("hsl("+(i*359)/maxValue+", 100%, "+String(Math.floor(brightness))+"%)");
}

//Code to animate the visualisation begins.
function updateMeshes(){
  let volumeBoost = 0; //VolumeBoost is used to speed up the segments spinning.
  if ((soundDataArray === undefined) == false) {
    volumeBoost = getAverageOfDataArray(soundDataArray);
  }
  
  for (let i = 0; i < springs.numSamples; i++){
    let sampleLevel = 1;
    
    //Carefully access the soundDataArray, as it doesn't exist until the user selects a sound file.
    if ((soundDataArray === undefined) == false) {
      sampleLevel = getSampleOfSoundData(i, springs.numSamples, soundDataArray);
    }
    
    //Update the springs. 
    for (let j = 0; j < springs.nodesPerLine; j++){
      //Wave factor is a simple trig representation of a circle. You could make this any lissajous figure.
      //It's the amount the line point is offset by from the center line in the middle in of the spring.
      let waveFactorOne = Math.sin(Math.PI*springs.springPhase*(j/springs.nodesPerLine)) - 0.5;
      let waveFactorTwo = Math.cos(Math.PI*springs.springPhase*(j/springs.nodesPerLine)) - 0.5;

      let XBaseline = getSpiralPosition("X",i);
      let ZBaseline = getSpiralPosition("Z",i);
      
      springsArray[i].geometry.vertices[j] = new THREE.Vector3( 
        XBaseline+waveFactorOne, 
        sampleLevel*springs.springHeight*(j/springs.nodesPerLine),
        ZBaseline+waveFactorTwo);
    }
    springsArray[i].geometry.verticesNeedUpdate = true; 
    //This line is vital for animation of updated geometries.
   
    //Update the segments.
    segmentsArray[i].scale.set(0.01+sampleLevel,0.01+sampleLevel,1);
    segmentsArray[i].rotateZ(0.003+0.01*volumeBoost);
    //In this case, we have transformed on the mesh directly, so it knows to update already.
  }
}

function animate() {
	requestAnimationFrame(animate);
  controls.update();
  //Update the soundDataArray with the new wave frequency.
  if((soundDataArray === undefined) == false){
    analyser.getByteFrequencyData(soundDataArray);
  }
  updateMeshes();
	renderer.render(scene, camera);
}

animate();
