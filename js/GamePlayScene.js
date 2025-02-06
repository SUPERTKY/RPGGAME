class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
    }

    preload() {
        this.load.image("background3", "assets/background3.png"); 
        this.load.image("vsImage", "assets/VS.png");
        this.load.image("swordsman", "assets/剣士.png");
        this.load.image("mage", "assets/魔法使い.png");
        this.load.image("priest", "assets/僧侶.png");
        this.load.audio("bgmRoleReveal", "assets/役職発表音楽.mp3");
        this.load.audio("decisionSound", "assets/決定音.mp3");
        this.load.audio("vsSound", "assets/VS効果音.mp3");
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");

        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
        let scaleX = this.scale.width / this.bg.width;
        let scaleY = this.scale.height / this.bg.height;
        let scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        this.sound.stopAll();
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();

        this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
        Phaser.Utils.Array.Shuffle(this.roles);

        this.getPlayersFromFirebase().then(players => {
            this.players = players;
            console.log("取得したプレイヤー名:", this.players);
        }).catch(error => {
            console.error("Firebaseからプレイヤー名を取得できませんでした:", error);
        });

        this.currentRoleIndex = 0;
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.6).setDepth(1).setAlpha(0);

        // 4秒遅延後にルーレットを開始
        this.time.delayedCall(4000, () => {
            let totalSpins = this.roles.length * 3; // 合計スピン数を調整
            let spinDuration = 200; // 各スピンの間隔

            this.roleDisplay.setAlpha(1);
            this.time.addEvent({
                delay: spinDuration,
                repeat: totalSpins - 1,
                callback: () => {
                    this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                    this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
                }
            });

            // ルーレット終了後5秒でVS画面表示
            this.time.delayedCall(spinDuration * totalSpins + 5000, () => {
                this.finalizeRole();
                this.showVsScreen();
            });
        });
    }

    async getPlayersFromFirebase() {
        let roomId = localStorage.getItem("roomId");
        if (!roomId) {
            console.error("⚠️ ルームIDが見つかりません。");
            return ["エラー: ルーム不明"];
        }

        let snapshot = await firebase.database().ref(`gameRooms/${roomId}/players`).once("value");
        let data = snapshot.val();

        console.log("🔥 Firebase から取得したデータ:", data); // デバッグ用

        if (data) {
            return Object.values(data).map(player => player.name || "名前なし");
        } else {
            console.error("⚠️ Firebase からプレイヤー情報を取得できませんでした。");
            return ["エラー: データなし"];
        }
    }

    finalizeRole() {
        let finalRole = this.roles[this.currentRoleIndex];
        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();

        this.roleDisplay.setTexture(finalRole);
    }

    showVsScreen() {
        let vsSound = this.sound.add("vsSound", { volume: 1 });
        vsSound.play();

        let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7).setDepth(2);

        let leftTeam = this.players.slice(0, 3);
        let rightTeam = this.players.slice(3, 6);

        console.log("左チーム:", leftTeam);
        console.log("右チーム:", rightTeam);

        leftTeam.forEach((name, index) => {
            this.add.text(this.scale.width * 0.25, this.scale.height * (0.4 + index * 0.1), name, {
                fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
            }).setOrigin(0.5);
        });

        rightTeam.forEach((name, index) => {
            this.add.text(this.scale.width * 0.75, this.scale.height * (0.4 + index * 0.1), name, {
                fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
            }).setOrigin(0.5);
        });

        this.time.delayedCall(8000, () => {
            vsImage.destroy();
            this.scene.start("BattleScene");
        });
    }
}

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    create() {
        console.log("バトルシーンに移動しました。");
    }
}


