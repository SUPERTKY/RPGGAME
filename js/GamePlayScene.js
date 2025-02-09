    class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
    }
        async markReadyAndCheckAllReady() {
    let roomId = localStorage.getItem("roomId");
    let userId = await this.getUserId();
    if (!roomId || !userId) {
        console.error("❌ ルームID または ユーザーIDが取得できません。");
        return;
    }

    console.log(`✅ プレイヤー ${userId} が準備完了`);
    let readyStatusRef = firebase.database().ref(`gameRooms/${roomId}/readyStatus/${userId}`);
    await readyStatusRef.set(true);

    // **全員の準備完了をチェック**
    let readyRef = firebase.database().ref(`gameRooms/${roomId}/readyStatus`);
    let playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);

    readyRef.on("value", async (snapshot) => {
        let readyData = snapshot.val();
        if (!readyData) {
            console.warn("⚠️ まだ準備が完了していません。");
            return;
        }

        let readyCount = Object.keys(readyData).length;
        let totalPlayersSnapshot = await playersRef.once("value");
        let totalPlayers = totalPlayersSnapshot.numChildren();

        console.log(`🔍 準備完了プレイヤー: ${readyCount} / ${totalPlayers}`);

        if (readyCount === totalPlayers) {
            console.log("✅ **全員が準備完了！ルーレット開始の合図を送信**");
            await firebase.database().ref(`gameRooms/${roomId}/startRoulette`).set(true);
        }
    });
}
async waitForRouletteStart() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    let startRouletteRef = firebase.database().ref(`gameRooms/${roomId}/startRoulette`);

    startRouletteRef.on("value", (snapshot) => {
        let shouldStart = snapshot.val();
        if (shouldStart) {
            console.log("🔥 **ルーレット開始の合図を受信！**");
            this.startRoulette();
        }
    });
}

         async setupRouletteCompleteListener() {
        let roomId = localStorage.getItem("roomId");
        if (!roomId) {
            console.error("❌ ルームIDが取得できません。");
            return;
        }

        let rouletteStatusRef = firebase.database().ref(`gameRooms/${roomId}/rouletteStatus`);
        let playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);

        // ✅ **ルーレット完了チェックを開始**
        rouletteStatusRef.on("value", async (snapshot) => {
            let statusData = snapshot.val();
            if (!statusData) {
                console.warn("⚠️ ルーレット完了状況がまだ登録されていません。");
                return;
            }

            let completedPlayers = Object.keys(statusData).length;
            let totalPlayersSnapshot = await playersRef.once("value");
            let totalPlayers = totalPlayersSnapshot.numChildren();

            console.log(`🔍 ルーレット完了状況: ${completedPlayers} / ${totalPlayers}`);

            // 🔥 **全員のルーレットが終わったらVS画面へ遷移**
            if (completedPlayers === totalPlayers) {
                console.log("✅ 全員のルーレットが完了！VS画面へ移行準備...");
                await firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).set(true);
                setTimeout(() => firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).remove(), 10000);
            }
        });
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
        console.warn("⚠️ ルームIDが見つかりません。");
        return;
    }

    try {
        this.players = await this.getPlayersFromFirebase(roomId);
        console.log("✅ 取得したプレイヤー:", this.players);
        if (!this.players || this.players.length === 0) {
            console.error("⚠️ プレイヤーが取得できませんでした。");
            return;
        }
    } catch (error) {
        console.error("❌ Firebase からプレイヤー情報を取得中にエラー:", error);
        return;
    }

    // ✅ **準備完了を送信**
    await this.markReadyAndCheckAllReady();

    // ✅ **ルーレット開始を待つ**
    this.waitForRouletteStart();

    // ✅ **ルーレット終了の監視**
    this.setupRouletteCompleteListener();
}

