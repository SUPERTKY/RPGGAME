class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png");
        this.load.audio("bgm", "assets/bgm.mp3"); // 🎵 音楽をロード
    }

    create() {
        // 背景
        let bg = this.add.image(0, 0, "background").setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        // スタートボタン
        let button = this.add.image(this.scale.width / 2, this.scale.height / 2, "startButton").setScale(0.5);
        button.setInteractive();
        button.on("pointerdown", () => {
            this.scene.start("GameScene");
        });

        // タイトル
        this.add.text(this.scale.width / 2 - 100, 100, "My Phaser Game", {
            fontSize: "40px",
            fill: "#ffffff"
        });

        // 🎵 BGM 再生（ループ付き）
        this.bgm = this.sound.add("bgm", { loop: true, volume: 0.5 });
        this.bgm.play();
    }
}

