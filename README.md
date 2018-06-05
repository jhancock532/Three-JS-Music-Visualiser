# THREE-JS-Visualiser
Using THREE.js, WebaudioAPI and dat.GUI, a simple 3D music visualiser is created. Meshes are updated via frequency data, and dat.GUI provides easy parameter tweaking.

The code can be seen live on CodePen [here](https://codepen.io/jhancock532/full/zaxjzd/).

Creating a visualiser like this is super easy when you have the framework.
It's made of three parts. WebAudioAPI, dat.GUI and ThreeJS.

#Setting up WebAudioAPI

```
let context = new (window.AudioContext || window.webkitAudioContext)();
let analyser = context.createAnalyser();
let soundDataArray;

const MAX_SOUND_VALUE = 256;
```

