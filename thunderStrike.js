class ThunderStrike {
    constructor() {
        this.bolts = [];
        this.flashIntensity = 0;
        this.minInterval = 60;   // ~3 Sekunden bei 60fps
        this.maxInterval = 120;   // ~10 Sekunden
        this.nextStrike = floor(random(60, this.minInterval)); //Erster Blitz kommt schneller
        this.timer = 0;
        this.flashDecay = 0.88;
        this.enabled = true;
    }

    update() {
        if (!this.enabled) return;

        this.timer++;

        if (this.timer >= this.nextStrike) {
            this.trigger();
            this.timer = 0;
            this.nextStrike = floor(random(this.minInterval, this.maxInterval));
        }

        this.flashIntensity *= this.flashDecay;
        if (this.flashIntensity < 0.01) this.flashIntensity = 0;

        for (let bolt of this.bolts) {
            bolt.life -= 0.06;
        }
        this.bolts = this.bolts.filter(b => b.life > 0);
    }

    trigger() {
        let angle = random(5 * PI / 4, 7 * PI / 4);
        let radius = random(CITY_RING.innerRadius, CITY_RING.radius + CITY_RING.depth / 2);

        let startX = cos(angle) * radius;
        let startY = -4000 - random(0, 2000);
        let startZ = sin(angle) * radius;

        let endX = startX + random(-400, 400);
        let endY = CITY_RING.groundLevel;
        let endZ = startZ + random(-400, 400);

        this.bolts.push(this.generateBolt(startX, startY, startZ, endX, endY, endZ));
        this.flashIntensity = 1.0;

        //Doppelblitz
        if (random() < 0.3) {
            this.bolts.push(this.generateBolt(
                startX + random(-200, 200), startY + random(-200, 200),
                startZ + random(-200, 200),
                endX + random(-300, 300), endY,
                endZ + random(-300, 300)
            ));
        }
    }

    generateBolt(sx, sy, sz, ex, ey, ez) {
        let points = [];
        let segments = 12;
        let jitter = 250;

        points.push({x: sx, y: sy, z: sz});

        for (let i = 1; i < segments; i++) {
            let t = i / segments;
            let spread = sin(t * PI) * jitter;
            points.push({
                x: lerp(sx, ex, t) + random(-spread, spread),
                y: lerp(sy, ey, t),
                z: lerp(sz, ez, t) + random(-spread, spread)
            });
        }

        points.push({x: ex, y: ey, z: ez});

        //Verzweigungen
        let branches = [];
        for (let i = 2; i < segments - 1; i++) {
            if (random() < 0.35) {
                let branchPts = [];
                let len = floor(random(3, 6));
                let bx = points[i].x;
                let by = points[i].y;
                let bz = points[i].z;

                branchPts.push({x: bx, y: by, z: bz});

                for (let j = 0; j < len; j++) {
                    bx += random(-150, 150);
                    by += random(80, 200);
                    bz += random(-150, 150);
                    branchPts.push({x: bx, y: by, z: bz});
                }

                branches.push(branchPts);
            }
        }

        return {main: points, branches: branches, life: 1.0};
    }

    getFlashIntensity() {
        return this.enabled ? this.flashIntensity : 0;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.bolts = [];
            this.flashIntensity = 0;
        }
    }

    draw() {
        if (!this.enabled || this.bolts.length === 0) return;

        push();
        noLights();
        noFill();

        for (let bolt of this.bolts) {
            let alpha = bolt.life;

            //Aeusserer Schein
            strokeWeight(14);
            stroke(45, 20, 80, alpha * 0.25);
            this.drawPath(bolt.main);

            //Mittlerer Schein
            strokeWeight(6);
            stroke(45, 15, 95, alpha * 0.6);
            this.drawPath(bolt.main);

            //Kern
            strokeWeight(2.5);
            stroke(45, 5, 100, alpha);
            this.drawPath(bolt.main);

            //Verzweigungen
            for (let branch of bolt.branches) {
                strokeWeight(5);
                stroke(45, 20, 80, alpha * 0.15);
                this.drawPath(branch);

                strokeWeight(2);
                stroke(45, 15, 95, alpha * 0.6);
                this.drawPath(branch);
            }
        }

        pop();
    }

    drawPath(points) {
        for (let i = 0; i < points.length - 1; i++) {
            line(
                points[i].x, points[i].y, points[i].z,
                points[i + 1].x, points[i + 1].y, points[i + 1].z
            );
        }
    }
}
