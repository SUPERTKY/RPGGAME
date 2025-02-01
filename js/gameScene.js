class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("background", "assets/村.png"); // 背景画像をロード
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png"); // マッチングボタン画像
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 新しいBGMをロード
    }

    create() {
        // 🔵 **前のシーンの残像を消す**
        this.cameras.main.setBackgroundColor("#000000");
        this.scene.restart(); // **前の画像を確実にクリア**

        // 🎨 **背景画像を配置し、全画面スケール**
        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-1); // **最背面に配置**

        // 📜 **タイトルテキスト**
        this.add.text(this.scale.width / 2, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        }).setOrigin(0.5, 0.5).setDepth(1);

        // 🔘 **マッチングボタン（画像）**
        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(1)
            .setScale(0.5); // 画像のサイズ調整


       // 🎵 BGMを停止（既に再生されている場合）
if (this.sound.get("bgm")) {
    this.sound.stopByKey("bgm");
}

// 🎵 すでにBGMが再生されていないか確認してから再生
if (!this.sound.get("newBgm")) {
    this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
    this.newBgm.play();
}


        // 📌 **テキストボックスを追加**
        this.createFramedInputBox();

        // 🔘 **画像ボタンのクリック処理**
        this.matchingButton.on("pointerdown", () => {
            console.log("マッチングボタン（画像）が押されました");
        });
    }

    createFramedInputBox() {
        // **テキストボックスの作成**
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "暗証番号を入力";
        input.style.fontSize = "20px";
        input.style.width = "200px";
        input.style.padding = "10px";
        input.style.textAlign = "center";

        // **額縁風のデザイン**
        input.style.border = "5px solid gold"; // 金色の枠
        input.style.borderRadius = "10px";
        input.style.background = "linear-gradient(to bottom, #fff8dc, #f4e1c6)"; // クリーム色のグラデーション
        input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)"; // 影で立体感
        input.style.position = "absolute"; // PhaserのCanvas上に配置
        input.style.zIndex = "10"; // **Canvasより前面に表示**
        input.style.transform = "translate(-50%, -50%)"; // **中央寄せ**

        this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
            .setOrigin(0.5, 0.5)
            .setDepth(2); // **画面の前面に配置**
    }
}
