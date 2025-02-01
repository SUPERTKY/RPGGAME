class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png");
    }

    create() {
        // 背景画像を全画面に設定
let bg = this.add.image(0, 0, "background");
    bg.setOrigin(0, 0); 
    bg.setDisplaySize(this.scale.width + 10, this.scale.height); // 右端に余裕を持たせる

        // スタートボタン
        let button = this.add.image(this.scale.width / 2, this.scale.height / 2, "startButton").setScale(0.5);
        button.setInteractive();
        button.on("pointerdown", () => {
            this.scene.start("GameScene");
        });

        // タイトルテキスト
        this.add.text(this.scale.width / 2 - 100, 100, "RPGGAME", {
            fontSize: "40px",
            fill: "#ffffff"
        });
    }
}
