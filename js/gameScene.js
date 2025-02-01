class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene", dom: { createContainer: true } });

        // 🎯 バージョン情報
        this.version = "1.0.4"; // 🔹 バージョンアップ
        console.log(`🛠 [GameScene] バージョン: ${this.version}`);
    }

    preload() {
        console.log(`🛠 [GameScene v${this.version}] preload 開始`);
        this.load.image("background2", "assets/村.png");
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png");
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 🎵 新しいBGMをロード
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

        // 🎵 **BGMを完全にリセット**
        this.resetBgm();

        console.log(`🛠 [GameScene v${this.version}] テキストボックス作成予定...`);
        setTimeout(() => {
            console.log(`🛠 [GameScene v${this.version}] テキストボックスを作成`);
            this.createFramedInputBox();
        }, 100);

        this.matchingButton.on("pointerdown", () => {
            console.log(`🎮 [GameScene v${this.version}] マッチングボタン（画像）が押されました`);
        });

        

        console.log(`✅ [GameScene v${this.version}] create 完了`);
    }

    resetBgm() {
        console.log("🎵 BGMリセット開始");

        // **古いBGMを停止・削除**
        if (this.newBgm) {
            console.log("🎵 既存の新BGMを停止・削除");
            this.newBgm.stop();
            this.newBgm.destroy();
        }

        console.log("🎵 すべてのBGMを停止");
        this.sound.stopAll();

        console.log("🎵 新BGMをロード");
        this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });

        console.log("🎵 新BGMを再生");
        this.newBgm.play();
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
    input.style.position = "absolute"; // ← 修正
    input.style.zIndex = "1000"; // ← 修正
    input.style.pointerEvents = "auto";
    input.style.display = "block";
    input.style.opacity = "1";

    this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
        .setOrigin(0.5, 0.5)
        .setDepth(1000) // ← 修正
        .setVisible(true);

    console.log(`✅ [GameScene v${this.version}] inputBox DOM要素をシーンに追加`, this.inputBox);
}

}
