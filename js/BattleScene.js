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
async getCorrectUserId() {
    console.log("👤 正しいユーザーIDを取得開始");

    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
        console.warn("⚠️ ローカルストレージに `userId` が見つかりません！");
        return null;
    }
    console.log("🔍 ローカルストレージから取得したユーザーID:", storedUserId);

    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが見つかりません");
        return null;
    }

    try {
        // 🔍 `gameRooms/{roomId}/players` から全データを取得
        const playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
        const snapshot = await playersRef.once("value");
        const playersData = snapshot.val();

        console.log("📊 取得したプレイヤーデータ:", playersData);

        if (playersData && playersData[storedUserId]) {
            console.log("✅ Firebaseで一致するユーザーIDを発見:", storedUserId);
            return storedUserId;
        } else {
            console.error("❌ Firebaseにこの `userId` は登録されていません:", storedUserId);
            return null;
        }
    } catch (error) {
        console.error("❌ Firebaseデータ取得エラー:", error);
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

    async determineFirstMove(roomId) {
    console.log("🎲 先行チームを決定中...");
    
    const firstMoveRef = firebase.database().ref(`gameRooms/${roomId}/firstMove`);
    const snapshot = await firstMoveRef.once("value");
    let firstMove = snapshot.val();

    if (!firstMove) {
        firstMove = Math.random() < 0.5 ? "Red" : "Blue"; // 50%の確率で決定
        await firstMoveRef.set(firstMove);
        console.log(`🎯 先行チーム決定: ${firstMove}`);
    } else {
        console.log(`🎯 既に先行チームが設定されています: ${firstMove}`);
    }

    return firstMove;
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

startBattle(firstMove) {
    console.log(`⚔️ バトル開始！${firstMove} チームの先攻`);
    this.cameras.main.fadeOut(1000, 0, 0, 0);

    this.tweens.add({
        targets: this.battleBgm,
        volume: 1,
        duration: 2000,
        loop: -1
    });

    this.cameras.main.once("camerafadeoutcomplete", () => {
        let randomChoice = Math.random();
        if (randomChoice < 0.05) {
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
        
        // ここでバトルフェーズ開始処理を追加
        this.startTurnPhase(firstMove);
    });
}

startTurnPhase(firstMove) {
    console.log(`🚀 ターンフェーズ開始！${firstMove} チームが先攻`);

    // ここでターン管理ロジックを実装
    this.currentTurnTeam = firstMove;
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
async displayCharacters() {
    console.log("🎮 displayCharacters 開始");

    let userId;
    try {
        userId = await this.getCorrectUserId();
        console.log("✅ ユーザーID取得成功:", userId);
    } catch (error) {
        console.error("❌ ユーザーIDの取得に失敗しました:", error);
        return;
    }

    if (!userId) {
        console.error("❌ ユーザーIDが取得できませんでした。");
        return;
    }

    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.warn("⚠️ ルームIDが見つかりません");
        return;
    }

    let firstMove;
    try {
        firstMove = await this.determineFirstMove(roomId);
    } catch (error) {
        console.error("❌ 先行チームの決定に失敗:", error);
        return;
    }

    try {
        const playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
        const playersSnapshot = await playersRef.once("value");
        const playersData = playersSnapshot.val();

        if (!playersData) {
            console.error("❌ プレイヤーデータが取得できません。");
            return;
        }

        let myTeam = playersData[userId].team || "未定";
        let allies = Object.values(playersData).filter(p => p.team === myTeam);
        let enemies = Object.values(playersData).filter(p => p.team !== myTeam);

        // 🟥 先行チームがRedなら、「Redチームの左端のキャラ」に「攻撃」を表示
        let firstMoveCharacters = firstMove === "Red" ? 
            Object.values(playersData).filter(p => p.team === "Red") :
            Object.values(playersData).filter(p => p.team === "Blue");

        firstMoveCharacters.sort((a, b) => a.joinTime - b.joinTime); // 先に参加した順に並べる
        let firstAttacker = firstMoveCharacters[0]; // 先行チームの左端キャラ

        // レイアウト計算
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const sideMargin = screenWidth * 0.05;
        const availableWidth = screenWidth - (sideMargin * 2);

        const maxPlayers = Math.max(allies.length, enemies.length);
        const unitWidth = availableWidth / maxPlayers;

        const characterScale = Math.min(0.2, unitWidth / 800);
        const frameScale = characterScale * 0.8;

        const placeCharacterSet = (player, index, isEnemy) => {
            const baseX = sideMargin + (unitWidth * index) + (unitWidth / 2);
            const y = isEnemy ? screenHeight * 0.3 : screenHeight * 0.7;

            const spacing = unitWidth * 0.2;
            const characterX = baseX - spacing;
            const frameX = baseX + spacing;

            const characterSprite = this.add.image(
                characterX, 
                y, 
                `${player.role}_${isEnemy ? 'enemy' : 'ally'}`
            ).setScale(characterScale);

            const frame = this.add.image(frameX, y, "frame_asset").setScale(frameScale);

            const text = isEnemy
                ? `${player.name}\nHP: ${player.hp || this.getInitialHP(player.role)}`
                : `${player.name}\nHP: ${player.hp}\nMP: ${player.mp}`;

            this.add.text(frameX, y - 5, text, {
                fontSize: "14px",
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 3,
                align: "center"
            }).setOrigin(0.5);

            // 🔥 先行チームの最初のキャラに「攻撃」マークを表示
            if (player.id === firstAttacker.id) {
                this.add.text(characterX, y - 50, "攻撃", {
                    fontSize: "20px",
                    fill: "#ff0000",
                    stroke: "#000000",
                    strokeThickness: 5
                }).setOrigin(0.5);
                console.log(`⚔️ 先行キャラ「${player.name}」に「攻撃」テキストを表示`);
            }
        };

        enemies.forEach((player, index) => {
            placeCharacterSet(player, index, true);
        });

        allies.forEach((player, index) => {
            placeCharacterSet(player, index, false);
        });

        console.log("✅ キャラクター表示完了");
    } catch (error) {
        console.error("❌ エラーが発生しました:", error);
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "エラーが発生しました。\n画面を更新してください。",
            {
                fontSize: "24px",
                fill: "#ff0000",
                align: "center"
            }
        ).setOrigin(0.5);
    }
}


    shutdown() {
        console.log("🔄 シーンシャットダウン開始");
        this.cleanupRoom();
    }

    async cleanupRoom() {
        console.log("🧹 ルームクリーンアップ開始");
        const roomId = localStorage.getItem('roomId');
        const userId = await this.getUserId();
        
        if (roomId && userId) {
            await RoomManager.removePlayer(roomId, userId);
            // ローカルストレージのクリーンアップ
            localStorage.removeItem('roomId');
            localStorage.removeItem('team');
            console.log("✅ ルームクリーンアップ完了");
        }
    }
}

// ページ離脱時のクリーンアップ処理
window.addEventListener('beforeunload', async (event) => {
    console.log("👋 ページ離脱処理開始");

    const roomId = localStorage.getItem('roomId');
    const userId = await getCorrectUserId(); // ここで正しいユーザーIDを取得

    if (roomId && userId) {
        await RoomManager.removePlayer(roomId, userId);
        console.log("✅ ページ離脱時のクリーンアップ完了");
    } else {
        console.warn("⚠️ ルームIDまたはユーザーIDが取得できませんでした");
    }
});
