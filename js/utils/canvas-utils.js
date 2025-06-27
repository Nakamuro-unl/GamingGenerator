/**
 * Gaming Generator - Canvas ユーティリティ
 * Canvas操作に関する共通関数群
 */

/**
 * Canvas設定と初期化を行うユーティリティクラス
 */
export class CanvasUtils {
    /**
     * Canvasを指定サイズで初期化
     * @param {HTMLCanvasElement} canvas - 対象Canvas
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {Object} options - オプション設定
     * @returns {CanvasRenderingContext2D} コンテキスト
     */
    static setupCanvas(canvas, width, height, options = {}) {
        const {
            willReadFrequently = true,
            alpha = true,
            desynchronized = false
        } = options;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d', {
            willReadFrequently,
            alpha,
            desynchronized
        });

        // 高品質レンダリング設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        return ctx;
    }

    /**
     * Canvasをクリア
     * @param {CanvasRenderingContext2D} ctx - コンテキスト
     * @param {string} fillColor - 塗りつぶし色（省略時は透明）
     */
    static clearCanvas(ctx, fillColor = null) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    /**
     * アスペクト比を保持して画像をフィット
     * @param {number} imageWidth - 画像幅
     * @param {number} imageHeight - 画像高さ
     * @param {number} canvasWidth - Canvas幅
     * @param {number} canvasHeight - Canvas高さ
     * @returns {Object} 描画位置とサイズ
     */
    static calculateFitSize(imageWidth, imageHeight, canvasWidth, canvasHeight) {
        const imageAspect = imageWidth / imageHeight;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (canvasAspect > imageAspect) {
            // キャンバスが横長の場合
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            // キャンバスが縦長の場合
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        }

        return { drawX, drawY, drawWidth, drawHeight };
    }

    /**
     * ImageDataを安全に取得
     * @param {CanvasRenderingContext2D} ctx - コンテキスト
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @returns {ImageData|null} ImageData
     */
    static getImageDataSafe(ctx, x = 0, y = 0, width = null, height = null) {
        try {
            width = width || ctx.canvas.width;
            height = height || ctx.canvas.height;
            
            // 範囲チェック
            if (x < 0 || y < 0 || width <= 0 || height <= 0) {
                return null;
            }
            
            return ctx.getImageData(x, y, width, height);
        } catch (error) {
            return null;
        }
    }

    /**
     * ImageDataを安全に適用
     * @param {CanvasRenderingContext2D} ctx - コンテキスト
     * @param {ImageData} imageData - ImageData
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 成功フラグ
     */
    static putImageDataSafe(ctx, imageData, x = 0, y = 0) {
        try {
            ctx.putImageData(imageData, x, y);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Canvas内容をBlob形式で取得
     * @param {HTMLCanvasElement} canvas - Canvas
     * @param {string} mimeType - MIME形式
     * @param {number} quality - 品質（0-1）
     * @returns {Promise<Blob>} Blob
     */
    static async canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob(resolve, mimeType, quality);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * ダウンロード用のリンクを生成してクリック
     * @param {HTMLCanvasElement} canvas - Canvas
     * @param {string} filename - ファイル名
     * @param {string} mimeType - MIME形式
     */
    static async downloadCanvas(canvas, filename, mimeType = 'image/png') {
        try {
            const blob = await CanvasUtils.canvasToBlob(canvas, mimeType);
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            throw new Error(`Canvas download failed: ${error.message}`);
        }
    }

    /**
     * Canvas のメモリ使用量を推定
     * @param {HTMLCanvasElement} canvas - Canvas
     * @returns {number} メモリ使用量（bytes）
     */
    static estimateMemoryUsage(canvas) {
        // RGBA = 4 bytes per pixel
        return canvas.width * canvas.height * 4;
    }
}