// 定数の定義
const GameConfig = {
    SCENE_KEY: "GamePlayScene",
    TIMING: {
        ROULETTE_START_DELAY: 4000,
        SPIN_DURATION: 500,
        VS_SCREEN_DURATION: 8000,
        ROLE_FINALIZATION_DELAY: 5000
    },
    AUDIO: {
        BGM_VOLUME: 0.5,
        DECISION_SOUND_VOLUME: 1.0,
        VS_SOUND_VOLUME: 1.0
    },
    SCALING: {
        ROLE_DISPLAY: 0.6,
        VS_IMAGE: 0.7
    },
    ASSETS: {
        IMAGES: {
            BACKGROUND: { key: "background3", path: "assets/background3.png" },
            VS: { key: "vsImage", path: "assets/VS.png" },
            SWORDSMAN: { key: "swordsman", path: "assets/剣士.png" },
            MAGE: { key: "mage", path: "assets/魔法使い.png" },
            PRIEST: { key: "priest", path: "assets/僧侶.png" }
        },
        AUDIO: {
            BGM: { key: "bgmRoleReveal", path: "assets/役職発表音楽.mp3" },
            DECISION: { key: "decisionSound", path: "assets/決定音.mp3" },
            VS: { key: "vsSound", path: "assets/VS効果音.mp3" }
        }
    },
    STYLES: {
        ERROR_TEXT: {
            fontSize: "32px",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 5
        },
        PLAYER_NAME: {
            fontSize: "32px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }
    }
};

class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: GameConfig.SCENE_KEY });
        this.isSceneActive = false;
        this.currentRoleIndex = 0;
    }

    preload() {
        // イメージのロード
        Object.values(GameConfig.ASSETS.IMAGES).forEach(({ key, path }) => {
            this.load.image(key, path);
        });

        // オーディオのロード
        Object.values(GameConfig.ASSETS.AUDIO).forEach(({ key, path }) => {
            this.load.audio(key, path);
        });
    }

    async create() {
        this.isSceneActive = true;
        this.setupBackground();
        this.setupAudio();
        this.roles = this.generateRoles();

        try {
            this.players = await this.getPlayersFromFirebase();
            if (this.players.length === 0) {
                this.handleNoPlayersError();
                return;
            }
            this.startRoulette();
        } catch (error) {
            this.handleFirebaseError(error);
        }
    }

    setupBackground() {
        this.cameras.main.setBackgroundColor("#000000");
        this.bg = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            GameConfig.ASSETS.IMAGES.BACKGROUND.key
        );
        this.updateBackgroundScale();
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize() {
        if (this.bg) {
            this.updateBackgroundScale();
        }
    }

    updateBackgroundScale() {
        const scaleX = this.scale.width / this.bg.width;
        const scaleY = this.scale.height / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);
    }

    setupAudio() {
        this.sound.stopAll();
        this.bgm = this.sound.add(GameConfig.ASSETS.AUDIO.BGM.key, {
            loop: true,
            volume: GameConfig.AUDIO.BGM_VOLUME
        });
        this.bgm.play();
    }

    generateRoles() {
        const baseRoles = [
            GameConfig.ASSETS.IMAGES.PRIEST.key,
            GameConfig.ASSETS.IMAGES.MAGE.key,
            GameConfig.ASSETS.IMAGES.SWORDSMAN.key,
            GameConfig.ASSETS.IMAGES.PRIEST.key,
            GameConfig.ASSETS.IMAGES.MAGE.key,
            GameConfig.ASSETS.IMAGES.SWORDSMAN.key
        ];
        return Phaser.Utils.Array.Shuffle([...baseRoles]);
    }

    async getPlayersFromFirebase() {
        const playerId = localStorage.getItem("playerId");
        if (!playerId) {
            throw new Error("プレイヤーIDが取得できませんでした。");
        }

        const roomId = await this.findPlayerRoom(playerId);
        if (!roomId) {
            throw new Error("プレイヤーが所属するルームIDが見つかりませんでした。");
        }

        const refPath = `gameRooms/${roomId}/players`;
        const snapshot = await firebase.database()
            .ref(refPath)
            .orderByChild("joinedAt")
            .once("value");
        
        const data = snapshot.val();
        if (!data || Object.keys(data).length === 0) {
            throw new Error("Firebaseにプレイヤーデータがありません。");
        }

        return Object.entries(data).map(([key, player]) => ({
            id: key,
            name: player.name || "名前なし",
            joinedAt: player.joinedAt || 0
        }));
    }

    async findPlayerRoom(playerId) {
        const snapshot = await firebase.database()
            .ref("gameRooms")
            .orderByChild(`players/${playerId}/exists`)
            .equalTo(true)
            .once("value");

        const rooms = snapshot.val();
        if (!rooms) {
            throw new Error("ルームデータが見つかりません。");
        }

        const roomId = Object.keys(rooms)[0];
        if (!roomId) {
            throw new Error(`プレイヤー ${playerId} の所属する部屋が見つかりませんでした。`);
        }

        return roomId;
    }

    handleNoPlayersError() {
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "⚠️ プレイヤーデータが見つかりません",
            GameConfig.STYLES.ERROR_TEXT
        ).setOrigin(0.5);
    }

    handleFirebaseError(error) {
        console.error("Firebaseエラー:", error);
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            `⚠️ ${error.message}`,
            GameConfig.STYLES.ERROR_TEXT
        ).setOrigin(0.5);
    }

    startRoulette() {
        if (!this.isSceneActive) return;

        this.roleDisplay = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            GameConfig.ASSETS.IMAGES.PRIEST.key
        )
        .setScale(GameConfig.SCALING.ROLE_DISPLAY)
        .setDepth(1)
        .setAlpha(0);

        this.time.delayedCall(GameConfig.TIMING.ROULETTE_START_DELAY, () => {
            this.startRouletteAnimation();
        });
    }

    startRouletteAnimation() {
        if (!this.isSceneActive) return;

        const totalSpins = this.roles.length * 3;
        this.roleDisplay.setAlpha(1);

        const spinTimer = this.time.addEvent({
            delay: GameConfig.TIMING.SPIN_DURATION,
            repeat: totalSpins - 1,
            callback: this.updateRoleDisplay,
            callbackScope: this
        });

        this.time.delayedCall(
            GameConfig.TIMING.SPIN_DURATION * totalSpins,
            this.finalizeRole,
            [],
            this
        );

        this.time.delayedCall(
            GameConfig.TIMING.SPIN_DURATION * totalSpins + GameConfig.TIMING.ROLE_FINALIZATION_DELAY,
            this.showVsScreen,
            [],
            this
        );
    }

    updateRoleDisplay() {
        if (!this.isSceneActive) return;
        
        this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
        this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
    }

    finalizeRole() {
        if (!this.isSceneActive) return;

        const finalRole = this.roles[this.currentRoleIndex];
        const decisionSound = this.sound.add(
            GameConfig.ASSETS.AUDIO.DECISION.key,
            { volume: GameConfig.AUDIO.DECISION_SOUND_VOLUME }
        );
        decisionSound.play();
        this.roleDisplay.setTexture(finalRole);
    }

    showVsScreen() {
        if (!this.isSceneActive || !this.players || this.players.length === 0) {
            console.error("プレイヤーデータがありません。VS画面を表示できません。");
            return;
        }

        const vsSound = this.sound.add(
            GameConfig.ASSETS.AUDIO.VS.key,
            { volume: GameConfig.AUDIO.VS_SOUND_VOLUME }
        );
        vsSound.play();

        const vsImage = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            GameConfig.ASSETS.IMAGES.VS.key
        )
        .setScale(GameConfig.SCALING.VS_IMAGE)
        .setDepth(2);

        this.displayTeam(this.players.slice(0, 2), 0.25);
        this.displayTeam(this.players.slice(2, 4), 0.75);

        this.time.delayedCall(GameConfig.TIMING.VS_SCREEN_DURATION, () => {
            if (this.isSceneActive) {
                vsImage.destroy();
                this.scene.start("BattleScene");
            }
        });
    }

    displayTeam(team, xPosition) {
        team.forEach((player, index) => {
            this.add.text(
                this.scale.width * xPosition,
                this.scale.height * (0.4 + index * 0.1),
                player.name,
                GameConfig.STYLES.PLAYER_NAME
            ).setOrigin(0.5);
        });
    }

    shutdown() {
        this.isSceneActive = false;
        this.sound.stopAll();
        this.scale.off('resize', this.handleResize, this);
        
        if (this.bgm) {
            this.bgm.destroy();
        }
        
        if (this.roleDisplay) {
            this.roleDisplay.destroy();
        }
    }
}
