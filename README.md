# ゲーミングツール - 集中線・テキストスタンプ生成器

![ゲーミングツール](https://img.shields.io/badge/Gaming%20Tools-集中線・テキストスタンプ生成器-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-orange)
![Client Side](https://img.shields.io/badge/Client%20Side-100%25-blue)

ブラウザ上で動作する高機能なゲーミングエフェクト生成ツールです。集中線生成とゲーミングテキスト・スタンプ作成の2つの機能を提供します。

## 🌟 主要機能

### 🎯 集中線ジェネレーター
- **多彩な色モード**: 単色・ゲーミング虹色対応
- **リアルタイムアニメーション**: 虹色グラデーション・ピカピカ点滅・波動効果
- **自由な調整**: 線の本数・太さ・中心位置・中心サイズの詳細設定
- **画像合成**: 任意の画像に集中線を重ね合わせ
- **多形式出力**: PNG・WebM動画・GIF・HTMLアニメーション

### 🎮 ゲーミングテキスト・スタンプジェネレーター
- **テキスト・画像両対応**: テキスト入力または画像アップロード
- **ゲーミングエフェクト**: 虹色グラデーション・ピカピカ点滅・虹色ピカピカ
- **高品質レンダリング**: アンチエイリアス・グロー効果・透過背景対応
- **Slack最適化**: 32×32px・64×64pxプレビュー機能
- **フォント豊富**: 日本語・英語フォント多数搭載
- **自動最適化**: テキスト引き伸ばし・動的フォントサイズ調整

## 🚀 特徴

### ✨ ユーザー体験
- **リアルタイムプレビュー**: 設定変更を即座に反映
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **グローバルダークモード**: 目に優しいダークテーマ
- **直感的UI**: ワンクリック生成・ドラッグ&ドロップ対応

### 🔧 技術特徴
- **100%クライアントサイド**: サーバーへのデータ送信なし
- **高性能処理**: WebWorkers活用のマルチスレッド生成
- **最適化されたGIF**: 自動フレーム数計算・完璧ループ
- **メモリ効率**: Canvas最適化・リソース管理

### 🎨 アニメーション
- **非線形速度制御**: 1-20段階の精密な速度調整
- **同期化**: プレビューとGIFの完全一致
- **自然な色遷移**: ROYGBIV順の美しい虹色グラデーション
- **画像色保持**: 元画像の色相を保持したアニメーション

## 📱 使い方

### 🎯 集中線生成
1. **画像選択**（任意）: 「画像を選択」で背景画像をアップロード
2. **線の設定**: 本数（10-300）・太さ（1-10）を調整
3. **色モード選択**: 単色またはゲーミング虹色
4. **中心設定**: マウスクリックまたはスライダーで位置調整
5. **アニメーション**: 静止画・虹色・点滅・波動から選択
6. **出力**: PNG・動画・GIF形式でダウンロード

### 🎮 ゲーミングテキスト・スタンプ
1. **入力方式選択**: テキスト入力または画像アップロード
2. **テキスト設定**: サイズ（20-200px）・フォント選択
3. **エフェクト選択**: 虹色・点滅・虹色点滅・静止から選択
4. **詳細調整**: 彩度・基準色・アニメーション速度
5. **レイアウト**: キャンバスサイズ・背景透過・引き伸ばし
6. **プレビュー確認**: ライト・ダーク・Slackサイズで確認
7. **出力**: PNG・GIF形式でダウンロード

## 🎮 デフォルト設定（Slack最適化）

- **キャンバスサイズ**: 64×64px（Slack標準）
- **背景透過**: ON（透明背景）
- **テキスト引き伸ばし**: ON（最大化表示）
- **グロー効果**: OFF（透過時の互換性向上）
- **アニメーション**: 虹色グラデーション

## 🎨 対応フォント

### 📝 日本語フォント
- **システムフォント**: 游ゴシック・ヒラギノ角ゴ・MS ゴシック・メイリオ
- **Google Fonts**: Noto Sans JP・M PLUS 1p・小杉丸ゴシック・Dela Gothic One・Rampart One

### 🔤 英語フォント
- **標準フォント**: Arial・Helvetica・Times New Roman・Georgia
- **装飾フォント**: Impact・Comic Sans MS・Arial Black

## 🖼️ 出力形式

### 📸 静止画
- **PNG**: 高品質・透過対応
- **品質**: ロスレス圧縮

### 🎬 アニメーション
- **GIF**: 最適化・完璧ループ・透過対応
- **WebM**: 高品質動画（集中線のみ）
- **HTML**: インタラクティブアニメーション

## 🛠️ 技術仕様

### 📋 システム要件
- **ブラウザ**: Chrome 60+・Firefox 55+・Safari 11+・Edge 79+
- **必要機能**: HTML5 Canvas・File API・Web Workers・Typed Arrays
- **推奨環境**: デスクトップブラウザ（最適なパフォーマンス）

### 🔧 技術スタック
- **フロントエンド**: 純粋なHTML5・CSS3・JavaScript ES6+
- **レンダリング**: HTML5 Canvas API・requestAnimationFrame
- **並行処理**: Web Workers（GIF生成）
- **GIFライブラリ**: gif.js（MIT License）

### 📊 パフォーマンス
- **処理方式**: 100%クライアントサイド
- **メモリ使用量**: 最適化済み（フレーム管理）
- **生成速度**: WebWorkers活用のマルチスレッド
- **ファイルサイズ**: 自動最適化（フレーム数・品質調整）

### 🔒 プライバシー・セキュリティ
- **データ送信**: なし（完全ローカル処理）
- **画像処理**: ブラウザ内完結
- **外部通信**: Google Fonts読み込みのみ
- **ストレージ**: ダークモード設定のみローカルストレージ使用

## 🚀 サーバー要件

### 💻 最小構成
- **静的ファイル配信のみ**: Apache・Nginx・CDN対応
- **データベース**: 不要
- **サーバーサイド処理**: 不要
- **セッション管理**: 不要

### 📈 スケーラビリティ
- **負荷**: 静的ファイル配信程度（極めて軽微）
- **同時接続**: 制限なし（クライアントサイド処理）
- **帯域幅**: 初回アクセスのみ（キャッシュ効果大）

## 📂 ファイル構成

```
GamingTools/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── script.js           # メインスクリプト
├── gif.js              # GIF生成ライブラリ
├── gif.worker.js       # WebWorker
├── favicon.ico         # ファビコン
└── README.md           # このファイル
```

## 🎯 使用例

### Slackカスタム絵文字
1. テキスト「OK」を入力
2. サイズ64×64px、背景透過ON
3. 虹色グラデーション選択
4. GIFでダウンロード
5. Slackにカスタム絵文字として登録

### SNS投稿用アニメーション
1. 画像をアップロード
2. 集中線モードで虹色設定
3. アニメーション速度調整
4. GIFまたは動画で保存
5. Twitter・Instagram等に投稿

## 🔄 更新履歴

### v2.0 (最新)
- ゲーミングテキスト・スタンプ機能追加
- グローバルダークモード実装
- 非線形アニメーション速度制御
- Slackプレビュー機能
- モバイル対応強化

### v1.0
- 集中線ジェネレーター基本機能
- 虹色グラデーション・アニメーション
- GIF・動画出力対応

## 📄 ライセンス

### メインコード
このプロジェクトのオリジナルコードは自由に使用可能です。

### 外部ライブラリ
- **gif.js**: MIT License (c) 2013 Johan Nordberg
- **Google Fonts**: SIL Open Font License

## 🤝 貢献

バグ報告・機能提案・プルリクエストを歓迎します。

## 📧 連絡先

問題や質問がある場合は、GitHubのIssuesをご利用ください。

---

**ゲーミングツール** - 最高品質のゲーミングエフェクトを、ブラウザで。 