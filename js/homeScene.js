class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
        this.firstClick = false; // 初回クリックを管理
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png");
        this.load.audio("bgm", "assets/Old_FortThe_sun_goes_down.mp3"); // 🎵 音楽をロード
    }

    create() {
        let bg = this.add.image(0, 0, "background").setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        let button = this.add.image(this.scale.width / 2, this.scale.height / 2, "startButton").setScale(0.5);
        button.setInteractive();

        this.add.text(this.scale.width / 2 - 100, 100, "My Phaser Game", {
            fontSize: "40px",
            fill: "#ffffff"
        });

        // 🎵 BGMの準備
        this.bgm = this.sound.add("bgm", { loop: true, volume: 0.5 });

        // **ボタンのクリック処理**
        button.on("pointerdown", () => {
            if (!this.firstClick) {
                // **最初のクリック: BGMを再生するだけ**
                if (!this.bgm.isPlaying) {
                    this.bgm.play();
                }
                this.firstClick = true; // 次からはシーン遷移ができる
                console.log("BGM開始 - もう一度押すとゲーム開始");
            } else {
                // **2回目以降のクリック: ゲームシーンに移動**
                this.scene.start("GameScene");
                console.log("ゲーム開始！");
            }
        });
    }
}
