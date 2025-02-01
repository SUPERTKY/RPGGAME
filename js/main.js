const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [IntroScene, HomeScene, GameScene], // 🎮 最初に IntroScene を実行
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    audio: {
        disableWebAudio: false // 🔊 オーディオを有効化
    }
};

const game = new Phaser.Game(config);
