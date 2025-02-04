class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
    }

    preload() {
        this.load.image("background3", "assets/戦場.png"); 
        this.load.image("vsImage", "assets/VS.png");
        this.load.image("swordsman", "assets/剣士.png");
        this.load.image("mage", "assets/魔法使い.png");
        this.load.image("priest", "assets/僧侶.png");
        this.load.audio("bgmRoleReveal", "assets/役職発表音楽.mp3");
        this.load.audio("decisionSound", "assets/決定音.mp3");
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");
        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        if (this.sound.get("bgmRoleReveal")) {
            this.sound.stopByKey("bgmRoleReveal");
        }
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();
        
        this.time.delayedCall(3000, () => {
            this.showRoleResults();
        });
    }

    showRoleResults() {
        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();

        let roles = ["priest", "priest", "mage", "mage", "swordsman", "swordsman"];
        Phaser.Utils.Array.Shuffle(roles);
        
        let positions = [
            { x: this.scale.width / 4, y: this.scale.height / 3 },
            { x: this.scale.width * 3 / 4, y: this.scale.height / 3 },
            { x: this.scale.width / 4, y: this.scale.height / 2 },
            { x: this.scale.width * 3 / 4, y: this.scale.height / 2 },
            { x: this.scale.width / 4, y: this.scale.height * 2 / 3 },
            { x: this.scale.width * 3 / 4, y: this.scale.height * 2 / 3 }
        ];
        
        for (let i = 0; i < roles.length; i++) {
            this.add.image(positions[i].x, positions[i].y, roles[i]).setScale(0.5);
        }

        this.time.delayedCall(10000, () => {
            this.showVsScreen();
        });
    }

    showVsScreen() {
        let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7);
        
        this.time.delayedCall(10000, () => {
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
