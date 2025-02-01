class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("background", "assets/background.png"); // 背景画像をロード
        this.load.image("player", "assets/MUCHINGBUTTON.png"); // マッチングボタン用画像
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 新しいBGMをロード
    }

    create() {
        // 🔵 背景画像の追加
        this.add.image(400, 300, "background").setScale(1);

        // ゲーム画面テキスト
        this.add.text(300, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        }).setDepth(1); // 前面に配置

        // マッチングボタン画像
        this.player = this.add.image(400, 300, "player").setInteractive().setDepth(1);

        // 🔴 ホーム画面のBGMを停止（前のBGMが "bgm" というキーなら）
        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }

        // 🎵 新しいBGMを再生
        this.newBgm = this.sound.add("newBgm", { loop: true });
        this.newBgm.play();

        // 額縁風のテキストボックス
        this.createFramedInputBox();

        // マッチングボタン（画像の下に追加）
        this.createMatchButton();
    }

    createFramedInputBox() {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "暗証番号を入力";
        input.style.fontSize = "20px";
        input.style.width = "200px";
        input.style.padding = "10px";
        input.style.textAlign = "center";

        // 額縁風のデザイン
        input.style.border = "5px solid gold"; // 太めの金枠
        input.style.borderRadius = "10px";
        input.style.background = "linear-gradient(to bottom, #fff8dc, #f4e1c6)"; // クリーム色のグラデーション
        input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)"; // 影で立体感
        input.style.position = "absolute"; // PhaserのCanvas上で表示するために必要
        input.style.transform = "translate(-50%, -50%)"; // 中央寄せ

        this.inputBox = this.add.dom(400, 200, input).setDepth(1); // 画面の前面に配置
    }

    createMatchButton() {
        const button = this.add.text(400, 350, "マッチング", {
            fontSize: "30px",
            fill: "#ffffff",
            backgroundColor: "#007BFF",
            padding: { left: 15, right: 15, top: 8, bottom: 8 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(1) // 画面の前面に配置
        .setStyle({
            border: "3px solid #0056b3", // 枠
            borderRadius: "10px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)", // 立体感
            cursor: "pointer"
        });

        // クリック時の処理（現時点では効果なし）
        button.on("pointerdown", () => {
            console.log("マッチングボタンが押されました");
        });
    }
}

