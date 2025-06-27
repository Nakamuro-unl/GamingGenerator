/**
 * Gaming Generator - エラーハンドリングシステム
 * 統一されたエラー処理とユーザーフレンドリーなメッセージ表示
 */

/**
 * エラーの種類を定義
 */
export const ErrorTypes = {
    CANVAS_ERROR: 'CANVAS_ERROR',
    FILE_ERROR: 'FILE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    PROCESSING_ERROR: 'PROCESSING_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MEMORY_ERROR: 'MEMORY_ERROR'
};

/**
 * カスタムエラークラス
 */
export class GamingGeneratorError extends Error {
    /**
     * @param {string} type - エラータイプ
     * @param {string} message - エラーメッセージ
     * @param {Error} originalError - 元のエラー
     * @param {Object} context - エラーのコンテキスト情報
     */
    constructor(type, message, originalError = null, context = {}) {
        super(message);
        this.name = 'GamingGeneratorError';
        this.type = type;
        this.originalError = originalError;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * エラーハンドリングとユーザー通知を管理するクラス
 */
export class ErrorHandler {
    /**
     * エラーメッセージの日本語マッピング
     */
    static ERROR_MESSAGES = {
        [ErrorTypes.CANVAS_ERROR]: {
            title: 'キャンバスエラー',
            message: 'キャンバスの描画中にエラーが発生しました。ブラウザを更新してお試しください。'
        },
        [ErrorTypes.FILE_ERROR]: {
            title: 'ファイルエラー',
            message: 'ファイルの読み込みに失敗しました。ファイル形式とサイズを確認してください。'
        },
        [ErrorTypes.NETWORK_ERROR]: {
            title: 'ネットワークエラー',
            message: 'サーバーとの通信に失敗しました。インターネット接続を確認してください。'
        },
        [ErrorTypes.PROCESSING_ERROR]: {
            title: '処理エラー',
            message: '画像処理中にエラーが発生しました。設定を確認してもう一度お試しください。'
        },
        [ErrorTypes.VALIDATION_ERROR]: {
            title: '入力エラー',
            message: '入力値が正しくありません。設定値を確認してください。'
        },
        [ErrorTypes.MEMORY_ERROR]: {
            title: 'メモリエラー',
            message: 'メモリ不足です。画像サイズを小さくするか、ブラウザを再起動してください。'
        }
    };

    /**
     * エラーを処理してユーザーに通知
     * @param {Error|GamingGeneratorError} error - エラーオブジェクト
     * @param {Object} options - 表示オプション
     */
    static handle(error, options = {}) {
        const {
            showAlert = true,
            logToConsole = false, // プロダクションでは false
            customMessage = null
        } = options;

        let errorInfo;

        if (error instanceof GamingGeneratorError) {
            errorInfo = ErrorHandler.ERROR_MESSAGES[error.type] || {
                title: 'エラー',
                message: error.message
            };
        } else {
            // 一般的なエラーの場合、内容から推測
            errorInfo = ErrorHandler._inferErrorType(error);
        }

        if (customMessage) {
            errorInfo.message = customMessage;
        }

        if (showAlert) {
            alert(`${errorInfo.title}\n\n${errorInfo.message}`);
        }

        // プロダクションでは console.log は無効
        if (logToConsole && window.location.hostname === 'localhost') {
            console.error('Gaming Generator Error:', error);
        }

        return errorInfo;
    }

    /**
     * エラー内容からタイプを推測
     * @param {Error} error - エラーオブジェクト
     * @returns {Object} エラー情報
     * @private
     */
    static _inferErrorType(error) {
        const message = error.message.toLowerCase();

        if (message.includes('canvas') || message.includes('context')) {
            return ErrorHandler.ERROR_MESSAGES[ErrorTypes.CANVAS_ERROR];
        }
        if (message.includes('fetch') || message.includes('network') || message.includes('xhr')) {
            return ErrorHandler.ERROR_MESSAGES[ErrorTypes.NETWORK_ERROR];
        }
        if (message.includes('file') || message.includes('blob')) {
            return ErrorHandler.ERROR_MESSAGES[ErrorTypes.FILE_ERROR];
        }
        if (message.includes('memory') || message.includes('allocation')) {
            return ErrorHandler.ERROR_MESSAGES[ErrorTypes.MEMORY_ERROR];
        }

        // デフォルト
        return {
            title: 'エラー',
            message: '予期しないエラーが発生しました。ページを再読み込みしてお試しください。'
        };
    }

    /**
     * ファイル関連のバリデーション
     * @param {File} file - ファイルオブジェクト
     * @param {Object} constraints - 制約条件
     * @throws {GamingGeneratorError} バリデーションエラー
     */
    static validateFile(file, constraints = {}) {
        const {
            maxSize = 50 * 1024 * 1024, // 50MB
            allowedTypes = ['image/gif', 'image/png', 'image/jpeg'],
            maxNameLength = 255
        } = constraints;

        if (!file) {
            throw new GamingGeneratorError(
                ErrorTypes.VALIDATION_ERROR,
                'ファイルが選択されていません'
            );
        }

        if (file.size > maxSize) {
            throw new GamingGeneratorError(
                ErrorTypes.FILE_ERROR,
                `ファイルサイズが大きすぎます（最大: ${Math.round(maxSize / 1024 / 1024)}MB）`
            );
        }

        if (!allowedTypes.includes(file.type)) {
            throw new GamingGeneratorError(
                ErrorTypes.FILE_ERROR,
                `サポートされていないファイル形式です（対応形式: ${allowedTypes.join(', ')}）`
            );
        }

        if (file.name.length > maxNameLength) {
            throw new GamingGeneratorError(
                ErrorTypes.VALIDATION_ERROR,
                'ファイル名が長すぎます'
            );
        }
    }

    /**
     * Canvas操作を安全に実行
     * @param {Function} operation - Canvas操作関数
     * @param {Object} context - エラーコンテキスト
     * @returns {any} 操作結果
     * @throws {GamingGeneratorError} Canvas エラー
     */
    static async safeCanvasOperation(operation, context = {}) {
        try {
            return await operation();
        } catch (error) {
            throw new GamingGeneratorError(
                ErrorTypes.CANVAS_ERROR,
                'Canvas操作中にエラーが発生しました',
                error,
                context
            );
        }
    }

    /**
     * 非同期処理を安全に実行（タイムアウト付き）
     * @param {Promise} promise - 実行するPromise
     * @param {number} timeoutMs - タイムアウト時間
     * @param {string} timeoutMessage - タイムアウトメッセージ
     * @returns {Promise} 結果
     * @throws {GamingGeneratorError} タイムアウトまたは処理エラー
     */
    static async withTimeout(promise, timeoutMs = 30000, timeoutMessage = '処理がタイムアウトしました') {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new GamingGeneratorError(
                    ErrorTypes.PROCESSING_ERROR,
                    timeoutMessage
                ));
            }, timeoutMs);
        });

        try {
            return await Promise.race([promise, timeoutPromise]);
        } catch (error) {
            if (error instanceof GamingGeneratorError) {
                throw error;
            }
            throw new GamingGeneratorError(
                ErrorTypes.PROCESSING_ERROR,
                '処理中にエラーが発生しました',
                error
            );
        }
    }
}