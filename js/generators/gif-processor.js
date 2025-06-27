/**
 * Gaming Generator - GIF Processor Module
 * GIF処理機能の基本処理を担当するモジュール
 */

import { ErrorHandler, ErrorTypes } from '../utils/error-handler.js';
import { Config } from '../utils/config.js';

/**
 * GIF処理クラス
 */
export class GIFProcessor {
    /**
     * コンストラクタ
     */
    constructor() {
        this.frames = [];
        this.currentFrameIndex = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.frameDelay = 100; // デフォルト100ms
    }

    /**
     * GIFファイルからフレームを抽出
     * @param {File} file - GIFファイル
     * @returns {Promise<Object>} フレーム情報
     */
    async extractFrames(file) {
        try {
            ErrorHandler.validateFile(file, {
                allowedTypes: ['image/gif'],
                maxSize: Config.GIF.maxFileSize
            });

            const arrayBuffer = await file.arrayBuffer();
            const frames = await this._parseGifFrames(arrayBuffer);

            if (frames.length === 0) {
                throw new Error('No frames found in GIF');
            }

            if (frames.length > Config.GIF.maxFrames) {
                throw new Error(`Too many frames: ${frames.length} (max: ${Config.GIF.maxFrames})`);
            }

            this.frames = frames;
            this.currentFrameIndex = 0;

            return {
                frameCount: frames.length,
                width: frames[0].width,
                height: frames[0].height,
                duration: frames.reduce((sum, frame) => sum + frame.delay, 0)
            };

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.FILE_ERROR(
                'GIF frame extraction failed',
                error,
                { fileName: file.name, fileSize: file.size }
            ));
        }
    }

    /**
     * フレームをImageDataとして取得
     * @param {number} frameIndex - フレームインデックス
     * @returns {ImageData|null} フレームのImageData
     */
    getFrameImageData(frameIndex) {
        if (frameIndex < 0 || frameIndex >= this.frames.length) {
            return null;
        }

        const frame = this.frames[frameIndex];
        return frame.imageData;
    }

    /**
     * 現在のフレームを取得
     * @returns {ImageData|null} 現在フレームのImageData
     */
    getCurrentFrame() {
        return this.getFrameImageData(this.currentFrameIndex);
    }

    /**
     * 次のフレームに進む
     * @returns {ImageData|null} 次フレームのImageData
     */
    nextFrame() {
        if (this.frames.length === 0) return null;
        
        this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
        return this.getCurrentFrame();
    }

    /**
     * フレーム再生を開始
     * @param {Function} onFrameUpdate - フレーム更新コールバック
     * @param {number} speed - 再生速度（1.0が通常速度）
     */
    startPlayback(onFrameUpdate, speed = 1.0) {
        this.stopPlayback();
        
        if (this.frames.length <= 1) return;

        this.isPlaying = true;
        
        const playNextFrame = () => {
            if (!this.isPlaying) return;

            const currentFrame = this.frames[this.currentFrameIndex];
            const delay = Math.max(50, currentFrame.delay / speed); // 最小50ms

            if (onFrameUpdate) {
                onFrameUpdate(this.getCurrentFrame(), this.currentFrameIndex);
            }

            this.nextFrame();

            this.playInterval = setTimeout(playNextFrame, delay);
        };

        playNextFrame();
    }

    /**
     * フレーム再生を停止
     */
    stopPlayback() {
        this.isPlaying = false;
        if (this.playInterval) {
            clearTimeout(this.playInterval);
            this.playInterval = null;
        }
    }

    /**
     * 再生中かどうか
     * @returns {boolean} 再生状態
     */
    isPlayingFrames() {
        return this.isPlaying;
    }

    /**
     * フレーム数を取得
     * @returns {number} フレーム数
     */
    getFrameCount() {
        return this.frames.length;
    }

    /**
     * フレーム進行度を計算（アニメーション同期用）
     * @param {number} animationTime - アニメーション時間（ms）
     * @returns {number} 進行度（0-1）
     */
    calculateFrameProgress(animationTime) {
        if (this.frames.length <= 1) return 0;

        const totalDuration = this.frames.reduce((sum, frame) => sum + frame.delay, 0);
        const normalizedTime = (animationTime % totalDuration) / totalDuration;
        
        return normalizedTime;
    }

    /**
     * 時間からフレームインデックスを計算
     * @param {number} animationTime - アニメーション時間（ms）
     * @returns {number} フレームインデックス
     */
    getFrameIndexFromTime(animationTime) {
        if (this.frames.length <= 1) return 0;

        const totalDuration = this.frames.reduce((sum, frame) => sum + frame.delay, 0);
        const normalizedTime = animationTime % totalDuration;
        
        let accumulatedTime = 0;
        for (let i = 0; i < this.frames.length; i++) {
            accumulatedTime += this.frames[i].delay;
            if (normalizedTime <= accumulatedTime) {
                return i;
            }
        }
        
        return this.frames.length - 1;
    }

    /**
     * GIFフレームをパース（簡易実装）
     * @param {ArrayBuffer} arrayBuffer - GIFファイルのArrayBuffer
     * @returns {Promise<Array>} フレーム配列
     * @private
     */
    async _parseGifFrames(arrayBuffer) {
        // 実際の実装では、GIF decoder ライブラリを使用
        // ここでは簡易的な実装として、1フレームのみ返す
        
        try {
            const blob = new Blob([arrayBuffer], { type: 'image/gif' });
            const url = URL.createObjectURL(blob);
            
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });

            // 仮のキャンバスでImageDataを作成
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            
            URL.revokeObjectURL(url);

            // 単一フレームとして返す（実際の実装では複数フレーム対応が必要）
            return [{
                imageData,
                delay: 100,
                width: img.width,
                height: img.height
            }];

        } catch (error) {
            throw new Error('Failed to parse GIF frames: ' + error.message);
        }
    }

    /**
     * リソースをクリーンアップ
     */
    dispose() {
        this.stopPlayback();
        this.frames = [];
        this.currentFrameIndex = 0;
    }

    /**
     * フレーム情報の取得
     * @returns {Object} フレーム情報
     */
    getFrameInfo() {
        if (this.frames.length === 0) {
            return {
                frameCount: 0,
                totalDuration: 0,
                averageDelay: 0,
                dimensions: null
            };
        }

        const totalDuration = this.frames.reduce((sum, frame) => sum + frame.delay, 0);
        const averageDelay = totalDuration / this.frames.length;
        const firstFrame = this.frames[0];

        return {
            frameCount: this.frames.length,
            totalDuration,
            averageDelay,
            dimensions: {
                width: firstFrame.width,
                height: firstFrame.height
            }
        };
    }

    /**
     * 静的メソッド: サーバーでGIF処理
     * @param {File} gifFile - GIFファイル
     * @param {Object} settings - 処理設定
     * @returns {Promise<Blob>} 処理済みGIF
     */
    static async processGifOnServer(gifFile, settings) {
        try {
            const formData = new FormData();
            formData.append('gif', gifFile);
            formData.append('settings', JSON.stringify(settings));

            const response = await ErrorHandler.withTimeout(
                fetch('/api/gif-gaming.py', {
                    method: 'POST',
                    body: formData
                }),
                Config.API.timeout,
                'GIF処理がタイムアウトしました'
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            return await response.blob();

        } catch (error) {
            throw ErrorHandler.handle(new ErrorTypes.NETWORK_ERROR(
                'Server-side GIF processing failed',
                error,
                { fileName: gifFile.name, settings }
            ));
        }
    }
}