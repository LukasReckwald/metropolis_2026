let maria;
let metropolis;
let buildings = [];
let spotlights = [];
let metropolisBBox;
let mariaBBox;

const GROUND_LEVEL_FRONT = 4000;
const GROUND_LEVEL_CITY = 0;
const CLEAR_RADIUS = 500;

// Maria's Position (unabhängig von der vorderen Plane)
const MARIA_POS = {x: 0, y: GROUND_LEVEL_FRONT -2500, z: 800};

async function setup() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    colorMode(HSB);

    maria = await loadModel('models/metropolis_woman.obj', true);
    metropolis = await loadModel('models/Metropolis.obj', true);

    metropolisBBox = calculateBoundingBox(metropolis, 0, GROUND_LEVEL_CITY - 1500, -5000, 15);
    mariaBBox = calculateBoundingBox(maria, MARIA_POS.x, MARIA_POS.y, MARIA_POS.z, 25);

    console.log('Metropolis BBox:', metropolisBBox);
    console.log('Maria BBox:', mariaBBox);

    generateBuildings();
    generateSpotlights();
}

function calculateBoundingBox(model, posX, posY, posZ, scale_factor) {
    if (!model || !model.vertices) {
        console.error('Modell hat keine Vertices!');
        return {minX: -100, maxX: 100, minY: -100, maxY: 100, minZ: -100, maxZ: 100};
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let v of model.vertices) {
        let x = v.x * scale_factor;
        let y = v.y * scale_factor;
        let z = v.z * scale_factor;

        minX = min(minX, x);
        maxX = max(maxX, x);
        minY = min(minY, y);
        maxY = max(maxY, y);
        minZ = min(minZ, z);
        maxZ = max(maxZ, z);
    }

    return {
        minX: minX + posX,
        maxX: maxX + posX,
        minY: -maxY + posY,
        maxY: -minY + posY,
        minZ: minZ + posZ,
        maxZ: maxZ + posZ
    };
}

function generateBuildings() {
    buildings = [];

    for (let x = -2400; x <= 2400; x += 250) {
        for (let z = -2400; z <= 2400; z += 250) {
            let distanceFromCenter = dist(x, z, 0, 0);

            if (distanceFromCenter < CLEAR_RADIUS) continue;

            buildings.push({
                x: x,
                z: z,
                width: random(60, 120),
                height: random(400, 1200),
                depth: random(60, 120),
                hue: 40,
                sat: random(20, 40),
                bright: random(40, 70)
            });
        }
    }
}

function generateSpotlights() {
    for (let i = 0; i < 15; i++) {
        if (buildings.length > 0) {
            let randomBuilding = random(buildings);
            spotlights.push({
                buildingX: randomBuilding.x,
                buildingZ: randomBuilding.z - 15000,
                buildingTop: GROUND_LEVEL_CITY - randomBuilding.height,
                angleXZ: random(TWO_PI),
                angleY: random(-1.2, 1.2),
                speedXZ: random(0.01, 0.03),
                speedY: random(0.005, 0.015),
                radius: random(300, 600),
                intensity: random(200, 255)
            });
        }
    }
}

