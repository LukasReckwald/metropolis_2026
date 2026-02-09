class AnimatedRingSet {
    constructor() {
        this.lowestPoint = -125;
        this.highestPoint = 100;
        this.speed = random(0.01, 0.03);
        this.angle = random(TWO_PI);

        this.rings = [
            { radius: 35, thickness: 0.5, hue: random(40, 50) },
            { radius: 40, thickness: 0.5, hue: random(40, 50) },
            { radius: 45, thickness: 0.5, hue: random(40, 50) }
        ];

        this.segments = 60;
        this.visible = false;
    }

    update() {
        this.angle += this.speed;
    }

    toggle() {
        this.visible = !this.visible;
    }

    getCurrentHeight() {
        let middle = (this.lowestPoint + this.highestPoint) / 2;
        let range = (this.highestPoint - this.lowestPoint) / 2;
        return middle + sin(this.angle) * range;
    }

    draw() {
        if (!this.visible) return;

        push();

        let currentHeight = this.getCurrentHeight();
        translate(0, currentHeight, 0);
        rotateX(PI / 2);
        noStroke();

        for (let ring of this.rings) {
            push();
            emissiveMaterial(ring.hue, 70, 100);
            torus(ring.radius, ring.thickness, this.segments, 16);
            pop();
        }

        pop();
    }
}