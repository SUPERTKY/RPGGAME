class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene", dom: { createContainer: true } });

        // 🎯 現在のバージョン情報をデバッグログに追加
        this.version = "1.0.3"; // ⬅️ ここを変更してバージョン管理
        console.log(`🛠 [GameScene] バージョン: ${this.version}`);
    }

    preload() {
        console.log(`🛠 [GameScene v${this.version}] preload 開始`);
        this.load.image("background2", "assets/村.png");
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png");
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3");
        console.log(`🛠 [GameScene v${this.version}] preload 完了`);
    }

    create() {
        console.log(`🛠 [GameScene v${this.version}] create 開始`);

        this.cameras.main.setBackgroundColor("#000000");
        this.children.removeAll();

        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        console.log(`🛠 [GameScene v${this.version}] テキストボックス作成予定...`);
        setTimeout(() => {
            console.log(`🛠 [GameScene v${this.version}] テキストボックスを作成`);
            this.createFramedInputBox();
        }, 100);

        this.matchingButton.on("pointerdown", () => {
            console.log(`🎮 [GameScene v${this.version}] マッチングボタン（画像）が押されました`);
        });

        document.querySelector("canvas").style.overflow = "visible";

        console.log(`✅ [GameScene v${this.version}] create 完了`);
    }

    createFramedInputBox() {
        console.log(`🛠 [GameScene v${this.version}] createFramedInputBox 実行開始`);

        if (this.inputBox) {
            console.log(`🛠 [GameScene v${this.version}] 既存のテキストボックスを削除`);
            this.inputBox.destroy();
        }

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "暗証番号を入力";
        input.style.fontSize = "20px";
        input.style.width = "200px";
        input.style.padding = "10px";
        input.style.textAlign = "center";
        input.style.border = "5px solid red";
        input.style.borderRadius = "10px";
        input.style.background = "yellow";
        input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";
        input.style.position = "relative";
        input.style.zIndex = "99999";
        input.style.pointerEvents = "auto";
        input.style.display = "block";
        input.style.opacity = "1";

        this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
            .setOrigin(0.5, 0.5)
            .setDepth(9999)
            .setVisible(true);

        console.log(`✅ [GameScene v${this.version}] inputBox DOM要素をシーンに追加`, this.inputBox);
    }
}

