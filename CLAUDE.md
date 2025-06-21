# CLAUDE.md

This file provides comprehensive guidance for Claude Code when working with the Gaming Generator codebase.

## 🎯 重要な制約

- **日本語UI維持** - ユーザー向けテキストは日本語を保持
- **プロダクション環境** - デバッグ機能は削除済み、リリース準備完了
- **モジュール構造** - 新機能は適切なモジュールに分離して実装

## 📋 Project Overview

**Gaming Generator** (ゲーミングジェネレーター) は、ゲーミング風ビジュアルエフェクトを生成するWebアプリケーションです。

### 🏗️ Architecture
- **フロントエンド**: HTML5 Canvas + ES6 JavaScript (モジュール構造)
- **バックエンド**: Vercel Functions (Python) for GIFアニメーション処理
- **デプロイ**: Vercel (Serverless Functions + Static Hosting)

### 🎨 Core Features
1. **集中線ジェネレーター** - マンガ風集中線エフェクト
2. **ゲーミングスタンプ** - テキスト/画像へのゲーミング効果適用
3. **GIFアニメーション強化** - アップロードGIFへのリアルタイム効果適用

## 📁 File Structure

```
Gaming Generator/
├── index.html                 # メインHTML (タブベースUI)
├── script.js                  # レガシーコア (順次モジュール化予定)
├── styles.css                 # 全スタイリング (レスポンシブ + ダークモード)
├── js/                        # モジュール構造 (NEW!)
│   ├── utils/                 # ユーティリティライブラリ
│   │   ├── config.js          # 設定管理システム
│   │   ├── canvas-utils.js    # Canvas操作ユーティリティ
│   │   └── error-handler.js   # 統一エラーハンドリング
│   ├── effects/               # エフェクト処理モジュール群
│   │   ├── effect-manager.js  # エフェクト統合管理
│   │   ├── rainbow-effect.js  # 虹色エフェクト
│   │   ├── golden-effect.js   # 金ピカエフェクト
│   │   ├── pulse-effect.js    # ピカピカ点滅エフェクト
│   │   ├── bluepurplepink-effect.js # 青紫ピンクエフェクト
│   │   └── rainbow-pulse-effect.js  # 虹色ピカピカエフェクト
│   └── generators/            # ジェネレータークラス群
│       ├── concentration-generator.js # 集中線ジェネレーター
│       ├── text-generator.js         # テキスト描画機能
│       ├── gif-processor.js          # GIF処理機能
│       └── gaming-text-generator.js  # ゲーミングテキスト統合
├── api/
│   └── gif-gaming.py          # Vercel Function (GIFアニメーション処理)
├── gif.js & gif.worker.js     # サードパーティGIFライブラリ (MIT)
├── CLAUDE.md                  # 開発ガイド
└── vercel.json                # Vercel設定
```

## 🎯 Development Status

### ✅ 完了済み機能
1. **モジュール分割** - `script.js`からエフェクト・ユーティリティを分離
2. **設定管理統一** - `Config`クラスで中央管理実装
3. **エラーハンドリング強化** - `ErrorHandler`で統一処理
4. **エフェクトシステム** - 各エフェクトを独立モジュール化

### 🔄 進行中のタスク
1. **レガシーコード移行** - `script.js`の完全モジュール化
2. **型アノテーション** - JSDoc記述の充実
3. **パフォーマンス最適化** - Canvas操作の効率化

## 🛠️ Module Usage Guide

### エフェクトの使用例
```javascript
import { EffectManager } from './js/effects/effect-manager.js';

// 虹色エフェクトを適用
const imageData = ctx.getImageData(0, 0, width, height);
const processedData = EffectManager.applyEffect(
    'rainbow',
    imageData,
    { saturation: 100, gradientDirection: 'horizontal' },
    0.5 // 進行度
);
ctx.putImageData(processedData, 0, 0);
```

### 新しいエフェクトの追加
```javascript
// js/effects/my-effect.js
export class MyEffect {
    static apply(imageData, settings, progress) {
        // エフェクト処理の実装
        return processedImageData;
    }
    
    static validateSettings(settings) {
        // 設定値の検証
        return validatedSettings;
    }
    
    static PRESETS = {
        classic: { /* デフォルト設定 */ }
    };
}

// effect-manager.js に登録
static EFFECT_CLASSES = {
    myEffect: MyEffect,
    // ...
};
```

### ユーティリティの活用
```javascript
import { CanvasUtils } from './js/utils/canvas-utils.js';
import { Config } from './js/utils/config.js';
import { ErrorHandler } from './js/utils/error-handler.js';

// Canvas安全操作
const imageData = CanvasUtils.getImageDataSafe(ctx);
CanvasUtils.putImageDataSafe(ctx, processedData);

// 設定値の取得
const maxSize = Config.get('CANVAS', 'maxWidth', 800);

// エラーハンドリング
try {
    // 処理...
} catch (error) {
    ErrorHandler.handle(error);
}
```

