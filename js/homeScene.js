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

        // **ボタンの設定（初回クリック時は無効）**
        let button = this.add.image(this.scale.width / 2, this.scale.height * 0.75, "startButton").setScale(0.4);
        button.setInteractive(false); // 初回は押せない
        button.setDepth(2);

        // **袋文字のテキスト（中央配置）**
        let text = this.add.text(this.scale.width / 2, this.scale.height / 2, "My Phaser Game", {
            fontSize: "64px", // 文字を大きく
            fill: "#ffffff", // 文字の色
            stroke: "#000000", // 袋文字の色（黒）
            strokeThickness: 10, // 枠の太さ
            fontStyle: "bold",
            align: "center"
        }).setOrigin(0.5, 0.5).setDepth(2);

        // **クリックエリア（画面全体をクリック可能に）**
        this.input.once("pointerdown", () => {
            console.log("画面がクリックされた - BGM再生");

            // **BGMが再生されていなければ流す**
            if (!this.bgm.isPlaying) {
                this.bgm.play();
            }

            // **ボタンを有効化**
            button.setInteractive();
            this.firstClick = true;
        });

        // **ボタンのクリック処理（2回目以降）**
        button.on("pointerdown", () => {
            if (this.firstClick) {
                console.log("ボタンが押された - ゲーム開始");
                this.scene.start("GameScene");
            }
        });

        // **デバッグ用：どこをクリックしたかを確認**
        this.input.on("pointerdown", (pointer) => {
            console.log(`クリック位置: x=${pointer.x}, y=${pointer.y}`);
        });
    }
}

