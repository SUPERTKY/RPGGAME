    class GamePlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "GamePlayScene" });

    // ✅ シーンが初期化されたかどうかを管理（再実行を防ぐ）
    this.isSceneInitialized = false;

    // ✅ ルーレットの無限ループを防ぐ
    this.isRouletteRunning = false;

    // ✅ VS画面の無限実行を防ぐ
    this.isVsScreenShown = false;

    // ✅ ルーレットイベント管理
    this.rouletteEvent = null;

    // ✅ VS画面リスナーの二重登録防止
    this.vsScreenListener = null;
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
       if (this.isSceneInitialized) {
        console.warn("⚠️ GamePlayScene はすでに初期化済みです。再実行を防ぎます。");
        return;
    }
    this.isSceneInitialized = true;
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

async cleanupRouletteData() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        return;
    }

    try {
        let updates = {
            [`gameRooms/${roomId}/roles`]: null,
            [`gameRooms/${roomId}/startVsScreen`]: null,
            [`gameRooms/${roomId}/rouletteState`]: null,
            [`gameRooms/${roomId}/rouletteFinished`]: null
        };

        await firebase.database().ref().update(updates);
        console.log("✅ ルーレット関連データを Firebase から削除しました。");

        let roomRef = firebase.database().ref(`gameRooms/${roomId}`);
        let snapshot = await roomRef.once("value");

        if (!snapshot.exists()) {
            console.log("🛑 ルームのデータが空のため削除します...");
            await roomRef.remove()
                .then(() => console.log("✅ ルームデータを完全削除しました"))
                .catch(error => console.error("❌ ルーム削除エラー:", error));
        }

    } catch (error) {
        console.error("❌ ルーレット関連データの削除エラー:", error);
    }
}



async cleanupPlayerRoles() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。削除処理を中止します。");
        return;
    }

    try {
        let snapshot = await firebase.database().ref(`gameRooms/${roomId}/players`).once("value");
        let players = snapshot.val();

        if (!players) {
            console.warn("⚠️ プレイヤーデータが存在しません。");
            return;
        }

        let updates = {};
        Object.keys(players).forEach(playerId => {
            updates[`gameRooms/${roomId}/players/${playerId}/role`] = null;
            updates[`gameRooms/${roomId}/players/${playerId}/team`] = null;
        });

        await firebase.database().ref().update(updates);
        console.log("✅ プレイヤーの役職データを削除しました。");

    } catch (error) {
        console.error("❌ プレイヤーの役職データ削除エラー:", error);
    }
}

