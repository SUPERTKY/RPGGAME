class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
        this.ROULETTE_START_DELAY = 4000;
        this.SPIN_DURATION = 500;
        this.VS_SCREEN_DURATION = 8000;
        this.BGM_VOLUME = 0.5;
        this.DECISION_SOUND_VOLUME = 1;
        this.VS_SOUND_VOLUME = 1;
    }

    preload() {
        this.load.image("background3", "assets/background3.png");
        this.load.image("vsImage", "assets/VS.png");
        this.load.image("swordsman", "assets/剣士.png");
        this.load.image("mage", "assets/魔法使い.png");
        this.load.image("priest", "assets/僧侶.png");

        this.load.audio("bgmRoleReveal", "assets/役職発表音楽.mp3");
        this.load.audio("decisionSound", "assets/決定音.mp3");
        this.load.audio("vsSound", "assets/VS効果音.mp3");
    }

    async create() {
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
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
        let scaleX = this.scale.width / this.bg.width;
        let scaleY = this.scale.height / this.bg.height;
        let scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);
    }

    setupAudio() {
        this.sound.stopAll();
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: this.BGM_VOLUME });
        this.bgm.play();
    }

    generateRoles() {
        let roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
        return Phaser.Utils.Array.Shuffle(roles);
    }

    async getPlayersFromFirebase() {
        let playerId = localStorage.getItem("playerId");
        if (!playerId) {
            throw new Error("プレイヤーIDが取得できませんでした。");
        }

        let roomId = await this.findPlayerRoom(playerId);
        if (!roomId) {
            throw new Error("プレイヤーが所属するルームIDが見つかりませんでした。");
        }

        let refPath = `gameRooms/${roomId}/players`;
        let snapshot = await firebase.database().ref(refPath).once("value");
        let data = snapshot.val();

        if (!data || Object.keys(data).length === 0) {
            throw new Error("Firebaseにプレイヤーデータがありません。");
        }

        return Object.entries(data).map(([key, player]) => ({
            id: key,
            name: player.name || "名前なし"
        }));
    }

    async findPlayerRoom(playerId) {
        let snapshot = await firebase.database().ref("gameRooms").once("value");
        let rooms = snapshot.val();

        if (!rooms) {
            throw new Error("ルームデータが見つかりません。");
        }

        for (let roomId in rooms) {
            if (rooms[roomId].players && rooms[roomId].players[playerId]) {
                return roomId;
            }
        }

        throw new Error(`プレイヤー ${playerId} の所属する部屋が見つかりませんでした。`);
    }

    handleNoPlayersError() {
        this.add.text(this.scale.width / 2, this.scale.height / 2, "⚠️ プレイヤーデータが見つかりません", {
            fontSize: "32px",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);
    }

    handleFirebaseError(error) {
        console.error("Firebaseエラー:", error);
        this.add.text(this.scale.width / 2, this.scale.height / 2, "⚠️ データ取得中にエラーが発生しました", {
            fontSize: "32px",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);
    }

    startRoulette() {
        this.currentRoleIndex = 0;
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.6).setDepth(1).setAlpha(0);

        this.time.delayedCall(this.ROULETTE_START_DELAY, () => {
            let totalSpins = this.roles.length * 3;

            this.roleDisplay.setAlpha(1);
            this.time.addEvent({
                delay: this.SPIN_DURATION,
                repeat: totalSpins - 1,
                callback: this.updateRoleDisplay,
                callbackScope: this
            });

            this.time.delayedCall(this.SPIN_DURATION * totalSpins, this.finalizeRole, [], this);
            this.time.delayedCall(this.SPIN_DURATION * totalSpins + 5000, this.showVsScreen, [], this);
        });
    }

    updateRoleDisplay() {
        this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
        this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
    }

    finalizeRole() {
        let finalRole = this.roles[this.currentRoleIndex];
        let decisionSound = this.sound.add("decisionSound", { volume: this.DECISION_SOUND_VOLUME });
        decisionSound.play();
        this.roleDisplay.setTexture(finalRole);
    }

    showVsScreen() {
        if (!this.players || this.players.length === 0) {
            console.error("プレイヤーデータがありません。VS画面を表示できません。");
            return;
        }

        let vsSound = this.sound.add("vsSound", { volume: this.VS_SOUND_VOLUME });
        vsSound.play();

        let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7).setDepth(2);

        this.displayTeam(this.players.slice(0, 2), 0.25);
        this.displayTeam(this.players.slice(2, 4), 0.75);

        this.time.delayedCall(this.VS_SCREEN_DURATION, () => {
            vsImage.destroy();
            this.scene.start("BattleScene");
        });
    }

    displayTeam(team, xPosition) {
        team.forEach((player, index) => {
            this.add.text(this.scale.width * xPosition, this.scale.height * (0.4 + index * 0.1), player.name, {
                fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
            }).setOrigin(0.5);
        });
    }
}
