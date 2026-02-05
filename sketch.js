const CITY_RING = {
    radius: 5000,
    innerRadius: 1800,
    groundLevel: -300,
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
let cameraInitialized = false;

class MariaPlatform {
    constructor() {
        this.radius = MARIA_PLATFORM.radius;
        this.height = MARIA_PLATFORM.height;
        this.groundLevel = MARIA_PLATFORM.groundLevel;

        // Material
        this.color = {h: 40, s: 25, b: 35, a: 250};
        this.specular = {h: 40, s: 30, b: 60};
        this.shininess = 100;
    }

    draw() {
        push();
        translate(0, this.groundLevel, 0);
        fill(this.color.h, this.color.s, this.color.b, this.color.a);
        specularMaterial(this.specular.h, this.specular.s, this.specular.b);
        shininess(this.shininess);
        noStroke();
        cylinder(this.radius, this.height, 24);
        pop();
    }
}

class ConnectionRing {
    constructor() {
        this.segments = 64;

        // Farbe
        this.color = {h: 40, s: 22, b: 25};
    }

    draw() {
        push();
        fill(this.color.h, this.color.s, this.color.b);
        noStroke();

        beginShape(TRIANGLE_STRIP);
        for (let i = 0; i <= this.segments; i++) {
            let angle = map(i, 0, this.segments, 0, TWO_PI);

            let x1 = cos(angle) * MARIA_PLATFORM.radius;
            let z1 = sin(angle) * MARIA_PLATFORM.radius;
            let y1 = MARIA_PLATFORM.groundLevel;

            let x2 = cos(angle) * CITY_RING.innerRadius;
            let z2 = sin(angle) * CITY_RING.innerRadius;
            let y2 = CITY_RING.groundLevel;

            vertex(x1, y1, z1);
            vertex(x2, y2, z2);
        }
        endShape();
        pop();
    }
}

class CityRing {
    constructor() {
        this.segments = 48;

        // Farbe
        this.color = {h: 40, s: 20, b: 15};
    }

    draw() {
        push();
        translate(0, CITY_RING.groundLevel, 0);
        fill(this.color.h, this.color.s, this.color.b);
        noStroke();

        let outerRadius = CITY_RING.radius + CITY_RING.depth/2;
        let innerRadius = CITY_RING.innerRadius;

        beginShape(TRIANGLE_STRIP);
        for (let i = 0; i <= this.segments; i++) {
            let angle = map(i, 0, this.segments, 0, TWO_PI);
            let x1 = cos(angle) * innerRadius;
            let z1 = sin(angle) * innerRadius;
            let x2 = cos(angle) * outerRadius;
            let z2 = sin(angle) * outerRadius;

            vertex(x1, 0, z1);
            vertex(x2, 0, z2);
        }
        endShape();
        pop();
    }
}

async function setup() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    colorMode(HSB);
    setAttributes('alpha', true);

    let mariaModel = await loadModel('models/metropolis_woman.obj', true);
    let metropolisModel = await loadModel('models/Metropolis.obj', true);

    mariaStatue = new MariaStatue(mariaModel, MARIA_SCALE, MARIA_PLATFORM.groundLevel);
    metropolisStatue = new MetropolisStatue(metropolisModel, METROPOLIS_SCALE, CITY_RING.radius, CITY_RING.groundLevel);

    mariaPlatform = new MariaPlatform();
    connectionRing = new ConnectionRing();
    cityRing = new CityRing();

    generateBuildings();
    generateSpotlights();
}

function generateBuildings() {
    buildings = [];

    let outerRadius = CITY_RING.radius + CITY_RING.depth/2;
    let numBuildings = 800;

    for (let i = 0; i < numBuildings; i++) {
        let angle = random(TWO_PI);
        let radius = random(CITY_RING.innerRadius + 50, outerRadius - 50);

        let x = cos(angle) * radius;
        let z = sin(angle) * radius;

        let building = new Building(
            x, z,
            random(60, 120),   // breite
            random(300, 1000), // hoehe
            random(60, 120),   // tiefe
            CITY_RING.groundLevel
        );

        buildings.push(building);
    }
}

