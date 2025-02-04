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
        this.players = JSON.parse(localStorage.getItem("players")) || ["プレイヤー1", "プレイヤー2", "プレイヤー3", "プレイヤー4", "プレイヤー5", "プレイヤー6"];

        this.currentRoleIndex = 0;
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.6).setDepth(1);

        let totalSpins = this.roles.length * 3;
        let spinTime = totalSpins * 500;

        this.time.addEvent({
            delay: 500,
            repeat: totalSpins,
            callback: () => {
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
            }
        });

        this.time.delayedCall(spinTime + 500, () => {
            this.finalizeRole();
        });
    }

    finalizeRole() {
        let finalRole = this.roles[this.currentRoleIndex];
        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();

        this.time.delayedCall(500, () => {
            this.roleDisplay.setTexture(finalRole);
        });

        this.time.delayedCall(3000, () => {
            this.showVsScreen();
        });
    }

    showVsScreen() {
        let vsSound = this.sound.add("vsSound", { volume: 1 });
        vsSound.play();

        this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7).setDepth(2);

        let leftTeam = this.players.slice(0, 3);
        let rightTeam = this.players.slice(3, 6);

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
