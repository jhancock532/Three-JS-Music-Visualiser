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
The `soundDataArray` is going to be where we store the music waveform data. The `context` and `analyser` will do all the processing of the audio for us. What does `soundDataArray` look like? It contains the heights for the bars in the below classic music visualiser snapshot, and it's max value is `MAX_SOUND_VALUE`.  

![A series of vertical bars in a row.](http://www.smartjava.org/sites/default/files/localhost_Dev_WebstormProjects_webaudio_example3.html.png)

```html
<label for="audioInput" id="audioInputLabel">Choose a WAV file. </label>
<input type="file" id="audioInput"/>
<audio id="sound"></audio>
```
The user inputs a sound file of their choice through the input element above. We then use js to load the selected file, and start playing it.
```js
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
So we have the music going, but how does `context` and `analyser` interact with it? Well, that is sorted by `createAudioObjects();`
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
We declare the `source` (where music is coming from), connect the `source` to the `analyser` and finally connect the `analyser` to the final `context.destination`. If you didn't do this last step, you wouldn't hear anything! You are diverting the audio data through a `analyser` bypass, and you reconnect it to where it would originally output.

The larger `analyser.fftSize` is, the more detail your sound wave will have, and the larger your `soundDataArray` will be. `analyser.frequencyBinCount` is half the value of `analyser.fftSize` and is the length of `soundDataArray`. Details about `fftSize` can be found [here](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize), and `frequencyBinCount` [here](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount).

I created two simple methods to process the soundDataArray data neatly, one to get overall volume of the audio (`getAverageOfDataArray()`) and one to get an average from a sample of the array, according to the number of sample sections wanted from the array, and the index of what sample section is required. (`getSampleOfSoundData`). See the source code for more details.

`soundDataArray` is updated when the `animate` function loops and we have loaded a audio file to analyse.
```js
function animate() {
	requestAnimationFrame(animate); 
  
  //Update the soundDataArray with the new wave frequency.
  if((soundDataArray === undefined) == false){
    analyser.getByteFrequencyData(soundDataArray);
  }
  
  controls.update(); //Not audio related.
  updateMeshes(); //Not audio related.
	renderer.render(scene, camera); //Not audio related.
}

animate();
```
The audio `analyser` does all the complex work for us with `analyser.getByteFrequencyData();`. Note how we don't try and write to `soundDataArray` if it is `undefined` - this means we haven't loaded a file. For every frame that we are animating, we are refreshing the `soundDataArray` with the latest audio frequency data. The `updateMeshes();` function can then access `soundDataArray` and edit objects to make them dance to the music.




