let maria;
let metropolis;
let buildings = [];
let spotlights = [];
let metropolisBBox;
let mariaBBox;
let cameraInitialized = false;

const CITY_RING = {
    radius: 5000,        // Radius des Stadt-Rings
    innerRadius: 1800,    // Innerer Radius (freier Bereich um Maria)
    groundLevel: -300,   // Höhe der Stadt-Ebene
    depth: 1200          // Tiefe/Breite des Rings
};

const MARIA_PLATFORM = {
    radius: 600,         // Radius der Maria-Plattform
    groundLevel: 100,    // Höhe der Maria-Plattform (höher als Stadt)
    height: 1           // Dicke der Plattform
};

const MARIA_SCALE = 1;
const METROPOLIS_SCALE = 15;

const MARIA_POS = {
    x: 0,
    y: MARIA_PLATFORM.groundLevel -125,  // Angepasst für kleinere Statue
    z: 0
};

async function setup() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    colorMode(HSB);

    // Wichtig für transparente Objekte
    setAttributes('alpha', true);

    maria = await loadModel('models/metropolis_woman.obj', true);
    metropolis = await loadModel('models/Metropolis.obj', true);

    // Metropolis Position für BBox
    let metroAngle = -PI/2;
    let metroX = cos(metroAngle) * CITY_RING.radius;
    let metroZ = sin(metroAngle) * CITY_RING.radius + 1000;

    metropolisBBox = calculateBoundingBox(
        metropolis,
        metroX,
        CITY_RING.groundLevel - 1500,
        metroZ,
        METROPOLIS_SCALE
    );

    mariaBBox = calculateBoundingBox(
        maria,
        MARIA_POS.x,
        MARIA_POS.y,
        MARIA_POS.z,
        MARIA_SCALE
    );

    console.log('Metropolis BBox:', metropolisBBox);
    console.log('Maria BBox:', mariaBBox);

    generateBuildingsOnRing();
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

// Gebäude auf dem Ring anordnen
function generateBuildingsOnRing() {
    buildings = [];

    // Berechne den äußeren Rand des Rings
    let outerRadius = CITY_RING.radius + CITY_RING.depth/2;

    // Generiere random Gebäude im Ring-Bereich
    let numBuildings = 800;  // Anzahl der Gebäude

    for (let i = 0; i < numBuildings; i++) {
        // Zufälliger Winkel
        let angle = random(TWO_PI);

        // Zufälliger Radius im Ring-Bereich
        let radius = random(CITY_RING.innerRadius + 50, outerRadius - 50);

        // Position berechnen
        let x = cos(angle) * radius;
        let z = sin(angle) * radius;

        buildings.push({
            x: x,
            z: z,
            width: random(60, 120),
            height: random(300, 1000),
            depth: random(60, 120),
            hue: 40,
            sat: random(20, 40),
            bright: random(40, 70)
        });
    }
}

function generateSpotlights() {
    spotlights = [];

    for (let i = 0; i < 20; i++) {  // Reduziert von 40 auf 20
        if (buildings.length > 0) {
            let randomBuilding = random(buildings);

            // Verschiedene Modi für Spotlight-Ziele
            let rand = random(1);
            let mode;

            if (rand < 0.7) {
                // 70% - nach oben
                mode = 'up';
            } else if (rand < 0.95) {
                // 25% - Richtung Metropolis
                mode = 'metropolis';
            } else {
                // 5% - Richtung Maria
                mode = 'maria';
            }

            spotlights.push({
                buildingX: randomBuilding.x,
                buildingZ: randomBuilding.z,
                buildingTop: CITY_RING.groundLevel - randomBuilding.height,
                mode: mode,
                angle: random(TWO_PI),
                speed: random(0.002, 0.006),
                swayAmount: random(400, 800),  // Größerer Bewegungsradius
                baseHeight: random(2000, 3500),  // Feste Basis-Höhe für "up" mode
                intensity: random(180, 255),
                hue: random(40, 50)
            });
        }
    }
}

function draw() {
    background(40, 30, 20);

    perspective(PI/3, width/height, 10, 20000);

    ambientLight(40, 30, 30);
    directionalLight(40, 50, 60, 0, -1, 0);

    // Kamera nur beim ersten Frame setzen
    if (!cameraInitialized) {
        camera(
            0, 0, 300,  // Kamera Position: leicht erhöht und näher
            0, -150, 0,         // Schaut auf den Mittelpunkt (Maria)
            0, 1, 0          // Up-Vektor (Y ist oben)
        );
        cameraInitialized = true;
    }

    orbitControl();

    // MARIA PLATTFORM (zentral, erhöht)
    drawMariaPlatform();

    // DURCHGÄNGIGE VERBINDUNG (schräger Ring)
    drawConnectionRing();

    // STADT RING (außen herum, tiefer)
    drawCityRing();

    // GEBÄUDE auf dem Ring
    drawBuildings();

    // METROPOLIS Statue (auf dem Ring)
    drawMetropolis();

    // MARIA (zentral)
    drawMaria();

    // SCHEINWERFER - MÜSSEN ZULETZT gezeichnet werden wegen Transparenz!
    drawSpotlights();

}

