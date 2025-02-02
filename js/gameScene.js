const API_URL = "https://mute-hall-fe0f.6hk7hzcfqs.workers.dev";

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.isMatching = false;
        this.roomId = null;
        this.matchingStartTime = null;
        this.playerId = `player_${crypto.randomUUID()}`;

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
        console.log(`🧹 cleanupOldData 実行: ${this.playerId}`);
        try {
            let response = await fetch(`${API_URL}/cleanup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: this.playerId })
            });

            let data = await response.json();
            console.log("🗑️ cleanupOldData 結果:", data);
        } catch (error) {
            console.error("❌ cleanupOldData エラー:", error);
        }
    }

    preload() {
        this.load.image("background2", "assets/村.png");
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png");
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3");
    }

   create() {
    this.cameras.main.setBackgroundColor("#000000");

    // ✅ 先に `bg` を定義する
    let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");

    // ✅ `bg` の width と height を参照
    let scaleX = this.scale.width / bg.width;
    let scaleY = this.scale.height / bg.height;
    let scale = Math.max(scaleX, scaleY);

    bg.setScale(scale).setDepth(-5);
}


    async matchPlayer() {
        try {
            console.log("🧹 先に古いデータを削除");
            await this.cleanupOldData();
            await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ 1秒待機

            let response = await fetch(`${API_URL}/match`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: this.playerId })
            });

            let data = await response.json();
            if (data.matchId) {
                this.roomId = data.matchId;
                this.checkRoomStatus();
            } else {
                console.log("⏳ マッチング待機中...");
            }
        } catch (error) {
            console.error("❌ マッチングエラー:", error);
            this.isMatching = false;
        }
    }

    async checkRoomStatus() {
        if (!this.roomId) return;

        let interval = setInterval(async () => {
            try {
                let response = await fetch(`${API_URL}/room/${this.roomId}`);
                let roomData = await response.json();

                console.log(`🏠 ルームデータ:`, roomData);

                if (roomData.status === "ready" && roomData.players.length >= 2) {
                    clearInterval(interval);
                    console.log("✅ 全員揃いました！");
                    this.startBattle();
                } else {
                    console.log(`待機中... (現在のプレイヤー数: ${roomData.players.length || 0})`);
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


