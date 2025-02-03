class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.playerId = localStorage.getItem('userId'); // ユーザーIDを取得
    }

    preload() {
        this.load.image("background2", "assets/村.png"); 
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png");
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3");
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");
        

        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        console.log("GameScene: ユーザーID =", this.playerId);

        if (typeof window.db === "undefined") {
            console.error("🔥 Firebase Database が未定義です！ ゲームを開始できません！");
            return;
        }
        
        this.roomRef = window.db.ref("gameRooms/room1/players");

        // ✅ マッチングボタンを追加
        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        this.matchingButton.on("pointerdown", () => {
            this.startMatching();
        });

        this.checkExistingPlayer();
    }

    checkExistingPlayer() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            if (players[this.playerId]) {
                console.log("すでにマッチング済み:", this.playerId);
                this.monitorPlayers();
            }
        });
    }

   startMatching() {
    this.roomRef.once("value").then(snapshot => {
        let players = snapshot.val() || {};
        let playerCount = Object.keys(players).length;

        if (players[this.playerId]) {
            console.log("すでに登録済みのため、再登録しません:", this.playerId);
            return;
        }

        if (playerCount < 6) {
            this.roomRef.child(this.playerId).set({
                id: this.playerId,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                console.log("マッチング成功:", this.playerId);

                // ❗ ページ離脱時の自動削除処理を追加
                window.addEventListener("beforeunload", () => {
                    this.roomRef.child(this.playerId).remove();
                });

                this.monitorPlayers();
            });
        } else {
            console.log("部屋が満員です！マッチング不可");
        }
    });
}


    monitorPlayers() {
        this.roomRef.on("value", snapshot => {
            let players = snapshot.val() || {};
            let playerCount = Object.keys(players).length;

            console.log(`現在のプレイヤー数: ${playerCount}`);

            if (playerCount >= 3) {
                console.log("マッチング完了！ゲーム開始！");
                this.startGame();
            }
        });
    }

    startGame() {
        this.roomRef.off();
        this.scene.start("GamePlayScene");
    }
}

