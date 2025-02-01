class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png"); 
    }

    create() {
        this.add.image(400, 300, "background");

        let button = this.add.image(400, 400, "startButton").setScale(0.5);
        button.setInteractive();

        // ボタンをクリックでGameSceneに移動
        button.on("pointerdown", () => {
            this.scene.start("GameScene");
        });

        this.add.text(250, 100, "My Phaser Game", {
            fontSize: "40px",
            fill: "#ffffff"
        });
    }
}
