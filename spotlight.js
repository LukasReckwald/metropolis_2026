class Spotlight {
    constructor(building, mode, metropolisStatue, mariaPlatformGroundLevel, cityRingGroundLevel) {
        this.buildingX = building.x;
        this.buildingZ = building.z;
        this.buildingTop = building.groundLevel - building.height;

        this.mode = mode; // 'up', 'metropolis', 'maria'
        this.angle = random(TWO_PI);
        this.speed = random(0.002, 0.006);
        this.swayAmount = random(400, 800);
        this.baseHeight = random(2000, 3500);
        this.intensity = random(180, 255);
        this.hue = random(40, 50);

        // Kegel-Parameter
        this.coneSegments = 1;
        this.coneSides = 4;
        this.maxRadius = 100;
        this.alpha = 0.5;

        this.metropolisStatue = metropolisStatue;
        this.mariaPlatformGroundLevel = mariaPlatformGroundLevel;
        this.cityRingGroundLevel = cityRingGroundLevel;
    }

    update() {
        this.angle += this.speed;
    }

    getTargetPosition() {
        let targetX, targetY, targetZ;

        if (this.mode === 'up') {
            targetX = this.buildingX + cos(this.angle) * this.swayAmount;
            targetZ = this.buildingZ + sin(this.angle) * this.swayAmount;
            targetY = this.cityRingGroundLevel - this.baseHeight;

        } else if (this.mode === 'metropolis') {
            let metroPos = this.metropolisStatue.getPosition();
            targetX = metroPos.x + cos(this.angle) * this.swayAmount;
            targetZ = metroPos.z + sin(this.angle) * this.swayAmount;
            targetY = metroPos.y + sin(this.angle * 2) * 400;

        } else if (this.mode === 'maria') {
            targetX = cos(this.angle) * this.swayAmount;
            targetZ = sin(this.angle) * this.swayAmount;
            targetY = this.mariaPlatformGroundLevel + sin(this.angle * 2) * 200;
        }

        return {x: targetX, y: targetY, z: targetZ};
    }

    draw(raycastFunction) {
        let fromX = this.buildingX;
        let fromY = this.buildingTop;
        let fromZ = this.buildingZ;

        let target = this.getTargetPosition();

        // Richtungsvektor
        let dirX = target.x - fromX;
        let dirY = target.y - fromY;
        let dirZ = target.z - fromZ;
        let dirLength = sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
        dirX /= dirLength;
        dirY /= dirLength;
        dirZ /= dirLength;

        let hitPoint = raycastFunction(fromX, fromY, fromZ, dirX, dirY, dirZ);
        let hitDistance = dist(fromX, fromY, fromZ, hitPoint.x, hitPoint.y, hitPoint.z);

        // Zeichne Kegel
        this.drawCone(fromX, fromY, fromZ, dirX, dirY, dirZ, hitDistance);

        // Lichtquelle am Gebäude
        this.drawLightSource(fromX, fromY, fromZ);
    }

    drawCone(fromX, fromY, fromZ, dirX, dirY, dirZ, distance) {
        for (let i = 0; i < this.coneSegments; i++) {
            let t1 = i / this.coneSegments;
            let t2 = (i + 1) / this.coneSegments;

            let x1 = fromX + dirX * distance * t1;
            let y1 = fromY + dirY * distance * t1;
            let z1 = fromZ + dirZ * distance * t1;

            let x2 = fromX + dirX * distance * t2;
            let y2 = fromY + dirY * distance * t2;
            let z2 = fromZ + dirZ * distance * t2;

            let radius1 = t1 * this.maxRadius;
            let radius2 = t2 * this.maxRadius;

            let alpha1 = (1 - t1) * this.intensity * this.alpha;
            let alpha2 = (1 - t2) * this.intensity * this.alpha;

            push();
            noStroke();

            for (let j = 0; j < this.coneSides; j++) {
                let angle1 = (j / this.coneSides) * TWO_PI;
                let angle2 = ((j + 1) / this.coneSides) * TWO_PI;

                beginShape();
                fill(this.hue, 80, 100, alpha1);
                vertex(x1 + cos(angle1) * radius1, y1, z1 + sin(angle1) * radius1);
                vertex(x1 + cos(angle2) * radius1, y1, z1 + sin(angle2) * radius1);

                fill(this.hue, 80, 100, alpha2);
                vertex(x2 + cos(angle2) * radius2, y2, z2 + sin(angle2) * radius2);
                vertex(x2 + cos(angle1) * radius2, y2, z2 + sin(angle1) * radius2);
                endShape(CLOSE);
            }
            pop();
        }
    }

    drawLightSource(x, y, z) {
        push();
        translate(x, y, z);
        fill(this.hue, 100, this.intensity, 200);
        noStroke();
        sphere(15);
        pointLight(this.hue, 80, this.intensity * 0.7, 0, 0, 0);
        pop();
    }
}
