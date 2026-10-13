const CITY_RING = {
    radius: 5000,
    innerRadius: 1800,
    groundLevel: -100,
    depth: 1200,
    //Winkelbereich des Stadtsegments (Math.PI, da p5-Konstanten hier noch nicht existieren)
    startAngle: 5 * Math.PI / 4,
    endAngle: 7 * Math.PI / 4
};

const MARIA_PLATFORM = {
    radius: 600,
    groundLevel: 100,
    height: 1
};

const MARIA_SCALE = 1;
const METROPOLIS_SCALE = 15;

let mariaStatue;
let metropolisStatue;
let mariaPlatform;
let connectionRing;
let cityRing;
let buildings = [];
let buildingBodies;
let buildingWindows;
let spotlights = [];
let animatedRings = [];
let fogLayers = [];
let thunderStrike;
let fogTexture;
let metropolisFont;
let metropolisTextModel;
let fixedTextCamera = true;

//Vergangene Zeit seit dem letzten Frame in ms (begrenzt, damit Ruckler nicht springen)
function frameDelta() {
    return min(deltaTime, 100);
}

//Faktor relativ zu 60 FPS, für Animationen, die pro Frame definiert sind
function frameFactor() {
    return frameDelta() / (1000 / 60);
}

async function setup() {
    let { w, h } = calculateCanvasSize();

    createCanvas(w, h, WEBGL);
    pixelDensity(1); //Auf HiDPI-Displays sonst 4x so viele Pixel für Nebel & Transparenz
    colorMode(HSB);
    setAttributes('alpha', true);

    let mariaModel = await loadModel('models/metropolis_woman.obj', true);
    let metropolisModel = await loadModel('models/Metropolis.obj', true);
    metropolisFont = await loadFont('font/Metropolis.ttf');

    let fogImage = await loadImage('images/white-fog.png');
    fogTexture = FogLayer.createSeamlessTexture(fogImage);

    metropolisTextModel = metropolisFont.textToModel('METROPOLIS', 50, 0, {
        sampleFactor: 10,
        extrude: 1
    });
    metropolisTextModel.clearColors();
    metropolisTextModel.normalize();

    mariaStatue = new MariaStatue(mariaModel, MARIA_SCALE, MARIA_PLATFORM.groundLevel);
    metropolisStatue = new MetropolisStatue(metropolisModel, METROPOLIS_SCALE, CITY_RING.radius, CITY_RING.groundLevel);

    mariaPlatform = new MariaPlatform();
    connectionRing = new ConnectionRing();
    cityRing = new CityRing();

    generateBuildings();
    bakeBuildingGeometry();
    generateSpotlights();
    generateAnimatedRings();
    generateFog();

    thunderStrike = new ThunderStrike();
}

function generateBuildings() {
    buildings = [];
    let outerRadius = CITY_RING.radius + CITY_RING.depth / 2;
    let numBuildings = 200;

    let metropolisBBox = metropolisStatue ? metropolisStatue.getBoundingBox() : null;

    for (let i = 0; i < numBuildings; i++) {
        let attempts = 0;
        let validBuilding = false;
        let building;

        while (!validBuilding && attempts < 50) {
            let angle = random(CITY_RING.startAngle, CITY_RING.endAngle);
            let radius = random(CITY_RING.innerRadius + 50, outerRadius - 50);

            let x = cos(angle) * radius;
            let z = sin(angle) * radius;

            building = new Building(
                x, z,
                random(60, 120),
                random(300, 1000),
                random(60, 120),
                CITY_RING.groundLevel
            );

            if (metropolisBBox) {
                let buildingBBox = building.getBoundingBox();

                let collides = !(
                    buildingBBox.maxX < metropolisBBox.minX ||
                    buildingBBox.minX > metropolisBBox.maxX ||
                    buildingBBox.maxY < metropolisBBox.minY ||
                    buildingBBox.minY > metropolisBBox.maxY ||
                    buildingBBox.maxZ < metropolisBBox.minZ ||
                    buildingBBox.minZ > metropolisBBox.maxZ
                );

                if (!collides) {
                    validBuilding = true;
                }
            } else {
                validBuilding = true;
            }
            attempts++;
        }

        if (validBuilding) {
            buildings.push(building);
        }
    }
}

//Alle Gebäude einmalig zu zwei statischen Modellen zusammenfassen,
//statt jedes Frame tausende Fenster einzeln zu zeichnen
function bakeBuildingGeometry() {
    buildingBodies = buildGeometry(() => {
        noStroke();
        for (let building of buildings) {
            building.addBody();
        }
    });

    buildingWindows = buildGeometry(() => {
        noStroke();
        for (let building of buildings) {
            building.addWindows();
        }
    });
}

function drawBuildings() {
    push();
    noStroke();
    ambientLight(0, 0, 5);
    model(buildingBodies);
    pop();

    //Fenster leuchten selbst und ignorieren die Beleuchtung
    push();
    noStroke();
    noLights();
    model(buildingWindows);
    pop();
}

