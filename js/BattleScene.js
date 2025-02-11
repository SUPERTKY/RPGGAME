class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.isListening = false;
        this.players = [];
    }

    preload() {
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
    }

    async create() {
        this.cameras.main.setBackgroundColor("#000000");

        this.statusText = this.add.text(this.scale.width / 2, this.scale.height * 0.1, "バトル開始を待っています...", {
            fontSize: "32px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.battleBgm = this.sound.add("battleBgm", { volume: 0 });

        let roomId = localStorage.getItem("roomId");
        if (!roomId) {
            console.error("❌ ルームIDが取得できません。");
            return;
        }

        try {
            this.playersRef = firebase.database().ref(`gameRooms/${roomId}/players`);
            this.listenForPlayers(roomId);
        } catch (error) {
            console.error("❌ Firebase の監視エラー:", error);
        }
    }

    listenForPlayers(roomId) {
        if (this.isListening) return;
        this.isListening = true;

        this.playersRef.on("value", (snapshot) => {
            let playersData = snapshot.val();
            if (!playersData) return;

            this.players = Object.keys(playersData).map(playerId => ({
                id: playerId,
                name: playersData[playerId].name || "???",
                role: playersData[playerId].role || "不明",
                team: playersData[playerId].team || "未定",
                hp: this.getInitialHP(playersData[playerId].role), // HP設定
                mp: this.getInitialMP(playersData[playerId].role), // MP設定
                lp: 3 // LPは固定
            }));

            let playerCount = this.players.length;
            this.statusText.setText(`戦闘準備完了: ${playerCount} / 6`);

            if (playerCount === 6) {
                console.log("🟢 全プレイヤーが揃いました。バトル開始！");
                this.playersRef.off("value");
                this.startCountdown();
            }
        });
    }

    // HPの初期設定
    getInitialHP(role) {
        switch (role) {
            case "swordsman": return 200;
            case "mage": return 160;
            case "priest": return 180;
            default: return 100;
        }
    }

    // MPの初期設定
    getInitialMP(role) {
        switch (role) {
            case "swordsman": return 8;
            case "mage": return 12;
            case "priest": return 14;
            default: return 10;
        }
    }

    startCountdown() {
        this.statusText.setText("");
        const countdownNumbers = ["3", "2", "1", "スタート！"];
        let index = 0;

        const showNextNumber = () => {
            if (index >= countdownNumbers.length) {
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

            // 📏 画面サイズに合わせてスケールを調整（アスペクト比を維持）
            let scaleX = this.scale.width / this.bg.width;
            let scaleY = this.scale.height / this.bg.height;
            let scale = Math.max(scaleX, scaleY); // どちらか大きい方に合わせる
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


   async displayCharacters() {
    let firebaseUserId = firebase.auth().currentUser?.uid;
    let localUserId = localStorage.getItem("userId");
    let userId = firebaseUserId || localUserId;

    if (!userId) {
        console.error("❌ ユーザーIDが取得できません。(Firebase・ローカルストレージの両方で失敗)");
        return;
    }

    let roomId = localStorage.getItem("roomId");
    if (!roomId) {
        console.error("❌ ルームIDが取得できません。");
        return;
    }

    try {
        // 🔥 Firebase から自分のチーム情報を取得
        let snapshot = await firebase.database().ref(`gameRooms/${roomId}/players/${userId}/team`).once("value");
        let localTeam = snapshot.val();

        // もし `team` 情報が `null` の場合、ローカルストレージから試みる
        if (!localTeam) {
            console.warn("⚠️ Firebase からチーム情報を取得できません。ローカルストレージを参照します...");
            localTeam = localStorage.getItem("team");
        }

        if (!localTeam) {
            console.error("❌ 自分のチーム情報が見つかりません。(Firebase・ローカルストレージの両方で失敗)");
            return;
        }

        console.log("✅ 自分のチーム:", localTeam);

        // 🔥 Firebase から全プレイヤーの情報を取得
        let playersSnapshot = await firebase.database().ref(`gameRooms/${roomId}/players`).once("value");
        let playersData = playersSnapshot.val();

        if (!playersData) {
            console.error("❌ プレイヤーデータが取得できません。");
            return;
        }

        // 🔥 全プレイヤーをオブジェクトから配列に変換
        this.players = Object.keys(playersData).map(playerId => ({
            id: playerId,
            name: playersData[playerId].name || "???",
            role: playersData[playerId].role || "不明",
            team: playersData[playerId].team || "未定",
            hp: this.getInitialHP(playersData[playerId].role),
            mp: this.getInitialMP(playersData[playerId].role),
            lp: 3 // LPは固定
        }));

        console.log("✅ 取得したプレイヤーリスト:", this.players);

        let allyY = this.scale.height * 0.8;
        let enemyY = this.scale.height * 0.2;
        let centerX = this.scale.width / 2;
        let spacing = 150;

        // 🟥 自分と同じチーム → 味方 (ally)
        let allies = this.players.filter(p => p.team === localTeam);
        // 🟦 自分と異なるチーム → 敵 (enemy)
        let enemies = this.players.filter(p => p.team !== localTeam);

        console.log("✅ 味方:", allies);
        console.log("✅ 敵:", enemies);

        // 🎨 仲間の表示
        allies.forEach((player, index) => {
            let x = centerX - (allies.length - 1) * spacing / 2 + index * spacing;
            this.add.image(x, allyY, `${player.role}_ally`).setScale(0.7);
            this.add.text(x, allyY + 50, `${player.name}\nHP: ${player.hp}\nMP: ${player.mp}\nLP: ${player.lp}`, {
                fontSize: "18px",
                fill: "#fff",
                align: "center"
            }).setOrigin(0.5);
        });

        // 🎭 敵の表示
        enemies.forEach((player, index) => {
            let x = centerX - (enemies.length - 1) * spacing / 2 + index * spacing;
            this.add.image(x, enemyY, `${player.role}_enemy`).setScale(0.7);
            this.add.text(x, enemyY - 50, `${player.name}\nHP: ${player.hp}`, {
                fontSize: "18px",
                fill: "#fff",
                align: "center"
            }).setOrigin(0.5);
        });

        console.log("✅ キャラクター表示完了");

    } catch (error) {
        console.error("❌ Firebase からチーム情報を取得中にエラー:", error);
    }
}


}
