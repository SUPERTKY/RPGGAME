// RoomManager.js
class RoomManager {
    static async checkAndCleanupRoom(roomId) {
        try {
            console.log("🧹 ルームクリーンアップチェック開始:", roomId);
            
            const playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
            const snapshot = await playersRef.once('value');
            const players = snapshot.val();

            if (!players) {
                console.log("👥 プレイヤーが0人になりました。ルームを削除します");
                await firebase.database().ref(`gameRooms/${roomId}`).remove();
                console.log("✅ ルーム削除完了:", roomId);
                return true;
            }

            const activePlayers = Object.values(players).filter(player => 
                player && (player.team === "Blue" || player.team === "Red")
            );

            console.log("👥 アクティブプレイヤー数:", activePlayers.length);

            if (activePlayers.length === 0) {
                await firebase.database().ref(`gameRooms/${roomId}`).remove();
                console.log("✅ アクティブプレイヤー0のためルーム削除完了:", roomId);
                return true;
            }

            return false;
        } catch (error) {
            console.error("❌ ルームクリーンアップエラー:", error);
            return false;
        }
    }

    static async removePlayer(roomId, userId) {
        try {
            console.log("👤 プレイヤー削除開始:", userId);
            await firebase.database().ref(`gameRooms/${roomId}/players/${userId}`).remove();
            console.log("✅ プレイヤー削除完了");
            await this.checkAndCleanupRoom(roomId);
        } catch (error) {
            console.error("❌ プレイヤー削除エラー:", error);
        }
    }
}

