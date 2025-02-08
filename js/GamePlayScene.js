class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: "GamePlayScene" });
    }

    async getUserId() {
        try {
            let user = firebase.auth().currentUser;
            if (user) return user.uid;

            let authChangePromise = new Promise((resolve, reject) => {
                let unsubscribe = firebase.auth().onAuthStateChanged(user => {
                    unsubscribe();
                    if (user) resolve(user.uid);
                    else {
                        firebase.auth().signInAnonymously()
                            .then(result => resolve(result.user.uid))
                            .catch(error => reject(error));
                    }
                });
            });

            return await authChangePromise;
        } catch (error) {
            console.error("❌ getUserId() でエラー:", error);
            showError("ログインエラー: 再試行してください。");
            throw error;
        }
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
        showLoading(); // 🔄 ローディング開始

        this.cameras.main.setBackgroundColor("#000000");
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background3")
            .setScale(Math.max(this.scale.width / this.bg.width, this.scale.height / this.bg.height))
            .setScrollFactor(0).setDepth(-5);

        this.sound.stopAll();
        this.bgm = this.sound.add("bgmRoleReveal", { loop: true, volume: 0.5 });
        this.bgm.play();

        try {
            this.userId = await this.getUserId();
            this.roomId = await this.findRoomByUserId(this.userId);

            if (!this.roomId) throw new Error("ルームIDが見つかりません");

            localStorage.setItem("roomId", this.roomId);
            this.players = await this.getPlayersFromFirebase();

            if (!this.players || this.players.length === 0) {
                throw new Error("プレイヤー情報が取得できません");
            }

            this.setupVsScreenListener();
            this.startRoulette();
        } catch (error) {
            console.error("❌ ゲーム初期化エラー:", error);
            showError("ゲームの開始に失敗しました。");
        } finally {
            hideLoading(); // ✅ ローディング終了
        }
    }

    async findRoomByUserId(userId) {
        try {
            let snapshot = await firebase.database().ref("gameRooms").once("value");
            let rooms = snapshot.val();
            if (!rooms) return null;

            for (let roomId in rooms) {
                if (rooms[roomId].players?.[userId]) return roomId;
            }
            return null;
        } catch (error) {
            console.error("❌ ルーム検索エラー:", error);
            return null;
        }
    }

    async getPlayersFromFirebase() {
        return await fetchWithRetry(`gameRooms/${this.roomId}/players`);
    }

    setupVsScreenListener() {
        firebase.database().ref(`gameRooms/${this.roomId}/startVsScreen`).on("value", snapshot => {
            if (snapshot.val()) this.showVsScreen();
        });
    }

    startRoulette() {
        if (this.isRouletteRunning) return;

        this.isRouletteRunning = true;
        this.currentRoleIndex = 0;
        this.roleDisplay = this.add.image(this.scale.width / 2, this.scale.height / 2, "priest")
            .setScale(0.6).setDepth(1).setAlpha(0);

        setTimeout(() => {
            let totalSpins = Math.min(this.roles.length * 3, 10);
            let spinDuration = 1000;
            this.roleDisplay.setAlpha(1);

            this.rouletteEvent = this.time.addEvent({
                delay: spinDuration,
                repeat: totalSpins - 1,
                callback: () => {
                    this.currentRoleIndex = (this.currentRoleIndex + 1) % this.roles.length;
                    this.roleDisplay.setTexture(this.roles[this.currentRoleIndex]);
                },
                callbackScope: this
            });

            setTimeout(() => this.finalizeRole(), spinDuration * totalSpins);
        }, 5000);
    }

    finalizeRole() {
        if (this.rouletteEvent) this.rouletteEvent.remove(false);
        this.isRouletteRunning = false;

        let finalRole = this.roles[this.currentRoleIndex];
        firebase.database().ref(`gameRooms/${this.roomId}/finalRole`).set(finalRole);
    }

    showVsScreen() {
        let vsSound = this.sound.add("vsSound", { volume: 1 });
        vsSound.play();
        let vsImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "vsImage")
            .setScale(0.7).setDepth(2);

        setTimeout(() => {
            vsImage.destroy();
            this.scene.start("BattleScene");
        }, 8000);
    }
}

// ✅ 共通関数
function showError(message) {
    let errorBox = document.getElementById("errorBox") || document.createElement("div");
    errorBox.id = "errorBox";
    errorBox.innerText = message;
    errorBox.style.color = "red";
    errorBox.style.position = "absolute";
    errorBox.style.top = "10px";
    errorBox.style.left = "50%";
    errorBox.style.transform = "translateX(-50%)";
    errorBox.style.background = "#fff";
    errorBox.style.padding = "10px";
    errorBox.style.border = "1px solid red";
    document.body.appendChild(errorBox);
}

function showLoading() {
    let loading = document.getElementById("loading") || document.createElement("div");
    loading.id = "loading";
    loading.innerText = "読み込み中...";
    loading.style.position = "absolute";
    loading.style.top = "50%";
    loading.style.left = "50%";
    loading.style.transform = "translate(-50%, -50%)";
    loading.style.background = "#000";
    loading.style.color = "#fff";
    loading.style.padding = "10px";
    document.body.appendChild(loading);
}

function hideLoading() {
    let loading = document.getElementById("loading");
    if (loading) loading.remove();
}

async function fetchWithRetry(ref, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            let snapshot = await firebase.database().ref(ref).once("value");
            if (snapshot.exists()) return snapshot.val();
        } catch (error) {
            console.error(`❌ データ取得失敗 (${i + 1}/${maxRetries})`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    showError("データ取得に失敗しました。");
    return null;
}
