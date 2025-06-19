// Vercel Function for GIF Gaming Effect Processing
import { createCanvas, loadImage } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { parseGIF, decompressFrames } from 'gifuct-js';

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 GIF Gaming処理開始');

    // リクエストからGIFデータを取得
    const { gifData, settings } = req.body;
    
    if (!gifData) {
      return res.status(400).json({ error: 'GIFデータが見つかりません' });
    }

    console.log('📊 設定:', settings);

    // Base64デコード
    const buffer = Buffer.from(gifData.split(',')[1], 'base64');
    
    // GIF解析
    console.log('🔍 GIF解析中...');
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);
    
    console.log(`📝 検出フレーム数: ${frames.length}`);

    if (frames.length === 0) {
      return res.status(400).json({ error: 'フレームが検出されませんでした' });
    }

    // GIFエンコーダー初期化
    const encoder = new GIFEncoder(gif.lsd.width, gif.lsd.height);
    encoder.start();
    encoder.setRepeat(0); // 無限ループ
    encoder.setQuality(10); // 品質設定

    const canvas = createCanvas(gif.lsd.width, gif.lsd.height);
    const ctx = canvas.getContext('2d');

    console.log('🎨 フレーム処理開始...');

    // 各フレームにゲーミング効果を適用
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      // フレーム遅延設定
      encoder.setDelay(frame.delay || 100);
      
      // フレームデータをキャンバスに描画
      const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
      imageData.data.set(frame.patch);
      ctx.putImageData(imageData, frame.dims.left, frame.dims.top);
      
      // ゲーミング効果オーバーレイを追加
      await applyGamingEffect(ctx, canvas.width, canvas.height, i, frames.length, settings);
      
      // フレームを追加
      encoder.addFrame(ctx);
      
      console.log(`✅ フレーム ${i + 1}/${frames.length} 完了`);
    }

    encoder.finish();
    
    console.log('🎉 GIF生成完了');

    // 結果を返却
    const outputBuffer = encoder.out.getData();
    const base64Output = outputBuffer.toString('base64');
    
    res.status(200).json({
      success: true,
      gifData: `data:image/gif;base64,${base64Output}`,
      frameCount: frames.length,
      size: outputBuffer.length
    });

  } catch (error) {
    console.error('❌ GIF処理エラー:', error);
    res.status(500).json({ 
      error: 'GIF処理に失敗しました',
      details: error.message 
    });
  }
}

// ゲーミング効果を適用する関数
async function applyGamingEffect(ctx, width, height, frameIndex, totalFrames, settings = {}) {
  const {
    animationType = 'rainbow',
    speed = 5,
    saturation = 100
  } = settings;

  // アニメーション進行度
  const progress = (frameIndex / totalFrames) * speed;
  
  // グラデーション作成
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  
  if (animationType === 'rainbow') {
    // 虹色グラデーション
    for (let i = 0; i <= 10; i++) {
      const hue = ((i * 36 + progress * 36) % 360);
      const color = `hsl(${hue}, ${saturation}%, 50%)`;
      gradient.addColorStop(i / 10, color);
    }
  } else if (animationType === 'golden') {
    // 金ピカグラデーション
    const baseHue = 45; // 金色
    for (let i = 0; i <= 10; i++) {
      const hue = baseHue + Math.sin(progress + i) * 20;
      const lightness = 50 + Math.sin(progress * 2 + i) * 20;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      gradient.addColorStop(i / 10, color);
    }
  }

  // ブレンドモードでオーバーレイ
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 元の描画モードに戻す
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
}