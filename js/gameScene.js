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
        this.load.audio("clickSound", "ファニージャンプ.mp3");

    }

    create() {
        this.clickSound = this.sound.add("clickSound", { volume: 0.8 });

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
         this.clickSound.play(); // 🔊 クリック音を再生
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
            let roomData = rooms[roomKey];
            let playerCount = Object.keys(roomData.players || {}).length;

            // 🔥 一度結成されたパーティには参加しない（ゲーム開始フラグがある場合も除外）
            if (playerCount < 6 && !roomData.partyFormed && !roomData.gameStarted) {
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
    let newRoomRef = window.db.ref(`gameRooms/${newRoomKey}`);
    
    newRoomRef.set({
        players: {},
        partyFormed: false, // 新しい部屋はまだパーティが結成されていない
        gameStarted: false
    }).then(() => {
        this.roomRef = newRoomRef.child("players");
        localStorage.setItem("roomId", newRoomKey);
        console.log("🆕 新しい部屋を作成:", newRoomKey);
        this.startMatching();
    }).catch(error => {
        console.error("🔥 部屋作成エラー:", error);
    });
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
    if (this.isGameStarted) {
        console.warn("⚠️ `monitorPlayers()` ですでにゲーム開始済みのため、Firebase の監視を停止");
        return;
    }

    this.roomRef.off("value"); // ✅ 以前のリスナーを削除
    this.roomRef.on("value", snapshot => {
        let players = snapshot.val() || {};
        console.log("🟢 Firebase 更新検知:", players);
        let playerCount = Object.keys(players).length;

        console.log(`現在のプレイヤー数: ${playerCount}`);

        if (playerCount >= 6) {
            console.log("✅ マッチング完了！ゲーム開始！");
            this.startGame();
        }
    });
}


   startGame() {
    if (this.isGameStarted) {
        console.warn("⚠️ すでに `startGame()` が実行されています。再実行を防ぎます。");
        return;
    }
    this.isGameStarted = true;

    console.log("🎮 startGame() が呼ばれました。シーンを変更します。");

    let roomId = localStorage.getItem("roomId");
    console.log("📌 保存された roomId:", roomId);

    let playerName = localStorage.getItem("playerName") || `プレイヤー${Math.floor(Math.random() * 1000)}`;
    let roomRef = window.db.ref(`gameRooms/${roomId}`);

    roomRef.update({ gameStarted: true }) // ゲームが開始されたことを Firebase に記録
        .then(() => console.log("✅ ゲーム開始フラグを Firebase に保存"))
        .catch(error => console.error("🔥 ゲーム開始フラグ保存エラー:", error));

    let playerRef = this.roomRef.child(this.playerId);
    playerRef.update({ name: playerName })
        .then(() => console.log("✅ プレイヤー名を Firebase に保存:", playerName))
        .catch(error => console.error("🔥 プレイヤー名保存エラー:", error));

    if (!this.scene.manager.keys["GamePlayScene"]) {
        console.log("📌 GamePlayScene を動的に追加します");
        this.scene.add("GamePlayScene", GamePlayScene);
    }

    this.scene.start("GamePlayScene");

    // 🔥 **ゲーム開始後にマッチングの監視を停止**
    this.roomRef.off("value");
}


}
