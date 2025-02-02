class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.playerId = localStorage.getItem('userId'); // ユーザーIDを取得
        this.roomRef = db.ref("gameRooms/room1/players"); // マッチング用の部屋
        this.isMatching = false; // 二重登録防止フラグ
    }

    preload() {
        this.load.image("background2", "assets/村.png"); // 🎨 背景画像
        this.load.image("matchingButton", "assets/MATCHINGBUTTON.png"); // 🔘 マッチングボタン
        this.load.audio("newBgm", "assets/モノクロライブラリー.mp3"); // 🎵 BGM
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");
        this.children.removeAll();

        // 背景画像の追加
        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background2");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        // BGMの再生
        if (this.sound.get("bgm")) {
            this.sound.stopByKey("bgm");
        }
        if (!this.sound.get("newBgm")) {
            this.newBgm = this.sound.add("newBgm", { loop: true, volume: 0.5 });
            this.newBgm.play();
        }

        console.log("GameScene: ユーザーID =", this.playerId);

        // マッチングボタンの追加
        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        this.matchingButton.on("pointerdown", () => {
            if (!this.isMatching) {
                this.isMatching = true; // クリック無効化
                this.startMatching();
            }
        });

        // すでにマッチングしているか確認
        this.checkExistingPlayer();
    }

    checkExistingPlayer() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            if (players[this.playerId]) {
                console.log("すでにマッチング済み:", this.playerId);
                this.isMatching = true; // クリック無効化
                this.monitorPlayers(); // マッチング監視を開始
            }
        });
    }

    startMatching() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            let playerCount = Object.keys(players).length;

            // すでに登録済みの場合、処理しない
            if (players[this.playerId]) {
                console.log("すでに登録済みのため、再登録しません:", this.playerId);
                return;
            }

            // 6人未満なら追加
            if (playerCount < 6) {
                this.roomRef.child(this.playerId).set({
                    id: this.playerId,
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    console.log("マッチング成功:", this.playerId);
                    this.monitorPlayers(); // マッチング監視を開始
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

            if (playerCount >= 6) {
                console.log("マッチング完了！ゲーム開始！");
                this.startGame();
            }
        });
    }

    startGame() {
        this.roomRef.off(); // 監視を解除
        this.scene.start("GamePlayScene"); // 次のシーンへ移動（要作成）
    }
}


