import Phaser from "phaser";

class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
        this.playerId = localStorage.getItem('userId');
        this.role = null;
        this.team = null;
        this.roles = ["剣士", "僧侶", "魔法使い"];
        this.rouletteIndex = 0;
        this.rouletteActive = false;
    }

    preload() {
        this.load.image("background", "assets/背景.png"); // 🏞️ 背景画像
        this.load.audio("rouletteSound", "assets/ルーレット音.mp3"); // 🎵 ルーレット音
        this.load.audio("decisionSound", "assets/決定音.mp3"); // 🎵 役職決定音
    }

    create() {
        console.log("🎭 GamePlayScene: 役職ルーレット");

        // 🏞️ 背景を設定
        this.add.image(this.scale.width / 2, this.scale.height / 2, "background")
            .setScale(1.2);

        this.add.text(100, 50, "役職を決定中...", { fontSize: "32px", fill: "#fff" });

        // 🎵 ルーレット効果音
        this.rouletteSound = this.sound.add("rouletteSound");
        this.decisionSound = this.sound.add("decisionSound");

        // 🌀 ルーレットテキスト
        this.roleText = this.add.text(this.scale.width / 2, this.scale.height / 2, "", {
            fontSize: "48px",
            fill: "#fff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // 🔄 ルーレット開始
        this.startRoleRoulette();

        // チーム分けを表示するエリア
        this.teamAText = this.add.text(50, 100, "Team A:", { fontSize: "24px", fill: "#fff" });
        this.teamBText = this.add.text(this.scale.width - 200, 100, "Team B:", { fontSize: "24px", fill: "#fff" });

        // 🔴 Firebase のプレイヤー一覧を取得
        this.roomRef = window.db.ref("gameRooms/room1/players");
        this.roomRef.on("value", snapshot => {
            let players = snapshot.val() || {};
            this.updateTeamDisplay(players);
        });
    }

    startRoleRoulette() {
        this.rouletteActive = true;
        this.rouletteSound.play({ loop: true });

        this.rouletteTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                this.rouletteIndex = (this.rouletteIndex + 1) % this.roles.length;
                this.roleText.setText(this.roles[this.rouletteIndex]);
            },
            loop: true
        });

        // ⏳ ルーレットを3秒後に止める
        this.time.delayedCall(3000, () => {
            this.stopRoleRoulette();
        });
    }

    stopRoleRoulette() {
        this.rouletteActive = false;
        this.rouletteSound.stop();
        this.rouletteTimer.remove();

        this.role = this.roles[this.rouletteIndex];
        this.roleText.setText(this.role);
        this.decisionSound.play(); // 🎵 決定音

        console.log(`✅ 役職決定: ${this.role}`);

        // 🔵 Firebase に役職登録
        this.registerPlayer();
    }

    registerPlayer() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            let playerCount = Object.keys(players).length;

            // チーム分け（偶数: A, 奇数: B）
            this.team = playerCount % 2 === 0 ? "TeamA" : "TeamB";

            let playerRef = this.roomRef.child(this.playerId);
            playerRef.set({
                id: this.playerId,
                role: this.role,
                team: this.team,
                ready: false
            }).then(() => {
                console.log("✅ 役職とチーム登録完了");
                this.addReadyButton();
            });
        });
    }

    addReadyButton() {
        let readyButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, "準備完了", {
            fontSize: "32px",
            fill: "#0f0",
            backgroundColor: "#333",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setInteractive()
            .on("pointerdown", () => {
                console.log("🟢 準備完了！");
                this.roomRef.child(this.playerId).update({ ready: true });
            });

        // 🔴 全員の準備完了を監視
        this.roomRef.on("value", snapshot => {
            let players = snapshot.val() || {};
            let allReady = Object.values(players).every(p => p.ready === true);

            if (allReady) {
                console.log("🚀 全員準備完了！BattleScene に移動！");
                this.scene.start("BattleScene");
            }
        });
    }

    updateTeamDisplay(players) {
        let teamA = Object.values(players).filter(p => p.team === "TeamA").map(p => p.id);
        let teamB = Object.values(players).filter(p => p.team === "TeamB").map(p => p.id);

        this.teamAText.setText("Team A:\n" + teamA.join("\n"));
        this.teamBText.setText("Team B:\n" + teamB.join("\n"));
    }
}


