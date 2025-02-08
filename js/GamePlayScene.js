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

    // 背景画像の設定
    this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
    let scaleX = this.scale.width / this.bg.width;
    let scaleY = this.scale.height / this.bg.height;
    let scale = Math.max(scaleX, scaleY);
    this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);

    // 音楽の再生
    this.sound.stopAll();
    this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
    this.bgm.play();

    this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
    Phaser.Utils.Array.Shuffle(this.roles);

    // 🛠️ ユーザーIDの取得（認証完了を待機）
    let userId;
    try {
        userId = await this.getUserId();
        console.log("✅ ユーザーID取得成功:", userId);
    } catch (error) {
        console.error("❌ ユーザーIDの取得に失敗しました:", error);
        return;
    }

    // 🛠️ ルームIDの取得
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

    // 🛠️ プレイヤー情報の取得
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

    // 🛠️ ルーレット開始
    this.startRoulette();
}



    startRoulette() {
        this.currentRoleIndex = 0;
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest").setScale(0.6).setDepth(1).setAlpha(0);

        this.time.delayedCall(4000, () => {
            let totalSpins = this.roles.length * 3;
            let spinDuration = 500;

            this.roleDisplay.setAlpha(1);
            this.time.addEvent({
                delay: spinDuration,
                repeat: totalSpins - 1,
                callback: () => {
                    this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                    this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
                },
                callbackScope: this
            });

            this.time.delayedCall(spinDuration * totalSpins, () => {
                this.finalizeRole();
            });

            this.time.delayedCall(spinDuration * totalSpins + 5000, () => {
                this.showVsScreen();
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

    async getPlayersFromFirebase() {
    let userId = firebase.auth().currentUser?.uid;
    if (!userId) {
        console.error("⚠️ ユーザーIDが取得できませんでした。");
        return ["エラー: ユーザー不明"];
    }

    // roomId を明示的に取得
    let roomId = localStorage.getItem("roomId");
    console.log("現在のルームID:", roomId);  // デバッグ用出力

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
        console.log("取得したデータ:", data);  // デバッグ用出力

        if (data) {
            let players = Object.keys(data).map(playerId => ({
                id: playerId,  // IDも含める
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
    let finalRole = this.roles[this.currentRoleIndex];
    let decisionSound = this.sound.add("decisionSound", { volume: 1 });
    decisionSound.play();

    this.roleDisplay.setTexture(finalRole);

    // ルーレットの停止処理
    if (this.rouletteEvent) {
        this.rouletteEvent.remove(false);
        console.log("✅ ルーレットイベントを停止しました。");
    }

    // Firebase に役職を保存
    let userId = firebase.auth().currentUser?.uid;
    let roomId = localStorage.getItem("roomId");

    if (userId && roomId) {
        firebase.database().ref(`gameRooms/${roomId}/players/${userId}`).update({
            role: finalRole
        }).then(() => {
            console.log(`✅ ユーザー ${userId} の役職を ${finalRole} に更新しました。`);
        }).catch(error => {
            console.error("❌ 役職の更新に失敗:", error);
        });
    }
}

    
    showVsScreen() {
    let vsSound = this.sound.add("vsSound", { volume: 1 });
    vsSound.play();

    let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage").setScale(0.7).setDepth(2);

    let leftTeam = this.players.slice(0, 3);
    let rightTeam = this.players.slice(3, 6);

    console.log("左チーム:", leftTeam);
    console.log("右チーム:", rightTeam);

    // チーム情報を Firebase に保存
    let roomId = localStorage.getItem("roomId");
    if (roomId) {
        leftTeam.forEach(player => {
            firebase.database().ref(`gameRooms/${roomId}/players/${player.id}`).update({
                team: "左チーム"
            }).then(() => {
                console.log(`✅ ${player.name} を 左チーム に設定しました。`);
            }).catch(error => {
                console.error("❌ チーム設定エラー:", error);
            });
        });

        rightTeam.forEach(player => {
            firebase.database().ref(`gameRooms/${roomId}/players/${player.id}`).update({
                team: "右チーム"
            }).then(() => {
                console.log(`✅ ${player.name} を 右チーム に設定しました。`);
            }).catch(error => {
                console.error("❌ チーム設定エラー:", error);
            });
        });
    }

    // 名前の表示を一番上にし、左右の幅を広げる
    leftTeam.forEach((player, index) => {
        this.add.text(this.scale.width * 0.2, this.scale.height * (0.3 + index * 0.1), player.name, {
            fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
        }).setOrigin(0.5).setDepth(3); // 名前が一番前面になるように
    });

    rightTeam.forEach((player, index) => {
        this.add.text(this.scale.width * 0.8, this.scale.height * (0.3 + index * 0.1), player.name, {
            fontSize: "32px", fill: "#ffffff", stroke: "#000000", strokeThickness: 5
        }).setOrigin(0.5).setDepth(3);
    });

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
