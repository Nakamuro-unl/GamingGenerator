/**
 * GIFアニメーション処理の単体テスト
 * これは実際のGIFファイルを使ってクライアント側の処理をテストします
 */

// テスト用のシンプルなGIF情報抽出関数
async function testGifFrameCount(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                const uint8View = new Uint8Array(arrayBuffer);
                
                // GIFヘッダーをチェック
                const header = String.fromCharCode(...uint8View.slice(0, 6));
                console.log('🔍 GIFヘッダー:', header);
                
                if (!header.startsWith('GIF')) {
                    reject(new Error('有効なGIFファイルではありません'));
                    return;
                }
                
                // 簡易的なフレーム数推定（実際の処理はサーバーサイドで行う）
                let frameCount = 1;
                
                // アニメーション制御拡張をスキャン
                for (let i = 0; i < uint8View.length - 3; i++) {
                    // 0x21 (Extension Introducer), 0xF9 (Graphic Control Label)
                    if (uint8View[i] === 0x21 && uint8View[i + 1] === 0xF9) {
                        frameCount++;
                    }
                }
                
                // 最大フレーム数制限
                frameCount = Math.min(frameCount, 100);
                
                console.log('📊 推定フレーム数:', frameCount);
                resolve(frameCount);
                
            } catch (error) {
                console.error('❌ GIF解析エラー:', error);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
        reader.readAsArrayBuffer(file);
    });
}

// DOM要素作成のテスト
function testDOMCreation() {
    console.log('🧪 DOM要素作成テスト開始');
    
    // テスト用キャンバス作成
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    canvas.id = 'testCanvas';
    document.body.appendChild(canvas);
    
    // テスト用画像要素作成
    const imgElement = document.createElement('img');
    imgElement.id = 'testGifImage';
    imgElement.style.position = 'absolute';
    imgElement.style.left = '0px';
    imgElement.style.top = '0px';
    imgElement.style.width = '256px';
    imgElement.style.height = '256px';
    imgElement.style.pointerEvents = 'none';
    document.body.appendChild(imgElement);
    
    console.log('✅ DOM要素作成完了');
    return { canvas, imgElement };
}

// ゲーミング効果のオーバーレイテスト
function testGamingOverlay(canvas, progress = 0) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 背景をクリア
    ctx.clearRect(0, 0, width, height);
    
    // 虹色グラデーション効果
    for (let x = 0; x < width; x++) {
        // 横方向のグラデーション + アニメーション
        const hue = (x / width * 360 + progress * 36) % 360;
        
        // HSVからRGBに変換（簡易版）
        const h = hue / 60.0;
        const c = 255;
        const x_val = c * (1 - Math.abs((h % 2) - 1));
        
        let r, g, b;
        if (0 <= h && h < 1) {
            r = c; g = x_val; b = 0;
        } else if (1 <= h && h < 2) {
            r = x_val; g = c; b = 0;
        } else if (2 <= h && h < 3) {
            r = 0; g = c; b = x_val;
        } else if (3 <= h && h < 4) {
            r = 0; g = x_val; b = c;
        } else if (4 <= h && h < 5) {
            r = x_val; g = 0; b = c;
        } else {
            r = c; g = 0; b = x_val;
        }
        
        // 透明度を設定してライン描画
        ctx.strokeStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0.6)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

// APIテスト用関数
async function testAPIConnection() {
    console.log('🌐 API接続テスト開始');
    
    const apiUrls = [
        'http://localhost:8002', // ローカル
        window.location.origin, // 現在のドメイン
        'https://gaming-generator-qjlika608-nakamuros-projects-f99bfc51.vercel.app',
        'https://gaming-generator.vercel.app'
    ];
    
    for (const apiUrl of apiUrls) {
        try {
            console.log(`🔌 テスト中: ${apiUrl}/api/test`);
            
            const response = await fetch(`${apiUrl}/api/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ test: true })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${apiUrl} - 接続成功:`, data);
                return apiUrl; // 最初に成功したURLを返す
            } else {
                console.log(`❌ ${apiUrl} - HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${apiUrl} - ${error.message}`);
        }
    }
    
    throw new Error('全てのAPI接続に失敗しました');
}

// メイン実行関数
async function runGifTests() {
    console.log('🚀 GIFアニメーション処理テスト開始\n');
    
    try {
        // 1. DOM要素作成テスト
        const { canvas, imgElement } = testDOMCreation();
        
        // 2. ゲーミング効果オーバーレイテスト
        console.log('🎨 ゲーミング効果テスト開始');
        let progress = 0;
        const animateOverlay = () => {
            testGamingOverlay(canvas, progress);
            progress += 0.1;
            if (progress < 10) {
                requestAnimationFrame(animateOverlay);
            } else {
                console.log('✅ ゲーミング効果アニメーション完了');
            }
        };
        animateOverlay();
        
        // 3. API接続テスト
        try {
            const workingApiUrl = await testAPIConnection();
            console.log('✅ 使用可能なAPI:', workingApiUrl);
        } catch (error) {
            console.warn('⚠️ API接続テスト失敗:', error.message);
        }
        
        // 4. ファイル読み込みテスト（test_animated.gifがある場合）
        if (typeof fetch !== 'undefined') {
            try {
                const response = await fetch('/test_animated.gif');
                if (response.ok) {
                    const blob = await response.blob();
                    console.log('📂 テストGIFファイル読み込み成功:', blob.size, 'bytes');
                    
                    // GIFフレーム数検出テスト
                    const frameCount = await testGifFrameCount(blob);
                    console.log('🎞️ 検出フレーム数:', frameCount);
                    
                    // 画像として表示
                    const url = URL.createObjectURL(blob);
                    imgElement.src = url;
                    console.log('✅ GIF表示完了');
                } else {
                    console.log('⚠️ テストGIFファイルが見つかりません');
                }
            } catch (error) {
                console.log('⚠️ GIFファイル読み込みエラー:', error.message);
            }
        }
        
        console.log('\n🎉 全テスト完了！');
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
    }
}

// 自動実行
if (typeof window !== 'undefined') {
    // ブラウザ環境
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runGifTests);
    } else {
        runGifTests();
    }
} else {
    // Node.js環境
    console.log('Node.js環境ではGUIテストはスキップされます');
}

// エクスポート（モジュール環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testGifFrameCount,
        testDOMCreation,
        testGamingOverlay,
        testAPIConnection,
        runGifTests
    };
}