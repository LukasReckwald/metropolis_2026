let maria;
let metropolis;

async function setup() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    colorMode(HSB);

    maria = await loadModel('models/metropolis_woman.obj', true);
    metropolis = await loadModel('models/Metropolis.obj', true);
}

function draw() {
    background(0, 0, 50);

    ambientLight(60);
    pointLight(255, 255, 255, 0, -200, 200);

    orbitControl();

    scale(10);

    if (maria) {
        noStroke();
        model(maria);
    }
}