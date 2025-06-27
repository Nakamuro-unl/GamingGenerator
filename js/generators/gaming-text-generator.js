/**
 * Gaming Generator - Gaming Text Generator Module
 * ゲーミングテキスト生成機能の統合クラス
 */

import { TextGenerator } from './text-generator.js';
import { GIFProcessor } from './gif-processor.js';
import { EffectManager } from '../effects/effect-manager.js';
import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { CanvasUtils } from '../utils/canvas-utils.js';
import { Config } from '../utils/config.js';

/**
 * ゲーミングテキストジェネレーター統合クラス
 */
export class GamingTextGenerator {
    /**
     * コンストラクタ
     * @param {HTMLCanvasElement} mainCanvas - メインキャンバス
     * @param {Object} previewCanvases - プレビューキャンバス群
     */
    constructor(mainCanvas, previewCanvases = {}) {
        this.textCanvas = mainCanvas;
        this.textCtx = CanvasUtils.setupCanvas(mainCanvas, 128, 128);
        
        this.previewCanvases = previewCanvases;
        this.setupPreviewCanvases();
        
        // アニメーション管理
        this.animationRunning = false;
        this.animationFrame = null;
        this.startTime = null;
        this.capturedFrames = [];
        
        // 作成モード
        this.creationMode = 'text'; // 'text' or 'image'
        this.uploadedImage = null;
        this.gifProcessor = new GIFProcessor();
        
        // 設定
        this.settings = this.getDefaultSettings();
        
        // UI状態
        this.isUIBlocked = false;
    }

    /**
     * プレビューキャンバスの初期化
     * @private
     */
    setupPreviewCanvases() {
        Object.values(this.previewCanvases).forEach(canvas => {
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        });
    }

    /**
     * デフォルト設定を取得
     * @returns {Object} デフォルト設定
     * @private
     */
    getDefaultSettings() {
        return {
            // テキスト設定
            text: 'GAMING',
            fontSize: 32,
            fontFamily: 'Arial',
            bold: false,
            
            // キャンバス設定
            canvasWidth: 128,
            canvasHeight: 128,
            transparentBg: true,
            stretch: true,
            glow: false,
            
            // アニメーション設定
            animationMode: 'rainbow',
            gradientDirection: 'horizontal',
            animationSpeed: 5,
            saturation: 100,
            gradientDensity: 7,
            baseColor: '#FF0000'
        };
    }

    /**
     * 設定を更新
     * @param {Object} newSettings - 新しい設定
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // キャンバスサイズが変更された場合
        if (newSettings.canvasWidth || newSettings.canvasHeight) {
            this.updateCanvasSize();
        }
    }

    /**
     * キャンバスサイズを更新
     * @private
     */
    updateCanvasSize() {
        const { canvasWidth, canvasHeight } = this.settings;
        this.textCtx = CanvasUtils.setupCanvas(this.textCanvas, canvasWidth, canvasHeight);
    }

    /**
     * 作成モードを変更
     * @param {string} mode - 作成モード ('text' or 'image')
     */
    setCreationMode(mode) {
        this.creationMode = mode;
        this.stopAnimation();
        
        if (mode === 'image' && this.uploadedImage) {
            this.drawStaticGifPreview();
        }
    }

    /**
     * 画像をアップロード
     * @param {File} file - 画像ファイル
     */
    async uploadImage(file) {
        try {
            ErrorHandler.validateFile(file, {
                allowedTypes: Config.GIF.supportedFormats,
                maxSize: Config.GIF.maxFileSize
            });

            if (file.type === 'image/gif') {
                await this.loadGifImage(file);
            } else {
                await this.loadStaticImage(file);
            }

        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    /**
     * 静止画像を読み込み
     * @param {File} file - 画像ファイル
     * @private
     */
    async loadStaticImage(file) {
        const img = new Image();
        const url = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });

        this.uploadedImage = img;
        this.gifProcessor.dispose();
        
        URL.revokeObjectURL(url);
        
        if (this.creationMode === 'image') {
            this.generate();
        }
    }

    /**
     * GIF画像を読み込み
     * @param {File} file - GIFファイル
     * @private
     */
    async loadGifImage(file) {
        const frameInfo = await this.gifProcessor.extractFrames(file);
        
        // 最初のフレームを静止画として設定
        const firstFrameImageData = this.gifProcessor.getFrameImageData(0);
        if (firstFrameImageData) {
            const img = this.imageDataToImage(firstFrameImageData);
            this.uploadedImage = img;
        }
        
        if (this.creationMode === 'image') {
            this.drawStaticGifPreview();
        }
    }

