class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("background", "assets/村.png"); // 🎨 新しい背景
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png"); // 🔘 マッチングボタン
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 🎵 新しいBGM
    }

    create() {
        // 🔵 **前のシーンの背景を完全にリセット**
        this.cameras.main.setBackgroundColor("#000000");
        this.children.removeAll(); // **すべてのオブジェクトを削除**

        // 🎨 **背景画像を中央配置＆画面いっぱいに拡大**
        if (!this.textures.exists("background")) {
            console.error("背景画像がロードされていません！");
        }

        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5); // **背景を確実に最背面へ**

        // 📜 **タイトルテキスト**
        this.add.text(this.scale.width / 2, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        }).setOrigin(0.5, 0.5).setDepth(1);

        // 🔘 **マッチングボタン**
        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        // 🎵 **前のBGMを停止**
        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }

        // 🎵 **新しいBGMを再生**
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        // 📌 **テキストボックスを追加**
        this.createFramedInputBox();

        // 🔘 **マッチングボタンのクリック処理**
        this.matchingButton.on("pointerdown", () => {
            console.log("マッチングボタン（画像）が押されました");
        });
    }

    createFramedInputBox() {
        if (this.inputBox) {
            this.inputBox.destroy(); // **既存のDOM要素を削除**
        }

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "暗証番号を入力";
        input.style.fontSize = "20px";
        input.style.width = "200px";
        input.style.padding = "10px";
        input.style.textAlign = "center";
        input.style.border = "5px solid gold";
        input.style.borderRadius = "10px";
        input.style.background = "linear-gradient(to bottom, #fff8dc, #f4e1c6)";
        input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";
        input.style.position = "absolute";
        input.style.zIndex = "100";
        input.style.transform = "translate(-50%, -50%)";

        this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
            .setOrigin(0.5, 0.5)
            .setDepth(3); // **最前面に配置**
    }
}

