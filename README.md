# THREE-JS-Visualiser
Using THREE.js, WebaudioAPI and dat.GUI, a simple 3D music visualiser is created. Meshes are updated via frequency data, and dat.GUI provides easy parameter tweaking.

The code can be seen live on CodePen [here](https://codepen.io/jhancock532/full/zaxjzd/).

Creating a visualiser like this is super easy when you have the framework.
It's made of three parts. WebAudioAPI, dat.GUI and ThreeJS.

# WebAudioAPI

```
let context = new (window.AudioContext || window.webkitAudioContext)();
let analyser = context.createAnalyser();
let soundDataArray;

const MAX_SOUND_VALUE = 256;
```
The ```soundDataArray``` is going to be where we store the music waveform data. The ```context``` and ```analyser``` will do all the processing of the audio for us. What does ```soundDataArray``` look like? It contains the heights for the bars in the below music visualiser, and it's max value is ```MAX_SOUND_VALUE```.  ![Alt](https://camo.githubusercontent.com/f6722558a037fec0447216ef935b3fda19d0921a/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f323133393630342f38333033362f37643730323834612d363363622d313165322d386136662d3062633933333836303065332e706e67) 

