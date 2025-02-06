class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.playerId = localStorage.getItem('userId'); // ユーザーIDを取得
        this.roomRef = null; // 参加する部屋の参照
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

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        this.matchingButton.on("pointerdown", () => {
            this.findRoomAndJoin();
        });

        this.checkExistingPlayer();
    }

    checkExistingPlayer() {
        window.db.ref("gameRooms").once("value").then(snapshot => {
            let rooms = snapshot.val() || {};
            for (let roomKey in rooms) {
                if (rooms[roomKey].players && rooms[roomKey].players[this.playerId]) {
                    console.log("すでにマッチング済み:", this.playerId);
                    this.roomRef = window.db.ref(`gameRooms/${roomKey}/players`);
                    this.monitorPlayers();
                    return;
                }
            }
        });
    }

    findRoomAndJoin() {
        window.db.ref("gameRooms").once("value").then(snapshot => {
            let rooms = snapshot.val() || {};
            let foundRoom = false;

            for (let roomKey in rooms) {
                let playerCount = Object.keys(rooms[roomKey].players || {}).length;
                if (playerCount < 4) {
                    this.roomRef = window.db.ref(`gameRooms/${roomKey}/players`);
                    foundRoom = true;
                    this.registerPlayer(); // プレイヤーを即登録
                    break;
                }
            }

            if (!foundRoom) {
                this.createNewRoom();
            }
        });
    }

    createNewRoom() {
        let newRoomKey = window.db.ref("gameRooms").push().key;
        this.roomRef = window.db.ref(`gameRooms/${newRoomKey}/players`);
        console.log("🆕 新しい部屋を作成:", newRoomKey);
        this.registerPlayer(); // 新しい部屋でも即登録
    }

    registerPlayer() {
        if (!this.roomRef) {
            console.error("🔥 部屋の参照が未定義です！プレイヤーを登録できません！");
            return;
        }

        let playerRef = this.roomRef.child(this.playerId);
        let playerName = localStorage.getItem("playerName") || `プレイヤー${Math.floor(Math.random() * 1000)}`;

        // プレイヤー情報を Firebase に即座に送信
        playerRef.set({
            id: this.playerId,
            name: playerName,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            console.log(`📝 プレイヤー名を即時 Firebase に送信: ${playerName}`);
            this.startMatching();
        }).catch(error => {
            console.error("🔥 プレイヤー登録エラー:", error);
        });

        // Firebase への接続監視（プレイヤーが抜けたら自動削除）
        firebase.database().ref(".info/connected").on("value", (snapshot) => {
            if (snapshot.val() === true) {
                playerRef.onDisconnect().remove()
                    .then(() => console.log("✅ オフライン時に自動削除が設定されました"))
                    .catch(error => console.error("🔥 onDisconnect 設定エラー:", error));
            }
        });

        // ウィンドウを閉じたときに Firebase からプレイヤーを削除
        window.addEventListener("beforeunload", () => {
            playerRef.remove();
        });
    }

    startMatching() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            if (!players[this.playerId]) {
                console.error("🔥 プレイヤーが登録されていません！");
                return;
            }

            this.monitorPlayers();
        });
    }

    monitorPlayers() {
        this.roomRef.on("value", snapshot => {
            let players = snapshot.val() || {};
            console.log("現在のプレイヤーデータ:", players);
            let playerCount = Object.keys(players).length;

            console.log(`現在のプレイヤー数: ${playerCount}`);

            if (playerCount >= 4) {
                console.log("✅ マッチング完了！ゲーム開始！");
                this.startGame();
            }
        });
    }

    startGame() {
        console.log("🎮 startGame() が呼ばれました。シーンを変更します。");

        if (!this.scene.manager.keys["GamePlayScene"]) {
            console.log("📌 GamePlayScene を動的に追加します");
            this.scene.add("GamePlayScene", GamePlayScene);
        }

        this.scene.start("GamePlayScene");
    }
}
