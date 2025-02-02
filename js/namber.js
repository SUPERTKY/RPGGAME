function generateUniqueId() {
    return 'user-' + Math.random().toString(36).substr(2, 9);
}

let userId = localStorage.getItem('userId');

if (!userId) {
    userId = generateUniqueId();
    localStorage.setItem('userId', userId);
    console.log("新しいユーザーIDを生成しました:", userId);
} else {
    console.log("既存のユーザーIDを取得しました:", userId);
}

// ユーザーIDを表示（開発者ツールのコンソールに出力）
console.log("現在のユーザーID:", userId);
