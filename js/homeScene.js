class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: "HomeScene" });
        this.firstClick = false; // 初回クリックを管理
        this.playerName = localStorage.getItem("playerName") || ""; // 名前を取得
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("startButton", "assets/startButton.png");
        this.load.audio("bgm", "assets/Old_FortThe_sun_goes_down.mp3"); // 🎵 BGMロード
        this.load.audio("clickSound", "assets/ファニージャンプ.mp3"); // 🔊 クリック音ロード
    }

    create() {
        let bg = this.add.image(0, 0, "background").setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);
        bg.setInteractive();

        this.bgm = this.sound.add("bgm", { loop: true, volume: 0.5 });
        this.clickSound = this.sound.add("clickSound", { volume: 0.8 }); // 🔊 クリック音をセット

        let button = this.add.image(this.scale.width / 2, this.scale.height * 0.75, "startButton").setScale(0.4);
        button.setInteractive();
        button.setAlpha(1);
        button.setDepth(2);
        button.setVisible(false); // 初回はボタンを非表示

        let text = this.add.text(this.scale.width / 2, this.scale.height / 2, "勇者達の戦い", {
            fontSize: "64px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 10,
            fontStyle: "bold",
            align: "center"
        }).setOrigin(0.5, 0.5).setDepth(2);

        if (!this.playerName) {
            this.showNameInput(button);
        } else {
            button.setVisible(true); // 名前がある場合はボタンを表示
        }

        bg.once("pointerdown", () => {
            console.log("背景がクリックされた - BGM再生");
            if (!this.firstClick) {
                this.bgm.play();
                this.firstClick = true;
            }
        });

        button.on("pointerdown", () => {
            if (this.firstClick && this.playerName) {
                this.clickSound.play(); // 🔊 クリック音を再生
                console.log("ボタンが押された - ゲーム開始");
                this.scene.start("GameScene");
            }
        });

        this.input.on("pointerdown", (pointer) => {
            console.log(`クリック位置: x=${pointer.x}, y=${pointer.y}`);
        });
    }

    showNameInput(button) {
        let inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.placeholder = "名前を入力";
        inputElement.style.position = "absolute";
        inputElement.style.top = "50%";
        inputElement.style.left = "50%";
        inputElement.style.transform = "translate(-50%, -50%)";
        inputElement.style.fontSize = "24px";
        inputElement.style.padding = "10px";

        document.body.appendChild(inputElement);
        inputElement.focus();

        inputElement.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && inputElement.value.trim() !== "") {
                this.playerName = inputElement.value.trim();
                localStorage.setItem("playerName", this.playerName);
                document.body.removeChild(inputElement);
                button.setVisible(true); // ボタンを表示
            }
        });
    }
}

