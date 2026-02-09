class Building {
    constructor(x, z, width, height, depth, cityRingGroundLevel) {
        this.x = x;
        this.z = z;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.groundLevel = cityRingGroundLevel;

        this.hue = 0;
        this.sat = 0;
        this.bright = random(8, 12);

        this.windows = this.generateWindows();
    }

    generateWindows() {
        let windows = [];
        let windowWidth = 10;
        let windowHeight = 15;
        let spacing = 30;

        let cols = floor(this.width / spacing);
        let rows = floor(this.height / (spacing * 3));

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (random() < 0.5) {
                    let yPos = -this.height/2 + row * spacing * 3 + spacing;
                    let xOffset = -this.width/2 + col * spacing + spacing/2;

                    windows.push({
                        x: xOffset,
                        y: yPos,
                        width: windowWidth,
                        height: windowHeight,
                        brightness: random(30, 90)
                    });
                }
            }
        }

        return windows;
    }

    draw() {
        push();
        translate(this.x, this.groundLevel - this.height/2, this.z);
        ambientLight(0, 0, 5);
        noStroke();
        fill(this.hue, this.sat, this.bright);
        box(this.width, this.height, this.depth);

        noLights();
        for (let window of this.windows) {
            fill(45, 80, window.brightness);

            //vorne
            push();
            translate(window.x, window.y, this.depth/2 + 0.5);
            rect(0, 0, window.width, window.height);
            pop();

            //links
            push();
            translate(-this.width/2 - 0.5, window.y, window.x);
            rotateY(HALF_PI);
            rect(0, 0, window.width, window.height);
            pop();

            //rechts
            push();
            translate(this.width/2 + 0.5, window.y, -window.x);
            rotateY(-HALF_PI);
            rect(0, 0, window.width, window.height);
            pop();

        }
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