async leaveRoom(userId) {
    let roomId = localStorage.getItem("roomId");
    if (!roomId || !userId) {
        console.error("❌ ルームID または ユーザーID が見つかりません。");
        return;
    }

    let playerRef = firebase.database().ref(`gameRooms/${roomId}/players/${userId}`);

    try {
        // ✅ プレイヤー情報を削除
        await playerRef.remove();
        console.log(`✅ プレイヤー ${userId} をルーム ${roomId} から削除しました`);

        let activePlayersRef = firebase.database().ref(`gameRooms/${roomId}/activePlayers`);
        
        // ✅ `activePlayers` のカウントを減らす
        activePlayersRef.transaction(count => {
            if (count === null) return 0; // カウントがない場合は 0 に
            return Math.max(count - 1, 0); // 0 以下にならないように制限
        }).then(snapshot => {
            let remainingPlayers = snapshot.val();
            console.log(`👥 残りのアクティブプレイヤー数: ${remainingPlayers}`);

            // 🔥 **全員が抜けた場合、ゲームルームを削除**
            if (remainingPlayers === 0) {
                firebase.database().ref(`gameRooms/${roomId}`).remove()
                    .then(() => console.log("✅ ルームが削除されました"))
                    .catch(error => console.error("❌ ルーム削除エラー:", error));
            }
        });

    } catch (error) {
        console.error("❌ プレイヤー削除エラー:", error);
    }
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

    // ✅ ここで roleDisplay を確実に初期化
    if (this.roleDisplay) {
        this.roleDisplay.destroy();
    }
    this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest")
        .setScale(0.6)
        .setDepth(1)
        .setAlpha(0);

    this.time.delayedCall(5000, () => {
        if (!this.roleDisplay) {
            console.warn("⚠️ ルーレット開始時に roleDisplay が null になっています。処理を中止します。");
            return;
        }

        let totalSpins = this.roles.length * 2;
        let spinDuration = 1000;

        this.roleDisplay.setAlpha(1);  // ここで null チェックが適用される

        this.rouletteEvent = this.time.addEvent({
            delay: spinDuration,
            repeat: totalSpins - 1,
            callback: () => {
                if (!this.roleDisplay) {
                    console.warn("⚠️ ルーレット中に roleDisplay が null になりました。");
                    return;
                }
                this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
            },
            callbackScope: this
        });

        this.time.delayedCall(spinDuration * totalSpins, () => {
            try {
                this.finalizeRole();
            } catch (error) {
                console.error("❌ ルーレット停止処理中にエラー:", error);
            } finally {
                this.isRouletteRunning = false;
            }
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

            // ✅ **VS画面への遷移がすでに実行されていないかチェック**
            if (!this.isVsScreenShown) {
                this.isVsScreenShown = true; // ✅ フラグを設定
                this.showVsScreen();
            } else {
                console.warn("⚠️ VS画面はすでに表示されています。二重実行を防ぎます。");
            }
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
async finalizeRole() {
    if (this.rouletteEvent) {
        this.rouletteEvent.remove(false);
        this.rouletteEvent.destroy();
        this.rouletteEvent = null;
    }

    this.isRouletteRunning = false;

    let finalRole = this.roles[this.currentRoleIndex];
    if (this.roleDisplay) {
        this.roleDisplay.setTexture(finalRole);
        this.roleDisplay.setAlpha(1);
    }

    this.time.delayedCall(5000, async () => {
        await this.assignRolesAndSendToFirebase();

        let roomId = localStorage.getItem("roomId");
        let userId = await this.getUserId();
        if (!roomId || !userId) return;

        console.log(`🔥 ルーレット完了を通知: ${userId}`);
        await firebase.database().ref(`gameRooms/${roomId}/rouletteStatus/${userId}`).set(true);
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

    } catch (error) {
        console.error("❌ Firebase へのデータ送信エラー:", error);
    }
}

   showVsScreen() {
    this.isRouletteRunning = false; // ✅ VS画面に移行する前にフラグをリセット
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    // ✅ **すべての音を停止**
    this.sound.stopAll();

    let vsSound = this.sound.add("vsSound", { volume: 1 });

    // ✅ **既に `vsSound` が鳴っていないか確認**
    if (!vsSound.isPlaying) {
        vsSound.play();
    } else {
        console.warn("⚠️ VS音がすでに鳴っています。二重再生を防ぎます。");
    }

    let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage")
        .setScale(0.7)
        .setDepth(2);

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

    firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).remove()
        .then(() => console.log("✅ Firebase から `startVsScreen` を削除しました"))
        .catch(error => console.error("❌ `startVsScreen` の削除エラー:", error));

    if (this.roleDisplay) {
        console.log("🛑 VS画面移行前に roleDisplay を完全に削除");
        this.roleDisplay.destroy();
        this.roleDisplay = null;
    }

    this.time.delayedCall(8000, () => {
        vsImage.destroy();
        this.scene.start("BattleScene");
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