// BattleScene.js
class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.isListening = false;
        this.players = [];
        console.log("🎮 BattleScene コンストラクタ実行");
    }

    async getUserId() {
        console.log("👤 getUserId 開始");
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
async function getCorrectUserId() {
    console.log("👤 正しいユーザーIDを取得開始");

    let storedUserId = localStorage.getItem("userId");
    let roomId = localStorage.getItem("roomId");

    if (!storedUserId || !roomId) {
        console.warn("⚠️ `userId` または `roomId` がローカルストレージに存在しません。");
        return null;
    }

    try {
        const playerRef = firebase.database().ref(`gameRooms/${roomId}/players/${storedUserId}`);
        const snapshot = await playerRef.once("value");

        if (snapshot.exists()) {
            console.log("✅ Firebaseで一致するユーザーIDを発見:", storedUserId);
            return storedUserId;
        } else {
            console.warn("⚠️ ローカルストレージの `userId` は Firebase に登録されていません。");
            return null;
        }
    } catch (error) {
        console.error("❌ `userId` の検証中にエラー:", error);
        return null;
    }
}



    preload() {
        console.log("🎮 アセットのプリロード開始");
        this.load.audio("battleBgm", "assets/ピエロは暗闇で踊る.mp3");
        this.load.image("battleBackground", "assets/旅立ち.png");
        this.load.image("battleField1", "assets/森.png");
        this.load.image("battleField2", "assets/海.png");
        this.load.image("frame_asset", "assets/フレーム.png");
        this.load.video("gorillaVideo", "assets/ゴリラ.mp4", "loadeddata", true);

        // 仲間用アイコン
        this.load.image("swordsman_ally", "assets/剣士.png");
        this.load.image("mage_ally", "assets/魔法使い.png");
        this.load.image("priest_ally", "assets/僧侶.png");

        // 敵用アイコン
        this.load.image("swordsman_enemy", "assets/剣士全身.png");
        this.load.image("mage_enemy", "assets/魔法使い全身.png");
        this.load.image("priest_enemy", "assets/僧侶全身.png");
        console.log("✅ アセットのプリロード完了");
    }

async create() {
    console.log("🎮 create メソッド開始");
    this.cameras.main.setBackgroundColor("#000000");

    // ✅ `this.statusText` を確実に定義
    this.statusText = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.1,
        "バトル開始を待っています...",
        {
            fontSize: "32px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }
    ).setOrigin(0.5);

    this.battleBgm = this.sound.add("battleBgm", { volume: 0 });

    let roomId = localStorage.getItem("roomId");
    console.log("📝 取得したルームID:", roomId);

    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    try {
        // ✅ ユーザーIDの取得方法を修正
        this.userId = await this.getCorrectUserId();
        if (!this.userId) {
            console.error("❌ ユーザーIDが取得できませんでした。");
            return;
        }
        console.log("✅ ユーザーID取得成功:", this.userId);
    } catch (error) {
        console.error("❌ ユーザーIDの取得に失敗しました:", error);
        return;
    }

    try {
        // ✅ Firebase リファレンスの作成
        this.playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
        console.log("✅ Firebase リファレンス作成成功");

        // ✅ プレイヤーの監視開始
        this.listenForPlayers(roomId);
    } catch (error) {
        console.error("❌ Firebase の監視エラー:", error);
    }
}


    listenForPlayers(roomId) {
        console.log("👥 プレイヤー監視開始", roomId);
        if (this.isListening) {
            console.log("ℹ️ 既に監視中です");
            return;
        }
        this.isListening = true;

        this.playersRef.on("value", (snapshot) => {
            let playersData = snapshot.val();
            console.log("📊 取得したプレイヤーデータ:", playersData);
            
            if (!playersData) {
                console.warn("⚠️ プレイヤーデータが空です");
                return;
            }

            this.players = Object.keys(playersData).map(playerId => {
                console.log(`👤 プレイヤー処理: ${playerId}`);
                return {
                    id: playerId,
                    name: playersData[playerId].name || "???",
                    role: playersData[playerId].role || "不明",
                    team: playersData[playerId].team || "未定",
                    hp: this.getInitialHP(playersData[playerId].role),
                    mp: this.getInitialMP(playersData[playerId].role),
                    lp: 3
                };
            });

            let playerCount = this.players.length;
            console.log(`👥 現在のプレイヤー数: ${playerCount}`);
            this.statusText.setText(`戦闘準備完了: ${playerCount} / 6`);

            if (playerCount === 6) {
                console.log("🟢 全プレイヤーが揃いました。バトル開始！");
                this.playersRef.off("value");
                this.startCountdown();
            }
        });
    }

    startCountdown() {
        console.log("⏱️ カウントダウン開始");
        this.statusText.setText("");
        const countdownNumbers = ["3", "2", "1", "スタート！"];
        let index = 0;

        const showNextNumber = () => {
            if (index >= countdownNumbers.length) {
                console.log("✅ カウントダウン完了、バトル開始");
                this.startBattle();
                return;
            }

            let countText = this.add.text(this.scale.width / 2, this.scale.height / 2, countdownNumbers[index], {
                fontSize: "80px",
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8
            }).setOrigin(0.5);

            countText.setAlpha(0);
            this.tweens.add({
                targets: countText,
                alpha: 1,
                scale: 1.5,
                duration: 500,
                ease: "Cubic.easeOut",
                yoyo: true,
                onComplete: () => {
                    countText.destroy();
                    index++;
                    this.time.delayedCall(500, showNextNumber);
                }
            });
        };
        showNextNumber();
    }

    startBattle() {
        console.log("⚔️ バトル開始処理実行");
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.tweens.add({
            targets: this.battleBgm,
            volume: 1,
            duration: 2000
        });

        this.cameras.main.once("camerafadeoutcomplete", () => {
            let randomChoice = Math.random();
            if (randomChoice < 0.55) {
                this.bg = this.add.video(this.scale.width / 2, this.scale.height / 2, "gorillaVideo");
                this.bg.setOrigin(0.5, 0.5);
                this.bg.play(true);

                let scaleX = this.scale.width / this.bg.width;
                let scaleY = this.scale.height / this.bg.height;
                let scale = Math.max(scaleX, scaleY);
                this.bg.setScale(scale);
            } else {
                let selectedField = randomChoice < 0.5 ? "battleField1" : "battleField2";
                this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, selectedField);
                this.bg.setScale(Math.max(this.scale.width / this.bg.width, this.scale.height / this.bg.height));
            }

            this.cameras.main.fadeIn(1000, 0, 0, 0);
            this.battleBgm.play();
            this.displayCharacters();
        });
    }

    getInitialHP(role) {
        const hp = {
            swordsman: 200,
            mage: 160,
            priest: 180
        }[role] || 100;
        console.log(`💪 ${role}の初期HP設定: ${hp}`);
        return hp;
    }

    getInitialMP(role) {
        const mp = {
            swordsman: 8,
            mage: 12,
            priest: 14
        }[role] || 10;
        console.log(`✨ ${role}の初期MP設定: ${mp}`);
        return mp;
    }


    shutdown() {
        console.log("🔄 シーンシャットダウン開始");
        this.cleanupRoom();
    }

    class RoomManager {
    static async checkAndCleanupRoom(roomId) {
        try {
            console.log("🧹 ルームクリーンアップチェック開始:", roomId);

            const playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
            const snapshot = await playersRef.once('value');
            const players = snapshot.val();

            if (!players) {
                console.log("👥 プレイヤーが0人になりました。ルームを削除します");
                await firebase.database().ref(`gameRooms/${roomId}`).remove();
                console.log("✅ ルーム削除完了:", roomId);
                return true;
            }

            const activePlayers = Object.values(players).filter(player =>
                player && (player.team === "Blue" || player.team === "Red")
            );

            console.log("👥 アクティブプレイヤー数:", activePlayers.length);

            if (activePlayers.length === 0) {
                await firebase.database().ref(`gameRooms/${roomId}`).remove();
                console.log("✅ アクティブプレイヤー0のためルーム削除完了:", roomId);
                return true;
            }

            return false;
        } catch (error) {
            console.error("❌ ルームクリーンアップエラー:", error);
            return false;
        }
    }

    static async removePlayer(roomId, userId) {
        try {
            console.log("👤 プレイヤー削除開始:", userId);
            await firebase.database().ref(`gameRooms/${roomId}/players/${userId}`).remove();
            console.log("✅ プレイヤー削除完了");
            await this.checkAndCleanupRoom(roomId);
        } catch (error) {
            console.error("❌ プレイヤー削除エラー:", error);
        }
    }
}

}

let userIdForUnload = null;

// 事前にユーザーIDを取得
(async () => {
    userIdForUnload = await getCorrectUserId();
})();

window.addEventListener("beforeunload", (event) => {
    console.log("👋 ページ離脱処理開始");

    const roomId = localStorage.getItem("roomId");
    if (roomId && userIdForUnload) {
        const url = `https://your-firebase-function-url/removePlayer?roomId=${roomId}&userId=${userIdForUnload}`;
        navigator.sendBeacon(url);
        console.log("✅ ページ離脱時のクリーンアップ完了");
    } else {
        console.warn("⚠️ ルームIDまたはユーザーIDが取得できませんでした");
    }
});
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.removePlayer = functions.https.onRequest(async (req, res) => {
    const roomId = req.query.roomId;
    const userId = req.query.userId;

    if (!roomId || !userId) {
        return res.status(400).send("Missing roomId or userId");
    }

    try {
        await admin.database().ref(`gameRooms/${roomId}/players/${userId}`).remove();
        console.log("✅ プレイヤー削除成功:", userId);
        res.status(200).send("Player removed");
    } catch (error) {
        console.error("❌ プレイヤー削除エラー:", error);
        res.status(500).send("Error removing player");
    }
});

