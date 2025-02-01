const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [IntroScene, HomeScene, GameScene], // 🎮 必ず `IntroScene` から開始
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    audio: {
        disableWebAudio: false // 🎵 オーディオを有効化
    }
};

const game = new Phaser.Game(config);




// ウィンドウサイズ変更時に修正
window.addEventListener("resize", () => {
      let newWidth = document.documentElement.clientWidth;
    let newHeight = document.documentElement.clientHeight;
    game.scale.resize(newWidth, newHeight);
});


