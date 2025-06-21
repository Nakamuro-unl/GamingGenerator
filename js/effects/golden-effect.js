/**
 * Gaming Generator - Golden Effect Module
 * 金ピカエフェクトの処理を担当するモジュール
 */

import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { Config } from '../utils/config.js';

/**
 * 金ピカエフェクト処理クラス
 */
export class GoldenEffect {
    /**
     * 金色パレット（グラデーション）
     */
    static COLORS = [
        [255, 215, 0],   // ゴールド
        [255, 193, 37],  // 明るい金
        [255, 165, 0],   // オレンジゴールド
        [218, 165, 32],  // ダークゴールド
        [255, 140, 0],   // ダークオレンジ
        [255, 215, 0]    // ゴールド（ループ）
    ];

    /**
     * ImageDataに金ピカエフェクトを適用
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
                speed = 5
            } = settings;

            const data = new Uint8ClampedArray(imageData.data);
            const width = imageData.width;
            const height = imageData.height;

            // 彩度調整されたカラーパレット
            const adjustedColors = GoldenEffect._adjustColorsForSaturation(
                GoldenEffect.COLORS,
                saturation / 100
            );

            // 時間ベースのカラーシフト
            const normalizedTime = (progress * speed) % 1;
            const colorShift = normalizedTime * adjustedColors.length;

            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);

                // 透過ピクセルはスキップ
                if (data[i + 3] === 0) continue;

                // グラデーション位置計算
                const position = GoldenEffect._calculateGradientPosition(
                    x, y, width, height, gradientDirection
                );

                // カラーインデックス計算（線形補間）
                const colorFloat = (position * gradientDensity + colorShift) % adjustedColors.length;
                const colorIndex = Math.floor(Math.abs(colorFloat)) % adjustedColors.length;
                const nextColorIndex = (colorIndex + 1) % adjustedColors.length;
                const blend = colorFloat - Math.floor(colorFloat);

                // 線形補間でスムーズなグラデーション
                const blendedColor = GoldenEffect._interpolateColors(
                    adjustedColors[colorIndex],
                    adjustedColors[nextColorIndex],
                    blend
                );

                // 元画像の輝度を保持
                const originalR = data[i];
                const originalG = data[i + 1];
                const originalB = data[i + 2];

                const luminance = GoldenEffect._calculateLuminance(originalR, originalG, originalB);
                const adjustedLuminance = Math.max(0.3, Math.min(1.0, luminance * 1.2));

                // 金色に輝度を適用
                const targetR = blendedColor[0] * adjustedLuminance;
                const targetG = blendedColor[1] * adjustedLuminance;
                const targetB = blendedColor[2] * adjustedLuminance;

                // 彩度レベルでブレンド
                const saturationLevel = saturation / 100;
                data[i] = Math.round(targetR * saturationLevel + originalR * (1 - saturationLevel));
                data[i + 1] = Math.round(targetG * saturationLevel + originalG * (1 - saturationLevel));
                data[i + 2] = Math.round(targetB * saturationLevel + originalB * (1 - saturationLevel));
            }

            return new ImageData(data, width, height);

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                'Golden effect processing failed',
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
     * 彩度に基づいてカラーパレットを調整
     * @param {Array} colors - 元のカラーパレット
     * @param {number} saturationFactor - 彩度係数（0-2）
     * @returns {Array} 調整済みカラーパレット
     * @private
     */
    static _adjustColorsForSaturation(colors, saturationFactor) {
        if (saturationFactor === 1.0) return colors;

        return colors.map(color => [
            Math.round(color[0] * saturationFactor + 128 * (1 - saturationFactor)),
            Math.round(color[1] * saturationFactor + 128 * (1 - saturationFactor)),
            Math.round(color[2] * saturationFactor + 128 * (1 - saturationFactor))
        ]);
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
            speed: 5
        },
        subtle: {
            saturation: 70,
            gradientDirection: 'horizontal',
            gradientDensity: 5.0,
            speed: 3
        },
        intense: {
            saturation: 130,
            gradientDirection: 'diagonal1',
            gradientDensity: 10.0,
            speed: 8
        },
        vertical: {
            saturation: 100,
            gradientDirection: 'vertical',
            gradientDensity: 7.0,
            speed: 5
        }
    };
}