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

        this.matchingButton = this.add.image(this.scale.width / 2, 350, "matchingButton")
            .setInteractive()
            .setDepth(2)
            .setScale(0.5);

        this.matchingButton.on("pointerdown", () => {
    this.checkExistingPlayer(); // ✅ 修正
});


        this.checkExistingPlayer();
    }

   checkExistingPlayer() {
    let gameRoomsRef = window.db.ref("gameRooms");

    gameRoomsRef.once("value").then(snapshot => {
        let rooms = snapshot.val() || {};
        let assignedRoom = null;

        for (let roomId in rooms) {
            let players = rooms[roomId].players || {};
            let playerCount = Object.keys(players).length;

            // 🔍 プレイヤーがすでに部屋にいるか確認
            if (players[this.playerId]) {
                assignedRoom = roomId;
                break; // すでに部屋が見つかったらループ終了
            }
        }

        if (assignedRoom) {
            console.log(`✅ 既存の部屋を利用: ${assignedRoom}`);
            localStorage.setItem("roomId", assignedRoom);
            this.roomRef = window.db.ref(`gameRooms/${assignedRoom}/players`);
            this.monitorPlayers();
        } else {
            this.createNewRoom(); // ✅ 既存の部屋がない場合のみ、新しい部屋を作成
        }
    });
}


    createNewRoom() {
    let gameRoomsRef = window.db.ref("gameRooms");

    gameRoomsRef.once("value").then(snapshot => {
        let rooms = snapshot.val() || {};
        let newRoomId = `room${Object.keys(rooms).length + 1}`;

        console.log(`🆕 新しい部屋を作成します: ${newRoomId}`);

        // 🔥 ルームIDを `localStorage` に保存
        localStorage.setItem("roomId", newRoomId);
        console.log("✅ ルームIDを保存:", newRoomId);

        // Firebase に新しい部屋を作成
        gameRoomsRef.child(newRoomId).set({
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            this.roomRef = gameRoomsRef.child(newRoomId).child("players");
            this.addPlayerToRoom();
        }).catch(error => console.error("🔥 ルーム作成エラー:", error));
    });
}


    addPlayerToRoom() {
    let playerRef = this.roomRef.child(this.playerId);
    let playerName = localStorage.getItem("playerName") || `プレイヤー${Math.floor(Math.random() * 1000)}`;

    firebase.database().ref(".info/connected").on("value", snapshot => {
        if (snapshot.val() === true) {
            console.log("🔌 Firebase に接続成功！onDisconnect を設定");
            playerRef.onDisconnect().remove()
                .then(() => console.log("✅ オフライン時に自動削除が設定されました"))
                .catch(error => console.error("🔥 onDisconnect 設定エラー:", error));
        }
    });

    playerRef.set({
        id: this.playerId,
        name: playerName,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log(`✅ マッチング成功: ${this.playerId} (部屋: ${localStorage.getItem("roomId")})`);

        window.addEventListener("beforeunload", () => {
            playerRef.remove().then(() => {
                this.cleanupEmptyRoom();
            });
        });

        this.monitorPlayers();
    }).catch(error => {
        console.error("🔥 プレイヤー登録エラー:", error);
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
　　cleanupEmptyRoom() {
    let roomId = localStorage.getItem("roomId");
    let roomRef = window.db.ref(`gameRooms/${roomId}/players`);

    roomRef.once("value").then(snapshot => {
        let players = snapshot.val() || {};
        if (Object.keys(players).length === 0) {
            console.log(`🗑️ 部屋 ${roomId} が空になったため削除`);
            window.db.ref(`gameRooms/${roomId}`).remove();
        }
    });
}

    startGame() {
        let roomId = localStorage.getItem("roomId");
        console.log("🎮 startGame() が呼ばれました。ルームID:", roomId);

        if (!roomId) {
            console.error("⚠️ ルームIDが `localStorage` にありません！");
            return;
        }

        let playerRef = this.roomRef.child(this.playerId);
        let playerName = localStorage.getItem("playerName") || `プレイヤー${Math.floor(Math.random() * 1000)}`;

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


