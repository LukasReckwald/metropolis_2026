class MetropolisStatue {
    constructor(model, scale, cityRingRadius, cityRingGroundLevel) {
        this.model = model;
        this.scale = scale;
        let angle = -PI/2;
        this.position = {
            x: cos(angle) * cityRingRadius,
            y: cityRingGroundLevel - 1500,
            z: sin(angle) * cityRingRadius + 1000
        };
        this.rotation = angle;

        this.boundingBox = this.calculateBoundingBox();
    }

    calculateBoundingBox() {

        let bbox = this.model.calculateBoundingBox();

        return {
            minX: bbox.min.x * this.scale + this.position.x,
            maxX: bbox.max.x * this.scale + this.position.x,
            minY: bbox.min.y * this.scale + this.position.y,
            maxY: bbox.max.y * this.scale + this.position.y,
            minZ: bbox.min.z * this.scale + this.position.z,
            maxZ: bbox.max.z * this.scale + this.position.z
        };
    }

    getPosition() {
        return this.position;
    }

    draw() {
        if (!this.model) return;

        push();
        translate(this.position.x, this.position.y, this.position.z);
        rotateX(PI);
        rotateY(this.rotation + PI/2);
        scale(this.scale);
        ambientLight(0, 0, 5);
        noStroke();
        fill(0, 0, 10);

        model(this.model);
        pop();
    }

    getBoundingBox() {
        return this.boundingBox;
    }
}
