class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene", dom: { createContainer: true } });
        console.log("GameScene: コンストラクタ実行");
    }

    preload() {
        console.log("GameScene: preload 開始");
        this.load.image("background2", "assets/村.png");
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png");
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3");
        console.log("GameScene: preload 完了");
    }

    create() {
        console.log("GameScene: create 開始");

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

        // **BGMを完全に変更**
        console.log("現在のBGM:", this.sound.get("bgm"));

        // **すべてのBGMを停止**
        this.sound.stopAll();

        if (this.newBgm) {
            console.log("新BGMを停止");
            this.newBgm.stop();
            this.newBgm.destroy();
        }

        console.log("新BGMをロード");
        this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });

        console.log("新BGMを再生");
        this.newBgm.play();

        setTimeout(() => {
            this.createFramedInputBox();
        }, 100);

        this.matchingButton.on("pointerdown", () => {
            console.log("マッチングボタン（画像）が押されました");
        });

        console.log("GameScene: create 完了");
    }

    createFramedInputBox() {
        if (this.inputBox) {
            this.inputBox.destroy();
        }

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "暗証番号を入力";
        input.style.fontSize = "20px";
        input.style.width = "200px";
        input.style.padding = "10px";
        input.style.textAlign = "center";
        input.style.border = "5px solid red"; // 赤枠
        input.style.borderRadius = "10px";
        input.style.background = "yellow"; // 背景を黄色に
        input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";
        input.style.position = "relative";
        input.style.zIndex = "9999"; // z-indexを最大
        input.style.opacity = "1";
        input.style.display = "block";

this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
    .setOrigin(0.5, 0.5)
    .setDepth(9999) // 💡 優先度を最大に
    .setVisible(true);

        console.log("inputBox DOM要素をシーンに追加", this.inputBox);
    }
}



