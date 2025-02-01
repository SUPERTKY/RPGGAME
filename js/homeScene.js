class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png"); 
    }
create() {
    let bg = this.add.image(0, 0, "background");
    bg.setOrigin(0, 0); 
    bg.setDisplaySize(this.scale.width + 5, this.scale.height + 5); // 少し大きめに
}

    create() {
        this.add.image(400, 300, "background");

        let button = this.add.image(400, 400, "startButton").setScale(0.5);
        button.setInteractive();

        // ボタンをクリックでGameSceneに移動
        button.on("pointerdown", () => {
            this.scene.start("GameScene");
        });

        this.add.text(250, 100, "RPGGAME", {
            fontSize: "40px",
            fill: "#ffffff"
        });
    }
}
