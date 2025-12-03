// Fisher-Yatesシャッフルは不要、単純なランダムインデックス選択で十分

/**
 * リストファイル（urls.txt）を取得し、ランダムなURLにリダイレクトする関数
 */
async function getRandomUrlAndRedirect() {
    // 1. ファイルの取得
    // GitHub Pagesにデプロイすると、このパス（urls.txt）でファイルが取得できます
    try {
        const response = await fetch('urls.txt');
        if (!response.ok) {
            throw new Error(`ファイルの読み込みに失敗しました: ${response.status}`);
        }
        
        const text = await response.text();
        
        // 2. リストの解析とフィルタリング
        // 空行やコメント行（#から始まる行）を除去
        const urlList = text.split('\n')
            .map(url => url.trim())
            .filter(url => url !== '' && !url.startsWith('#')); 

        if (urlList.length === 0) {
            alert('URLリストが空か、有効なURLがありません。');
            return;
        }

        // 3. ランダムなURLの選択
        // 0 から (リストの長さ - 1) までのランダムなインデックスを生成
        const randomIndex = Math.floor(Math.random() * urlList.length);
        const randomUrl = urlList[randomIndex];
        
        // 4. ページ遷移（リダイレクト）
        console.log(`ランダムに選択されたURL: ${randomUrl}`);
        window.location.href = randomUrl;

    } catch (error) {
        console.error("エラーが発生しました:", error);
        alert('URLの取得中にエラーが発生しました。コンソールを確認してください。');
    }
}