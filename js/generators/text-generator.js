/**
 * Gaming Generator - Text Generator Module
 * テキスト生成機能の基本処理を担当するモジュール
 */

import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { CanvasUtils } from '../utils/canvas-utils.js';
import { Config } from '../utils/config.js';

/**
 * テキスト生成クラス
 */
export class TextGenerator {
    /**
     * キャンバスにテキストを描画
     * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
     * @param {Object} settings - テキスト設定
     */
    static drawText(ctx, settings) {
        try {
            const {
                text = 'GAMING',
                fontSize = 32,
                fontFamily = 'Arial',
                bold = false,
                stretch = true,
                glow = false,
                transparentBg = true
            } = settings;

            const canvas = ctx.canvas;
            const width = canvas.width;
            const height = canvas.height;

            // 背景をクリア
            if (transparentBg) {
                CanvasUtils.clearCanvas(ctx);
            } else {
                CanvasUtils.clearCanvas(ctx, '#FFFFFF');
            }

            // フォント設定
            const weight = bold ? 'bold' : 'normal';
            ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // グロー効果
            if (glow) {
                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            const centerX = width / 2;
            const centerY = height / 2;

            // テキストを行ごとに分割
            const lines = text.split('\n');
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = centerY - totalHeight / 2 + lineHeight / 2;

            lines.forEach((line, index) => {
                const y = startY + index * lineHeight;
                
                if (stretch) {
                    // テキストを引き伸ばし描画
                    TextGenerator._drawStretchedText(ctx, line, centerX, y, width * 0.9);
                } else {
                    // 通常描画
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(line, centerX, y);
                }
            });

            // グロー効果をリセット
            if (glow) {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Text drawing failed',
                error,
                settings
            ));
        }
    }

    /**
     * 画像をキャンバスに描画（フィット）
     * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
     * @param {HTMLImageElement} image - 画像
     * @param {Object} options - オプション
     */
    static drawImage(ctx, image, options = {}) {
        try {
            const { transparentBg = true } = options;
            const canvas = ctx.canvas;

            // 背景をクリア
            if (transparentBg) {
                CanvasUtils.clearCanvas(ctx);
            } else {
                CanvasUtils.clearCanvas(ctx, '#FFFFFF');
            }

            // 画像をフィットさせて描画
            const { drawX, drawY, drawWidth, drawHeight } = CanvasUtils.calculateFitSize(
                image.width,
                image.height,
                canvas.width,
                canvas.height
            );

            ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Image drawing failed',
                error,
                { imageSize: { width: image.width, height: image.height }, options }
            ));
        }
    }

    /**
     * テキストを指定幅に引き伸ばして描画
     * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
     * @param {string} text - テキスト
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} targetWidth - 目標幅
     * @private
     */
    static _drawStretchedText(ctx, text, x, y, targetWidth) {
        if (!text.trim()) return;

        // テキストの実際の幅を測定
        const metrics = ctx.measureText(text);
        const actualWidth = metrics.width;

        if (actualWidth === 0) return;

        // 横方向のスケール計算
        const scaleX = targetWidth / actualWidth;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    /**
     * テキスト設定のバリデーション
     * @param {Object} settings - テキスト設定
     * @returns {Object} 検証済み設定
     */
    static validateSettings(settings) {
        const validated = { ...settings };

        // フォントサイズの範囲チェック
        if (validated.fontSize !== undefined) {
            validated.fontSize = Math.max(8, Math.min(500, validated.fontSize));
        }

        // テキストの文字数制限
        if (validated.text !== undefined && typeof validated.text === 'string') {
            validated.text = validated.text.substring(0, 1000); // 1000文字制限
        }

        return validated;
    }

    /**
     * フォント読み込み状況をチェック
     * @param {string} fontFamily - フォントファミリー
     * @returns {Promise<boolean>} 読み込み完了フラグ
     */
    static async checkFontLoaded(fontFamily) {
        try {
            if (!document.fonts) return true; // 古いブラウザでは常にtrue
            
            await document.fonts.ready;
            return document.fonts.check(`16px ${fontFamily}`);
        } catch (error) {
            return true; // エラーの場合は読み込み済みとして扱う
        }
    }

    /**
     * テキストの描画に必要なサイズを計算
     * @param {string} text - テキスト
     * @param {Object} settings - テキスト設定
     * @returns {Object} 必要サイズ
     */
    static calculateTextSize(text, settings) {
        const {
            fontSize = 32,
            fontFamily = 'Arial',
            bold = false
        } = settings;

        // 仮のキャンバスで測定
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        const weight = bold ? 'bold' : 'normal';
        tempCtx.font = `${weight} ${fontSize}px ${fontFamily}`;

        const lines = text.split('\n');
        let maxWidth = 0;
        
        lines.forEach(line => {
            const metrics = tempCtx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        });

        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;

        return {
            width: Math.ceil(maxWidth),
            height: Math.ceil(totalHeight),
            lineHeight,
            lineCount: lines.length
        };
    }

    /**
     * 推奨キャンバスサイズを計算
     * @param {string} text - テキスト
     * @param {Object} settings - テキスト設定
     * @returns {Object} 推奨サイズ
     */
    static calculateRecommendedCanvasSize(text, settings) {
        const textSize = TextGenerator.calculateTextSize(text, settings);
        
        // テキストサイズに余白を追加
        const padding = Math.max(20, settings.fontSize * 0.5);
        
        let width = textSize.width + padding * 2;
        let height = textSize.height + padding * 2;
        
        // 最小・最大サイズの制限
        width = Math.max(Config.CANVAS.minWidth, Math.min(Config.CANVAS.maxWidth, width));
        height = Math.max(Config.CANVAS.minHeight, Math.min(Config.CANVAS.maxHeight, height));
        
        // 2の倍数に調整（GIF生成の互換性のため）
        width = Math.round(width / 2) * 2;
        height = Math.round(height / 2) * 2;
        
        return { width, height };
    }
}