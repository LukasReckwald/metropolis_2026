class Spotlight {
    constructor(building, mode, metropolisStatue, mariaPlatformGroundLevel, cityRingGroundLevel) {
        this.position = createVector(building.x, building.groundLevel - building.height, building.z);

        this.mode = mode;

        this.angle = random(TWO_PI);
        this.speed = random(0.004, 0.008);
        this.swayAmount = random(400, 800);
        this.baseHeight = random(2000, 3500);

        this.hue = random(40, 50);
        this.intensity = random(100, 140);
        this.maxRadius = 100;
        this.alpha = 0.01;
        this.segments = 50;

        if (mode === 'v-left' || mode === 'v-right') {
            this.maxRadius = 50;
        }

        this.metropolisStatue = metropolisStatue;
        this.cityRingGroundLevel = cityRingGroundLevel;
    }

    update() {
        this.angle += this.speed;
    }

    //Scheinwerfer Richtung
    getTargetPosition() {
        if (this.mode === 'up') {
            return createVector(
                this.position.x + cos(this.angle) * this.swayAmount,
                this.cityRingGroundLevel - this.baseHeight,
                this.position.z + sin(this.angle) * this.swayAmount
            );
        }

        if (this.mode === 'metropolis') {
            let metroPos = this.metropolisStatue.position;
            return createVector(
                metroPos.x + cos(this.angle) * this.swayAmount,
                metroPos.y + sin(this.angle * 2) * 400,
                metroPos.z + sin(this.angle) * this.swayAmount
            );
        }

        if (this.mode === 'v-left') {
            return createVector(
                -800 + cos(this.angle) * this.swayAmount * 0.5,
                this.cityRingGroundLevel - this.baseHeight,
                -1000 + sin(this.angle) * this.swayAmount * 0.4
            );
        }

        if (this.mode === 'v-right') {
            return createVector(
                800 + cos(this.angle) * this.swayAmount * 0.5,
                this.cityRingGroundLevel - this.baseHeight,
                -1000 + sin(this.angle) * this.swayAmount * 0.4
            );
        }
    }

    draw(raycastFunction) {
        let target = this.getTargetPosition();

        let direction = p5.Vector.sub(target, this.position);
        direction.normalize();

        let hitPoint = raycastFunction(
            this.position.x, this.position.y, this.position.z,
            direction.x, direction.y, direction.z
        );

        let hitDistance = dist(
            this.position.x, this.position.y, this.position.z,
            hitPoint.x, hitPoint.y, hitPoint.z
        );


        if (this.mode === 'v-left' || this.mode === 'v-right') { // V-Scheinwerfer haben kürzere Reichweite (aesthetisch)
            hitDistance = min(hitDistance, 1000);
        }

        this.drawCone(this.position, direction, hitDistance);
    }

    drawCone(startPos, direction, distance) {
        push();
        noStroke();

        let startTransparency = (this.mode === 'v-left' || this.mode === 'v-right') ? 0.3 : 0.5;
        let startAlpha = startTransparency * this.intensity * this.alpha;

        let endPos = p5.Vector.add(startPos, p5.Vector.mult(direction, distance));

        for (let i = 0; i < this.segments; i++) {
            let angle1 = map(i, 0, this.segments, 0, TWO_PI);
            let angle2 = map(i + 1, 0, this.segments, 0, TWO_PI);

            beginShape();

            //start
            fill(this.hue, 80, 100, startAlpha);
            vertex(startPos.x, startPos.y, startPos.z);
            vertex(startPos.x, startPos.y, startPos.z);

            //ende
            fill(this.hue, 80, 100, 0);
            vertex(endPos.x + cos(angle2) * this.maxRadius, endPos.y, endPos.z + sin(angle2) * this.maxRadius);
            vertex(endPos.x + cos(angle1) * this.maxRadius, endPos.y, endPos.z + sin(angle1) * this.maxRadius);

            endShape(CLOSE);
        }

        pop();
    }
}