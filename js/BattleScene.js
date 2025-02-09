class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.isListening = false;
    }

    preload() {
        this.load.audio("battleBgm", "ピエロは暗闇で踊る.mp3");
        this.load.image("battleBackground", "assets/旅立ち.png");
        this.load.image("battleField1", "assets/森.png");
        this.load.image("battleField2", "assets/海.png");
        this.load.video("gorillaVideo", "assets/ゴリラ.mp4", "loadeddata", true);
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

        this.battleBgm = this.sound.add("battleBgm");

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
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            let randomChoice = Math.random();
            if (randomChoice < 0.05) {
                this.bg.destroy();
                this.bg = this.add.video(this.scale.width / 2, this.scale.height / 2, "gorillaVideo");
                this.bg.setScale(1.2);
                this.bg.play(true);
            } else {
                let selectedField = randomChoice < 0.5 ? "battleField1" : "battleField2";
                this.bg.setTexture(selectedField);
                this.bg.setScale(Math.max(this.scale.width / this.bg.width, this.scale.height / this.bg.height));
            }
            this.cameras.main.fadeIn(1000, 0, 0, 0);
            this.battleBgm.play({ loop: true });
        });
    }
}

