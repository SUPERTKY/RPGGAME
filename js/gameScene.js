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
    // ゲームルームの親リファレンス
    let roomsRef = window.db.ref("gameRooms");

    roomsRef.once("value").then(snapshot => {
        let rooms = snapshot.val() || {};
        let selectedRoom = null;

        // 空いている部屋を探す
        Object.keys(rooms).forEach(roomId => {
            let players = rooms[roomId].players || {};
            let playerCount = Object.keys(players).length;

            if (playerCount < 3) { // 3人未満ならこの部屋を使う
                selectedRoom = roomId;
            }
        });

        // 空いている部屋がなければ、新しい部屋を作る
        if (!selectedRoom) {
            selectedRoom = "room" + (Object.keys(rooms).length + 1);
            roomsRef.child(selectedRoom).set({ players: {} });
        }

        // 選ばれた部屋の参照をセット
        this.roomRef = roomsRef.child(selectedRoom).child("players");

        // 選ばれた部屋に参加
        this.joinRoom();
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

