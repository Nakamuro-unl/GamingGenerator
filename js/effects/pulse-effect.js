/**
 * Gaming Generator - Pulse Effect Module
 * ピカピカ点滅エフェクトの処理を担当するモジュール
 */

import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { Config } from '../utils/config.js';

/**
 * ピカピカ点滅エフェクト処理クラス
 */
export class PulseEffect {
    /**
     * ImageDataにピカピカ点滅エフェクトを適用
     * @param {ImageData} imageData - 対象のImageData
     * @param {Object} settings - エフェクト設定
     * @param {number} progress - アニメーション進行度（0-1）
     * @returns {ImageData} 処理済みImageData
     */
    static apply(imageData, settings = {}, progress = 0) {
        try {
            const {
                saturation = 100,
                baseColor = [255, 0, 0], // デフォルトは赤
                speed = 5,
                minIntensity = 0.3,
                maxIntensity = 1.0
            } = settings;

            const data = new Uint8ClampedArray(imageData.data);
            const width = imageData.width;
            const height = imageData.height;

            // 時間ベースの強度計算（サイン波）
            const timeOffset = progress * speed * 2 * Math.PI;
            const intensity = minIntensity + (maxIntensity - minIntensity) * 
                            (Math.sin(timeOffset) * 0.5 + 0.5);

            // ベースカラーを彩度に基づいて調整
            const adjustedBaseColor = PulseEffect._adjustColorForSaturation(
                baseColor,
                saturation / 100
            );

            for (let i = 0; i < data.length; i += 4) {
                // 透過ピクセルはスキップ
                if (data[i + 3] === 0) continue;

                // 元画像の輝度を保持
                const originalR = data[i];
                const originalG = data[i + 1];
                const originalB = data[i + 2];

                const luminance = PulseEffect._calculateLuminance(originalR, originalG, originalB);
                const adjustedLuminance = Math.max(0.2, Math.min(1.0, luminance * 1.3));

                // ベース色に輝度と強度を適用
                const targetR = adjustedBaseColor[0] * adjustedLuminance * intensity;
                const targetG = adjustedBaseColor[1] * adjustedLuminance * intensity;
                const targetB = adjustedBaseColor[2] * adjustedLuminance * intensity;

                // 彩度レベルでブレンド
                const saturationLevel = (saturation / 100) * intensity;
                data[i] = Math.round(targetR * saturationLevel + originalR * (1 - saturationLevel));
                data[i + 1] = Math.round(targetG * saturationLevel + originalG * (1 - saturationLevel));
                data[i + 2] = Math.round(targetB * saturationLevel + originalB * (1 - saturationLevel));
            }

            return new ImageData(data, width, height);

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Pulse effect processing failed',
                error,
                { settings, progress }
            ));
        }
    }

    /**
     * 彩度に基づいて色を調整
     * @param {Array} color - 元の色 [R, G, B]
     * @param {number} saturationFactor - 彩度係数（0-2）
     * @returns {Array} 調整済み色 [R, G, B]
     * @private
     */
    static _adjustColorForSaturation(color, saturationFactor) {
        if (saturationFactor === 1.0) return color;

        return [
            Math.round(color[0] * saturationFactor + 128 * (1 - saturationFactor)),
            Math.round(color[1] * saturationFactor + 128 * (1 - saturationFactor)),
            Math.round(color[2] * saturationFactor + 128 * (1 - saturationFactor))
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

        // 強度の範囲チェック
        if (validated.minIntensity !== undefined) {
            validated.minIntensity = Math.max(0, Math.min(1, validated.minIntensity));
        }
        if (validated.maxIntensity !== undefined) {
            validated.maxIntensity = Math.max(0, Math.min(1, validated.maxIntensity));
        }

        // 速度の範囲チェック
        if (validated.speed !== undefined) {
            validated.speed = Math.max(
                Config.ANIMATION.minSpeed,
                Math.min(Config.ANIMATION.maxSpeed, validated.speed)
            );
        }

        return validated;
    }

    /**
     * エフェクトのプリセット設定
     */
    static PRESETS = {
        classic: {
            saturation: 100,
            baseColor: [255, 0, 0],
            speed: 5,
            minIntensity: 0.3,
            maxIntensity: 1.0
        },
        subtle: {
            saturation: 70,
            baseColor: [255, 0, 0],
            speed: 3,
            minIntensity: 0.5,
            maxIntensity: 0.8
        },
        intense: {
            saturation: 150,
            baseColor: [255, 0, 0],
            speed: 8,
            minIntensity: 0.1,
            maxIntensity: 1.0
        },
        slow: {
            saturation: 100,
            baseColor: [255, 0, 0],
            speed: 2,
            minIntensity: 0.4,
            maxIntensity: 1.0
        }
    };
}