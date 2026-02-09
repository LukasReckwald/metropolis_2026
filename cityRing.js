class CityRing {
    constructor() {
        this.segments = 48;
        this.color = {h: 40, s: 20, b: 15};
        this.startAngle = 5 * PI / 4;
        this.endAngle = 7 * PI / 4;
    }

    draw() {
        push();
        translate(0, CITY_RING.groundLevel, 0);
        fill(this.color.h, this.color.s, this.color.b);
        noStroke();

        let innerRadius = CITY_RING.innerRadius;
        let outerRadius = CITY_RING.radius + CITY_RING.depth / 2;

        beginShape(TRIANGLE_STRIP);

        for (let i = 0; i <= this.segments; i++) {
            let angle = map(i, 0, this.segments, this.startAngle, this.endAngle);
            let cosA = cos(angle);
            let sinA = sin(angle);

            vertex(cosA * innerRadius, 0, sinA * innerRadius);
            vertex(cosA * outerRadius, 0, sinA * outerRadius);
        }

        endShape();
        pop();
    }
}