### 将来の機能拡張候補
- **新エフェクト追加** - ネオン、レーザー、爆発エフェクト
- **プリセット機能** - エフェクト設定の保存/読み込み
- **バッチ処理** - 複数ファイル一括処理
- **リアルタイムプレビュー強化** - WebGL活用

## 💻 Development Guide

### 🚀 Local Development Setup
```bash
# 1. 静的ファイルサーバーを起動
python3 -m http.server 8000
# または
npx http-server

# 2. ブラウザでアクセス
open http://localhost:8000
```

### 🧪 Testing Workflow
1. **基本動作確認**
   - 各タブの機能テスト
   - ライト/ダークモード切り替え
   - レスポンシブデザイン確認

2. **エフェクト品質チェック**
   - 各アニメーションモードの動作
   - GIFアップロード → 処理 → ダウンロード
   - 異なる画像サイズでの動作

3. **パフォーマンステスト**
   - 大きなGIFファイルの処理時間
   - メモリ使用量の監視
   - モバイルデバイスでの動作

### 🔧 Code Modification Guidelines

#### 新機能追加時の手順
1. **設計検討** - CLAUDE.mdで機能設計を確認
2. **モジュール選択** - 適切なファイル/クラスを特定
3. **実装** - 既存パターンに従った実装
4. **テスト** - 全機能の動作確認
5. **ドキュメント更新** - 必要に応じてCLAUDE.md更新

#### コーディング規約
- **クラス名**: PascalCase (例: `GamingTextGenerator`)
- **メソッド名**: camelCase (例: `generateGamingEffect`)
- **定数**: UPPER_SNAKE_CASE (例: `DEFAULT_CANVAS_SIZE`)
- **ファイル名**: kebab-case (例: `gaming-effects.js`)

## 🔧 Technical Architecture

### 🎨 Canvas Rendering System
```javascript
// メインレンダリングパターン
class EffectRenderer {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        this.animationFrame = null;
    }
    
    startAnimation() {
        const animate = (currentTime) => {
            this.render(currentTime);
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }
}
```

### 🔄 GIF Processing Pipeline
1. **クライアントサイド**: 基本的なプレビュー表示
2. **サーバーサイド**: 高品質なGIFアニメーション処理
3. **フレーム同期**: `frame_progress = i / total_frames` による完全同期

### 🎯 効果システム設計
```javascript
// エフェクト共通インターフェース
const EffectProcessor = {
    // 必須メソッド
    applyEffect(imageData, settings, progress) { /* ... */ },
    getEffectSettings() { /* ... */ },
    
    // オプション
    preprocess(imageData) { /* ... */ },
    postprocess(imageData) { /* ... */ }
};
```

### 📊 パフォーマンス最適化指針
- **メモリ管理**: ImageDataの適切な解放
- **計算最適化**: ピクセル処理のバッチ化
- **非同期処理**: Web Workersの活用
- **レスポンシブ設計**: モバイル対応の軽量モード

## 📚 Core Classes & Modules

### 現在のクラス構造
```javascript
// メインジェネレータークラス
class ConcentrationLineGenerator {
    // 集中線エフェクト専用
    // Location: script.js:1-1000行目頃
}

class GamingTextGenerator {
    // ゲーミングテキスト + GIFアニメーション処理
    // Location: script.js:1000-4000行目頃
    // 注意: 巨大クラスのため分割推奨
}
```

### 推奨モジュール分割案
```javascript
// js/utils/canvas-utils.js
export class CanvasUtils {
    static setupCanvas(canvas, width, height) { /* ... */ }
    static clearCanvas(ctx) { /* ... */ }
}

// js/effects/rainbow-effect.js
export class RainbowEffect {
    static apply(imageData, settings, progress) { /* ... */ }
}

// js/generators/gaming-text-generator.js
export class GamingTextGenerator {
    // 分割後の軽量版
}
```

## 🚀 Future Development Roadmap

### Phase 1: コードベース改善 (即座に実行可能)
- [ ] `GamingTextGenerator`の分割
- [ ] 設定管理システムの統一
- [ ] エラーハンドリングの強化
- [ ] JSDoc型アノテーション追加

### Phase 2: 機能拡張
- [ ] **新エフェクト追加**
  - ネオンエフェクト
  - グリッチエフェクト
  - パーティクルエフェクト
- [ ] **UI/UX改善**
  - プリセット機能
  - ドラッグ&ドロップ対応
  - プロ向け詳細設定パネル

### Phase 3: パフォーマンス最適化
- [ ] WebGL活用によるリアルタイム処理
- [ ] バッチ処理機能
- [ ] プログレッシブWeb App (PWA) 対応

## 🔍 Debugging & Monitoring

### 開発時の確認ポイント
1. **Canvas描画**: DevTools > Canvas tab
2. **メモリ使用量**: Performance tab > Memory
3. **API通信**: Network tab > XHR/Fetch
4. **エラー**: Console tab (本番では削除済み)

### 主要なパフォーマンス指標
- GIF処理時間: < 10秒 (通常サイズ)
- メモリ使用量: < 200MB (大容量GIF)
- 初回描画時間: < 2秒