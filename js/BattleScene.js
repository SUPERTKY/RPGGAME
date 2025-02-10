class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.isListening = false;
        this.players = [];
    }

    preload() {
        this.load.audio("battleBgm", "assets/ピエロは暗闇で踊る.mp3");
        this.load.image("battleBackground", "assets/旅立ち.png");
        this.load.image("battleField1", "assets/森.png");
        this.load.image("battleField2", "assets/海.png");
        this.load.video("gorillaVideo", "assets/ゴリラ.mp4", "loadeddata", true);

        // 仲間用アイコン
        this.load.image("swordsman_ally", "assets/剣士.png");
        this.load.image("mage_ally", "assets/魔法使い.png");
        this.load.image("priest_ally", "assets/僧侶.png");

        // 敵用アイコン
        this.load.image("swordsman_enemy", "assets/剣士全身.png");
        this.load.image("mage_enemy", "assets/魔法使い全身.png");
        this.load.image("priest_enemy", "assets/僧侶全身.png");
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

        this.battleBgm = this.sound.add("battleBgm", { volume: 0 });

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
            let playersData = snapshot.val();
            if (!playersData) return;

            this.players = Object.keys(playersData).map(playerId => ({
                id: playerId,
                name: playersData[playerId].name || "???",
                role: playersData[playerId].role || "不明",
                team: playersData[playerId].team || "未定",
                hp: this.getInitialHP(playersData[playerId].role), // HPを初期設定
                lp: 3 // LP は固定
            }));

            let playerCount = this.players.length;
            this.statusText.setText(`戦闘準備完了: ${playerCount} / 6`);

            if (playerCount === 6) {
                console.log("🟢 全プレイヤーが揃いました。バトル開始！");
                this.playersRef.off("value");
                this.startCountdown();
            }
        });
    }

    // HPの初期設定
    getInitialHP(role) {
        switch (role) {
            case "swordsman": return 150;
            case "mage": return 100;
            case "priest": return 120;
            default: return 100;
        }
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
        this.tweens.add({
            targets: this.battleBgm,
            volume: 1,
            duration: 2000
        });

        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.cameras.main.fadeIn(1000, 0, 0, 0);
            this.battleBgm.play();
            this.displayCharacters();
        });
    }

    displayCharacters() {
        let allyY = this.scale.height * 0.8;
        let enemyY = this.scale.height * 0.2;
        let centerX = this.scale.width / 2;
        let spacing = 150;

        let allies = this.players.filter(p => p.team === "ally");
        let enemies = this.players.filter(p => p.team === "enemy");

        // 仲間の表示
        allies.forEach((player, index) => {
            let x = centerX - (allies.length - 1) * spacing / 2 + index * spacing;
            let icon = this.add.image(x, allyY, `${player.role}_ally`).setScale(0.7);
            this.add.text(x, allyY + 50, player.name, { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
            this.add.text(x, allyY + 75, `HP: ${player.hp}`, { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
            this.add.text(x, allyY + 100, `LP: ${player.lp}`, { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
        });

        // 敵の表示
        enemies.forEach((player, index) => {
            let x = centerX - (enemies.length - 1) * spacing / 2 + index * spacing;
            let icon = this.add.image(x, enemyY, `${player.role}_enemy`).setScale(0.7);
            this.add.text(x, enemyY - 50, player.name, { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
            this.add.text(x, enemyY - 75, `HP: ${player.hp}`, { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
        });
    }
}
