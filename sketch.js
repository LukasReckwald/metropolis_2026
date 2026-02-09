const CITY_RING = {
    radius: 5000,
    innerRadius: 1800,
    groundLevel: -100,
    depth: 1200
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
let spotlights = [];
let animatedRingSets = [];
let fogLayers = [];
let fogImage;
let metropolisFont;
let metropolisTextModel;
let fixedTextCamera = true;


async function setup() {
    let { w, h } = calculateCanvasSize();

    createCanvas(w, h, WEBGL);
    colorMode(HSB);
    setAttributes('alpha', true);

    let mariaModel = await loadModel('models/metropolis_woman.obj', true);
    let metropolisModel = await loadModel('models/Metropolis.obj', true);
    metropolisFont = await loadFont('font/Metropolis.ttf');

    fogImage = await loadImage('images/white-fog.png');

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
    generateSpotlights();
    generateAnimatedRingSets();
    generateFog();
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
            let angle = random(5 * PI / 4, 7 * PI / 4);
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

function generateAnimatedRingSets() {
    animatedRingSets = [];

    for (let i = 0; i < 4; i++) {
        animatedRingSets.push(new AnimatedRingSet());
    }
}

function generateFog() {
    fogLayers = [];

    let maxRadius = CITY_RING.radius + CITY_RING.depth / 2;
    let minRadius = CITY_RING.innerRadius;
    let numLayers = 3;

    for (let i = 0; i < numLayers; i++) {

        let radiusProgress = i / (numLayers - 1);
        let radius = lerp(minRadius, maxRadius, radiusProgress);

        let fog = new FogLayer(
            fogImage,
            -650,
            radius,
            1500,
            random(0.001, 0.003) * (random() > 0.5 ? 1 : -1)
        );
        fogLayers.push(fog);
    }

    fogLayers.sort((a, b) => b.radius - a.radius); // Lösung für Render-Reihenfolge
}

function draw() {
    background(40, 30, 20);
    perspective(PI / 3, width / height, 10, 20000);

    ambientLight(40, 30, 20);
    directionalLight(40, 50, 60, 0, -1, -1);

    orbitControl();

    mariaPlatform.draw();
    connectionRing.draw();
    cityRing.draw();

    for (let building of buildings) {
        building.draw();
    }

    metropolisStatue.draw();
    mariaStatue.draw();

    for (let ringSet of animatedRingSets) {
        ringSet.update();
        ringSet.draw();
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
        for (let ringSet of animatedRingSets) {
            ringSet.toggle();
        }
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