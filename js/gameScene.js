class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("background2", "assets/村.png"); // 🎨 背景画像
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png"); // 🔘 マッチングボタン
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 🎵 BGM
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");
        this.children.removeAll();

        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        this.add.text(this.scale.width / 2, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        }).setOrigin(0.5, 0.5).setDepth(1);

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        this.createFramedInputBox();

        this.matchingButton.on("pointerdown", () => {
            console.log("マッチングボタン（画像）が押されました");
        });
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
        input.style.border = "5px solid gold";
        input.style.borderRadius = "10px";
        input.style.background = "linear-gradient(to bottom, #fff8dc, #f4e1c6)";
        input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";
        input.style.position = "absolute";
        input.style.zIndex = "100";
        input.style.transform = "translate(-50%, -50%)";

        this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
            .setOrigin(0.5, 0.5)
            .setDepth(3);
    }
}
