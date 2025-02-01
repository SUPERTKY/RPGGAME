const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [HomeScene, GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE,  // 画面サイズに合わせる
        autoCenter: Phaser.Scale.CENTER_BOTH // 中央揃え
    }
};


const game = new Phaser.Game(config);
