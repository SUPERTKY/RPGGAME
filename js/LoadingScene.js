class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: "LoadingScene" });
    }

    preload() {
        // 背景とローディングアイコンをロード
        this.load.image("loadingBg", "assets/loading_background.png");
        this.load.image("loadingIcon", "assets/loading_icon.png");
    }

    create() {
        // 背景を追加
        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "loadingBg");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        // 画像を画面中央に追加し回転
        this.loadingIcon = this.add.image(this.scale.width / 2, this.scale.height / 2, "loadingIcon");
        this.loadingIcon.setScale(0.5);

        // 画像を回転アニメーション
        this.tweens.add({
            targets: this.loadingIcon,
            angle: 360,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });

        // 10秒待機
        this.time.delayedCall(10000, () => {
            console.log("10秒経過...");
        });
    }
}
