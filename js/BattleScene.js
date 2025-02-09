class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.isListening = false;
    }

    preload() {
        this.load.audio("battleBgm", "ピエロは暗闇で踊る.mp3");
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
            this.statusText.setText(`戦闘準備完了: ${playerCount} / 4`);

            if (playerCount >= 4) {
                console.log("🟢 全プレイヤーが揃いました。バトル開始！");
                this.playersRef.off("value");
                this.startCountdown();
            }
        });
    }

    startCountdown() {
        this.statusText.setText("");
        const countdownNumbers = ["3", "2", "1", "スタート！"];
        let index = 0;

        const showNextNumber = () => {
            if (index >= countdownNumbers.length) {
                this.startBattle();
                return;
            }
            let countText = this.add.text(this.scale.width / 2, this.scale.height / 2, countdownNumbers[index], {
                fontSize: "80px",
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8
            }).setOrigin(0.5);

            countText.setAlpha(0);
            this.tweens.add({
                targets: countText,
                alpha: 1,
                scale: 1.5,
                duration: 500,
                ease: "Cubic.easeOut",
                yoyo: true,
                onComplete: () => {
                    countText.destroy();
                    index++;
                    this.time.delayedCall(500, showNextNumber);
                }
            });
        };
        showNextNumber();
    }

    startBattle() {
        this.scene.start("GamePlayScene");
    }
}
