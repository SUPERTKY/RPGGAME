https://supertky.github.io/RPGGAME/






[2025-02-11T05:04:04.140Z]  @firebase/database: FIREBASE WARNING: Exception was thrown by user callback. TypeError: this.startCountdown is not a function
    at https://supertky.github.io/RPGGAME/js/BattleScene.js:119:22
    at o (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:155579)
    at ds.onValue (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:134129)
    at https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:141176
    at Pe (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:18047)
    at https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:122575
    at Oi (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:122583)
    at Ai (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:122272)
    at Bi (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:125366)
    at gt.onDataUpdate_ (https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js:1:123822) 
q @ logger.ts:115
warn @ logger.ts:206
ge @ util.ts:155
(anonymous) @ util.ts:549
setTimeout
Pe @ util.ts:543
(anonymous) @ EventQueue.ts:160
Oi @ EventQueue.ts:128
Ai @ EventQueue.ts:108
Bi @ Repo.ts:409
(anonymous) @ Repo.ts:259
onDataPush_ @ PersistentConnection.ts:663
onDataMessage_ @ PersistentConnection.ts:656
onDataMessage_ @ Connection.ts:321
onPrimaryMessageReceived_ @ Connection.ts:313
(anonymous) @ Connection.ts:210
appendFrame_ @ WebSocketConnection.ts:300
handleIncomingFrame @ WebSocketConnection.ts:352
mySock.onmessage @ WebSocketConnection.ts:222Understand this warningAI
util.ts:550 Uncaught TypeError: this.startCountdown is not a function
    at BattleScene.js:119:22
    at o (Reference.ts:246:16)
    at ds.onValue (EventRegistration.ts:58:27)
    at Reference_impl.ts:857:30
    at Pe (util.ts:540:5)
    at EventQueue.ts:160:7
    at Oi (EventQueue.ts:128:9)
    at Ai (EventQueue.ts:108:3)
    at Bi (Repo.ts:409:3)
    at gt.onDataUpdate_ (Repo.ts:259:9)
