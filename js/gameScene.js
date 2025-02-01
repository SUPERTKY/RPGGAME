class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("player", "assets/MACHINGBUTTON.png");
        this.load.audio("newBgm", "assets/ピエロは暗闇で踊る.mp3"); // 新しいBGMをロード
    }

    create() {
        this.add.text(300, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        });

        this.player = this.add.image(400, 300, "player");

        // 新しいBGMを再生
        this.newBgm = this.sound.add("newBgm", { loop: true });
        this.newBgm.play();

        // 暗証番号入力用テキストボックス
        this.createInputBox();

        // マッチングボタン
        this.createMatchButton();
    }

    createInputBox() {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "暗証番号を入力";
        input.style.fontSize = "20px";
        input.style.width = "200px";

        this.inputBox = this.add.dom(400, 200, input);
    }

    createMatchButton() {
        const button = this.add.text(400, 250, "マッチング", {
            fontSize: "30px",
            fill: "#ffffff",
            backgroundColor: "#007BFF",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(0.5);

        // クリック時の処理（現時点では効果なし）
        button.setInteractive().on("pointerdown", () => {
            console.log("マッチングボタンが押されました");
        });
    }
}
