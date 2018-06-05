# Three JS Music Visualiser

The code can be seen live on CodePen [here](https://codepen.io/jhancock532/full/zaxjzd/).
Creating a visualiser like this is super easy and fun when you have the framework, so here is a tutorial.
It's made of three parts. WebAudioAPI, dat.GUI and ThreeJS. Some javascript libaries that you will need for this project are
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js"></script> 
<script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.2/dat.gui.min.js"></script> 
<script src="https://codepen.io/jhancock532/pen/VdLmvN"></script> 
<!-- This last one is a custom OrbitControls script, edited to be compatible with dat.GUI 
     (I commented out line 661, that's the only change). -->
```

## WebAudioAPI

```js
let context = new (window.AudioContext || window.webkitAudioContext)();
let analyser = context.createAnalyser();
let soundDataArray;

const MAX_SOUND_VALUE = 256;
```
The `soundDataArray` is going to be where we store the music waveform data. The `context` and `analyser` will do all the processing of the audio for us. What does `soundDataArray` look like? It contains the heights for the bars in the below music visualiser snapshot. As you might have guessed, each element in the array has a max value of 256.

![A series of vertical bars in a row.](http://www.smartjava.org/sites/default/files/localhost_Dev_WebstormProjects_webaudio_example3.html.png)

```html
<input type="file" id="audioInput"/>
<label for="audioInput" id="audioInputLabel">Choose a WAV file. </label>

<audio id="sound"></audio>
```
The user inputs a sound file of their choice through the input element above. We then use JavaScript to load the selected file, and start playing it.
```js
audioInput.onchange = function() {
  let sound = document.getElementById("sound");    //What element we want to play the audio.
  let reader = new FileReader();                   //How we load the file.
  reader.onload = function(e) {                    //What we do when we load a file.
    sound.src = this.result;                       //Setting the source for the sound element.
    sound.controls = true;                         //User can pause and play audio.
    sound.play();                                  //Start playing the tunes!
  };
  reader.readAsDataURL(this.files[0]);             //This will call the reader.onload function when it finishes loading the file.
  createAudioObjects();                            
};
```
So we have the music going, but how does `context` and `analyser` interact with it? That is sorted by `createAudioObjects();`
```js
//Connects the audio source to the analyser and creating a suitably sized array to hold the frequency data.
function createAudioObjects() {
  source = context.createMediaElementSource(document.getElementById("sound"));
  source.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 1024; //128, 256, 512, 1024 and 2048 are valid values.
  soundDataArray = new Uint8Array(analyser.frequencyBinCount);
}
```
We declare the `source` (where music is coming from), connect the `source` to the `analyser` and finally connect the `analyser` to the final `context.destination`. If you didn't do this last step, you wouldn't hear anything! You are diverting the audio data through a `analyser` bypass, and you reconnect it to where it would originally output. A more detailed explanation can be found [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

The larger `analyser.fftSize` is, the more detail your sound wave will have, and the larger your `soundDataArray` will be. `analyser.frequencyBinCount` is half the value of `analyser.fftSize` and is the length of `soundDataArray`. Details about `fftSize` can be found [here](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize), and `frequencyBinCount` [here](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount).

I created two simple methods to process the soundDataArray data neatly, one to get overall volume of the audio `getAverageOfDataArray()` and one to get an average from a sample of the array, according to the number of sample sections wanted from the array, and the index of which sample section is required `getSampleOfSoundData()`. See the source code for more details.

The `soundDataArray` is updated when the `animate` function loops and we have loaded a audio file to analyse.
```js
function animate() {
  requestAnimationFrame(animate); 
  
  //Update the soundDataArray with the new sound data.
  if((soundDataArray === undefined) == false){
    analyser.getByteFrequencyData(soundDataArray);
  }
  
  controls.update(); //Not audio related.
  updateMeshes(); //Not audio related.
  renderer.render(scene, camera); //Not audio related.
}
animate();
```
The audio `analyser` does all the complex work for us with `analyser.getByteFrequencyData();`. Note how we don't try and write to `soundDataArray` if it is `undefined`, as this means we haven't loaded a file. For every frame that we are animating, we are refreshing the `soundDataArray` with the current audio data. The `updateMeshes();` function can then access `soundDataArray` and edit objects to make them dance to the music.

## Three JS
This library handles all the complexity of creating and rendering 3D scenes. For the source code, I animated a collection of [line objects](https://threejs.org/docs/#api/objects/Line), and a collection of [circle meshes](https://threejs.org/docs/#api/geometries/CircleGeometry).

To get set up, we'll need
```js
let scene = new THREE.Scene();                                                                    //The stage which contains everything.
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);  //How we see the scene.
let controls = new THREE.OrbitControls(camera);                                                   //Determines how we control the camera.
```
Note that I use a customised THREE.OrbitControls class, which can be found at https://codepen.io/jhancock532/pen/VdLmvN
I commented out the line event.preventDefault(); in the mouse down function, in order to fix a bug with selecting the preset for the dat.GUI (See line 661). You won't be able to select a preset in dat.GUI with the original OrbitControls class.

Let's tweak the controls parameter to make the camerawork tidy.
```js
controls.target = new THREE.Vector3(0,10,0);       //Slightly above (0,0,0) to frame the visual better.
controls.enableDamping = true;                     //Makes for a smoother camera experience.
controls.dampingFactor = 0.1;                          
controls.rotateSpeed = 0.005;                      
controls.enableKeys = false;
controls.enablePan = false;
controls.maxDistance = 400;                        //Determines how far the user can move the camera out by scrolling.
```
Finally, create a `renderer` to take in the `scene` and convert it into an image for our screen.
```js
let renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );             //Adds the display canvas to the web page.

