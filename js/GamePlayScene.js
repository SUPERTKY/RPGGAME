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

        this.roomRef = window.db.ref("gameRooms/room1/players");
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            let playerList = Object.values(players);

            if (playerList.length < 4) {
                console.error("🚨 プレイヤーが足りません！", playerList);
                return;
            }

            Phaser.Utils.Array.Shuffle(playerList);
            let leftTeam = playerList.slice(0, 2);
            let rightTeam = playerList.slice(2, 4);

            this.showVsScreen(leftTeam, rightTeam);
        });
    }

    showVsScreen(leftTeam, rightTeam) {
        let vsSound = this.sound.add("vsSound", { volume: 1 });
        vsSound.play();

        this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7).setDepth(2);

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

        this.time.delayedCall(3000, () => {
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

