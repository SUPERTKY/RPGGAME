class GameScene extends Phaser.Scene {
constructor() {
    super({ key: "GameScene", dom: { createContainer: true } });
}


    preload() {
        this.load.image("background2", "assets/村.png"); // 🎨 **背景をバックグラウンド2に変更**
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png"); // 🔘 マッチングボタン
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 🎵 新しいBGM
    }

    create() {
        // 🔵 **前のシーンの残像を消す**
        this.cameras.main.setBackgroundColor("#000000");
        this.children.removeAll(); // **前のオブジェクトをクリア**

        // 🎨 **背景を "バックグラウンド2" に設定**
        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5); // **最背面に配置**

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

        // 🎵 **BGMをセット**
        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }
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


