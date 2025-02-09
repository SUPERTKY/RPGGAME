class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.isListening = false;
    }

    preload() {
        this.load.image("battleBackground", "assets/旅立ち.png");
    }

    async create() {
        this.cameras.main.setBackgroundColor("#000000");
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "battleBackground");
        this.bg.setScale(Math.max(this.scale.width / this.bg.width, this.scale.height / this.bg.height));

        this.statusText = this.add.text(this.scale.width / 2, this.scale.height * 0.1, "バトル開始を待っています...", {
            fontSize: "32px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        let roomId = localStorage.getItem("roomId");
        if (!roomId) {
            console.error("❌ ルームIDが取得できません。");
            return;
        }

        try {
            this.playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
            this.listenForPlayers(roomId);
        } catch (error) {
            console.error("❌ Firebase の監視エラー:", error);
        }
    }

    listenForPlayers(roomId) {
        if (this.isListening) return;
        this.isListening = true;

        this.playersRef.on("value", (snapshot) => {
            let players = snapshot.val();
            if (!players) return;

            let playerCount = Object.keys(players).length;
            this.statusText.setText(`戦闘準備完了: ${playerCount} / 6`);

            if (playerCount >= 6) {
                console.log("🟢 全プレイヤーが揃いました。バトル開始！");
                this.playersRef.off("value");
                this.startBattle();
            }
        });
    }

    startBattle() {
        this.statusText.setText("バトル開始！");
        this.time.delayedCall(2000, () => {
            this.scene.start("GamePlayScene");
        });
    }
}
