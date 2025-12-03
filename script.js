// --- 設定値 ---
const DRAWN_URLS_KEY = 'tarotDrawnUrls'; // 履歴を保存するlocalStorageのキー名
const DRAWN_URLS_LIMIT = 20;            // 履歴として残すURLの最大数（例: 直近20回は再抽選しない）
const RESET_TIME_KEY = 'tarotResetTime';  // リセット時間を保存するキー名
const RESET_DURATION_MS = 24 * 60 * 60 * 1000; // リセット期間（24時間）をミリ秒で設定

// ----------------------------------------------------
// ページ読み込み時に日付を表示
// ----------------------------------------------------
function displayCurrentDate() {
    const now = new Date();
    const weekday = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(now);
    const formattedDate = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '/');

    const dateString = `${formattedDate} (${weekday})`;
    
    const dateElement = document.getElementById('dateDisplay');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// ----------------------------------------------------
// 抽選待ちメッセージを表示する関数
// ----------------------------------------------------
function showWaitMessage(resetTime) {
    const now = new Date();
    const diffMs = resetTime - now.getTime(); // 残り時間を計算
    
    if (diffMs <= 0) {
        // 時間が過ぎていたらリセットし、ページをリロードして再抽選を試みる
        localStorage.removeItem(DRAWN_URLS_KEY);
        localStorage.removeItem(RESET_TIME_KEY);
        alert("抽選可能になりました。ページを更新します。");
        window.location.reload();
        return;
    }

    // 日本語でリセット時間をフォーマット
    const resetDate = new Date(resetTime);
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' };
    const resetTimeString = resetDate.toLocaleTimeString('ja-JP', timeOptions);
    
    // HTMLの内容を待機メッセージに変更
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div id="dateDisplay"></div>
            <h1>ワンオラクル：<br>タロット占い</h1>
            <p style="color: red; font-size: 20px;">本日のカードはすべて引かれました。</p>
            <p style="margin-top: 30px;">星の力が回復する<br><strong>${resetTimeString}</strong>までお待ちください。</p>
        `;
        // メッセージ表示後も日付は更新しておく
        displayCurrentDate(); 
    }
}


/**
 * メインの抽選処理
 */
async function getRandomUrlAndRedirect() {
    // 1. リセット時間チェック（もしリセット時間が設定されていたら）
    const savedResetTime = localStorage.getItem(RESET_TIME_KEY);
    const nowTimestamp = new Date().getTime();
    
    if (savedResetTime && nowTimestamp < parseInt(savedResetTime, 10)) {
        // リセット時間前なので、待機メッセージを表示して処理を中断
        showWaitMessage(parseInt(savedResetTime, 10));
        return;
    } 
    
    // リセット時間を過ぎていたら履歴をクリアして続行
    if (savedResetTime && nowTimestamp >= parseInt(savedResetTime, 10)) {
        localStorage.removeItem(DRAWN_URLS_KEY);
        localStorage.removeItem(RESET_TIME_KEY);
    }
    
    // 2. 抽選処理の開始
    try {
        const response = await fetch('urls.txt');
        if (!response.ok) throw new Error(`ファイルの読み込みに失敗しました: ${response.status}`);
        
        const text = await response.text();
        const urlList = text.split('\n')
            .map(url => url.trim())
            .filter(url => url !== '' && !url.startsWith('#')); 

        // 3. 履歴の読み込みと抽選リストの作成
        let drawnUrls = JSON.parse(localStorage.getItem(DRAWN_URLS_KEY) || '[]');
        
        // 履歴に含まれていないURLのみを抽出して抽選用リストを作成
        const eligibleUrls = urlList.filter(url => !drawnUrls.includes(url));

        if (eligibleUrls.length === 0) {
            // 4A. 抽選可能なURLがない場合（すべて引いた場合）
            
            // リセット時間を設定（現在時刻 + 24時間）
            const resetTime = nowTimestamp + RESET_DURATION_MS;
            localStorage.setItem(RESET_TIME_KEY, resetTime);
            
            // 待機メッセージを表示
            showWaitMessage(resetTime);
            return;
        }

        // 4B. ランダムなURLの選択
        const randomIndex = Math.floor(Math.random() * eligibleUrls.length);
        const randomUrl = eligibleUrls[randomIndex];
        
        // 5. 履歴の更新と保存
        // 履歴リストに追加
        drawnUrls.push(randomUrl);
        
        // 履歴を制限数（20個）に調整（最も古いものを削除）
        if (drawnUrls.length > DRAWN_URLS_LIMIT) {
            drawnUrls = drawnUrls.slice(drawnUrls.length - DRAWN_URLS_LIMIT);
        }
        
        // localStorageに保存
        localStorage.setItem(DRAWN_URLS_KEY, JSON.stringify(drawnUrls));
        
        // 6. ページ遷移
        window.location.href = randomUrl;

    } catch (error) {
        console.error("エラーが発生しました:", error);
        alert('URLの取得中にエラーが発生しました。コンソールを確認してください。');
    }
}

// ページが完全に読み込まれた後に日付表示処理を実行
window.onload = function() {
    displayCurrentDate();
    
    // ページロード時にもリセット時間チェックを実行して、待機状態なら表示
    const savedResetTime = localStorage.getItem(RESET_TIME_KEY);
    const nowTimestamp = new Date().getTime();
    if (savedResetTime && nowTimestamp < parseInt(savedResetTime, 10)) {
        showWaitMessage(parseInt(savedResetTime, 10));
    }
};
