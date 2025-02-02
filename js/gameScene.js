const API_URL = "https://mute-hall-fe0f.6hk7hzcfqs.workers.dev";  

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.isMatching = false;
        this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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

        // 🎵 **BGMの管理**
        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm"); // 既存のBGMを止める
        }
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        this.matchingButton.on("pointerdown", () => {
            if (this.isMatching) {
                console.log("すでにマッチング中です...");
                return;
            }
            this.isMatching = true;
            console.log(`マッチング開始 (Player ID: ${this.playerId})`);
            this.matchPlayer();
        });
    }

    async matchPlayer() {
        try {
            let response = await fetch(`${API_URL}/match`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: this.playerId })
            });

            if (!response.ok) {
                throw new Error(`HTTPエラー: ${response.status}`);
            }

            let data = await response.json();
            if (data.matchId) {
                console.log(`マッチング成功！ 部屋ID: ${data.matchId}`);
                this.roomId = data.matchId;
                this.checkRoomStatus();
            } else {
                console.log("マッチング待機中...");
            }
        } catch (error) {
            console.error("マッチングエラー:", error);
            this.isMatching = false;
        }
    }

    async checkRoomStatus() {
        if (!this.roomId) return;

        let interval = setInterval(async () => {
            let response = await fetch(`${API_URL}/room/${this.roomId}`);
            let roomData = await response.json();

            if (roomData.status === "ready") {
                clearInterval(interval);
                console.log("全員揃いました！");
                this.add.text(this.scale.width / 2, 500, "全員揃いました！", {
                    fontSize: "20px",
                    fill: "#00ff00"
                }).setOrigin(0.5, 0.5);
                
                this.startBattle();
            } else {
                console.log("待機中...");
            }
        }, 2000);
    }

    startBattle() {
        console.log("バトル開始！");
        this.scene.start("BattleScene", { roomId: this.roomId });
    }
}