function generateSpotlights() {
    spotlights = [];

    for (let i = 0; i < 20; i++) {
        if (buildings.length > 0) {
            let randomBuilding = random(buildings);

            let rand = random(1);
            let mode;
            if (rand < 0.7) mode = 'up';
            else if (rand < 0.95) mode = 'metropolis';
            else mode = 'maria';

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
}

function draw() {
    background(40, 30, 20);
    perspective(PI/3, width/height, 10, 20000);

    ambientLight(40, 30, 30);
    directionalLight(40, 50, 60, 0, -1, 0);

    // Kamera
    if (!cameraInitialized) {
        camera(
            0, -110, 100,   // Kamera ist 200 Einheiten höher
            0, -130, 0,     // Zielpunkt ist AUCH 200 Einheiten höher
            0, 1, 0
        );
        cameraInitialized = true;
    }

    orbitControl();

    mariaPlatform.draw();
    connectionRing.draw();
    cityRing.draw();

    for (let building of buildings) {
        building.draw();
    }

    metropolisStatue.draw();
    mariaStatue.draw();

    for (let spotlight of spotlights) {
        spotlight.update();
        spotlight.draw(raycastHit);
    }
}

function raycastHit(startX, startY, startZ, dirX, dirY, dirZ) {
    let maxDist = 8000;
    let closestHit = {
        x: startX + dirX * maxDist,
        y: startY + dirY * maxDist,
        z: startZ + dirZ * maxDist
    };
    let closestDist = maxDist;

    for (let b of buildings) {
        let bbox = b.getBoundingBox();
        let hit = rayAABBIntersection(
            startX, startY, startZ,
            dirX, dirY, dirZ,
            bbox.minX, bbox.minY, bbox.minZ,
            bbox.maxX, bbox.maxY, bbox.maxZ
        );

        if (hit && hit.distance < closestDist) {
            closestDist = hit.distance;
            closestHit = hit.point;
        }
    }

    if (metropolisStatue) {
        let bbox = metropolisStatue.getBoundingBox();
        let hit = rayAABBIntersection(
            startX, startY, startZ,
            dirX, dirY, dirZ,
            bbox.minX, bbox.minY, bbox.minZ,
            bbox.maxX, bbox.maxY, bbox.maxZ
        );

        if (hit && hit.distance < closestDist) {
            closestDist = hit.distance;
            closestHit = hit.point;
        }
    }

    if (mariaStatue) {
        let bbox = mariaStatue.getBoundingBox();
        let hit = rayAABBIntersection(
            startX, startY, startZ,
            dirX, dirY, dirZ,
            bbox.minX, bbox.minY, bbox.minZ,
            bbox.maxX, bbox.maxY, bbox.maxZ
        );

        if (hit && hit.distance < closestDist) {
            closestDist = hit.distance;
            closestHit = hit.point;
        }
    }

    if (dirY > 0) {
        let t = (CITY_RING.groundLevel - startY) / dirY;
        if (t > 0 && t < closestDist) {
            let hitX = startX + dirX * t;
            let hitZ = startZ + dirZ * t;
            let distFromCenter = sqrt(hitX*hitX + hitZ*hitZ);

            if (distFromCenter > CITY_RING.innerRadius &&
                distFromCenter < CITY_RING.radius + CITY_RING.depth/2) {
                closestDist = t;
                closestHit = {x: hitX, y: CITY_RING.groundLevel, z: hitZ};
            }
        }
    }

    if (dirY > 0) {
        let t = (MARIA_PLATFORM.groundLevel - startY) / dirY;
        if (t > 0 && t < closestDist) {
            let hitX = startX + dirX * t;
            let hitZ = startZ + dirZ * t;
            let distFromCenter = sqrt(hitX*hitX + hitZ*hitZ);

            if (distFromCenter < MARIA_PLATFORM.radius) {
                closestDist = t;
                closestHit = {x: hitX, y: MARIA_PLATFORM.groundLevel, z: hitZ};
            }
        }
    }

    let hitX = startX + dirX * maxDist;
    let hitZ = startZ + dirZ * maxDist;
    let distFromCenter = sqrt(hitX*hitX + hitZ*hitZ);

    if (distFromCenter >= MARIA_PLATFORM.radius &&
        distFromCenter <= CITY_RING.innerRadius) {
        let t = (distFromCenter - MARIA_PLATFORM.radius) /
            (CITY_RING.innerRadius - MARIA_PLATFORM.radius);
        let slopeY = lerp(MARIA_PLATFORM.groundLevel, CITY_RING.groundLevel, t);

        if (dirY > 0) {
            let tSlope = (slopeY - startY) / dirY;
            if (tSlope > 0 && tSlope < closestDist) {
                let testX = startX + dirX * tSlope;
                let testZ = startZ + dirZ * tSlope;
                let testDist = sqrt(testX*testX + testZ*testZ);

                if (testDist >= MARIA_PLATFORM.radius &&
                    testDist <= CITY_RING.innerRadius) {
                    closestDist = tSlope;
                    closestHit = {x: testX, y: slopeY, z: testZ};
                }
            }
        }
    }

    return closestHit;
}

function rayAABBIntersection(rayX, rayY, rayZ, dirX, dirY, dirZ, minX, minY, minZ, maxX, maxY, maxZ) {
    const EPSILON = 0.000001;


    if (rayX >= minX && rayX <= maxX &&
        rayY >= minY && rayY <= maxY &&
        rayZ >= minZ && rayZ <= maxZ) {
        return null;
    }

    let tMin = -Infinity;
    let tMax = Infinity;

    // X-Achse
    if (abs(dirX) > EPSILON) {
        let t1 = (minX - rayX) / dirX;
        let t2 = (maxX - rayX) / dirX;
        tMin = max(tMin, min(t1, t2));
        tMax = min(tMax, max(t1, t2));
    } else {
        if (rayX < minX || rayX > maxX) return null;
    }

    // Y-Achse
    if (abs(dirY) > EPSILON) {
        let t1 = (minY - rayY) / dirY;
        let t2 = (maxY - rayY) / dirY;
        tMin = max(tMin, min(t1, t2));
        tMax = min(tMax, max(t1, t2));
    } else {
        if (rayY < minY || rayY > maxY) return null;
    }

    // Z-Achse
    if (abs(dirZ) > EPSILON) {
        let t1 = (minZ - rayZ) / dirZ;
        let t2 = (maxZ - rayZ) / dirZ;
        tMin = max(tMin, min(t1, t2));
        tMax = min(tMax, max(t1, t2));
    } else {
        if (rayZ < minZ || rayZ > maxZ) return null;
    }

    // Kein Treffer wenn tMin > tMax oder alles hinter dem Startpunkt
    if (tMin > tMax || tMax < 0) return null;

    // Verwende tMin wenn positiv, sonst tMax
    let t = tMin > 0 ? tMin : tMax;
    if (t < 0) return null;

    return {
        distance: t,
        point: {
            x: rayX + dirX * t,
            y: rayY + dirY * t,
            z: rayZ + dirZ * t
        }
    };
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}