function draw() {
    background(40, 30, 20);

    perspective(PI/3, width/height, 10, 50000);

    ambientLight(40, 30, 30);
    directionalLight(40, 50, 60, 0, -1, 0);

    orbitControl();


    // Definiere Ebenen-Parameter (unabhängig von Maria!)
    let frontPlane = {
        x: 0,
        y: GROUND_LEVEL_FRONT,
        z: 1500,      // Kann jetzt frei angepasst werden
        width: 10000,
        depth: 2000,
        color: {h: 40, s: 20, b: 20}  // Farbe definiert
    };

    let backPlane = {
        x: 0,
        y: GROUND_LEVEL_CITY,
        z: -15000,
        width: 10000,
        depth: 10000,
        color: {h: 40, s: 20, b: 15}
    };

    // VORDERE EBENE (unabhängig von Maria)
    push();
    translate(frontPlane.x, frontPlane.y, frontPlane.z);
    noStroke();
    box(frontPlane.width, 5, frontPlane.depth);
    pop();

    // SCHRÄGE
    drawAutoRamp(frontPlane, backPlane);

    // HINTERE EBENE
    push();
    translate(backPlane.x, backPlane.y, backPlane.z);
    noStroke();
    box(backPlane.width, 5, backPlane.depth);
    pop();

    // GEBÄUDE
    for (let b of buildings) {
        push();
        translate(b.x, GROUND_LEVEL_CITY - b.height/2, b.z - 15000);
        fill(b.hue, b.sat, b.bright);
        noStroke();
        box(b.width, b.height, b.depth);
        pop();
    }

    // SCHEINWERFER
    for (let spot of spotlights) {
        spot.angleXZ += spot.speedXZ;
        spot.angleY += spot.speedY;

        if (spot.angleY > 1.4 || spot.angleY < -1.4) {
            spot.speedY *= -1;
        }

        let fromX = spot.buildingX;
        let fromY = spot.buildingTop;
        let fromZ = spot.buildingZ;

        let targetX = cos(spot.angleXZ) * spot.radius;
        let targetZ = -5000 + sin(spot.angleXZ) * spot.radius;
        let targetY = GROUND_LEVEL_CITY - 1000 + sin(spot.angleY) * 1500;

        let dirX = targetX - fromX;
        let dirY = targetY - fromY;
        let dirZ = targetZ - fromZ;
        let dirLength = sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
        dirX /= dirLength;
        dirY /= dirLength;
        dirZ /= dirLength;

        let hitPoint = raycastHit(fromX, fromY, fromZ, dirX, dirY, dirZ);

        push();
        stroke(45, 80, spot.intensity, 120);
        strokeWeight(8);
        line(fromX, fromY, fromZ, hitPoint.x, hitPoint.y, hitPoint.z);
        pop();

        let hitDistance = dist(fromX, fromY, fromZ, hitPoint.x, hitPoint.y, hitPoint.z);
        if (hitDistance < 2900) {
            push();
            translate(hitPoint.x, hitPoint.y, hitPoint.z);
            fill(45, 100, 100, 200);
            noStroke();
            sphere(20);
            pointLight(45, 100, spot.intensity, 0, 0, 0);
            pop();
        }

        push();
        translate(fromX, fromY, fromZ);
        pointLight(45, 80, spot.intensity * 0.5, 0, 0, 0);
        pop();
    }

    // METROPOLIS
    push();
    translate(0, GROUND_LEVEL_CITY - 3500, -15000);
    rotateX(PI);
    scale(35);
    noStroke();
    ambientMaterial(45, 60, 90);
    specularMaterial(45, 80, 100);
    shininess(50);
    if (metropolis) {
        model(metropolis);
    }
    pop();

    // MARIA - unabhängige Position!
    push();
    translate(MARIA_POS.x, MARIA_POS.y, MARIA_POS.z);
    rotateX(PI);
    rotateY(PI);
    scale(25);
    noStroke();
    ambientMaterial(45, 40, 80);
    specularMaterial(45, 60, 100);
    shininess(150);
    if (maria) {
        model(maria);
    }
    pop();
}

function drawAutoRamp(frontPlane, backPlane) {
    // Berechne Eckpunkte der vorderen Ebene (hintere Kante)
    let frontZ = frontPlane.z - frontPlane.depth/2;
    let frontLeft = {
        x: frontPlane.x - frontPlane.width/2,
        y: frontPlane.y,
        z: frontZ
    };
    let frontRight = {
        x: frontPlane.x + frontPlane.width/2,
        y: frontPlane.y,
        z: frontZ
    };

    // Berechne Eckpunkte der hinteren Ebene (vordere Kante)
    let backZ = backPlane.z + backPlane.depth/2;
    let backLeft = {
        x: backPlane.x - backPlane.width/2,
        y: backPlane.y,
        z: backZ
    };
    let backRight = {
        x: backPlane.x + backPlane.width/2,
        y: backPlane.y,
        z: backZ
    };

    push();
    noStroke();
    beginShape();
    vertex(frontLeft.x, frontLeft.y, frontLeft.z);
    vertex(frontRight.x, frontRight.y, frontRight.z);
    vertex(backRight.x, backRight.y, backRight.z);
    vertex(backLeft.x, backLeft.y, backLeft.z);
    endShape(CLOSE);
    pop();
}

