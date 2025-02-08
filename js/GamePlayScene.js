class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
        this.loadingText = null;
        this.errorText = null;
        this.reconnectAttempts = 0;
        this.MAX_RECONNECT_ATTEMPTS = 3;
    }

    // ローディング表示の管理
    showLoading(message) {
        if (this.loadingText) {
            this.loadingText.destroy();
        }
        this.loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 
            message || "読み込み中...", 
            { fontSize: '24px', fill: '#fff' })
            .setOrigin(0.5)
            .setDepth(100);
    }

    hideLoading() {
        if (this.loadingText) {
            this.loadingText.destroy();
            this.loadingText = null;
        }
    }

    // エラーメッセージの表示
    showError(message, duration = 3000) {
        if (this.errorText) {
            this.errorText.destroy();
        }
        this.errorText = this.add.text(this.scale.width / 2, this.scale.height * 0.2, 
            message, 
            { fontSize: '24px', fill: '#ff0000', backgroundColor: '#ffffff', padding: 10 })
            .setOrigin(0.5)
            .setDepth(100);

        this.time.delayedCall(duration, () => {
            if (this.errorText) {
                this.errorText.destroy();
                this.errorText = null;
            }
        });
    }

    async getUserId() {
        return new Promise((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                unsubscribe(); // リスナーの解除
                if (user) {
                    console.log("✅ Firebase 認証成功 ユーザーID:", user.uid);
                    this.setupDisconnectHandlers(user.uid);
                    resolve(user.uid);
                } else {
                    console.warn("⚠️ ユーザーが未ログインです。匿名ログインを試行...");
                    firebase.auth().signInAnonymously()
                        .then(result => {
                            console.log("✅ 匿名ログイン成功 ユーザーID:", result.user.uid);
                            this.setupDisconnectHandlers(result.user.uid);
                            resolve(result.user.uid);
                        })
                        .catch(error => {
                            console.error("❌ ログインエラー:", error);
                            this.showError("ログインに失敗しました。再試行します...");
                            reject(error);
                        });
                }
            });
        });
    }

    // 切断時の処理をセットアップ
    setupDisconnectHandlers(userId) {
        const roomId = localStorage.getItem("roomId");
        if (!roomId || !userId) return;

        const playerRef = firebase.database().ref(`gameRooms/${roomId}/players/${userId}`);
        const connectRef = firebase.database().ref(".info/connected");

        connectRef.on("value", (snap) => {
            if (snap.val() === true) {
                // オンラインになった時の処理
                console.log("🌐 オンラインに復帰しました");
                this.reconnectAttempts = 0;
                this.hideLoading();

                // 切断時の処理を設定
                playerRef.onDisconnect().remove();
            } else {
                // オフラインになった時の処理
                console.log("⚠️ オフラインになりました");
                this.showLoading("接続が切れました。再接続を試みています...");
                this.attemptReconnect();
            }
        });
    }

    // 再接続の試行
    async attemptReconnect() {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.showError("接続に失敗しました。ページを更新してください。");
            return;
        }

        this.reconnectAttempts++;
        try {
            await firebase.database().goOnline();
            console.log("✅ 再接続成功");
            this.hideLoading();
        } catch (error) {
            console.error("❌ 再接続失敗:", error);
            this.time.delayedCall(2000, () => this.attemptReconnect());
        }
    }

    preload() {
        this.showLoading("アセットを読み込み中...");

        // アセットのロード
        this.load.image("background3", "assets/background3.png");
        this.load.image("vsImage", "assets/VS.png");
        this.load.image("swordsman", "assets/剣士.png");
        this.load.image("mage", "assets/魔法使い.png");
        this.load.image("priest", "assets/僧侶.png");
        this.load.audio("bgmRoleReveal", "assets/役職発表音楽.mp3");
        this.load.audio("decisionSound", "assets/決定音.mp3");
        this.load.audio("vsSound", "assets/VS効果音.mp3");

        // ロード完了時の処理
        this.load.on('complete', () => {
            this.hideLoading();
        });

        // ロードエラー時の処理
        this.load.on('loaderror', (file) => {
            console.error("❌ アセットのロードに失敗:", file.key);
            this.showError(`${file.key}の読み込みに失敗しました`);
        });
    }

    async create() {
        try {
            this.showLoading("ゲームを準備中...");
            this.setupScene();
            await this.initializeGame();
            this.hideLoading();
        } catch (error) {
            console.error("❌ ゲーム初期化エラー:", error);
            this.showError("ゲームの開始に失敗しました。再試行します...");
            // 3秒後に再試行
            this.time.delayedCall(3000, () => this.create());
        }
    }

    setupScene() {
        // 背景の設定
        this.cameras.main.setBackgroundColor("#000000");
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3");
        let scaleX = this.scale.width / this.bg.width;
        let scaleY = this.scale.height / this.bg.height;
        let scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        // BGMの設定
        this.sound.stopAll();
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();

        // 役職の初期化
        this.roles = ["priest", "mage", "swordsman", "priest", "mage", "swordsman"];
        Phaser.Utils.Array.Shuffle(this.roles);
    }

    async initializeGame() {
        // ユーザーIDの取得
        let userId = await this.getUserId();
        console.log("✅ ユーザーID取得成功:", userId);

        // ルームIDの取得と検証
        let roomId = await this.validateAndGetRoomId(userId);
        if (!roomId) throw new Error("ルームIDの取得に失敗しました");

        // プレイヤー情報の取得
        this.players = await this.getPlayersFromFirebase(roomId);
        if (!this.players || this.players.length === 0) {
            throw new Error("プレイヤー情報の取得に失敗しました");
        }

        // VS画面リスナーのセットアップ
        this.setupVsScreenListener();

        // ブラウザ終了時の処理
        window.onbeforeunload = () => {
            this.leaveRoom(userId);
        };

        // ルーレット開始
        this.startRoulette();
    }

    async validateAndGetRoomId(userId) {
        let roomId = localStorage.getItem("roomId");
        if (!roomId) {
            console.warn("⚠️ ルームIDが見つかりません。Firebase から検索します...");
            try {
                roomId = await this.findRoomByUserId(userId);
                if (roomId) {
                    localStorage.setItem("roomId", roomId);
                    console.log("✅ 取得したルームID:", roomId);
                    return roomId;
                }
                throw new Error("ルームIDが取得できませんでした");
            } catch (error) {
                console.error("❌ Firebase からルームID取得中にエラー:", error);
                throw error;
            }
        }
        return roomId;
    }

    startRoulette() {
        if (this.isRouletteRunning) {
            console.warn("⚠️ ルーレットがすでに実行中のため、再実行を防ぎます。");
            return;
        }

        // ルーレットの状態を Firebase で同期
        const roomId = localStorage.getItem("roomId");
        if (!roomId) return;

        firebase.database().ref(`gameRooms/${roomId}/roulette`).set({
            isRunning: true,
            startTime: firebase.database.ServerValue.TIMESTAMP
        });

        this.setupRoulette();
    }

    setupRoulette() {
        this.isRouletteRunning = true;
        this.currentRoleIndex = 0;

        if (this.rouletteEvent) {
            this.rouletteEvent.remove(false);
            this.rouletteEvent = null;
        }

        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest")
            .setScale(0.6)
            .setDepth(1)
            .setAlpha(0);

        // ルーレットのアニメーション開始
        this.time.delayedCall(5000, () => {
            this.startRouletteAnimation();
        });
    }

    startRouletteAnimation() {
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
    }

    async finalizeRole() {
        // ルーレットの終了処理
        if (this.rouletteEvent) {
            this.rouletteEvent.remove(false);
            this.rouletteEvent = null;
        }

        this.isRouletteRunning = false;

        // 結果の表示と効果音
        let finalRole = this.roles[this.currentRoleIndex];
        let decisionSound = this.sound.add("decisionSound", { volume: 1 });
        decisionSound.play();

        if (this.roleDisplay) {
            this.roleDisplay.setTexture(finalRole);
            this.roleDisplay.setAlpha(1);
        }

        try {
            // Firebase にデータを送信
            await this.assignRolesAndSendToFirebase();
            
            // VS画面の表示準備
            this.time.delayedCall(3000, () => {
                this.showVsScreen();
            });
        } catch (error) {
            console.error("❌ 役職の確定処理でエラー:", error);
            this.showError("役職の確定に失敗しました。再試行します...");
            // 3秒後に再試行
            this.time.delayedCall(3000, () => this.finalizeRole());
        }
    }

    async assignRolesAndSendToFirebase() {
        const roomId = localStorage.getItem("roomId");
        if (!roomId || !this.players || this.players.length === 0) {
            throw new Error("必要なデータが不足しています");
        }

        try {
            let updates = {};

            // 各プレイヤーに役職とチームを割り当て
            this.players = this.players.map((player, index) => ({
                id: player.id,
                name: player.name,
                team: index < this.players.length / 2 ? "Red" : "Blue",
                role: this.roles[index]
            }));

            // Firebase に更新データを準備
            this.players.forEach(player => {
                updates[`gameRooms/${roomId}/players/${player.id}/team`] = player.team;
                updates[`gameRooms/${roomId}/players/${player.id}/role`] = player.role;
            });

            // データを一括更新
            await firebase.database().ref().update(updates);
            console.log("✅ 役職 & チームデータを Firebase に送信完了");

            // VS画面の表示トリガーをセット
            const vsRef = firebase.database().ref(`gameRooms/${roomId}/startVsScreen`);
            await vsRef.set(true);
            
            // 10秒後に自動削除
            this.time.delayedCall(10000, () => {
                vsRef.remove()
                    .catch(error => console.error("❌ VS画面トリガー削除エラー:", error));
            });

        } catch (error) {
            console.error("❌ Firebase データ更新エラー:", error);
            throw error;
        }
    }

    showVsScreen() {
        const roomId = localStorage.getItem("roomId");
        if (!roomId) {
            this.showError("ルーム情報が見つかりません");
            return;
        }
