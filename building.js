class Building {
    constructor(x, z, width, height, depth, cityRingGroundLevel) {
        this.x = x;
        this.z = z;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.groundLevel = cityRingGroundLevel;

        // Farb-Einstellungen
        this.hue = 40;
        this.sat = random(20, 40);
        this.bright = random(40, 70);
    }

    draw() {
        push();
        translate(this.x, this.groundLevel - this.height/2, this.z);
        fill(this.hue, this.sat, this.bright);
        noStroke();
        box(this.width, this.height, this.depth);
        pop();
    }

    getBoundingBox() {
        return {
            minX: this.x - this.width/2,
            maxX: this.x + this.width/2,
            minY: this.groundLevel - this.height,
            maxY: this.groundLevel,
            minZ: this.z - this.depth/2,
            maxZ: this.z + this.depth/2
        };
    }
}
