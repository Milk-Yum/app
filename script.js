// --- 設定値 ---
const DRAWN_URLS_KEY = 'tarotDrawnUrls'; 
const DRAWN_URLS_LIMIT = 20;            
const RESET_TIME_KEY = 'tarotResetTime'; 
const RESET_DURATION_MS = 24 * 60 * 60 * 1000; 

// ----------------------------------------------------
// ページ読み込み時に日付を表示
// ----------------------------------------------------
function displayCurrentDate() {
    const now = new Date();
    
    // YYYY/MM/DD 形式で日付を作成
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 曜日を日本語で取得 (Safari互換性のためタイムゾーン指定をしない)
    const weekday = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(now);
    
    const dateString = `${year}/${month}/${day} (${weekday})`;
    
    const dateElement = document.getElementById('dateDisplay');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// ----------------------------------------------------
// 抽選待ちメッセージを表示する関数
// ----------------------------------------------------
function showWaitMessage(resetTime) {
    // 省略：前回のコードと同じ
    const now = new Date();
    const diffMs = resetTime - now.getTime();
    
    if (diffMs <= 0) {
        localStorage.removeItem(DRAWN_URLS_KEY);
        localStorage.removeItem(RESET_TIME_KEY);
        alert("抽選可能になりました。ページを更新します。");
        window.location.reload();
        return;
    }

    const resetDate = new Date(resetTime);
    // Safariでの互換性のため、時間表示はシンプルな形式に
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false }; 
    const resetTimeString = resetDate.toLocaleTimeString('ja-JP', timeOptions);
    
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div id="dateDisplay"></div>
            <h1>ワンオラクル：<br>タロット占い</h1>
            <p style="color: red; font-size: 20px;">本日のカードはすべて引かれました。</p>
            <p style="margin-top: 30px;">星の力が回復する<br><strong>${resetTimeString}</strong>までお待ちください。</p>
        `;
        displayCurrentDate(); 
    }
}


/**
 * メインの抽選処理
 */
async function getRandomUrlAndRedirect() {
    // 1. リセット時間チェック
    const savedResetTime = localStorage.getItem(RESET_TIME_KEY);
    const nowTimestamp = new Date().getTime();
    
    if (savedResetTime && nowTimestamp < parseInt(savedResetTime, 10)) {
        showWaitMessage(parseInt(savedResetTime, 10));
        return;
    } 
    
    if (savedResetTime && nowTimestamp >= parseInt(savedResetTime, 10)) {
        localStorage.removeItem(DRAWN_URLS_KEY);
        localStorage.removeItem(RESET_TIME_KEY);
    }
    
    // 2. 抽選処理の開始
    try {
        const response = await fetch('urls.txt', { cache: 'no-store' }); // ★重要: Safariでキャッシュ問題を避けるため
        
        // ★重要: HTTPステータスコードをチェックし、200番台以外はエラーとする
        if (!response.ok) {
            alert(`URLリストの読み込みに失敗しました (Status: ${response.status})。ファイル名を確認してください。`);
            throw new Error(`ファイル読み込みエラー: ${response.status}`);
        }
        
        const text = await response.text();
        const urlList = text.split('\n')
            .map(url => url.trim())
            .filter(url => url !== '' && !url.startsWith('#')); 

        // 3. 履歴の読み込みと抽選リストの作成
        let drawnUrls = JSON.parse(localStorage.getItem(DRAWN_URLS_KEY) || '[]');
        const eligibleUrls = urlList.filter(url => !drawnUrls.includes(url));

        if (eligibleUrls.length === 0) {
            // 4A. 抽選可能なURLがない場合
            const resetTime = nowTimestamp + RESET_DURATION_MS;
            localStorage.setItem(RESET_TIME_KEY, resetTime);
            showWaitMessage(resetTime);
            return;
        }

        // 4B. ランダムなURLの選択
        const randomIndex = Math.floor(Math.random() * eligibleUrls.length);
        const randomUrl = eligibleUrls[randomIndex];
        
        // 5. 履歴の更新と保存
        drawnUrls.push(randomUrl);
        if (drawnUrls.length > DRAWN_URLS_LIMIT) {
            drawnUrls = drawnUrls.slice(drawnUrls.length - DRAWN_URLS_LIMIT);
        }
        localStorage.setItem(DRAWN_URLS_KEY, JSON.stringify(drawnUrls));
        
        // 6. ページ遷移
        window.location.href = randomUrl;

    } catch (error) {
        console.error("エラーが発生しました:", error);
        alert('エラーが発生しました。コンソールを確認してください。');
    }
}

// ページが完全に読み込まれた後に日付表示処理と待機状態チェックを実行
window.onload = function() {
    displayCurrentDate();
    
    const savedResetTime = localStorage.getItem(RESET_TIME_KEY);
    const nowTimestamp = new Date().getTime();
    if (savedResetTime && nowTimestamp < parseInt(savedResetTime, 10)) {
        showWaitMessage(parseInt(savedResetTime, 10));
    }
};
