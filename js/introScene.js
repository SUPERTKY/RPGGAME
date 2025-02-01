class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: "IntroScene" });
    }

    create() {
        // 背景を白にする
        this.cameras.main.setBackgroundColor("#ffffff");

        // 「クリックして開始」を中央に表示
        let text = this.add.text(this.scale.width / 2, this.scale.height / 2, "クリックして開始", {
            fontSize: "32px",
            fill: "#000000",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        // クリックで「HomeScene」に遷移
        this.input.once("pointerdown", () => {
            this.scene.start("HomeScene");
        });
    }
}

