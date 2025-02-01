const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [HomeScene, GameScene]
};

const game = new Phaser.Game(config);
