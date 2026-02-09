class ConnectionRing {
    constructor() {
        this.segments = 64;
        this.color = {h: 40, s: 20, b: 15};
        this.startAngle = 5 * PI / 4;
        this.endAngle = 7 * PI / 4;
    }

    draw() {
        push();
        fill(this.color.h, this.color.s, this.color.b);
        noStroke();

        beginShape(TRIANGLE_STRIP);

        for (let i = 0; i <= this.segments; i++) {
            let angle = map(i, 0, this.segments, this.startAngle, this.endAngle);
            let cosA = cos(angle);
            let sinA = sin(angle);

            vertex(
                cosA * MARIA_PLATFORM.radius,
                MARIA_PLATFORM.groundLevel,
                sinA * MARIA_PLATFORM.radius
            );

            vertex(
                cosA * CITY_RING.innerRadius,
                CITY_RING.groundLevel,
                sinA * CITY_RING.innerRadius
            );
        }

        endShape();
        pop();
    }
}