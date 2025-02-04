class RoleAssignmentScene extends Phaser.Scene {
    constructor() {
        super({ key: "RoleAssignmentScene" });
        this.playerId = localStorage.getItem('userId'); // ユーザーIDを取得
    }

    preload() {
        this.load.image("roleBackground", "assets/role_scene.png"); // 背景画像
        this.load.audio("roleBgm", "assets/role_theme.mp3"); // BGM
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");

        // 背景画像を追加
        let bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "roleBackground");
        let scaleX = this.scale.width / bg.width;
        let scaleY = this.scale.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0).setDepth(-5);

        // BGM の処理
        if (this.sound.get("newBgm")) {
            this.sound.stopByKey("newBgm");
        }
        if (!this.sound.get("roleBgm")) {
            this.roleBgm = this.sound.add("roleBgm", { loop: true, volume: 0.5 });
            this.roleBgm.play();
        }

        console.log("RoleAssignmentScene: 役割発表・チーム分け開始！");

        // ✅ Firebase からプレイヤー情報を取得
        if (typeof window.db === "undefined") {
            console.error("🔥 Firebase Database が未定義です！ 役割を取得できません！");
            return;
        }

        this.roomRef = window.db.ref("gameRooms/room1/players");

        // 役割発表用のテキスト
        this.roleText = this.add.text(this.scale.width / 2, 150, "役割を決定中...", {
            fontSize: "24px",
            fill: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        this.assignRoles();
    }

    assignRoles() {
        this.roomRef.once("value").then(snapshot => {
            let players = snapshot.val() || {};
            let playerIds = Object.keys(players);

            if (!players[this.playerId]) {
                console.error("🔥 プレイヤーが部屋に存在しません！", this.playerId);
                return;
            }

            // 役割リスト（仮）
            let roles = ["リーダー", "サポーター", "戦略家", "調査員", "情報屋"];
            let assignedRoles = {};

            playerIds.forEach((id, index) => {
                assignedRoles[id] = roles[index % roles.length]; // 役割を順番に割り当てる
            });

            // Firebase に役割を保存
            this.roomRef.update(assignedRoles).then(() => {
                let myRole = assignedRoles[this.playerId];
                console.log(`✅ あなたの役割: ${myRole}`);

                // 画面に役割を表示
                this.roleText.setText(`あなたの役割: ${myRole}`);

                // **5秒後にゲーム開始**
                this.time.delayedCall(5000, () => {
                    this.startGame();
                });
            });
        });
    }

    startGame() {
        this.roomRef.off();
        this.scene.start("GamePlayScene"); // 次のシーンへ
    }
}

export default RoleAssignmentScene;