async leaveRoom() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId || !this.playerId) {
        console.error("❌ ルームID または ユーザーID が見つかりません。");
        return;
    }

    let playerRef = firebase.database().ref(`gameRooms/${roomId}/players/${this.playerId}`);

    try {
        await playerRef.remove();
        console.log(`✅ プレイヤー ${this.playerId} をルーム ${roomId} から削除しました`);

        let roomRef = firebase.database().ref(`gameRooms/${roomId}`);
        let activePlayersRef = firebase.database().ref(`gameRooms/${roomId}/activePlayers`);
        
        // 🔥 `activePlayers` のカウントを減らし、0なら `gameRooms` を削除
        activePlayersRef.transaction(async count => {
            let newCount = (count || 1) - 1;
            console.log(`👥 残りのアクティブプレイヤー数: ${newCount}`);

            if (newCount <= 0) {
                console.log("🛑 全員が退出しました。ルームを削除します...");
                await roomRef.remove()
                    .then(() => console.log("✅ ルームが Firebase から削除されました"))
                    .catch(error => console.error("❌ ルーム削除エラー:", error));
            }

            return newCount;
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
    this.isRouletteRunning = true; // ✅ ルーレット開始をロック

    this.currentRoleIndex = 0;
    let shuffledRoles = [...this.roles]; // 🔥 役職リストをコピー
    Phaser.Utils.Array.Shuffle(shuffledRoles); // 🔥 シャッフルしてランダム性を保つ

    if (this.rouletteEvent) {
        this.rouletteEvent.remove(false);
        this.rouletteEvent = null;
    }

    if (this.roleDisplay) {
        this.roleDisplay.destroy();
    }
    this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest")
        .setScale(0.6)
        .setDepth(1)
        .setAlpha(0);

    this.time.delayedCall(5000, () => {
        if (!this.roleDisplay) {
            return;
        }

        let totalSpins = this.roles.length * 2; // 🔥 役職を2周分回す
        let spinDuration = 1000;

        this.roleDisplay.setAlpha(1);

        this.rouletteEvent = this.time.addEvent({
            delay: spinDuration,
            repeat: totalSpins - 1,
            callback: () => {
                if (!this.roleDisplay) {
                    return;
                }

                // 🔥 本来の役職リスト (`this.roles`) から正しく選択する
                this.currentRoleIndex = (this.currentRoleIndex + 1) % shuffledRoles.length;
                this.roleDisplay.setTexture(shuffledRoles[this.currentRoleIndex]);
            },
            callbackScope: this
        });

        this.time.delayedCall(spinDuration * totalSpins, () => {
            try {
                this.finalizeRole();
            } catch (error) {
                console.error("❌ ルーレット停止処理中にエラー:", error);
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

    if (this.vsScreenListener) {
        console.warn("⚠️ 既に VS リスナーが登録済みです");
        return;
    }

    console.log("🟢 VS画面リスナーを登録");

    this.vsScreenListener = firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).on("value", snapshot => {
        let shouldStart = snapshot.val();
        console.log("🟢 Firebase の `startVsScreen` 変更検知:", shouldStart);

        if (shouldStart) {
            console.log("🟢 VS画面を開始します。");
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
async finalizeRole() {
    if (this.rouletteEvent) {
        this.rouletteEvent.remove(false);
        this.rouletteEvent.destroy();
        this.rouletteEvent = null;
        console.log("✅ ルーレットイベントを完全に停止しました");
    }

    let finalRole = this.roles[this.currentRoleIndex];
    let decisionSound = this.sound.add("decisionSound", { volume: 1 });
    decisionSound.play();

    if (this.roleDisplay) {
        this.roleDisplay.setTexture(finalRole);
        this.roleDisplay.setAlpha(1);
    }

    this.time.delayedCall(5000, async () => {
        console.log("🟢 役職を Firebase に送信");
        await this.assignRolesAndSendToFirebase();

        let roomId = localStorage.getItem("roomId");
        if (!roomId) {
            return;
        }

        console.log("🟢 ルーレットデータを削除");
        await this.cleanupRouletteData();

        this.isRouletteRunning = false;
        console.log("🛑 ルーレットが完全に終了しました。");

        // 🔥 1人ずつフェードアウトさせる
        this.fadeOutCharacters(() => {
            console.log("🟢 すべてのキャラが消えたので VS 画面へ");
            let vsRef = firebase.database().ref(`gameRooms/${roomId}/startVsScreen`);
            vsRef.set(true);
            console.log("🟢 Firebase に `startVsScreen` を設定");

            this.setupVsScreenListener();
        });
    });
}

/**
 * 🔥 キャラを 1 人ずつフェードアウトする関数
 */
fadeOutCharacters(callback) {
    let delay = 500; // 0.5 秒ごとに 1 人ずつ消える
    let fadeDuration = 1000; // 1 秒かけてフェードアウト
    let characters = [this.roleDisplay]; // 表示されているキャラを配列に追加

    characters.forEach((character, index) => {
        this.time.delayedCall(index * delay, () => {
            this.tweens.add({
                targets: character,
                alpha: 0,
                duration: fadeDuration,
                onComplete: () => {
                    character.destroy();
                }
            });
        });
    });

    // 最後のキャラが消えたらコールバックを呼ぶ
    this.time.delayedCall(characters.length * delay + fadeDuration, callback);
}


async assignRolesAndSendToFirebase() {
    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できませんでした。データ送信を中止します。");
        return;
    }

    if (!this.players || this.players.length !== 6) {
        console.error("❌ プレイヤー数が6人でないため、データ送信を中止します。");
        return;
    }

    try {
        let updates = {};

        // ✅ 役職リスト（各役職2つずつ）
        let roles = ["priest", "priest", "mage", "mage", "swordsman", "swordsman"];

        // ✅ 役職をシャッフル（偏りを防ぐ）
        Phaser.Utils.Array.Shuffle(roles);

        // ✅ プレイヤーに役職を割り当て
        this.players.forEach((player, index) => {
            player.role = roles[index]; // シャッフル済みのリストから役職を取得
        });

        // ✅ Firebase にデータ送信
        this.players.forEach(player => {
            updates[`gameRooms/${roomId}/players/${player.id}/role`] = player.role;
        });

        await firebase.database().ref().update(updates);
        console.log("✅ 役職を均等に割り当て、Firebase に保存しました:", updates);

    } catch (error) {
        console.error("❌ Firebase へのデータ送信エラー:", error);
    }
}

showVsScreen() {
    console.log("🟢 VS画面を表示しようとしています。");

    if (this.isVsScreenShown) {
        console.warn("⚠️ VS画面はすでに表示されています。二重実行を防ぎます。");
        return;
    }

    this.isVsScreenShown = true;
    console.log("🟢 VS画面を表示しました。");

    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    // 🔥 ルーレットの BGM をフェードアウト
    if (this.bgm) {
        this.tweens.add({
            targets: this.bgm,
            volume: 0,
            duration: 2000,
            onComplete: () => {
                this.bgm.stop();
            }
        });
    }

    // 🔥 VS の BGM をフェードイン
    let vsSound = this.sound.add("vsSound", { volume: 0 });
    vsSound.play();
    this.tweens.add({
        targets: vsSound,
        volume: 1,
        duration: 2000
    });

    let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage")
        .setScale(0.7)
        .setDepth(2);

    // 🔥 プレイヤーの名前を表示
    if (!this.players || this.players.length === 0) {
        console.error("❌ VS画面に表示するプレイヤーがいません！");
        return;
    }

    let leftTeam = this.players.slice(0, Math.ceil(this.players.length / 2));
    let rightTeam = this.players.slice(Math.ceil(this.players.length / 2));

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

    // ✅ VS画面の表示時間を8秒に設定
    this.time.delayedCall(8000, () => {
        vsImage.destroy();
        this.scene.start("BattleScene");
    });

    // ✅ `startVsScreen` を削除
    setTimeout(() => {
        firebase.database().ref(`gameRooms/${roomId}/startVsScreen`).remove()
            .then(() => console.log("✅ Firebase から `startVsScreen` を削除しました"))
            .catch(error => console.error("❌ `startVsScreen` の削除エラー:", error));
    }, 8000);
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


const battleScene = new Phaser.Scene("BattleScene");

battleScene.create = function () {
    console.log("⚔ バトルシーン開始！");

 
};





