const API_URL = "https://mute-hall-fe0f.6hk7hzcfqs.workers.dev";

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.isMatching = false;
        this.roomId = null;
        this.matchingStartTime = null;
        this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        document.addEventListener("visibilitychange", async () => {
            if (document.visibilityState === "hidden") {
                await this.leaveGame();
            }
        });
    }

    async leaveGame() {
        if (this.isMatching || this.roomId) {
            const payload = JSON.stringify({ playerId: this.playerId, matchId: this.roomId });
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon(`${API_URL}/leave`, blob);
            console.log("✅ ページ離脱時に `leaveGame()` を実行");
        }
    }

    async cleanupOldData() {
        try {
            console.log(`🧹 cleanupOldData 実行: ${this.playerId}`);

            let response = await fetch(`${API_URL}/cleanup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: this.playerId })
            });

            let data = await response.json();
            console.log("🗑️ cleanupOldData 結果:", data);
        } catch (error) {
            console.error("古いデータの削除エラー:", error);
        }
    }

    preload() {
        this.load.image("background2", "assets/村.png");
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png");
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3");
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");
        this.children.removeAll();

        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        this.add.text(this.scale.width / 2, 100, "ゲーム画面", {
            fontSize: "40px",
            fill: "#ffffff"
        }).setOrigin(0.5, 0.5).setDepth(1);

        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        this.matchingButton.on("pointerdown", async () => {
            if (this.isMatching) {
                console.log("すでにマッチング中です...");
                return;
            }
            this.isMatching = true;
            console.log(`🚀 マッチング開始 (Player ID: ${this.playerId})`);
            await this.matchPlayer();
        });

        this.waitingText = this.add.text(this.scale.width / 2, 450, "", {
            fontSize: "20px",
            fill: "#ffffff"
        }).setOrigin(0.5, 0.5);
    }

    async matchPlayer() {
        try {
            console.log("🧹 先に古いデータを削除");
            await this.cleanupOldData();

            let response = await fetch(`${API_URL}/match`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: this.playerId })
            });

            if (!response.ok) {
                throw new Error(`HTTPエラー: ${response.status}`);
            }

            let data = await response.json();
            console.log(`✅ マッチング結果:`, data);

            if (data.matchId) {
                console.log(`✅ マッチング成功！ 部屋ID: ${data.matchId}`);
                this.roomId = data.matchId;
                this.checkRoomStatus();
            } else {
                console.log("⏳ マッチング待機中...");
                setTimeout(() => {
                    this.checkRoomStatus();
                }, 2000);
            }
        } catch (error) {
            console.error("❌ マッチングエラー:", error);
            this.isMatching = false;
        }
    }

    async checkRoomStatus() {
        if (!this.roomId) return;

        this.matchingStartTime = Date.now();
        let interval = setInterval(async () => {
            try {
                let response = await fetch(`${API_URL}/room/${this.roomId}`);
                let roomData = await response.json();

                let elapsedSeconds = Math.floor((Date.now() - this.matchingStartTime) / 1000);
                this.waitingText.setText(`待機時間: ${elapsedSeconds}秒`);

                if (roomData.status === "ready") {
                    clearInterval(interval);
                    console.log("全員揃いました！");
                    this.waitingText.setText("全員揃いました！");
                    this.startBattle();
                } else {
                    console.log(`待機中... (${elapsedSeconds}秒経過)`);
                }
            } catch (error) {
                console.error("ルーム確認エラー:", error);
            }
        }, 1000);
    }

    startBattle() {
        console.log("🎮 バトル開始！");
        this.scene.start("BattleScene", { roomId: this.roomId });
    }
}

export default GameScene;



