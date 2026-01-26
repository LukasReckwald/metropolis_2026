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

        // Material Einstellungen
        this.material = {
            ambient: {h: 45, s: 60, b: 90},
            specular: {h: 45, s: 80, b: 100},
            shininess: 100
        };

        this.boundingBox = this.calculateBoundingBox();
    }

    calculateBoundingBox() {
        if (!this.model || !this.model.vertices) {
            return {minX: -100, maxX: 100, minY: -100, maxY: 100, minZ: -100, maxZ: 100};
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (let v of this.model.vertices) {
            let x = v.x * this.scale;
            let y = v.y * this.scale;
            let z = v.z * this.scale;

            minX = min(minX, x);
            maxX = max(maxX, x);
            minY = min(minY, y);
            maxY = max(maxY, y);
            minZ = min(minZ, z);
            maxZ = max(maxZ, z);
        }

        return {
            minX: minX + this.position.x,
            maxX: maxX + this.position.x,
            minY: -maxY + this.position.y,
            maxY: -minY + this.position.y,
            minZ: minZ + this.position.z,
            maxZ: maxZ + this.position.z
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
        noStroke();

        ambientMaterial(this.material.ambient.h, this.material.ambient.s, this.material.ambient.b);
        specularMaterial(this.material.specular.h, this.material.specular.s, this.material.specular.b);
        shininess(this.material.shininess);

        model(this.model);
        pop();
    }

    getBoundingBox() {
        return this.boundingBox;
    }
}
