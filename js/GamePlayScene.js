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

    async create() {
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

    console.log("🟢 プレイヤーデータ取得開始...");
    this.players = await this.getPlayersFromFirebase();

    console.log("✅ プレイヤーデータ取得成功:", this.players);

    if (this.players.length === 0) {
        console.error("⚠️ プレイヤーデータがないため、処理を中断します。");
        return;
    }

    this.startRoulette();
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
    console.log("🟢 取得したルームID:", roomId);

    if (!roomId) {
        console.warn("⚠️ ルームIDが見つかりません。ダミーデータを使用します。");
        return this.createDummyPlayers();
    }

    try {
        let refPath = `gameRooms/${roomId}/players`;
        console.log("🔍 Firebase 取得パス:", refPath);

        let snapshot = await firebase.database().ref(refPath).once("value");
        let data = snapshot.val();

        console.log("✅ Firebaseから取得したデータ:", data);

        if (!data) {
            console.warn("⚠️ データが見つかりませんでした。ダミーデータを使用します。");
            return this.createDummyPlayers();
        }

        let players = Object.entries(data).map(([key, player]) => ({
            id: key,
            name: player.name || "名前なし"
        }));

        console.log("✅ 取得したプレイヤーデータ:", players);
        return players;
    } catch (error) {
        console.error("❌ Firebaseからのデータ取得中にエラーが発生しました:", error);
        return this.createDummyPlayers();
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

    let leftTeam = this.players.slice(0, 2);
    let rightTeam = this.players.slice(2, 4);

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
