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
            this.startRoulette();
        }).catch(error => {
            console.error("Firebaseからプレイヤー名を取得できませんでした:", error);
        });
    }

    startRoulette() {
        this.currentRoleIndex = 0;
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.6).setDepth(1).setAlpha(0);

        this.time.delayedCall(4000, () => {
            let totalSpins = this.roles.length * 3;
            let spinDuration = 500;

            this.roleDisplay.setAlpha(1);
            this.time.addEvent({
                delay: spinDuration,
                repeat: totalSpins - 1,
                callback: () => {
                    this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                    this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
                },
                callbackScope: this
            });

            this.time.delayedCall(spinDuration * totalSpins, () => {
                this.finalizeRole();
            });

            this.time.delayedCall(spinDuration * totalSpins + 5000, () => {
                this.showVsScreen();
            });
        });
    }

    async getPlayersFromFirebase() {
    let roomId = localStorage.getItem("roomId");
    console.log("取得したルームID:", roomId); // 🔍 デバッグ用

    if (!roomId) {
        console.error("⚠️ ルームIDが見つかりません。");
        return [];
    }

    try {
        let snapshot = await firebase.database().ref(`gameRooms/${roomId}/players`).once("value");
        let data = snapshot.val();

        console.log("Firebaseから取得したデータ:", data); // 🔍 デバッグ用

        if (data) {
            let players = Object.keys(data).map(key => ({
                id: key,
                name: data[key].name || "名前なし",
                team: data[key].team || "チーム未定",
                role: data[key].role || "役職未定"
            }));

            console.log("処理後のプレイヤーデータ:", players); // 🔍 デバッグ用
            return players;
        } else {
            console.error("⚠️ Firebase からプレイヤー情報を取得できませんでした。");
            return [];
        }
    } catch (error) {
        console.error("Firebaseからのデータ取得中にエラーが発生しました:", error);
        return [];
    }
}





    finalizeRole() {
        let finalRole = this.roles[this.currentRoleIndex];
        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();

        this.roleDisplay.setTexture(finalRole);
    }

    showVsScreen() {
    if (!this.players || this.players.length === 0) {
        console.error("⚠️ プレイヤーデータがありません。VS画面を表示できません。");
        return;
    }

    let vsSound = this.sound.add("vsSound", { volume: 1 });
    vsSound.play();

    let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7).setDepth(2);

    let leftTeam = this.players.slice(0, 3);
    let rightTeam = this.players.slice(3, 6);

    console.log("左チーム:", leftTeam);
    console.log("右チーム:", rightTeam);

    leftTeam.forEach((player, index) => {
        this.add.text(this.scale.width * 0.25, this.scale.height * (0.4 + index * 0.1), player.name, {
            fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
        }).setOrigin(0.5);
    });

    rightTeam.forEach((player, index) => {
        this.add.text(this.scale.width * 0.75, this.scale.height * (0.4 + index * 0.1), player.name, {
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
