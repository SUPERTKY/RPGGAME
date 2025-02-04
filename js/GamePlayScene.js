import Phaser from "phaser";

class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
        this.playerId = localStorage.getItem('userId');
        this.role = null;
    }

    create() {
        console.log("🎭 GamePlayScene: 役職選択");

        this.add.text(100, 50, "役職を選んでください", { fontSize: "32px", fill: "#fff" });

        let roles = ["剣士", "僧侶", "魔法使い"];
        roles.forEach((role, index) => {
            this.add.text(100, 150 + index * 50, role, { fontSize: "32px", fill: "#fff" })
                .setInteractive()
                .on("pointerdown", () => {
                    console.log(`✅ 選択した役職: ${role}`);
                    this.role = role;
                    this.registerPlayer();
                });
        });
    }

    registerPlayer() {
        let playerRef = window.db.ref(`gameRooms/room1/players/${this.playerId}`);
        playerRef.set({
            id: this.playerId,
            role: this.role,
            team: Object.keys(this.scene.players || {}).length % 2 === 0 ? "TeamA" : "TeamB",
            ready: false
        }).then(() => {
            console.log("✅ 役職登録完了！準備完了を待ちます...");
            this.addReadyButton();
        });
    }

    addReadyButton() {
        let readyButton = this.add.text(100, 300, "準備完了", { fontSize: "32px", fill: "#0f0" })
            .setInteractive()
            .on("pointerdown", () => {
                console.log("🟢 準備完了！");
                window.db.ref(`gameRooms/room1/players/${this.playerId}`).update({ ready: true });
            });

        // 🔴 Firebase で全員の準備完了を監視
        window.db.ref("gameRooms/room1/players").on("value", snapshot => {
            let players = snapshot.val() || {};
            let allReady = Object.values(players).every(p => p.ready === true);
            
            if (allReady) {
                console.log("🚀 全員準備完了！BattleScene に移動！");
                this.scene.start("BattleScene");
            }
        });
    }
}

export default GamePlayScene;