function generateSpotlights() {
    spotlights = [];

    //Scheinwerfer auf Gebäude
    for (let i = 0; i < 20; i++) {
        if (buildings.length > 0) {
            let randomBuilding = random(buildings);
            let mode = random(1) < 0.5 ? 'up' : 'metropolis';

            let spotlight = new Spotlight(
                randomBuilding,
                mode,
                metropolisStatue,
                MARIA_PLATFORM.groundLevel,
                CITY_RING.groundLevel
            );
            spotlights.push(spotlight);
        }
    }

    //Scheinwerfer hinter Maria
    let behindMariaDistance = -200;

    let vSpotlight = {
        x: 0,
        z: behindMariaDistance,
        groundLevel: MARIA_PLATFORM.groundLevel + 100,
        height: 100
    };

    spotlights.push(new Spotlight(
        vSpotlight,
        'v-left',
        metropolisStatue,
        MARIA_PLATFORM.groundLevel,
        CITY_RING.groundLevel
    ));

    spotlights.push(new Spotlight(
        vSpotlight,
        'v-right',
        metropolisStatue,
        MARIA_PLATFORM.groundLevel,
        CITY_RING.groundLevel
    ));
}

function generateAnimatedRings() {
    animatedRings = [];

    for (let i = 0; i < 4; i++) {
        animatedRings.push(new AnimatedRing());
    }
}

function generateFog() {
    fogLayers = [];

    let maxRadius = CITY_RING.radius + CITY_RING.depth / 2;
    let minRadius = CITY_RING.innerRadius;
    let numLayers = 3;

    let stratfog = new FogLayer(
        fogTexture,
        -100,
        100,
        500,
        0.0005
    );
    fogLayers.push(stratfog);

    for (let i = 0; i < numLayers; i++) {

        let radiusProgress = i / (numLayers - 1);
        let radius = lerp(minRadius, maxRadius, radiusProgress);

        let fog = new FogLayer(
            fogTexture,
            -650,
            radius,
            1500,
            random(0.001, 0.003) * (random() > 0.5 ? 1 : -1) //Wechselnde Drehrichtung
        );
        fogLayers.push(fog);
    }

    fogLayers.sort((a, b) => b.radius - a.radius); //Lösung für Render-Reihenfolge
}

function draw() {
    background(40, 30, 20);
    perspective(PI / 3, width / height, 10, 20000);

    ambientLight(40, 30, 20);
    directionalLight(40, 50, 60, 0, -1, -1);

    //Blitz-Aufhellung
    let flash = thunderStrike.getFlashIntensity();
    if (flash > 0) {
        ambientLight(0, 0, flash * 60);
        directionalLight(0, 0, flash * 40, 0, -1, 0);
    }

    orbitControl();

    mariaPlatform.draw();
    connectionRing.draw();
    cityRing.draw();

    drawBuildings();

    metropolisStatue.draw();
    mariaStatue.draw();

    for (let ring of animatedRings) {
        ring.update();
        ring.draw();
    }

    push();
    if (fixedTextCamera) {
        camera(0, -110, 100, 0, -130, 0, 0, 1, 0);
    }
    translate(0, -8000, -10000);
    ambientMaterial(45, 25, 90);
    specularMaterial(45, 30, 100);
    shininess(100);
    noStroke();
    scale(38);
    model(metropolisTextModel);
    pop();

    for (let spotlight of spotlights) {
        spotlight.update();
        spotlight.draw(raycastHit);
    }

    for (let fog of fogLayers) {
        fog.update();
        fog.draw();
    }

    thunderStrike.update();
    thunderStrike.draw();
}

function raycastHit(startX, startY, startZ, dirX, dirY, dirZ) {
    let start = createVector(startX, startY, startZ);
    let direction = createVector(dirX, dirY, dirZ);

    let nearestHit = 8000;

    //Prüft Gebäude
    for (let building of buildings) {
        let distance = checkBoxHit(start, direction, building.getBoundingBox());
        if (distance && distance < nearestHit) {
            nearestHit = distance;
        }
    }

    //Prüft Metropolis
    if (metropolisStatue) {
        let distance = checkBoxHit(start, direction, metropolisStatue.getBoundingBox());
        if (distance && distance < nearestHit) {
            nearestHit = distance;
        }
    }

    let endPoint = p5.Vector.add(start, p5.Vector.mult(direction, nearestHit));
    return {x: endPoint.x, y: endPoint.y, z: endPoint.z};
}

function checkBoxHit(start, dir, box) {
    let tMin = 0;
    let tMax = 99999;

    for (let axis of ['x', 'y', 'z']) {
        let boxMin = box['min' + axis.toUpperCase()];
        let boxMax = box['max' + axis.toUpperCase()];

        if (abs(dir[axis]) > 0.0001) {
            let t1 = (boxMin - start[axis]) / dir[axis];
            let t2 = (boxMax - start[axis]) / dir[axis];

            tMin = max(tMin, min(t1, t2));
            tMax = min(tMax, max(t1, t2));
        } else {
            if (start[axis] < boxMin || start[axis] > boxMax) {
                return null;
            }
        }
    }

    if (tMin > tMax || tMax < 0) return null;

    return tMin > 0 ? tMin : tMax;
}

function keyPressed() {
    if (key === 'f' || key === 'F') {
        fixedTextCamera = !fixedTextCamera;
    }

    if (key === 'l' || key === 'L') {
        for (let ring of animatedRings) {
            ring.toggle();
        }
    }

    if (key === 't' || key === 'T') {
        thunderStrike.toggle();
    }
}

function windowResized() {
    let { w, h } = calculateCanvasSize();
    resizeCanvas(w, h);
}

function calculateCanvasSize() {
    let windowW = window.innerWidth;
    let windowH = window.innerHeight;

    let targetRatio = 9 / 15;
    let canvasW, canvasH;

    if (windowW / windowH > targetRatio) {
        canvasH = windowH;
        canvasW = canvasH * targetRatio;
    } else {
        canvasW = windowW;
        canvasH = canvasW / targetRatio;
    }

    return { w: canvasW, h: canvasH };
}