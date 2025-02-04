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
        this.load.audio("vsSound", "assets/VS効果音.mp3"); // VS 効果音を追加
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");

        // 🔧 背景が表示されない問題を修正
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
        let scaleX = this.scale.width / this.bg.width;
        let scaleY = this.scale.height / this.bg.height;
        let scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        // 🎵 以前の BGM を停止
        if (this.sound.get("bgmRoleReveal")) {
            this.sound.get("bgmRoleReveal").stop();
        }
        this.sound.stopAll();

        // 🎵 新しい BGM を一度だけ再生
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();

        // 🔧 キャラクターのサイズを小さくする & 初期位置を調整
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest")
            .setScale(0.6) // 🔥 サイズを小さく変更
            .setDepth(1);

        this.currentRoleIndex = 0;
        this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
        Phaser.Utils.Array.Shuffle(this.roles);
        
        // 🎲 ルーレットの回転（時間を計算）
        let totalSpins = this.roles.length * 3; // 役職リストを3周させる
        let spinTime = totalSpins * 500; // 500msごとに切り替え → 合計時間計算

        this.time.addEvent({
            delay: 500,
            repeat: totalSpins,
            callback: () => {
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
            }
        });

        // 🎵 **ルーレットが完全に止まった後に少し間を空ける**
        this.time.delayedCall(spinTime + 500, () => {
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

        // 🎯 **決定音の後に少し間を空けてから画像を固定**
        this.time.delayedCall(500, () => {
            this.roleDisplay.setTexture(finalRole);
        });

        // 🔥 **決定音終了後 3秒 待って VS 画面へ移行**
        this.time.delayedCall(3000, () => {
            this.showVsScreen();
        });
    }

    showVsScreen() {
        // 🎵 VS 効果音を再生
        let vsSound = this.sound.add("vsSound", { volume: 1 });
        vsSound.play();

        let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage")
            .setScale(0.7)
            .setDepth(2);

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
