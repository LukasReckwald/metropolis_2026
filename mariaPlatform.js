class MariaPlatform {
    constructor() {
        this.color = {h: 40, s: 25, b: 35, a: 250};
        this.specular = {h: 40, s: 30, b: 60};
    }

    draw() {
        push();
        translate(0, MARIA_PLATFORM.groundLevel, 0);
        fill(this.color.h, this.color.s, this.color.b, this.color.a);
        specularMaterial(this.specular.h, this.specular.s, this.specular.b);
        noStroke();
        cylinder(MARIA_PLATFORM.radius, MARIA_PLATFORM.height, 100);
        pop();
    }
}