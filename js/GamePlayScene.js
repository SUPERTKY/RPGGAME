// 定数の定義
const GameConfig = {
    ROLES: {
        PRIEST: "priest",
        MAGE: "mage",
        SWORDSMAN: "swordsman"
    },
    ASSETS: {
        IMAGES: {
            BACKGROUND: "background3",
            VS: "vsImage",
            PRIEST: "priest",
            MAGE: "mage",
            SWORDSMAN: "swordsman"
        },
        AUDIO: {
            BGM: "bgmRoleReveal",
            DECISION: "decisionSound",
            VS: "vsSound"
        }
    },
    TIMING: {
        ROULETTE_DELAY: 4000,
        SPIN_DURATION: 500,
        VS_SCREEN_DURATION: 8000
    },
    AUDIO: {
        BGM_VOLUME: 0.5,
        EFFECTS_VOLUME: 1.0
    },
    SCALING: {
        ROLE_DISPLAY: 0.6,
        VS_IMAGE: 0.7
    },
    TEXT_STYLE: {
        ERROR: {
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
        super({ key: "GamePlayScene" });
        this.players = [];
        this.currentRoleIndex = 0;
        this.isSceneActive = false;
    }

    preload() {
        // イメージのプリロード
        Object.entries(GameConfig.ASSETS.IMAGES).forEach(([key, path]) => {
            this.loadImageIfNotLoaded(path, `assets/${path}.png`);
        });

        // オーディオのプリロード
        Object.entries(GameConfig.ASSETS.AUDIO).forEach(([key, path]) => {
            this.load.audio(path, `assets/${path}.mp3`);
        });
    }

    loadImageIfNotLoaded(key, path) {
        if (!this.textures.exists(key)) {
            this.load.image(key, path);
        }
    }

    async create() {
        this.isSceneActive = true;
        this.setupBackground();
        this.setupAudio();
        this.initializeRoles();

        try {
            await this.initializePlayers();
            if (this.players.length > 0 && this.isSceneActive) {
                this.startRoulette();
            }
        } catch (error) {
            this.handleError("ゲーム初期化中にエラーが発生しました", error);
        }
    }

    setupBackground() {
        this.cameras.main.setBackgroundColor("#000000");
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, GameConfig.ASSETS.IMAGES.BACKGROUND);
        this.updateBackgroundScale();

        // リサイズイベントのリスナー追加
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
        this.bgm = this.sound.add(GameConfig.ASSETS.AUDIO.BGM, {
            loop: true,
            volume: GameConfig.AUDIO.BGM_VOLUME
        });
        this.bgm.play();
    }

    initializeRoles() {
        const baseRoles = [
            GameConfig.ROLES.PRIEST,
            GameConfig.ROLES.MAGE,
            GameConfig.ROLES.SWORDSMAN,
            GameConfig.ROLES.PRIEST,
            GameConfig.ROLES.MAGE,
            GameConfig.ROLES.SWORDSMAN
        ];
        this.roles = Phaser.Utils.Array.Shuffle([...baseRoles]);
    }

    async initializePlayers() {
        console.log("🟢 プレイヤーデータ取得開始...");
        this.players = await this.getPlayersFromFirebase();

        if (this.players.length === 0) {
            throw new Error("プレイヤーデータが空です");
        }

        console.log("✅ プレイヤーデータ取得成功:", this.players);
    }

    async getPlayersFromFirebase() {
        try {
            const playerId = localStorage.getItem("playerId");
            if (!playerId) {
                throw new Error("プレイヤーIDが取得できません");
            }

            const roomId = await this.findPlayerRoom(playerId);
            if (!roomId) {
                throw new Error("ルームが見つかりません");
            }

            const refPath = `gameRooms/${roomId}/players`;
            const snapshot = await firebase.database().ref(refPath)
                .orderByChild("joinedAt")
                .once("value");
            
            const data = snapshot.val();
            if (!data) {
                throw new Error("プレイヤーデータが見つかりません");
            }

            return Object.entries(data).map(([key, player]) => ({
                id: key,
                name: player.name || "名前なし",
                joinedAt: player.joinedAt || 0
            }));

        } catch (error) {
            this.handleError("プレイヤーデータの取得に失敗しました", error);
            return [];
        }
    }

    async findPlayerRoom(playerId) {
        try {
            const snapshot = await firebase.database()
                .ref("gameRooms")
                .orderByChild(`players/${playerId}/exists`)
                .equalTo(true)
                .once("value");

            const rooms = snapshot.val();
            if (!rooms) {
                throw new Error("ルームデータが見つかりません");
            }

            return Object.keys(rooms)[0];

        } catch (error) {
            this.handleError("ルーム検索中にエラーが発生しました", error);
            return null;
        }
    }

    startRoulette() {
        if (!this.isSceneActive) return;

        this.roleDisplay = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            GameConfig.ROLES.PRIEST
        )
        .setScale(GameConfig.SCALING.ROLE_DISPLAY)
        .setDepth(1)
        .setAlpha(0);

        this.time.delayedCall(GameConfig.TIMING.ROULETTE_DELAY, () => {
            this.startRouletteAnimation();
        });
    }

    startRouletteAnimation() {
        if (!this.isSceneActive) return;

        const totalSpins = this.roles.length * 3;
        this.roleDisplay.setAlpha(1);

        let spinsCompleted = 0;
        
        const spinTimer = this.time.addEvent({
            delay: GameConfig.TIMING.SPIN_DURATION,
            repeat: totalSpins - 1,
            callback: () => {
                if (!this.isSceneActive) {
                    spinTimer.remove();
                    return;
                }

                spinsCompleted++;
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);

                if (spinsCompleted === totalSpins) {
                    this.finalizeRole();
                }
            }
        });
    }

    finalizeRole() {
        if (!this.isSceneActive) return;

        const finalRole = this.roles[this.currentRoleIndex];
        const decisionSound = this.sound.add(
            GameConfig.ASSETS.AUDIO.DECISION,
            { volume: GameConfig.AUDIO.EFFECTS_VOLUME }
        );
        decisionSound.play();

        this.roleDisplay.setTexture(finalRole);

        this.time.delayedCall(GameConfig.TIMING.ROULETTE_DELAY, () => {
            this.showVsScreen();
        });
    }

    showVsScreen() {
        if (!this.isSceneActive || !this.players || this.players.length === 0) {
            this.handleError("VS画面の表示に失敗しました", new Error("プレイヤーデータが不足しています"));
            return;
        }

        const vsSound = this.sound.add(
            GameConfig.ASSETS.AUDIO.VS,
            { volume: GameConfig.AUDIO.EFFECTS_VOLUME }
        );
        vsSound.play();

        const vsImage = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            GameConfig.ASSETS.IMAGES.VS
        )
        .setScale(GameConfig.SCALING.VS_IMAGE)
        .setDepth(2);

        this.displayTeams();

        this.time.delayedCall(GameConfig.TIMING.VS_SCREEN_DURATION, () => {
            if (this.isSceneActive) {
                vsImage.destroy();
                this.scene.start("BattleScene");
            }
        });
    }

    displayTeams() {
        const leftTeam = this.players.slice(0, 2);
        const rightTeam = this.players.slice(2, 4);

        leftTeam.forEach((player, index) => {
            this.add.text(
                this.scale.width * 0.25,
                this.scale.height * (0.4 + index * 0.1),
                player.name,
                GameConfig.TEXT_STYLE.PLAYER_NAME
            ).setOrigin(0.5);
        });

        rightTeam.forEach((player, index) => {
            this.add.text(
                this.scale.width * 0.75,
                this.scale.height * (0.4 + index * 0.1),
                player.name,
                GameConfig.TEXT_STYLE.PLAYER_NAME
            ).setOrigin(0.5);
        });
    }

    handleError(message, error) {
        console.error(`⚠️ ${message}:`, error);
        
        if (this.isSceneActive) {
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                `⚠️ ${message}`,
                GameConfig.TEXT_STYLE.ERROR
            ).setOrigin(0.5);
        }
    }

    shutdown() {
        this.isSceneActive = false;
        this.sound.stopAll();
        this.scale.off('resize', this.handleResize, this);
        
        // クリーンアップ
        if (this.bgm) {
            this.bgm.destroy();
        }
        
        if (this.roleDisplay) {
            this.roleDisplay.destroy();
        }
    }
}
