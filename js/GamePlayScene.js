class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
    }

    preload() {
        this.load.image("background3", "assets/role_scene.png"); 
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

        // 以前の BGM を停止
        this.sound.stopAll();

        // 新しい BGM を再生
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();

        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.8);
        this.currentRoleIndex = 0;
        this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
        Phaser.Utils.Array.Shuffle(this.roles);
        
        this.time.addEvent({
            delay: 500,
            repeat: this.roles.length * 3,
            callback: () => {
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
            }
        });

        this.time.delayedCall(3000, () => {
            this.finalizeRole();
        });
    }

    finalizeRole() {
        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();
        
        let finalRole = this.roles[this.currentRoleIndex];
        this.roleDisplay.setTexture(finalRole);

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