function drawMariaPlatform() {
    push();
    translate(0, MARIA_PLATFORM.groundLevel, 0);
    // Leicht glänzende Oberfläche für Spiegeleffekt
    fill(40, 25, 35, 250);
    specularMaterial(40, 30, 60);
    shininess(100);
    noStroke();
    cylinder(MARIA_PLATFORM.radius, MARIA_PLATFORM.height, 24);
    pop();
}

function drawConnectionRing() {
    // Durchgängiger schräger Ring zwischen Maria-Plattform und Stadt-Ring
    let segments = 64;  // Mehr Segmente für glatte Kurve

    push();
    fill(40, 22, 25);
    noStroke();

    // Ring als TRIANGLE_STRIP von innen nach außen
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i <= segments; i++) {
        let angle = map(i, 0, segments, 0, TWO_PI);

        // Innerer Rand (Maria Plattform - höher)
        let x1 = cos(angle) * MARIA_PLATFORM.radius;
        let z1 = sin(angle) * MARIA_PLATFORM.radius;
        let y1 = MARIA_PLATFORM.groundLevel;

        // Äußerer Rand (Stadt Ring - tiefer)
        let x2 = cos(angle) * CITY_RING.innerRadius;
        let z2 = sin(angle) * CITY_RING.innerRadius;
        let y2 = CITY_RING.groundLevel;

        vertex(x1, y1, z1);
        vertex(x2, y2, z2);
    }
    endShape();

    pop();
}

