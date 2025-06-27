/**
 * Gaming Generator - Rainbow Pulse Effect Module
 * 虹色ピカピカエフェクトの処理を担当するモジュール
 */

import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { Config } from '../utils/config.js';
import { RainbowEffect } from './rainbow-effect.js';

/**
 * 虹色ピカピカエフェクト処理クラス
 */
export class RainbowPulseEffect {
    /**
     * ImageDataに虹色ピカピカエフェクトを適用
     * @param {ImageData} imageData - 対象のImageData
     * @param {Object} settings - エフェクト設定
     * @param {number} progress - アニメーション進行度（0-1）
     * @returns {ImageData} 処理済みImageData
     */
    static apply(imageData, settings = {}, progress = 0) {
        try {
            const {
                saturation = 100,
                gradientDirection = 'horizontal',
                gradientDensity = 7.0,
                speed = 5,
                pulseSpeed = 8,
                minIntensity = 0.3,
                maxIntensity = 1.0
            } = settings;

            const data = new Uint8ClampedArray(imageData.data);
            const width = imageData.width;
            const height = imageData.height;

            // 虹色パレット（RainbowEffectから取得）
            const adjustedColors = RainbowEffect._adjustColorsForSaturation(
                RainbowEffect.COLORS,
                saturation / 100
            );

            // 時間ベースのカラーシフト
            const normalizedTime = (progress * speed) % 1;
            const colorShift = normalizedTime * adjustedColors.length;

            // パルス強度計算（サイン波）
            const pulseTimeOffset = progress * pulseSpeed * 2 * Math.PI;
            const pulseIntensity = minIntensity + (maxIntensity - minIntensity) * 
                                  (Math.sin(pulseTimeOffset) * 0.5 + 0.5);

            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);

                // 透過ピクセルはスキップ
                if (data[i + 3] === 0) continue;

                // グラデーション位置計算
                const position = RainbowPulseEffect._calculateGradientPosition(
                    x, y, width, height, gradientDirection
                );

                // カラーインデックス計算（線形補間）
                const colorFloat = (position * gradientDensity + colorShift) % adjustedColors.length;
                const colorIndex = Math.floor(Math.abs(colorFloat)) % adjustedColors.length;
                const nextColorIndex = (colorIndex + 1) % adjustedColors.length;
                const blend = colorFloat - Math.floor(colorFloat);

                // 線形補間でスムーズなグラデーション
                const blendedColor = RainbowPulseEffect._interpolateColors(
                    adjustedColors[colorIndex],
                    adjustedColors[nextColorIndex],
                    blend
                );

                // 元画像の輝度を保持
                const originalR = data[i];
                const originalG = data[i + 1];
                const originalB = data[i + 2];

                const luminance = RainbowPulseEffect._calculateLuminance(originalR, originalG, originalB);
                const adjustedLuminance = Math.max(0.3, Math.min(1.0, luminance * 1.4)) * pulseIntensity;

                // 虹色に輝度とパルス強度を適用
                const targetR = blendedColor[0] * adjustedLuminance;
                const targetG = blendedColor[1] * adjustedLuminance;
                const targetB = blendedColor[2] * adjustedLuminance;

                // 彩度レベルでブレンド（パルス強度も考慮）
                const effectiveSaturation = (saturation / 100) * pulseIntensity;
                data[i] = Math.round(targetR * effectiveSaturation + originalR * (1 - effectiveSaturation));
                data[i + 1] = Math.round(targetG * effectiveSaturation + originalG * (1 - effectiveSaturation));
                data[i + 2] = Math.round(targetB * effectiveSaturation + originalB * (1 - effectiveSaturation));
            }

