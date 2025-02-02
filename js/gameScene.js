class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.playerId = localStorage.getItem('userId'); // ユーザーID
        this.roomRef = null;
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

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        this.matchingButton.on("pointerdown", () => {
            console.log("マッチングボタンが押されました");
            this.startMatching();
        });

        this.checkPlayersInRoom();
    }

    startMatching() {
        let roomRef = db.ref("gameRooms/room1/players");

        roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            let playerCount = Object.keys(players).length;

            if (!players[this.playerId]) {
                if (playerCount < 6) {
                    roomRef.child(this.playerId).set({ id: this.playerId, joinedAt: firebase.database.ServerValue.TIMESTAMP });
                } else {
                    console.log("部屋が満員です！");
                    return;
                }
            }

            this.roomRef = roomRef;
            this.checkPlayersInRoom();
        });
    }

    checkPlayersInRoom() {
        let roomRef = db.ref("gameRooms/room1/players");

        roomRef.on("value", snapshot => {
            let players = snapshot.val() || {};
            let playerCount = Object.keys(players).length;

            console.log(`現在のプレイヤー数: ${playerCount}`);

            if (playerCount >= 6) {
                console.log("マッチング完了！ゲーム開始！");
                this.startGame();
            }
        });
    }

    startGame() {
        if (this.roomRef) {
            this.roomRef.off(); // 監視を解除
        }
        this.scene.start("GamePlayScene"); // 次のシーンへ移動（要作成）
    }
}


