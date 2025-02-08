class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
    }
    async getUserId() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log("✅ Firebase 認証成功 ユーザーID:", user.uid);
                resolve(user.uid);
            } else {
                console.warn("⚠️ ユーザーが未ログインです。匿名ログインを試行...");
                firebase.auth().signInAnonymously()
                    .then(result => {
                        console.log("✅ 匿名ログイン成功 ユーザーID:", result.user.uid);
                        resolve(result.user.uid);
                    })
                    .catch(error => {
                        console.error("❌ ログインエラー:", error);
                        reject(error);
                    });
            }
        });
    });
}

    preload() {
        this.load.image("background3", "assets/background3.png");
        this.load.image("vsImage", "assets/VS.png");
        this.load.image("swordsman", "assets/剣士.png");
        this.load.image("mage", "assets/魔法使い.png");
        this.load.image("priest", "assets/僧侶.png");
        this.load.audio("bgmRoleReveal", "assets/役職発表音楽.mp3");
        this.load.audio("decisionSound", "assets/決定音.mp3");
        this.load.audio("vsSound", "assets/VS効果音.mp3");
    }

   async create() {
    this.cameras.main.setBackgroundColor("#000000");

    this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
    let scaleX = this.scale.width / this.bg.width;
    let scaleY = this.scale.height / this.bg.height;
    let scale = Math.max(scaleX, scaleY);
    this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);

    this.sound.stopAll();
    this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
    this.bgm.play();

    this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
    Phaser.Utils.Array.Shuffle(this.roles);

    let userId;
    try {
        userId = await this.getUserId();
        console.log("✅ ユーザーID取得成功:", userId);
    } catch (error) {
        console.error("❌ ユーザーIDの取得に失敗しました:", error);
        return;
    }

    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.warn("⚠️ ルームIDが見つかりません。Firebase から検索します...");
        try {
            roomId = await this.findRoomByUserId(userId);
            if (roomId) {
                localStorage.setItem("roomId", roomId);
                console.log("✅ 取得したルームID:", roomId);
            } else {
                console.error("⚠️ ルームIDが取得できませんでした。");
                return;
            }
        } catch (error) {
            console.error("❌ Firebase からルームID取得中にエラー:", error);
            return;
        }
    }

    try {
        this.players = await this.getPlayersFromFirebase(roomId);
        console.log("✅ 取得したプレイヤー名:", this.players);
        if (!this.players || this.players.length === 0) {
            console.error("⚠️ プレイヤーが取得できませんでした。");
            return;
        }
    } catch (error) {
        console.error("❌ Firebase からプレイヤー情報を取得中にエラー:", error);
        return;
    }

    // ✅ **VS画面を全端末で同期させるリスナーを開始**
    this.setupVsScreenListener();

    // 🛠️ ルーレット開始
    this.startRoulette();
}




 startRoulette() {
    if (this.isRouletteRunning) {
        console.warn("⚠️ ルーレットがすでに実行中のため、再実行を防ぎます。");
        return;
    }
    this.isRouletteRunning = true;

    this.currentRoleIndex = 0;

    if (this.rouletteEvent) {
        console.log("🛑 既存のルーレットイベントを削除しました");
        this.rouletteEvent.remove(false);
        this.rouletteEvent = null;
    }

    this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest")
        .setScale(0.6)
        .setDepth(1)
        .setAlpha(0);

    this.time.delayedCall(5000, () => {
        let totalSpins = this.roles.length * 2;
        let spinDuration = 1000;

        this.roleDisplay.setAlpha(1);

        this.rouletteEvent = this.time.addEvent({
            delay: spinDuration,
            repeat: totalSpins - 1,
            callback: () => {
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                if (this.roleDisplay) {
                    this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
                }
            },
            callbackScope: this
        });

        this.time.delayedCall(spinDuration * totalSpins, () => {
            this.finalizeRole();
        });
    });
}


