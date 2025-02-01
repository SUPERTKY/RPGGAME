createFramedInputBox() {
    console.log(`🛠 [GameScene v${this.version}] createFramedInputBox 実行開始`);

    // 既存のテキストボックスを削除
    if (this.inputBox) {
        this.inputBox.destroy();
    }

    // `input` 要素を作成
    let input = document.createElement("input");
    input.type = "text";
    input.id = "gameInput";  
    input.placeholder = "暗証番号を入力";
    input.style.fontSize = "20px";
    input.style.width = "200px";
    input.style.height = "40px";
    input.style.padding = "10px";
    input.style.textAlign = "center";
    input.style.border = "5px solid red";
    input.style.borderRadius = "10px";
    input.style.background = "yellow";
    input.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";
    input.style.position = "fixed";
    input.style.zIndex = "1000";
    input.style.pointerEvents = "auto";
    input.style.opacity = "1";

    // Phaser の `DOMElement` として追加
    this.inputBox = this.add.dom(this.scale.width / 2, 200, input)
        .setOrigin(0.5, 0.5)
        .setDepth(1000)
        .setVisible(true);

    // 🔍 デバッグ用に出力
    console.log("🛠 this.inputBox:", this.inputBox);

    // `this.inputBox` が正しく作成されているかチェック
    if (this.inputBox) {
        this.inputBox.setSize(200, 40); // `setScale` の代わりに `setSize` を使用
    } else {
        console.error("❌ this.inputBox が作成されませんでした！");
    }

    console.log(`✅ [GameScene v${this.version}] inputBox DOM要素をシーンに追加`, this.inputBox);
}
