const config = {
    type: Phaser.AUTO,
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    scene: [HomeScene, GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE, // 画面サイズに合わせる
        autoCenter: Phaser.Scale.CENTER_BOTH // 中央揃え
    }
};

const game = new Phaser.Game(config);

// ウィンドウサイズ変更時にキャンバスを修正（右端のズレ対策）
window.addEventListener("resize", () => {
    let newWidth = document.documentElement.clientWidth;
    let newHeight = document.documentElement.clientHeight;
    game.scale.resize(newWidth + 1, newHeight + 1); // 1px 追加してズレ防止
});
