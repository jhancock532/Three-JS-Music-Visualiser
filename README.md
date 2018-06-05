# THREE-JS-Visualiser
Using THREE.js, WebaudioAPI and dat.GUI, a simple 3D music visualiser is created. Meshes are updated via frequency data, and dat.GUI provides easy parameter tweaking.

The code can be seen live on CodePen [here](https://codepen.io/jhancock532/full/zaxjzd/).

Creating a visualiser like this is super easy when you have the framework, so here is a quick tutorial.
It's made of three parts. WebAudioAPI, dat.GUI and ThreeJS.

## WebAudioAPI

```js
let context = new (window.AudioContext || window.webkitAudioContext)();
let analyser = context.createAnalyser();
let soundDataArray;

const MAX_SOUND_VALUE = 256;
```
The `soundDataArray` is going to be where we store the music waveform data. The `context` and `analyser` will do all the processing of the audio for us. What does `soundDataArray` look like? It contains the heights for the bars in the below classic music visualiser snapshot, and it's max value is `MAX_SOUND_VALUE`.  

![A series of vertical bars in a row.](http://www.smartjava.org/sites/default/files/localhost_Dev_WebstormProjects_webaudio_example3.html.png)

```html
<label for="audioInput" id="audioInputLabel">Choose a WAV file. </label>
<input type="file" id="audioInput"/>
```
Here is some html
```js
//When the user chooses audio to visualise, this function is called.
//It starts playing the music and calls createAudioObjects.
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
};
```
Here is some js


