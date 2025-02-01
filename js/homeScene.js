class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
        this.firstClick = false; // 最初のクリック管理
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png");
        this.load.audio("bgm", "assets/Old_FortThe_sun_goes_down.mp3"); // 🎵 音楽をロード
    }

    create() {
        let bg = this.add.image(0, 0, "background").setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        // 🎵 BGMの準備
        this.bgm = this.sound.add("bgm", { loop: true, volume: 0.5 });

        // **ボタンの設定（最初は無効）**
        let button = this.add.image(this.scale.width / 2, this.scale.height * 0.7, "startButton").setScale(0.5);
        button.setInteractive(false); // 初回は押せない
        button.setDepth(2); // Z軸中央

        // **袋文字のテキスト（中央配置）**
        let text = this.add.text(this.scale.width / 2, this.scale.height * 0.2, "My Phaser Game", {
            fontSize: "40px",
            fill: "#ffffff", // 文字の色
            stroke: "#000000", // 袋文字の色（黒）
            strokeThickness: 8, // 枠の太さ
            fontStyle: "bold",
            align: "center"
        }).setOrigin(0.5).setDepth(2); // Z軸中央

        // **クリックイベント（画面のどこでも有効）**
        this.input.once("pointerdown", () => {
            if (!this.firstClick) {
                // **BGM再生**
                if (!this.bgm.isPlaying) {
                    this.bgm.play();
                }

                // **ボタンを有効化**
                button.setInteractive(true);
                this.firstClick = true;
                console.log("BGM開始 - 次のクリックでゲーム開始");
            }
        });

        // **ボタンのクリック処理（2回目以降）**
        button.on("pointerdown", () => {
            if (this.firstClick) {
                this.scene.start("GameScene");
                console.log("ゲーム開始！");
            }
        });
    }
}