    /**
     * ImageDataをImage要素に変換
     * @param {ImageData} imageData - ImageData
     * @returns {HTMLImageElement} Image要素
     * @private
     */
    imageDataToImage(imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    /**
     * 静的GIFプレビューを描画
     * @private
     */
    drawStaticGifPreview() {
        if (!this.uploadedImage) return;

        // メインキャンバスに静的プレビューを描画
        TextGenerator.drawImage(this.textCtx, this.uploadedImage, {
            transparentBg: this.settings.transparentBg
        });

        // プレビューキャンバスに説明テキストを描画
        this.drawGifPreviewMessage();
    }

    /**
     * GIFプレビューメッセージを描画
     * @private
     */
    drawGifPreviewMessage() {
        const canvas = this.textCanvas;
        const ctx = this.textCtx;

        // オーバーレイ描画
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GIFで保存でアニメーション生成', canvas.width / 2, canvas.height - 20);
        ctx.restore();
    }

    /**
     * プレビューを生成
     */
    generate() {
        try {
            this.stopAnimation();

            if (this.creationMode === 'text') {
                this.generateTextPreview();
            } else if (this.creationMode === 'image') {
                if (this.gifProcessor.getFrameCount() > 1) {
                    this.drawStaticGifPreview();
                } else if (this.uploadedImage) {
                    this.generateImagePreview();
                }
            }

            this.updateAllPreviews();

        } catch (error) {
            ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Preview generation failed',
                error,
                { creationMode: this.creationMode, settings: this.settings }
            ));
        }
    }

    /**
     * テキストプレビューを生成
     * @private
     */
    generateTextPreview() {
        const { text, animationMode } = this.settings;
        
        if (!text.trim()) {
            CanvasUtils.clearCanvas(this.textCtx);
            return;
        }

        // 静止画として描画
        TextGenerator.drawText(this.textCtx, this.settings);
        
        // エフェクトを適用
        this.applyEffect(animationMode, 0);
    }

    /**
     * 画像プレビューを生成
     * @private
     */
    generateImagePreview() {
        if (!this.uploadedImage) return;

        // 画像を描画
        TextGenerator.drawImage(this.textCtx, this.uploadedImage, {
            transparentBg: this.settings.transparentBg
        });
        
        // エフェクトを適用
        this.applyEffect(this.settings.animationMode, 0);
    }

    /**
     * エフェクトを適用
     * @param {string} effectType - エフェクトタイプ
     * @param {number} progress - 進行度（0-1）
     * @private
     */
    applyEffect(effectType, progress) {
        if (!EffectManager.isEffectAvailable(effectType)) return;

        const imageData = CanvasUtils.getImageDataSafe(this.textCtx);
        if (!imageData) return;

        const effectSettings = this.getEffectSettings();
        const processedImageData = EffectManager.applyEffect(
            effectType,
            imageData,
            effectSettings,
            progress
        );

        CanvasUtils.putImageDataSafe(this.textCtx, processedImageData);
    }

    /**
     * エフェクト設定を取得
     * @returns {Object} エフェクト設定
     * @private
     */
    getEffectSettings() {
        return {
            saturation: this.settings.saturation,
            gradientDirection: this.settings.gradientDirection,
            gradientDensity: this.settings.gradientDensity,
            speed: this.settings.animationSpeed,
            baseColor: this.hexToRgb(this.settings.baseColor)
        };
    }

    /**
     * 16進数色をRGBに変換
     * @param {string} hex - 16進数色
     * @returns {Array} RGB配列
     * @private
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 0, 0];
    }

    /**
     * 全プレビューを更新
     * @private
     */
    updateAllPreviews() {
        // テーマプレビュー更新
        this.updateThemePreviews();
        
        // Slackプレビュー更新
        this.updateSlackPreviews();
    }

    /**
     * テーマプレビューを更新
     * @private
     */
    updateThemePreviews() {
        const { lightCanvas, darkCanvas } = this.previewCanvases;
        
        if (lightCanvas && darkCanvas) {
            this.copyCanvasContent(this.textCanvas, lightCanvas);
            this.copyCanvasContent(this.textCanvas, darkCanvas);
        }
    }

    /**
     * Slackプレビューを更新
     * @private
     */
    updateSlackPreviews() {
        const slackCanvases = [
            this.previewCanvases.slack32Light,
            this.previewCanvases.slack32Dark,
            this.previewCanvases.slack64Light,
            this.previewCanvases.slack64Dark
        ];

        slackCanvases.forEach(canvas => {
            if (canvas) {
                this.copyCanvasContent(this.textCanvas, canvas);
            }
        });
    }

    /**
     * キャンバス内容をコピー
     * @param {HTMLCanvasElement} source - ソースキャンバス
     * @param {HTMLCanvasElement} target - ターゲットキャンバス
     * @private
     */
    copyCanvasContent(source, target) {
        const ctx = target.getContext('2d');
        ctx.clearRect(0, 0, target.width, target.height);
        ctx.drawImage(source, 0, 0, target.width, target.height);
    }

    /**
     * アニメーションを開始
     */
    startAnimation() {
        this.stopAnimation();
        this.animationRunning = true;
        this.startTime = performance.now();
        
        const animate = (currentTime) => {
            if (!this.animationRunning) return;
            
            const elapsed = currentTime - this.startTime;
            const progress = (elapsed * 0.001) % 1; // 1秒でループ
            
            this.generateFrame(progress);
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * アニメーションを停止
     */
    stopAnimation() {
        this.animationRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * フレームを生成
     * @param {number} progress - 進行度（0-1）
     * @private
     */
    generateFrame(progress) {
        if (this.creationMode === 'text') {
            this.generateTextPreview();
        } else if (this.creationMode === 'image' && this.uploadedImage) {
            this.generateImagePreview();
        }
        
        this.applyEffect(this.settings.animationMode, progress);
        this.updateAllPreviews();
    }

    /**
     * UIをブロック/アンブロック
     * @param {boolean} blocked - ブロック状態
     */
    setUIBlocked(blocked) {
        this.isUIBlocked = blocked;
        
        // ボタンの有効/無効を切り替え
        const buttons = [
            document.getElementById('textGenerateBtn'),
            document.getElementById('textDownloadBtn'),
            document.getElementById('textDownloadGifBtn')
        ];
        
        buttons.forEach(btn => {
            if (btn) btn.disabled = blocked;
        });
    }

    /**
     * GIF生成（サーバーサイド）
     * @returns {Promise<Blob>} 生成されたGIF
     */
    async generateGif() {
        try {
            this.setUIBlocked(true);

            if (this.creationMode === 'image' && this.gifProcessor.getFrameCount() > 1) {
                // GIFアニメーションの場合はサーバーで処理
                const gifFile = await this.getCurrentGifFile();
                const settings = this.getEffectSettings();
                settings.animation_type = this.settings.animationMode;
                
                return await GIFProcessor.processGifOnServer(gifFile, settings);
            } else {
                // 静的コンテンツの場合はクライアントで処理
                return await this.generateStaticGif();
            }

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'GIF generation failed',
                error,
                { creationMode: this.creationMode, settings: this.settings }
            ));
        } finally {
            this.setUIBlocked(false);
        }
    }

    /**
     * 現在のGIFファイルを取得
     * @returns {File} GIFファイル
     * @private
     */
    async getCurrentGifFile() {
        // 実装では、アップロードされたGIFファイルを返す
        // 簡易実装のため、ダミーファイルを返す
        return new File([''], 'dummy.gif', { type: 'image/gif' });
    }

    /**
     * 静的GIFを生成
     * @returns {Promise<Blob>} 生成されたGIF
     * @private
     */
    async generateStaticGif() {
        // gif.jsライブラリを使用してクライアントでGIF生成
        // 実装では、複数フレームを生成してGIFを作成
        return CanvasUtils.canvasToBlob(this.textCanvas, 'image/gif');
    }

    /**
     * PNG画像をダウンロード
     */
    async downloadPng() {
        try {
            const blob = await CanvasUtils.canvasToBlob(this.textCanvas, 'image/png');
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'gaming-text.png';
            link.click();
            
            URL.revokeObjectURL(url);

        } catch (error) {
            ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'PNG download failed',
                error
            ));
        }
    }

    /**
     * リソースをクリーンアップ
     */
    dispose() {
        this.stopAnimation();
        this.gifProcessor.dispose();
        this.uploadedImage = null;
        this.capturedFrames = [];
    }
}