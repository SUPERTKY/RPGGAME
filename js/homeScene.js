class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
        this.firstClick = false; // 最初のクリックを管理
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
        let button = this.add.image(this.scale.width / 2, this.scale.height * 0.75, "startButton").setScale(0.3);
        button.setInteractive(false); // 初回は押せない
        button.setDepth(2); // Z軸中央

        // **袋文字のテキスト（完全に中央配置 & 視認性UP）**
        let text = this.add.text(this.scale.width / 2, this.scale.height / 2, "My Phaser Game", {
            fontSize: "64px", // 大きく
            fill: "#ffffff", // 文字の色
            stroke: "#000000", // 袋文字の色（黒）
            strokeThickness: 10, // 枠の太さ
            fontStyle: "bold",
            align: "center"
        }).setOrigin(0.5, 0.5).setDepth(2); // 完全中央配置

        // **透明のクリックエリア（全画面クリック可能に）**
        let clickableArea = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0);
        clickableArea.setInteractive(); // 全画面でクリックを受け付ける
        clickableArea.setDepth(1); // 背景の次のレイヤー

        // **クリックイベント（どこを押してもOK）**
        this.input.on("pointerdown", (pointer) => {
            console.log(`画面がクリックされた: x=${pointer.x}, y=${pointer.y}`);

            if (!this.firstClick) {
                console.log("BGM再生開始");
                this.bgm.play(); // BGM再生
                button.setInteractive(); // ボタンを有効化
                this.firstClick = true;
            }
        });

        // **ボタンのクリック処理（2回目以降）**
        button.on("pointerdown", () => {
            if (this.firstClick) {
                console.log("ボタンが押された - ゲーム開始");
                this.scene.start("GameScene");
            }
        });
    }
}


