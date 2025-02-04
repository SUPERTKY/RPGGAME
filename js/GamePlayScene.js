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

        // 🎵 **すでにBGMが再生されていたら停止**
        if (this.sound.get("bgmRoleReveal")) {
            this.sound.get("bgmRoleReveal").stop();
        }

        // 🔇 **全ての音楽を確実に停止**
        this.sound.stopAll();

        // 🎵 **BGMを一度だけ再生**
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();

        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.8);
        this.currentRoleIndex = 0;
        this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
        Phaser.Utils.Array.Shuffle(this.roles);
        
        // ルーレットの回転時間を計算
        let totalSpins = this.roles.length * 3;
        let spinTime = totalSpins * 500; // 500msごとに切り替え → 合計時間計算

        this.time.addEvent({
            delay: 500,
            repeat: totalSpins,
            callback: () => {
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
            }
        });

        // 🎵 **ルーレットが完全に止まった直後に決定音を再生**
        this.time.delayedCall(spinTime, () => {
            this.finalizeRole();
        });
    }

    finalizeRole() {
        let finalRole = this.roles[this.currentRoleIndex];

        // 🎵 **決定音が重ならないように確実に停止**
        if (this.sound.get("decisionSound")) {
            this.sound.get("decisionSound").stop();
        }

        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();

        // 🎯 **決定音の再生が終わるタイミングで画像を固定**
        decisionSound.once("complete", () => {
            this.roleDisplay.setTexture(finalRole);
        });

        // ルーレット停止後の待機時間（決定音終了後にVS画面に移行）
        this.time.delayedCall(3000, () => {
            this.showVsScreen();
        });
    }

    showVsScreen() {
        let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7);
        
        this.time.delayedCall(3000, () => {
            this.scene.start("BattleScene");
        });
    }
}