function raycastHit(startX, startY, startZ, dirX, dirY, dirZ) {
    let maxDist = 3000;
    let closestHit = {x: startX + dirX * maxDist, y: startY + dirY * maxDist, z: startZ + dirZ * maxDist};
    let closestDist = maxDist;

    for (let b of buildings) {
        let bx = b.x;
        let by = GROUND_LEVEL_CITY - b.height/2;
        let bz = b.z - 5000;

        let hit = rayAABBIntersection(
            startX, startY, startZ,
            dirX, dirY, dirZ,
            bx - b.width/2, by - b.height/2, bz - b.depth/2,
            bx + b.width/2, by + b.height/2, bz + b.depth/2
        );

        if (hit && hit.distance < closestDist) {
            closestDist = hit.distance;
            closestHit = hit.point;
        }
    }

    if (metropolisBBox) {
        let metroHit = rayAABBIntersection(
            startX, startY, startZ,
            dirX, dirY, dirZ,
            metropolisBBox.minX, metropolisBBox.minY, metropolisBBox.minZ,
            metropolisBBox.maxX, metropolisBBox.maxY, metropolisBBox.maxZ
        );

        if (metroHit && metroHit.distance < closestDist) {
            closestDist = metroHit.distance;
            closestHit = metroHit.point;
        }
    }

    if (mariaBBox) {
        let mariaHit = rayAABBIntersection(
            startX, startY, startZ,
            dirX, dirY, dirZ,
            mariaBBox.minX, mariaBBox.minY, mariaBBox.minZ,
            mariaBBox.maxX, mariaBBox.maxY, mariaBBox.maxZ
        );

        if (mariaHit && mariaHit.distance < closestDist) {
            closestDist = mariaHit.distance;
            closestHit = mariaHit.point;
        }
    }

    // Kollision mit vorderer Ebene
    if (dirY > 0) {
        let t = (GROUND_LEVEL_FRONT - startY) / dirY;
        if (t > 0 && t < closestDist) {
            closestDist = t;
            closestHit = {x: startX + dirX * t, y: GROUND_LEVEL_FRONT, z: startZ + dirZ * t};
        }
    }

    // Kollision mit hinterer Ebene
    if (dirY > 0) {
        let t = (GROUND_LEVEL_CITY - startY) / dirY;
        if (t > 0 && t < closestDist) {
            closestDist = t;
            closestHit = {x: startX + dirX * t, y: GROUND_LEVEL_CITY, z: startZ + dirZ * t};
        }
    }

    return closestHit;
}

function rayAABBIntersection(rayX, rayY, rayZ, dirX, dirY, dirZ, minX, minY, minZ, maxX, maxY, maxZ) {
    let tMin = (minX - rayX) / dirX;
    let tMax = (maxX - rayX) / dirX;
    if (tMin > tMax) [tMin, tMax] = [tMax, tMin];

    let tyMin = (minY - rayY) / dirY;
    let tyMax = (maxY - rayY) / dirY;
    if (tyMin > tyMax) [tyMin, tyMax] = [tyMax, tyMin];

    if ((tMin > tyMax) || (tyMin > tMax)) return null;

    tMin = max(tMin, tyMin);
    tMax = min(tMax, tyMax);

    let tzMin = (minZ - rayZ) / dirZ;
    let tzMax = (maxZ - rayZ) / dirZ;
    if (tzMin > tzMax) [tzMin, tzMax] = [tzMax, tzMin];

    if ((tMin > tzMax) || (tzMin > tMax)) return null;

    tMin = max(tMin, tzMin);

    if (tMin < 0) return null;

    return {
        distance: tMin,
        point: {
            x: rayX + dirX * tMin,
            y: rayY + dirY * tMin,
            z: rayZ + dirZ * tMin
        }
    };
}

function drawLightRays() {
    push();
    translate(0, GROUND_LEVEL_CITY - 500, -5000);

    for (let i = 0; i < 12; i++) {
        push();
        rotateY(i * TWO_PI / 12);
        fill(45, 80, 80, 30);
        noStroke();
        beginShape();
        vertex(0, 0, 0);
        vertex(2000, 0, 100);
        vertex(2000, -2000, 100);
        endShape(CLOSE);
        pop();
    }
    pop();
}

function drawPerlinFog() {
    push();
    translate(0, GROUND_LEVEL_CITY - 400, -3000);
    rotateX(PI/2);
    noStroke();

    let gridSize = 50;
    let scale_noise = 0.01;

    for (let x = -10; x < 10; x++) {
        for (let y = -10; y < 10; y++) {
            let noiseVal = noise(
                x * scale_noise + frameCount * 0.001,
                y * scale_noise + frameCount * 0.001
            );

            let alpha = map(noiseVal, 0, 1, 10, 60);
            fill(40, 20, 60, alpha);

            push();
            translate(x * gridSize, y * gridSize, 0);
            plane(gridSize, gridSize);
            pop();
        }
    }
    pop();
}

function drawPerlinFog_Front() {
    push();
    translate(0, GROUND_LEVEL_FRONT - 200, -500);
    rotateX(PI/2);
    noStroke();

    let gridSize = 40;
    let scale_noise = 0.015;

    for (let x = -8; x < 8; x++) {
        for (let y = -8; y < 8; y++) {
            let noiseVal = noise(
                x * scale_noise + frameCount * 0.002,
                y * scale_noise + frameCount * 0.002,
                2000
            );

            let alpha = map(noiseVal, 0, 1, 15, 70);
            fill(40, 25, 55, alpha);

            push();
            translate(x * gridSize, y * gridSize, 0);
            plane(gridSize, gridSize);
            pop();
        }
    }
    pop();
}