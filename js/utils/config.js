/**
 * Gaming Generator - 設定管理システム
 * 全体の設定値を中央管理し、デフォルト値と型安全性を提供
 */

/**
 * @typedef {Object} CanvasConfig
 * @property {number} width - キャンバス幅
 * @property {number} height - キャンバス高さ
 * @property {number} minWidth - 最小幅
 * @property {number} maxWidth - 最大幅
 * @property {number} minHeight - 最小高さ
 * @property {number} maxHeight - 最大高さ
 */

/**
 * @typedef {Object} AnimationConfig
 * @property {number} defaultSpeed - デフォルトアニメーション速度
 * @property {number} minSpeed - 最小速度
 * @property {number} maxSpeed - 最大速度
 * @property {number} defaultSaturation - デフォルト彩度
 * @property {string[]} modes - 利用可能なアニメーションモード
 */

/**
 * @typedef {Object} GIFConfig
 * @property {number} maxFileSize - 最大ファイルサイズ (bytes)
 * @property {number} maxFrames - 最大フレーム数
 * @property {string[]} supportedFormats - サポートする画像形式
 * @property {number} timeoutMs - API タイムアウト時間
 */

export class Config {
    /**
     * キャンバス関連の設定
     * @type {CanvasConfig}
     */
    static CANVAS = {
        width: 800,
        height: 600,
        minWidth: 64,
        maxWidth: 2048,
        minHeight: 64,
        maxHeight: 2048
    };

    /**
     * アニメーション関連の設定
     * @type {AnimationConfig}
     */
    static ANIMATION = {
        defaultSpeed: 5,
        minSpeed: 1,
        maxSpeed: 10,
        defaultSaturation: 100,
        modes: [
            'rainbow',
            'golden',
            'bluepurplepink',
            'pulse',
            'rainbowPulse',
            'concentration'
        ]
    };

    /**
     * GIF処理関連の設定
     * @type {GIFConfig}
     */
    static GIF = {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFrames: 100,
        supportedFormats: ['image/gif', 'image/png', 'image/jpeg', 'image/webp'],
        timeoutMs: 30000 // 30秒
    };

    /**
     * グラデーション関連の設定
     */
    static GRADIENT = {
        defaultDensity: 7.0,
        minDensity: 1.0,
        maxDensity: 20.0,
        directions: ['horizontal', 'vertical', 'diagonal1', 'diagonal2']
    };

    /**
     * API エンドポイント設定
     */
    static API = {
        gifProcessing: '/api/gif-gaming.py',
        timeout: 30000,
        retryAttempts: 3
    };

    /**
     * 設定値の妥当性を検証
     * @param {string} category - 設定カテゴリ
     * @param {string} key - 設定キー
     * @param {any} value - 検証する値
     * @returns {boolean} 妥当性
     */
    static validate(category, key, value) {
        const config = Config[category.toUpperCase()];
        if (!config || !(key in config)) {
            return false;
        }

        // 数値範囲の検証
        if (category === 'CANVAS' && key === 'width') {
            return value >= Config.CANVAS.minWidth && value <= Config.CANVAS.maxWidth;
        }
        if (category === 'CANVAS' && key === 'height') {
            return value >= Config.CANVAS.minHeight && value <= Config.CANVAS.maxHeight;
        }
        if (category === 'ANIMATION' && key === 'defaultSpeed') {
            return value >= Config.ANIMATION.minSpeed && value <= Config.ANIMATION.maxSpeed;
        }

        return true;
    }

    /**
     * 安全な設定値取得（フォールバック付き）
     * @param {string} category - 設定カテゴリ
     * @param {string} key - 設定キー
     * @param {any} fallback - フォールバック値
     * @returns {any} 設定値
     */
    static get(category, key, fallback = null) {
        const config = Config[category.toUpperCase()];
        return config && config[key] !== undefined ? config[key] : fallback;
    }

    /**
     * デバッグ用: 全設定を出力
     * @returns {Object} 全設定値
     */
    static debug() {
        return {
            CANVAS: Config.CANVAS,
            ANIMATION: Config.ANIMATION,
            GIF: Config.GIF,
            GRADIENT: Config.GRADIENT,
            API: Config.API
        };
    }
}