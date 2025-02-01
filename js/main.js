const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [HomeScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT, // 画面サイズに自動調整
        autoCenter: Phaser.Scale.CENTER_BOTH // 中央に配置
    }
};

const game = new Phaser.Game(config);

// ウィンドウサイズ変更時に修正
window.addEventListener("resize", () => {
      let newWidth = document.documentElement.clientWidth;
    let newHeight = document.documentElement.clientHeight;
    game.scale.resize(newWidth, newHeight);
});