            return new ImageData(data, width, height);

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Rainbow Pulse effect processing failed',
                error,
                { settings, progress }
            ));
        }
    }

    /**
     * グラデーション位置を計算
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {string} direction - グラデーション方向
     * @returns {number} 位置（0-1）
     * @private
     */
    static _calculateGradientPosition(x, y, width, height, direction) {
        switch (direction) {
            case 'horizontal':
                return x / width;
            case 'vertical':
                return y / height;
            case 'diagonal1': // 左上から右下
                const centerX1 = width / 2;
                const centerY1 = height / 2;
                return ((x - centerX1) + (y - centerY1) + width + height) / (2 * (width + height));
            case 'diagonal2': // 右上から左下
                const centerX2 = width / 2;
                const centerY2 = height / 2;
                return ((centerX2 - x) + (y - centerY2) + width + height) / (2 * (width + height));
            default:
                return x / width;
        }
    }

    /**
     * 2つの色を線形補間
     * @param {Array} color1 - 開始色 [R, G, B]
     * @param {Array} color2 - 終了色 [R, G, B]
     * @param {number} t - 補間係数（0-1）
     * @returns {Array} 補間された色 [R, G, B]
     * @private
     */
    static _interpolateColors(color1, color2, t) {
        return [
            Math.round(color1[0] + (color2[0] - color1[0]) * t),
            Math.round(color1[1] + (color2[1] - color1[1]) * t),
            Math.round(color1[2] + (color2[2] - color1[2]) * t)
        ];
    }

    /**
     * RGB値から輝度を計算
     * @param {number} r - 赤成分（0-255）
     * @param {number} g - 緑成分（0-255）
     * @param {number} b - 青成分（0-255）
     * @returns {number} 輝度（0-1）
     * @private
     */
    static _calculateLuminance(r, g, b) {
        return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    }

    /**
     * エフェクト設定のバリデーション
     * @param {Object} settings - 設定オブジェクト
     * @returns {Object} 検証済み設定
     */
    static validateSettings(settings) {
        const validated = { ...settings };

        // 彩度の範囲チェック
        if (validated.saturation !== undefined) {
            validated.saturation = Math.max(0, Math.min(200, validated.saturation));
        }

        // グラデーション密度の範囲チェック
        if (validated.gradientDensity !== undefined) {
            validated.gradientDensity = Math.max(
                Config.GRADIENT.minDensity,
                Math.min(Config.GRADIENT.maxDensity, validated.gradientDensity)
            );
        }

        // グラデーション方向の検証
        if (validated.gradientDirection !== undefined) {
            if (!Config.GRADIENT.directions.includes(validated.gradientDirection)) {
                validated.gradientDirection = 'horizontal';
            }
        }

        // パルス強度の範囲チェック
        if (validated.minIntensity !== undefined) {
            validated.minIntensity = Math.max(0, Math.min(1, validated.minIntensity));
        }
        if (validated.maxIntensity !== undefined) {
            validated.maxIntensity = Math.max(0, Math.min(1, validated.maxIntensity));
        }

        return validated;
    }

    /**
     * エフェクトのプリセット設定
     */
    static PRESETS = {
        classic: {
            saturation: 100,
            gradientDirection: 'horizontal',
            gradientDensity: 7.0,
            speed: 5,
            pulseSpeed: 8,
            minIntensity: 0.3,
            maxIntensity: 1.0
        },
        subtle: {
            saturation: 80,
            gradientDirection: 'horizontal',
            gradientDensity: 5.0,
            speed: 3,
            pulseSpeed: 5,
            minIntensity: 0.5,
            maxIntensity: 0.8
        },
        intense: {
            saturation: 150,
            gradientDirection: 'diagonal1',
            gradientDensity: 10.0,
            speed: 8,
            pulseSpeed: 12,
            minIntensity: 0.1,
            maxIntensity: 1.0
        },
        slow: {
            saturation: 100,
            gradientDirection: 'horizontal',
            gradientDensity: 7.0,
            speed: 2,
            pulseSpeed: 4,
            minIntensity: 0.4,
            maxIntensity: 1.0
        }
    };
}