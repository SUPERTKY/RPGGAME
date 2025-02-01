class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("player", "assets/player.png");
    }

    create() {
        this.add.text(300, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        });

        this.player = this.add.image(400, 300, "player");
    }
}
