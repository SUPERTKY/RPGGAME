const config = {
    type: Phaser.AUTO,
    width: document.documentElement.clientWidth, // より正確な幅を取得
    height: document.documentElement.clientHeight,
    scene: [HomeScene, GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE, // ウィンドウサイズ変更に対応
        autoCenter: Phaser.Scale.CENTER_BOTH // 中央揃え
    }
};

const game = new Phaser.Game(config);

// ウィンドウリサイズ時に修正
window.addEventListener("resize", () => {
    let newWidth = document.documentElement.clientWidth;
    let newHeight = document.documentElement.clientHeight;
    game.scale.resize(newWidth, newHeight);
});