camera.position.z = 0;
camera.position.y = 60;
controls.update();
```
We set the camera position to look down onto the scene, and update the `controls` object to let it know where the camera is. To make the canvas look pretty, touch it up with some CSS.
```css
html, body {
  overflow: hidden; /*Removes the scrollbars from the webpage*/
}

canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  margin: 0;
  z-index: -1;
}
```
We've created a `scene`, so it's time to add stuff to it. To stop the scene being entirely black, we add a grey skybox encapsulating the camera in it. The grey skybox is a sphere geometry with a grey material applied to it, combined together to create a mesh.
```js
function createSkybox(){
  let sphereBox = new THREE.SphereGeometry( 500, 32, 32 );                           //Creating the sphere geometry.
  let sphereMaterial = new THREE.MeshBasicMaterial( {color: 0x111111, side: 2} );    //Creating a material for the sphere
  let sphere = new THREE.Mesh( sphereBox, sphereMaterial );                          //Combining geometry and material.
  scene.add(sphere);                                                                 //Add the result to the scene.
}
```
There needs to be a global array of meshes which you will update according to `soundArrayData`. To create this array and fill it, declare some global arrays and use a helper function to fill them.
```js
let segmentGeometryArray = [];   //Globally accessible arrays.
let segmentMaterialArray = [];   //Perhaps could be stored together in an object.
let segmentsArray = [];

const numSamples = 60;           //The number of segments in the circle.
const segBaseRadius = 20;        //The base radius for each segment
const segBrightness = 50;        
setUpAllArrays();

function setUpAllArrays() {
  for (let i = 0; i < numSamples; i++){
    segmentGeometryArray.push(
      new THREE.CircleGeometry(segBaseRadius, 64, i*2*Math.PI/numSamples, 2*Math.PI/numSamples)
    );

    segmentMaterialArray.push(new THREE.MeshBasicMaterial( {
      color: new THREE.Color("hsl("+(i*359)/numSamples+", 100%, "+String(Math.floor(segBrightness))+"%)"),
      side: 2
    }));
    
    segmentsArray.push(new THREE.Mesh(segmentGeometryArray[i], segmentMaterialArray[i]));
    segmentsArray[i].rotateX( Math.PI / 2 );   //The circle is initally created in the x-y plane, so we rotate it here flat onto x-z.

    scene.add(segmentsArray[i]);
  }
}
```
I am creating segments of a circle (like slices of a pie) through `i*2*Math.PI/numSamples, 2*Math.PI/numSamples` in the `CircleGeometry` constructor. To learn more about the constructor for `THREE.CircleGeometry` go [here](https://threejs.org/docs/#api/geometries/CircleGeometry). This is as mathsy as the code gets for now, some slightly more interesting maths can be seen in the source code where I added some springs to the scene.

We have an array of meshes added to the scene, ready and waiting for animation. Remember the `animate` function?
```js
function animate() {
  requestAnimationFrame(animate); 
  
  //Update the soundDataArray with the new sound data.
  if((soundDataArray === undefined) == false){
    analyser.getByteFrequencyData(soundDataArray);
  }
  
  controls.update();               //Updates the internal camera controls (as you have probably moved it)
  updateMeshes();                  //Updates the mesh array.
  renderer.render(scene, camera);  //Render a new frame of the scene.
}
```
Updating the meshes is quite simple, just a scale effect on the mesh. 
```js
function updateMeshes(){
  for (let i = 0; i < numSamples; i++){
    let sampleLevel = 1; //Fallback value if soundDataArray doesn't exist.
    
    //Carefully access the soundDataArray, as it doesn't exist until the user selects a sound file.
    if ((soundDataArray === undefined) == false) {
      sampleLevel = getSampleOfSoundData(i, numSamples, soundDataArray);
    }

    segmentsArray[i].scale.set(0.01+sampleLevel,0.01+sampleLevel,1); 
    segmentsArray[i].rotateZ(0.003);
  }
}
```
The function `getSampleOfSoundData()` is provided below.
```js
//Returns the average of a small sample of the array. Index declares which sample you want from a noSampleSections, ideal for iteration.
function getSampleOfSoundData(index, noSampleSections, soundDataArray){
  let sampleSize = Math.floor((soundDataArray.length/2) / noSampleSections); 
  
  let minBound = index * sampleSize; 
  let maxBound = (index + 1) * sampleSize;
  let sum = 0;
  
  for (let i = minBound; i < maxBound; i++){
    sum += soundDataArray[i];
  }
  let average = sum / sampleSize;
  
  return average / MAX_SOUND_VALUE;
}
```
At this stage we have implemented all the basics of our Three JS scene. To check whether your code looks like mine, check the your code against the code in this CodePen example. View the project in action [here](https://codepen.io/jhancock532/full/qKNWxV) and the code [here](https://codepen.io/jhancock532/pen/qKNWxV). We should now have a functional music visualiser.

