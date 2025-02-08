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
    
    // すでに音楽が再生されている場合、再度再生しない
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

    // **ウェブページを離れたとき（タブ切り替え・ウィンドウ非表示）にリロード**
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            this.leaveRoomAndReload();
        }
    });

    // **ネットワークが切れたときにリロード**
    window.addEventListener("offline", () => {
        this.leaveRoomAndReload();
    });

    // **ブラウザを閉じる or リロードする前にルームを退出**
    window.addEventListener("beforeunload", () => {
        this.leaveRoom();
    });
}



        leaveRoom() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId || !this.roomRef) return;

    let playerRef = window.db.ref(`gameRooms/${roomId}/players/${this.playerId}`);
    playerRef.remove().then(() => {
        console.log(`🚪 ルーム ${roomId} からプレイヤー ${this.playerId} を削除しました`);
    }).catch(error => {
        console.error("🔥 ルーム退出エラー:", error);
    });

    localStorage.removeItem("roomId");
}


   leaveRoomAndReload() {
    this.leaveRoom();

    // 音楽を停止する
    if (this.newBgm) {
        this.newBgm.stop();
        this.newBgm.destroy(); // メモリから削除
        this.newBgm = null;
    }

    console.log("🔄 ゲームをリロードします...");
    setTimeout(() => {
        window.location.reload(); // 100ms 後にリロード（即時リロードより安定する）
    }, 100);
}



    checkExistingPlayer() {
        window.db.ref("gameRooms").once("value").then(snapshot => {
            let rooms = snapshot.val() || {};
            for (let roomKey in rooms) {
                if (rooms[roomKey].players && rooms[roomKey].players[this.playerId]) {
                    console.log("すでにマッチング済み:", this.playerId);
                    localStorage.setItem("roomId", roomKey);
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
                    localStorage.setItem("roomId", roomKey);
                    foundRoom = true;
                    this.startMatching();
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
        localStorage.setItem("roomId", newRoomKey);
        console.log("🆕 新しい部屋を作成:", newRoomKey);
        this.startMatching();
    }

    startMatching() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            if (players[this.playerId]) {
                console.log("すでに登録済み:", this.playerId);
                return;
            }

            let playerRef = this.roomRef.child(this.playerId);
            firebase.database().ref(".info/connected").on("value", (snapshot) => {
                if (snapshot.val() === true) {
                    playerRef.onDisconnect().remove()
                        .then(() => console.log("✅ オフライン時に自動削除が設定されました"))
                        .catch(error => console.error("🔥 onDisconnect 設定エラー:", error));
                }
            });

            playerRef.set({
                id: this.playerId,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                console.log(`✅ マッチング成功: ${this.playerId} (部屋: ${this.roomRef.parent.key})`);

                window.addEventListener("beforeunload", () => {
                    playerRef.remove();
                });

                this.monitorPlayers();
            }).catch(error => {
                console.error("🔥 プレイヤー登録エラー:", error);
            });
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

        let roomId = localStorage.getItem("roomId");
        console.log("📌 保存された roomId:", roomId);

        let playerName = localStorage.getItem("playerName") || `プレイヤー${Math.floor(Math.random() * 1000)}`;
        let playerRef = this.roomRef.child(this.playerId);

        playerRef.update({ name: playerName })
            .then(() => console.log("✅ プレイヤー名を Firebase に保存:", playerName))
            .catch(error => console.error("🔥 プレイヤー名保存エラー:", error));

        if (!this.scene.manager.keys["GamePlayScene"]) {
            console.log("📌 GamePlayScene を動的に追加します");
            this.scene.add("GamePlayScene", GamePlayScene);
        }

        this.scene.start("GamePlayScene");
    }
}
