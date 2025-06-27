/**
 * Gaming Generator - Effect Manager
 * 全エフェクトの統一管理を行うモジュール
 */

import { RainbowEffect } from './rainbow-effect.js';
import { GoldenEffect } from './golden-effect.js';
import { BluePurplePinkEffect } from './bluepurplepink-effect.js';
import { PulseEffect } from './pulse-effect.js';
import { RainbowPulseEffect } from './rainbow-pulse-effect.js';
import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';

/**
 * エフェクト管理クラス
 * 全てのエフェクトへの統一インターフェースを提供
 */
export class EffectManager {
    /**
     * 利用可能なエフェクトタイプ
     */
    static EFFECT_TYPES = {
        RAINBOW: 'rainbow',
        GOLDEN: 'golden',
        BLUE_PURPLE_PINK: 'bluepurplepink',
        PULSE: 'pulse',
        RAINBOW_PULSE: 'rainbowPulse',
        CONCENTRATION: 'concentration'
    };

    /**
     * エフェクトクラスのマッピング
     */
    static EFFECT_CLASSES = {
        [EffectManager.EFFECT_TYPES.RAINBOW]: RainbowEffect,
        [EffectManager.EFFECT_TYPES.GOLDEN]: GoldenEffect,
        [EffectManager.EFFECT_TYPES.BLUE_PURPLE_PINK]: BluePurplePinkEffect,
        [EffectManager.EFFECT_TYPES.PULSE]: PulseEffect,
        [EffectManager.EFFECT_TYPES.RAINBOW_PULSE]: RainbowPulseEffect,
        // concentration は既存のロジックで処理
    };

    /**
     * エフェクトを適用
     * @param {string} effectType - エフェクトタイプ
     * @param {ImageData} imageData - 対象のImageData
     * @param {Object} settings - エフェクト設定
     * @param {number} progress - アニメーション進行度（0-1）
     * @returns {ImageData} 処理済みImageData
     */
    static applyEffect(effectType, imageData, settings = {}, progress = 0) {
        try {
            const EffectClass = EffectManager.EFFECT_CLASSES[effectType];
            
            if (!EffectClass) {
                throw new Error(`Unknown effect type: ${effectType}`);
            }

            // 設定のバリデーション
            const validatedSettings = EffectClass.validateSettings ? 
                EffectClass.validateSettings(settings) : settings;

            return EffectClass.apply(imageData, validatedSettings, progress);

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.PROCESSING_ERROR(
                `Effect application failed: ${effectType}`,
                error,
                { effectType, settings, progress }
            ));
        }
    }

    /**
     * エフェクトが利用可能かチェック
     * @param {string} effectType - エフェクトタイプ
     * @returns {boolean} 利用可能フラグ
     */
    static isEffectAvailable(effectType) {
        return effectType in EffectManager.EFFECT_CLASSES;
    }

    /**
     * エフェクトのプリセット設定を取得
     * @param {string} effectType - エフェクトタイプ
     * @param {string} presetName - プリセット名
     * @returns {Object|null} プリセット設定
     */
    static getPreset(effectType, presetName = 'classic') {
        const EffectClass = EffectManager.EFFECT_CLASSES[effectType];
        
        if (!EffectClass || !EffectClass.PRESETS) {
            return null;
        }

        return EffectClass.PRESETS[presetName] || EffectClass.PRESETS.classic || null;
    }

    /**
     * 全エフェクトのプリセット一覧を取得
     * @returns {Object} エフェクトタイプ別プリセット一覧
     */
    static getAllPresets() {
        const presets = {};
        
        Object.entries(EffectManager.EFFECT_CLASSES).forEach(([type, EffectClass]) => {
            if (EffectClass.PRESETS) {
                presets[type] = EffectClass.PRESETS;
            }
        });

        return presets;
    }

    /**
     * エフェクト設定のバリデーション
     * @param {string} effectType - エフェクトタイプ
     * @param {Object} settings - 設定オブジェクト
     * @returns {Object} 検証済み設定
     */
    static validateSettings(effectType, settings) {
        const EffectClass = EffectManager.EFFECT_CLASSES[effectType];
        
        if (!EffectClass) {
            throw new Error(`Unknown effect type: ${effectType}`);
        }

        return EffectClass.validateSettings ? 
            EffectClass.validateSettings(settings) : settings;
    }

    /**
     * エフェクトの説明を取得
     * @param {string} effectType - エフェクトタイプ
     * @returns {Object} エフェクト情報
     */
    static getEffectInfo(effectType) {
        const effectInfo = {
            [EffectManager.EFFECT_TYPES.RAINBOW]: {
                name: '虹色グラデーション',
                description: 'ROYGBIV の虹色グラデーションを適用',
                features: ['グラデーション方向設定', '密度調整', '彩度調整']
            },
            [EffectManager.EFFECT_TYPES.GOLDEN]: {
                name: '金ピカグラデーション',
                description: '金色のグラデーションを適用',
                features: ['グラデーション方向設定', '密度調整', '彩度調整']
            },
            [EffectManager.EFFECT_TYPES.BLUE_PURPLE_PINK]: {
                name: '青→紫→ピンク',
                description: '青から紫、ピンクへのグラデーション',
                features: ['グラデーション方向設定', '密度調整', '彩度調整']
            },
            [EffectManager.EFFECT_TYPES.PULSE]: {
                name: 'ピカピカ点滅',
                description: '指定色での点滅エフェクト',
                features: ['ベース色設定', '点滅速度調整', '強度範囲設定']
            },
            [EffectManager.EFFECT_TYPES.RAINBOW_PULSE]: {
                name: '虹色ピカピカ',
                description: '虹色グラデーションと点滅の組み合わせ',
                features: ['グラデーション設定', '点滅速度調整', '強度範囲設定']
            },
            [EffectManager.EFFECT_TYPES.CONCENTRATION]: {
                name: '集中線',
                description: '放射状の集中線エフェクト',
                features: ['線数調整', '線幅設定', '中心点設定']
            }
        };

        return effectInfo[effectType] || {
            name: '不明なエフェクト',
            description: 'エフェクトの説明がありません',
            features: []
        };
    }

    /**
     * パフォーマンス情報を取得
     * @param {string} effectType - エフェクトタイプ
     * @returns {Object} パフォーマンス情報
     */
    static getPerformanceInfo(effectType) {
        const performanceInfo = {
            [EffectManager.EFFECT_TYPES.RAINBOW]: { complexity: 'medium', memoryUsage: 'low' },
            [EffectManager.EFFECT_TYPES.GOLDEN]: { complexity: 'medium', memoryUsage: 'low' },
            [EffectManager.EFFECT_TYPES.BLUE_PURPLE_PINK]: { complexity: 'medium', memoryUsage: 'low' },
            [EffectManager.EFFECT_TYPES.PULSE]: { complexity: 'low', memoryUsage: 'low' },
            [EffectManager.EFFECT_TYPES.RAINBOW_PULSE]: { complexity: 'high', memoryUsage: 'medium' },
            [EffectManager.EFFECT_TYPES.CONCENTRATION]: { complexity: 'high', memoryUsage: 'medium' }
        };

        return performanceInfo[effectType] || { complexity: 'unknown', memoryUsage: 'unknown' };
    }
}