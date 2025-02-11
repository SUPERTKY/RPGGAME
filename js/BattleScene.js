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

    preload() {
        console.log("🎮 アセットのプリロード開始");
        this.load.audio("battleBgm", "assets/ピエロは暗闇で踊る.mp3");
        this.load.image("battleBackground", "assets/旅立ち.png");
        this.load.image("battleField1", "assets/森.png");
        this.load.image("battleField2", "assets/海.png");
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

        this.statusText = this.add.text(this.scale.width / 2, this.scale.height * 0.1, "バトル開始を待っています...", {
            fontSize: "32px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.battleBgm = this.sound.add("battleBgm", { volume: 0 });

        let roomId = localStorage.getItem("roomId");
        console.log("📝 取得したルームID:", roomId);
        
        if (!roomId) {
            console.error("❌ ルームIDが取得できません。");
            return;
        }

        try {
            this.playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
            console.log("✅ Firebase リファレンス作成成功");
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

    async displayCharacters() {
        console.log("🎮 displayCharacters 開始");
        let userId;
        try {
            userId = await this.getUserId();
            console.log("✅ ユーザーID取得成功:", userId);
        } catch (error) {
            console.error("❌ ユーザーIDの取得に失敗しました:", error);
            return;
        }

        let roomId = localStorage.getItem("roomId");
        console.log("🔍 取得したルームID:", roomId);
        
        if (!roomId) {
            console.warn("⚠️ ルームIDが見つかりません");
            return;
        }

        try {
            const playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
            console.log("📌 Firebaseパス:", `gameRooms/${roomId}/players`);
            
            const playersSnapshot = await playersRef.once("value");
            const playersData = playersSnapshot.val();
            
            console.log("📊 取得したプレイヤーデータ全体:", playersData);
            console.log("🔍 現在のユーザーID:", userId);
            console.log("🔍 自分のプレイヤーデータ:", playersData[userId]);

            if (!playersData) {
                console.error("❌ プレイヤーデータが取得できません。");
                return;
            }

            let myTeam = playersData[userId]?.team;
            console.log("🔍 Firebase から取得したチーム情報:", myTeam);

            if (!myTeam) {
                // 既存プレイヤーのチームを確認
                const existingTeams = Object.values(playersData)
                    .map(player => player.team)
                    .filter(team => team); // undefined/nullを除外

                console.log("👥 既存のチーム:", existingTeams);

                // "Blue" と "Red" の数をカウント
                const teamCounts = existingTeams.reduce((acc, team) => {
                    acc[team] = (acc[team] || 0) + 1;
                    return acc;
                }, { Blue: 0, Red: 0 });

                // 人数が少ない方のチームを選択
                myTeam = teamCounts.Blue <= teamCounts.Red ? "Blue" : "Red";
                
                // 新しいチーム情報を保存
                await playersRef.child(userId).update({ team: myTeam });
                localStorage.setItem("team", myTeam);
                console.log("✅ チーム自動割り当て:", myTeam);
            }

            // この時点でのデータを確認
            console.log("✅ 最終的に使用するチーム情報:", myTeam);
            console.log("📊 プレイヤーリスト作成開始");

            let allies = this.players.filter(p => p.team === myTeam);
            let enemies = this.players.filter(p => p.team !== myTeam);

            console.log("✅ 味方チーム:", allies);
            console.log("✅ 敵チーム:", enemies);

            // キャラクター表示処理
            let allyY = this.scale.height * 0.8;
            let enemyY = this.scale.height * 0.2;
            let centerX = this.scale.width / 2;
            let spacing = 150;

            allies.forEach((player, index) => {
                let x = centerX - (allies.length - 1) * spacing / 2 + index * spacing;
                this.add.image(x, allyY, `${player.role}_ally`).setScale(0.7);
                this.add.text(x, allyY + 50, `${player.name}\nHP: ${player.hp}\nMP: ${player.mp}\nLP: ${player.lp}`, {
                    fontSize: "18px",
                    fill: "#fff",
                    align: "center"
                }).setOrigin(0.5);
                console.log(`✅ 味方キャラクター表示: ${player.name}`);
            });

            enemies.forEach((player, index) => {
                let x = centerX - (enemies.length - 1) * spacing / 2 + index * spacing;
                this.add.image(x, enemyY, `${player.role}_enemy`).setScale(0.7);
                this.add.text(x, enemyY - 50, `${player.name}\nHP: ${player.hp}`, {
                    fontSize: "18px",
                    fill: "#fff",
                    align: "center"
                }).setOrigin(0.5);
                console.log(`✅ 敵キャラクター表示: ${player.name}`);
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
}
