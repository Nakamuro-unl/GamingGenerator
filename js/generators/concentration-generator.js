/**
 * Gaming Generator - Concentration Line Generator Module
 * 集中線ジェネレーターの機能を分離したモジュール
 */

import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { CanvasUtils } from '../utils/canvas-utils.js';
import { Config } from '../utils/config.js';

/**
 * 集中線ジェネレーター クラス
 */
export class ConcentrationLineGenerator {
    /**
     * コンストラクタ
     * @param {HTMLCanvasElement} canvas - 描画用Canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = CanvasUtils.setupCanvas(canvas, Config.CANVAS.width, Config.CANVAS.height);
        this.backgroundImage = null;
        this.animationId = null;
        this.isAnimating = false;
        
        this.settings = {
            lineCount: 150,
            lineWidth: 6,
            colorMode: 'single',
            lineColor: '#000000',
            darkBackground: 'original',
            centerX: 50,
            centerY: 50,
            centerSize: 40,
            animationMode: 'static',
            animationSpeed: 5,
            gifSizeMode: 'original',
            gifWidth: 768,
            gifHeight: 768
        };

        this.initializeEventListeners();
    }

    /**
     * イベントリスナーの初期化
     * @private
     */
    initializeEventListeners() {
        // Canvasクリックで中心点設定
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            this.updateSettings({ centerX: x, centerY: y });
            this.updateCenterDisplayValues();
            this.generate();
        });
    }

    /**
     * 設定を更新
     * @param {Object} newSettings - 新しい設定
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * 背景画像を設定
     * @param {HTMLImageElement} image - 背景画像
     */
    setBackgroundImage(image) {
        this.backgroundImage = image;
        
        if (image) {
            // 画像のアスペクト比に合わせてCanvasサイズを調整
            const maxSize = 800;
            let canvasWidth, canvasHeight;
            
            if (image.width > image.height) {
                canvasWidth = Math.min(maxSize, image.width);
                canvasHeight = (canvasWidth / image.width) * image.height;
            } else {
                canvasHeight = Math.min(maxSize, image.height);
                canvasWidth = (canvasHeight / image.height) * image.width;
            }
            
            this.ctx = CanvasUtils.setupCanvas(this.canvas, canvasWidth, canvasHeight);
        }
    }

    /**
     * 集中線を生成
     */
    generate() {
        try {
            this.stopAnimation();
            
            if (this.settings.animationMode === 'animated') {
                this.startAnimation();
            } else {
                this.drawFrame(0);
            }
        } catch (error) {
            ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Concentration line generation failed',
                error,
                this.settings
            ));
        }
    }

    /**
     * 単一フレームを描画
     * @param {number} time - 時間（アニメーション用）
     * @private
     */
    drawFrame(time = 0) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 背景を描画
        this.drawBackground();
        
        // 中心点計算
        const centerX = (this.settings.centerX / 100) * width;
        const centerY = (this.settings.centerY / 100) * height;
        
        // 集中線を描画
        this.drawConcentrationLines(centerX, centerY, time);
    }

    /**
     * 背景を描画
     * @private
     */
    drawBackground() {
        CanvasUtils.clearCanvas(this.ctx);
        
        if (this.backgroundImage) {
            if (this.settings.darkBackground === 'dark') {
                // 黒背景
                CanvasUtils.clearCanvas(this.ctx, '#000000');
                // 画像を半透明で描画
                this.ctx.globalAlpha = 0.3;
                this.drawBackgroundImage();
                this.ctx.globalAlpha = 1.0;
            } else {
                // 元画像背景
                this.drawBackgroundImage();
            }
        } else {
            // 背景なしの場合は白背景
            CanvasUtils.clearCanvas(this.ctx, '#FFFFFF');
        }
    }

    /**
     * 背景画像を描画
     * @private
     */
    drawBackgroundImage() {
        if (!this.backgroundImage) return;
        
        const { drawX, drawY, drawWidth, drawHeight } = CanvasUtils.calculateFitSize(
            this.backgroundImage.width,
            this.backgroundImage.height,
            this.canvas.width,
            this.canvas.height
        );
        
        this.ctx.drawImage(this.backgroundImage, drawX, drawY, drawWidth, drawHeight);
    }

    /**
     * 集中線を描画
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} time - 時間（アニメーション用）
     * @private
     */
    drawConcentrationLines(centerX, centerY, time) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const lineCount = this.settings.lineCount;
        const lineWidth = this.settings.lineWidth;
        const centerSize = this.settings.centerSize;
        
        // 描画領域の最大半径を計算
        const maxRadius = Math.sqrt(width * width + height * height);
        
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * 2 * Math.PI;
            
            // 線の開始点（中心から一定距離）
            const startRadius = centerSize;
            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            
            // 線の終了点（画面端まで）
            const endX = centerX + Math.cos(angle) * maxRadius;
            const endY = centerY + Math.sin(angle) * maxRadius;
            
            // 色を設定
            this.setLineColor(i, lineCount, time);
            
            // 線を描画
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    /**
     * 線の色を設定
     * @param {number} lineIndex - 線のインデックス
     * @param {number} totalLines - 総線数
     * @param {number} time - 時間（アニメーション用）
     * @private
     */
    setLineColor(lineIndex, totalLines, time) {
        const colorMode = this.settings.colorMode;
        const animationSpeed = this.settings.animationSpeed;
        
        switch (colorMode) {
            case 'single':
                this.ctx.strokeStyle = this.settings.lineColor;
                break;
                
            case 'rainbow':
                const rainbowColors = [
                    '#FF0000', '#FF8000', '#FFFF00', '#00FF00',
                    '#0080FF', '#4000FF', '#8000FF'
                ];
                const rainbowOffset = this.settings.animationMode === 'animated' ? 
                    (time * animationSpeed * 0.01) % 1 : 0;
                const rainbowIndex = ((lineIndex / totalLines) + rainbowOffset) % 1;
                this.ctx.strokeStyle = this.interpolateColors(rainbowColors, rainbowIndex);
                break;
                
            case 'bluepurplepink':
                const bppColors = ['#0080FF', '#4000FF', '#8000FF', '#FF00C0', '#FF0080'];
                const bppOffset = this.settings.animationMode === 'animated' ? 
                    (time * animationSpeed * 0.01) % 1 : 0;
                const bppIndex = ((lineIndex / totalLines) + bppOffset) % 1;
                this.ctx.strokeStyle = this.interpolateColors(bppColors, bppIndex);
                break;
                
            case 'golden':
                const goldenColors = ['#FFD700', '#FFC125', '#FFA500', '#DA9532', '#FF8C00'];
                const goldenOffset = this.settings.animationMode === 'animated' ? 
                    (time * animationSpeed * 0.01) % 1 : 0;
                const goldenIndex = ((lineIndex / totalLines) + goldenOffset) % 1;
                this.ctx.strokeStyle = this.interpolateColors(goldenColors, goldenIndex);
                break;
                
            default:
                this.ctx.strokeStyle = this.settings.lineColor;
        }
    }

    /**
     * 色配列から指定位置の色を補間して取得
     * @param {string[]} colors - 色配列
     * @param {number} position - 位置（0-1）
     * @returns {string} 補間された色
     * @private
     */
    interpolateColors(colors, position) {
        const scaledPosition = position * (colors.length - 1);
        const index = Math.floor(scaledPosition);
        const nextIndex = Math.min(index + 1, colors.length - 1);
        const blend = scaledPosition - index;
        
        if (blend === 0) {
            return colors[index];
        }
        
        // 16進数色をRGBに変換して補間
        const color1 = this.hexToRgb(colors[index]);
        const color2 = this.hexToRgb(colors[nextIndex]);
        
        const r = Math.round(color1.r + (color2.r - color1.r) * blend);
        const g = Math.round(color1.g + (color2.g - color1.g) * blend);
        const b = Math.round(color1.b + (color2.b - color1.b) * blend);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 16進数色をRGBに変換
     * @param {string} hex - 16進数色
     * @returns {Object} RGB値
     * @private
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * アニメーションを開始
     * @private
     */
    startAnimation() {
        this.isAnimating = true;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            if (!this.isAnimating) return;
            
            const elapsed = currentTime - startTime;
            this.drawFrame(elapsed);
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    /**
     * アニメーションを停止
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * GIFサイズ設定を取得
     * @returns {Object} 幅と高さ
     */
    getGifSize() {
        const sizeMode = this.settings.gifSizeMode;
        
        switch (sizeMode) {
            case 'small':
                return { width: 512, height: 512 };
            case 'custom':
                return { 
                    width: this.settings.gifWidth, 
                    height: this.settings.gifHeight 
                };
            case 'original':
            default:
                return { 
                    width: this.canvas.width, 
                    height: this.canvas.height 
                };
        }
    }

    /**
     * 中心点表示値を更新（UI連携用）
     */
    updateCenterDisplayValues() {
        const centerXElement = document.getElementById('centerXValue');
        const centerYElement = document.getElementById('centerYValue');
        
        if (centerXElement) {
            centerXElement.textContent = `${Math.round(this.settings.centerX)}%`;
        }
        if (centerYElement) {
            centerYElement.textContent = `${Math.round(this.settings.centerY)}%`;
        }
    }

    /**
     * 現在の設定を取得
     * @returns {Object} 設定オブジェクト
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Canvas内容をBlob形式で取得
     * @param {string} mimeType - MIME形式
     * @returns {Promise<Blob>} Blob
     */
    async toBlob(mimeType = 'image/png') {
        return CanvasUtils.canvasToBlob(this.canvas, mimeType);
    }

    /**
     * リソースをクリーンアップ
     */
    dispose() {
        this.stopAnimation();
        this.backgroundImage = null;
    }
}