　　async findRoomByUserId(userId) {
    try {
        let snapshot = await firebase.database().ref("gameRooms").once("value");
        let rooms = snapshot.val();

        if (!rooms) {
            console.warn("⚠️ ルームが存在しません。");
            return null;
        }

        for (let roomId in rooms) {
            if (rooms[roomId].players && rooms[roomId].players[userId]) {
                console.log("✅ プレイヤーが所属しているルームID:", roomId);
                return roomId;
            }
        }

        console.warn("⚠️ プレイヤーの所属するルームが見つかりませんでした。");
        return null;
    } catch (error) {
        console.error("❌ Firebase からルーム検索中にエラーが発生:", error);
        return null;
    }
}
    setupVsScreenListener() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).on("value", snapshot => {
        let shouldStart = snapshot.val();
        if (shouldStart) {
            console.log("🔥 VS画面を開始する合図を受信！");
            this.showVsScreen();
        }
    });
}

    async getPlayersFromFirebase() {
    let userId = firebase.auth().currentUser?.uid;
    if (!userId) {
        console.error("⚠️ ユーザーIDが取得できませんでした。");
        return ["エラー: ユーザー不明"];
    }

    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.warn("⚠️ ルームIDが見つかりません。検索します...");
        roomId = await this.findRoomByUserId(userId);
        if (roomId) {
            localStorage.setItem("roomId", roomId);
            console.log("✅ 取得したルームIDを保存:", roomId);
        } else {
            console.error("⚠️ ルームIDが取得できませんでした。");
            return ["エラー: ルーム不明"];
        }
    }

    try {
        let snapshot = await firebase.database().ref(`gameRooms/${roomId}/players`).once("value");
        let data = snapshot.val();
        console.log("取得したデータ:", data); 

        if (data) {
            let players = Object.keys(data).map(playerId => ({
                id: playerId,
                name: data[playerId].name || "名前なし",
                team: data[playerId].team || "チーム未定",
                role: data[playerId].role || "役職未定"
            }));

            console.log("プレイヤーリスト:", players);
            return players;
        } else {
            console.error("⚠️ Firebase からプレイヤー情報を取得できませんでした。");
            return ["エラー: データなし"];
        }
    } catch (error) {
        console.error("❌ Firebaseからのデータ取得中にエラーが発生:", error);
        return ["エラー: 例外発生"];
    }
}
finalizeRole() {
    if (this.rouletteEvent) {
        this.rouletteEvent.remove(false);
        this.rouletteEvent = null; // ✅ ルーレットイベントの参照を消す
        console.log("✅ ルーレットイベントを完全に停止しました");
    }

    this.isRouletteRunning = false; // ✅ 二度とルーレットが実行されないようにする

    let finalRole = this.roles[this.currentRoleIndex];
    let decisionSound = this.sound.add("decisionSound", { volume: 1 });
    decisionSound.play();

    if (this.roleDisplay) {
        this.roleDisplay.setTexture(finalRole);
        this.roleDisplay.setAlpha(1);
    }

    // ✅ ルーレット終了後、5秒間待ってから Firebase にデータを送信
    this.time.delayedCall(5000, async () => {
        await this.assignRolesAndSendToFirebase();

        // ✅ **データ送信後にさらに3秒待機して VS 画面を表示**
        this.time.delayedCall(3000, () => {
            this.showVsScreen();
        });
    });
}



   async assignRolesAndSendToFirebase() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できませんでした。データ送信を中止します。");
        return;
    }

    if (!this.players || this.players.length === 0) {
        console.error("❌ プレイヤーデータがありません。データ送信を中止します。");
        return;
    }

    try {
        let updates = {};

        // ✅ 各プレイヤーに役職とチームをセット
        this.players = this.players.map((player, index) => ({
            id: player.id,
            name: player.name,
            team: index < this.players.length / 2 ? "Red" : "Blue",
            role: this.roles[index]
        }));

        this.players.forEach(player => {
            updates[`gameRooms/${roomId}/players/${player.id}/team`] = player.team;
            updates[`gameRooms/${roomId}/players/${player.id}/role`] = player.role;
        });

        await firebase.database().ref().update(updates);
        console.log("✅ 役職 & チームデータを Firebase に送信しました:", updates);

        this.isRouletteRunning = false; // ✅ ルーレット停止

        // 🔥 **VS画面の合図をセット（10秒後に自動削除）**
        let vsRef = firebase.database().ref(`gameRooms/${roomId}/startVsScreen`);
        await vsRef.set(true);
        setTimeout(() => vsRef.remove(), 10000); // 🔥 **10秒後に削除！**

    } catch (error) {
        console.error("❌ Firebase へのデータ送信エラー:", error);
    }
}
   
   showVsScreen() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    let vsSound = this.sound.add("vsSound", { volume: 1 });
    vsSound.play();

    let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage")
        .setScale(0.7)
        .setDepth(2);

    console.log("📌 VS画面のプレイヤーデータ:", this.players);

    if (!this.players || this.players.length === 0) {
        console.error("❌ VS画面に表示するプレイヤーがいません！");
        return;
    }

    let leftTeam = this.players.slice(0, 3);
    let rightTeam = this.players.slice(3, 6);

    leftTeam.forEach((player, index) => {
        this.add.text(this.scale.width * 0.2, this.scale.height * (0.3 + index * 0.1), player.name || "???", {
            fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
        }).setOrigin(0.5).setDepth(3);
    });

    rightTeam.forEach((player, index) => {
        this.add.text(this.scale.width * 0.8, this.scale.height * (0.3 + index * 0.1), player.name || "???", {
            fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
        }).setOrigin(0.5).setDepth(3);
    });

    // ✅ **VS画面が表示されたら `startVsScreen` を削除**
    firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).remove()
        .then(() => console.log("✅ Firebase から `startVsScreen` を削除しました"))
        .catch(error => console.error("❌ `startVsScreen` の削除エラー:", error));

    this.time.delayedCall(8000, () => {
        vsImage.destroy();
        this.scene.start("BattleScene");
    });
}



async function leaveRoom(userId) {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) return;

    let playerRef = firebase.database().ref(`gameRooms/${roomId}/players/${userId}`);
    await playerRef.remove();

    let activePlayersRef = firebase.database().ref(`gameRooms/${roomId}/activePlayers`);
    activePlayersRef.transaction(count => {
        if (count === null) return 0;
        return count - 1;
    }).then(snapshot => {
        if (snapshot.val() === 0) {
            // 🔥 **誰もいなくなったらゲームデータを削除**
            firebase.database().ref(`gameRooms/${roomId}`).remove()
                .then(() => console.log("✅ ルームが削除されました"))
                .catch(error => console.error("❌ ルーム削除エラー:", error));
        }
    });
}

}

async function registerPlayer(roomId, playerName, team, role) {
    let playerRef = firebase.database().ref(`gameRooms/${roomId}/players`).push();
    await playerRef.set({
        joinedAt: Date.now(),
        team: team,
        role: role
    });
}


class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    create() {
        console.log("バトルシーンに移動しました。");
    }
} 
