# Three JS Music Visualiser

The code can be seen live on CodePen [here](https://codepen.io/jhancock532/full/zaxjzd/).
Creating a visualiser like this is super easy when you have the framework, so here is a tutorial.
It's made of three parts. WebAudioAPI, dat.GUI and ThreeJS.

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
controls.target = new THREE.Vector3(0,10,0);           //Slightly above (0,0,0) to frame the visual better.
controls.enableDamping = true;                         //Makes for a smoother camera experience.
controls.dampingFactor = 0.1;                          
controls.rotateSpeed = 0.005;                            
controls.enableKeys = false;
controls.enablePan = false;
controls.maxDistance = 400;                            //Determines how far the user can move the camera out by scrolling.
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
We set the camera position to look down onto the scene, and update the `controls` object to let it know where we are.

To make the canvas look pretty, touch it up with some CSS.
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
We've created a `scene`, so it's time to add stuff to it. To stop the scene being entirely black, we add a grey skybox encapsulating it. The grey skybox is a sphere geometry with a double sided grey material applied to it, combined to create a mesh.
```js
function createSkybox(){
  let sphereBox = new THREE.SphereGeometry( 500, 32, 32 );                           //Creating the sphere geometry.
  let sphereMaterial = new THREE.MeshBasicMaterial( {color: 0x111111, side: 2} );    //Creating a material for the sphere
  let sphere = new THREE.Mesh( sphereBox, sphereMaterial );                          //Combining geometry and material.
  scene.add(sphere);                                                                 //Add the result to the scene.
}
```


