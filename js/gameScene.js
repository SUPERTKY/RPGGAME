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
        console.log("前のシーンの残像をクリア");

        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);
        console.log("背景画像を設定");

        this.add.text(this.scale.width / 2, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        }).setOrigin(0.5, 0.5).setDepth(1);
        console.log("タイトルテキストを追加");

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);
        console.log("マッチングボタンを追加");

        if (this.sound.get("bgm")) {
            console.log("旧BGMを停止");
            this.sound.stopByKey("bgm");
        }
        if (!this.sound.get("newBgm")) {
            console.log("新BGMをロード");
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
            console.log("新BGMを再生");
        }

        console.log("テキストボックスを作成予定...");
        setTimeout(() => {
            console.log("テキストボックスの作成を実行");
            this.createFramedInputBox();
        }, 100);

        this.matchingButton.on("pointerdown", () => {
            console.log("マッチングボタン（画像）が押されました");
        });

        console.log("GameScene: create 完了");
    }

    createFramedInputBox() {
        console.log("createFramedInputBox: 実行開始");

        if (this.inputBox) {
            console.log("既存のテキストボックスを削除");
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
        input.style.position = "relative"; // absolute → relative に変更
        input.style.zIndex = "100";
        input.style.transform = "translate(-50%, -50%)";
        console.log("input 要素を作成");

        this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
            .setOrigin(0.5, 0.5)
            .setDepth(3)
            .setVisible(true);
        
        console.log("inputBox DOM要素をシーンに追加");
    }
}



