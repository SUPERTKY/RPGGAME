
// ✅ Firebase のロード確認
if (typeof firebase === "undefined") {
    console.error("🔥 Firebase SDK がロードされていません！");
} else {
    console.log("✅ Firebase SDK 読み込み成功！");
}

// Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyCwYEJvpjVIA6mynBX0FWp-RbeqmE4hCA0",
    authDomain: "rpggame-b7e7e.firebaseapp.com",
    databaseURL: "https://rpggame-b7e7e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rpggame-b7e7e",
    storageBucket: "rpggame-b7e7e.firebasestorage.app",
    messagingSenderId: "54622239169",
    appId: "1:54622239169:web:6abbb760805e63fa215740"
  };// Firebase の初期化

// ✅ Firebase を初期化（`firebase` が定義されていないときの対策）
if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database(); // `db` をグローバル変数に設定
    console.log("✅ Firebase 初期化成功");
} else {
    console.error("🔥 Firebase の初期化に失敗しました！");
}