function drawCityRing() {
    push();
    translate(0, CITY_RING.groundLevel, 0);
    fill(40, 20, 15);
    noStroke();

    // Ring als Torus oder als einfacher Ring mit mehreren Zylindern
    // Einfache Version: Äußerer Zylinder - Innerer Zylinder

    // Äußerer Ring
    let outerRadius = CITY_RING.radius + CITY_RING.depth/2;
    let innerRadius = CITY_RING.innerRadius;
    let segments = 48;

    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i <= segments; i++) {
        let angle = map(i, 0, segments, 0, TWO_PI);
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

function drawBuildings() {
    for (let b of buildings) {
        push();
        translate(b.x, CITY_RING.groundLevel - b.height/2, b.z);
        fill(b.hue, b.sat, b.bright);
        noStroke();
        box(b.width, b.height, b.depth);
        pop();
    }
}

function drawSpotlights() {
    for (let spot of spotlights) {
        spot.angle += spot.speed;

        let fromX = spot.buildingX;
        let fromY = spot.buildingTop;
        let fromZ = spot.buildingZ;

        let targetX, targetY, targetZ;

        if (spot.mode === 'up') {
            // Nach oben mit leichtem Schwanken - KEIN random() mehr!
            targetX = spot.buildingX + cos(spot.angle) * spot.swayAmount;
            targetZ = spot.buildingZ + sin(spot.angle) * spot.swayAmount;
            targetY = CITY_RING.groundLevel - spot.baseHeight;  // Feste Höhe mit leichter Variation

        } else if (spot.mode === 'metropolis') {
            // Richtung Metropolis mit leichter Variation
            let metroAngle = -PI/2;
            let metroX = cos(metroAngle) * CITY_RING.radius;
            let metroZ = sin(metroAngle) * CITY_RING.radius + 1000;

            targetX = metroX + cos(spot.angle) * spot.swayAmount;
            targetZ = metroZ + sin(spot.angle) * spot.swayAmount;
            targetY = CITY_RING.groundLevel - 1500 + sin(spot.angle * 2) * 400;

        } else if (spot.mode === 'maria') {
            // Richtung Maria mit leichter Variation
            targetX = cos(spot.angle) * spot.swayAmount;
            targetZ = sin(spot.angle) * spot.swayAmount;
            targetY = MARIA_PLATFORM.groundLevel + sin(spot.angle * 2) * 200;
        }

        // Richtungsvektor berechnen
        let dirX = targetX - fromX;
        let dirY = targetY - fromY;
        let dirZ = targetZ - fromZ;
        let dirLength = sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
        dirX /= dirLength;
        dirY /= dirLength;
        dirZ /= dirLength;

        // Raycast für Kollisionserkennung
        let hitPoint = raycastHit(fromX, fromY, fromZ, dirX, dirY, dirZ);
        let hitDistance = dist(fromX, fromY, fromZ, hitPoint.x, hitPoint.y, hitPoint.z);

        // Vereinfachter Kegel - nur 4 Seiten + weniger Segmente
        let segments = 3;  // Nur 3 Segmente statt 8
        let sides = 4;     // Nur 4 Seiten (Quadrat) statt Kreis

        for (let i = 0; i < segments; i++) {
            let t1 = i / segments;
            let t2 = (i + 1) / segments;

            let x1 = fromX + dirX * hitDistance * t1;
            let y1 = fromY + dirY * hitDistance * t1;
            let z1 = fromZ + dirZ * hitDistance * t1;

            let x2 = fromX + dirX * hitDistance * t2;
            let y2 = fromY + dirY * hitDistance * t2;
            let z2 = fromZ + dirZ * hitDistance * t2;

            let radius1 = t1 * 40;
            let radius2 = t2 * 40;

            let alpha1 = (1 - t1) * spot.intensity * 0.5;
            let alpha2 = (1 - t2) * spot.intensity * 0.5;

            push();
            noStroke();

            for (let j = 0; j < sides; j++) {
                let angle1 = (j / sides) * TWO_PI;
                let angle2 = ((j + 1) / sides) * TWO_PI;

                beginShape();
                fill(spot.hue, 80, 100, alpha1);
                vertex(x1 + cos(angle1) * radius1, y1, z1 + sin(angle1) * radius1);
                vertex(x1 + cos(angle2) * radius1, y1, z1 + sin(angle2) * radius1);

                fill(spot.hue, 80, 100, alpha2);
                vertex(x2 + cos(angle2) * radius2, y2, z2 + sin(angle2) * radius2);
                vertex(x2 + cos(angle1) * radius2, y2, z2 + sin(angle1) * radius2);
                endShape(CLOSE);
            }
            pop();
        }

        // Lichtquelle am Gebäude
        push();
        translate(fromX, fromY, fromZ);
        fill(spot.hue, 100, spot.intensity, 200);
        noStroke();
        sphere(15);
        pointLight(spot.hue, 80, spot.intensity * 0.7, 0, 0, 0);
        pop();

        // Lichtspot am Aufprallpunkt - AUSKOMMENTIERT
        /*
        if (hitDistance < 8000) {
            push();
            translate(hitPoint.x, hitPoint.y, hitPoint.z);
            fill(spot.hue, 100, 100, 100);
            noStroke();
            sphere(25);  // <-- DIESE KUGEL AM ENDE
            pointLight(spot.hue, 100, spot.intensity, 0, 0, 0);
            pop();
        }
        */
    }
}

function drawMetropolis() {
    if (!metropolis) return;

    // Metropolis auf dem Ring platzieren - HINTER Maria
    let metroAngle = -PI/2;  // -90° = hinter Maria (negative Z-Achse)
    let metroX = cos(metroAngle) * CITY_RING.radius;
    let metroZ = sin(metroAngle) * CITY_RING.radius +1000;

    push();
    translate(metroX, CITY_RING.groundLevel - 1500, metroZ);
    rotateX(PI);
    rotateY(metroAngle + PI/2);  // Zur Mitte ausgerichtet
    scale(METROPOLIS_SCALE);
    noStroke();
    ambientMaterial(45, 60, 90);
    specularMaterial(45, 80, 100);
    shininess(50);
    model(metropolis);
    pop();
}

function drawMaria() {
    if (!maria) return;

    push();
    translate(MARIA_POS.x, MARIA_POS.y, MARIA_POS.z);
    rotateX(PI);
    rotateY(PI);
    scale(MARIA_SCALE);
    noStroke();
    // Reflektierendes Metall-Material (wie Chrom)
    ambientMaterial(45, 20, 60);  // Dunkler ambient
    specularMaterial(0, 0, 100);  // Sehr helles specular (fast weiß)
    shininess(400);  // Sehr hohe shininess für Chrom-Effekt
    model(maria);
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function raycastHit(startX, startY, startZ, dirX, dirY, dirZ) {
    let maxDist = 8000;
    let closestHit = {
        x: startX + dirX * maxDist,
        y: startY + dirY * maxDist,
        z: startZ + dirZ * maxDist
    };
    let closestDist = maxDist;

    // Gebäude
    for (let b of buildings) {
        let bx = b.x;
        let by = CITY_RING.groundLevel - b.height/2;
        let bz = b.z;

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

    // Metropolis
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

    // Maria
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

    // Kollision mit Stadt Ring
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

    // Kollision mit Maria Plattform
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

    // Kollision mit Verbindungsring (schräge Fläche)
    let hitX = startX + dirX * maxDist;
    let hitZ = startZ + dirZ * maxDist;
    let distFromCenter = sqrt(hitX*hitX + hitZ*hitZ);

    if (distFromCenter >= MARIA_PLATFORM.radius && distFromCenter <= CITY_RING.innerRadius) {
        let t = (distFromCenter - MARIA_PLATFORM.radius) / (CITY_RING.innerRadius - MARIA_PLATFORM.radius);
        let slopeY = lerp(MARIA_PLATFORM.groundLevel, CITY_RING.groundLevel, t);

        if (dirY > 0) {
            let tSlope = (slopeY - startY) / dirY;
            if (tSlope > 0 && tSlope < closestDist) {
                let testX = startX + dirX * tSlope;
                let testZ = startZ + dirZ * tSlope;
                let testDist = sqrt(testX*testX + testZ*testZ);

                if (testDist >= MARIA_PLATFORM.radius && testDist <= CITY_RING.innerRadius) {
                    closestDist = tSlope;
                    closestHit = {x: testX, y: slopeY, z: testZ};
                }
            }
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