class MariaStatue {
    constructor(model, scale, platformGroundLevel) {
        this.model = model;
        this.scale = scale;

        this.position = {
            x: 0,
            y: platformGroundLevel - 125,
            z: 0
        };

        this.material = {
            ambient: {h: 45, s: 20, b: 60},
            specular: {h: 0, s: 0, b: 100},
            shininess: 80
        };
    }

    draw() {
        if (!this.model) return;

        push();
        translate(this.position.x, this.position.y, this.position.z);
        rotateX(PI);
        rotateY(PI);
        scale(this.scale);
        noStroke();

        ambientMaterial(this.material.ambient.h, this.material.ambient.s, this.material.ambient.b);
        specularMaterial(this.material.specular.h, this.material.specular.s, this.material.specular.b);
        shininess(this.material.shininess);

        model(this.model);
        pop();
    }
}
