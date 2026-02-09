class FogLayer {
    constructor(fogImage, yPosition, radius, height, rotationSpeed) {
        this.image = fogImage;
        this.y = yPosition;
        this.radius = radius;
        this.height = height;
        this.rotationSpeed = rotationSpeed;
        this.angle = random(TWO_PI);
        this.opacity = random(40, 80);
        this.hue = random(38, 45);

        this.doubleTexture = this.createDoubleTexture(fogImage);
    }

    //Spiegelt die Textur horizontal, um nahtlose Rotation zu ermöglichen
    createDoubleTexture(img) {
        let doubleImg = createGraphics(img.width * 2, img.height);
        doubleImg.image(img, 0, 0);
        doubleImg.push();
        doubleImg.scale(-1, 1);
        doubleImg.image(img, -img.width * 2, 0);
        doubleImg.pop();
        return doubleImg;
    }

    update() {
        this.angle += this.rotationSpeed;
    }

    draw() {
        push();

        translate(0, this.y, 0);
        rotateY(this.angle);

        emissiveMaterial(this.hue, 20, 10);
        tint(this.hue, 25, 80, this.opacity);
        texture(this.doubleTexture);
        noStroke();

        cylinder(this.radius, this.height, 50, 1, false, false);

        pop();
    }
}