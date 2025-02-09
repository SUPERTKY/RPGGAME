class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "WaitingRoomScene" });
        this.isListening = false;
    }

    preload() {
        this.load.image("waitingBackground", "assets/旅立ち.png");
    }

    async create() {
        this.cameras.main.setBackgroundColor("#000000");
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "waitingBackground");
        this.bg.setScale(Math.max(this.scale.width / this.bg.width, this.scale.height / this.bg.height));

        this.statusText = this.add.text(this.scale.width / 2, this.scale.height * 0.8, "プレイヤーを待っています...", {
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
            this.statusText.setText(`参加プレイヤー数: ${playerCount} / 6`);

            if (playerCount >= 6) {
                console.log("🟢 全プレイヤーが揃いました。ゲーム開始！");
                this.playersRef.off("value");
                this.time.delayedCall(2000, () => {
                    this.scene.start("GamePlayScene");
                });
            }
        });
    }
}
