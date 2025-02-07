// resetRoomId.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔄 ページが読み込まれました。ルームIDをリセットします...");
    
    // ローカルストレージの roomId を削除
    localStorage.removeItem("roomId");

    console.log("✅ ルームIDがリセットされました。");
});
