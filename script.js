class ConcentrationLineGenerator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.originalImage = null;
        this.imageAspectRatio = 1;
        this.previewTimeout = null;
        
        // アニメーション関連
        this.animationRunning = false;
        this.animationFrame = null;
        this.startTime = null;
        this.gif = null;
        this.gifFrames = [];
        
        // GIF用フレームデータ
        this.capturedFrames = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.imageInput = document.getElementById('imageInput');
        this.fileName = document.getElementById('fileName');
        this.lineCount = document.getElementById('lineCount');
        this.lineCountValue = document.getElementById('lineCountValue');
        this.lineWidth = document.getElementById('lineWidth');
        this.lineWidthValue = document.getElementById('lineWidthValue');
        this.colorMode = document.getElementById('colorMode');
        this.lineColor = document.getElementById('lineColor');
        this.singleColorGroup = document.getElementById('singleColorGroup');
        this.centerX = document.getElementById('centerX');
        this.centerXValue = document.getElementById('centerXValue');
        this.centerY = document.getElementById('centerY');
        this.centerYValue = document.getElementById('centerYValue');
        this.centerSize = document.getElementById('centerSize');
        this.centerSizeValue = document.getElementById('centerSizeValue');
        this.darkBackground = document.getElementById('darkBackground');
        this.animationMode = document.getElementById('animationMode');
        this.animationSpeed = document.getElementById('animationSpeed');
        this.animationSpeedValue = document.getElementById('animationSpeedValue');
        this.gifSizeMode = document.getElementById('gifSizeMode');
        this.gifWidth = document.getElementById('gifWidth');
        this.gifHeight = document.getElementById('gifHeight');
        this.customSizeGroup = document.getElementById('customSizeGroup');
        this.generateBtn = document.getElementById('generateBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadGifBtn = document.getElementById('downloadGifBtn');
        this.downloadRealGifBtn = document.getElementById('downloadRealGifBtn');
    }

    bindEvents() {
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.lineCount.addEventListener('input', (e) => {
            this.updateValue(e, this.lineCountValue);
            this.autoGeneratePreview();
        });
        this.lineWidth.addEventListener('input', (e) => {
            this.updateValue(e, this.lineWidthValue);
            this.autoGeneratePreview();
        });
        this.centerX.addEventListener('input', (e) => {
            this.updateValue(e, this.centerXValue, '%');
            this.autoGeneratePreview();
        });
        this.centerY.addEventListener('input', (e) => {
            this.updateValue(e, this.centerYValue, '%');
            this.autoGeneratePreview();
        });
        this.centerSize.addEventListener('input', (e) => {
            this.updateValue(e, this.centerSizeValue);
            this.autoGeneratePreview();
        });
        this.colorMode.addEventListener('change', (e) => {
            this.toggleColorMode(e);
            this.autoGeneratePreview();
        });
        this.darkBackground.addEventListener('change', () => this.autoGeneratePreview());
        this.lineColor.addEventListener('input', () => this.autoGeneratePreview());
        this.animationMode.addEventListener('change', () => this.handleAnimationModeChange());
        this.animationSpeed.addEventListener('input', (e) => {
            this.updateValue(e, this.animationSpeedValue);
        });
        this.gifSizeMode.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.customSizeGroup.style.display = 'block';
            } else {
                this.customSizeGroup.style.display = 'none';
            }
        });
        this.generateBtn.addEventListener('click', () => this.generateConcentrationLines());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.downloadGifBtn.addEventListener('click', () => this.downloadGif());
        this.downloadRealGifBtn.addEventListener('click', () => this.downloadRealGif());
        
        // キャンバスクリックで中心点を設定
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.style.cursor = 'crosshair';
    }

    updateValue(event, valueElement, suffix = '') {
        valueElement.textContent = event.target.value + suffix;
    }

    toggleColorMode(event) {
        if (event.target.value === 'rainbow') {
            this.singleColorGroup.classList.add('hidden');
        } else {
            this.singleColorGroup.classList.remove('hidden');
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.fileName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.imageAspectRatio = img.width / img.height;
                this.setupCanvas();
                this.drawImage();
                // 画像読み込み後に自動でプレビューを生成
                this.autoGeneratePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleCanvasClick(event) {
        if (!this.originalImage) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // クリック位置を取得（キャンバス座標系に変換）
        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;
        
        // パーセンテージに変換
        const centerXPercent = Math.round((clickX / this.canvas.width) * 100);
        const centerYPercent = Math.round((clickY / this.canvas.height) * 100);
        
        // スライダーの値を更新
        this.centerX.value = Math.max(0, Math.min(100, centerXPercent));
        this.centerY.value = Math.max(0, Math.min(100, centerYPercent));
        
        // 表示値を更新
        this.centerXValue.textContent = this.centerX.value + '%';
        this.centerYValue.textContent = this.centerY.value + '%';
        
        // プレビューを更新
        this.autoGeneratePreview();
    }

    autoGeneratePreview() {
        if (!this.originalImage) return;
        
        // 少し遅延を入れてスムーズな操作感を保つ
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
        
        this.previewTimeout = setTimeout(() => {
            if (this.animationMode.value === 'static') {
                this.generateConcentrationLines();
            } else {
                this.startAnimation();
            }
        }, 100);
    }

    handleAnimationModeChange() {
        if (this.animationMode.value === 'static') {
            this.stopAnimation();
            this.autoGeneratePreview();
        } else {
            this.startAnimation();
        }
    }

    startAnimation() {
        if (!this.originalImage) return;
        
        this.stopAnimation();
        this.animationRunning = true;
        this.startTime = Date.now();
        this.animate();
    }

    stopAnimation() {
        this.animationRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        if (!this.animationRunning) return;
        
        const currentTime = Date.now();
        this.generateConcentrationLines(currentTime);
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    setupCanvas() {
        const maxWidth = 800;
        const maxHeight = 600;
        
        let canvasWidth, canvasHeight;
        
        if (this.imageAspectRatio > maxWidth / maxHeight) {
            canvasWidth = maxWidth;
            canvasHeight = maxWidth / this.imageAspectRatio;
        } else {
            canvasHeight = maxHeight;
            canvasWidth = maxHeight * this.imageAspectRatio;
        }
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
    }

    drawImage(backgroundMode = 'original') {
        if (!this.originalImage) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (backgroundMode === 'dark') {
            // 黒背景を描画
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 元の画像を描画
            this.ctx.drawImage(this.originalImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    }

    generateConcentrationLines(currentTime = null) {
        if (!this.originalImage) {
            // 画像がない場合は何もしない（プレビュー用なので）
            return;
        }

        // 集中線のパラメータを取得
        const lineCount = parseInt(this.lineCount.value);
        const lineWidth = parseInt(this.lineWidth.value);
        const colorMode = this.colorMode.value;
        const singleColor = this.lineColor.value;
        const centerXPercent = parseInt(this.centerX.value);
        const centerYPercent = parseInt(this.centerY.value);
        const centerSize = parseInt(this.centerSize.value);
        const backgroundMode = this.darkBackground.value;
        const animationMode = this.animationMode.value;
        const animationSpeed = parseInt(this.animationSpeed.value);
        
        // 背景を描画
        this.drawImage(backgroundMode);
        
        // 中心点を計算
        const centerX = (this.canvas.width * centerXPercent) / 100;
        const centerY = (this.canvas.height * centerYPercent) / 100;
        
        // アニメーション時間オフセットを計算
        let timeOffset = 0;
        if (currentTime && this.startTime) {
            // 非線形速度計算：速度1を極端に遅く、20に向かって徐々に速くする
            const speedMultiplier = Math.pow(animationSpeed / 10, 2.5) * 0.003;
            timeOffset = (currentTime - this.startTime) * speedMultiplier;
        }
        
        // 集中線を描画
        this.drawConcentrationLines(centerX, centerY, lineCount, lineWidth, colorMode, singleColor, centerSize, animationMode, timeOffset);
        
        // ゲーミング虹色の場合、中心点を強調する効果を追加（完全透過）
        if (colorMode === 'rainbow') {
            this.drawCenterHighlight(centerX, centerY, lineWidth, centerSize);
        }
        
        // ダウンロードボタンを有効化
        this.downloadBtn.disabled = false;
        this.downloadGifBtn.disabled = false;
        this.downloadRealGifBtn.disabled = false;
    }

    drawConcentrationLines(centerX, centerY, lineCount, lineWidth, colorMode, singleColor, centerSize, animationMode = 'static', timeOffset = 0) {
        // 最高品質レンダリング設定
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.lineCap = 'butt'; // 線を尖った形に変更
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = lineWidth;
        
        // キャンバスの対角線の長さを計算（線の長さの基準）
        const maxDistance = Math.sqrt(
            Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)
        );
        
        for (let i = 0; i < lineCount; i++) {
            // ランダムな角度を生成
            const angle = (Math.PI * 2 * i) / lineCount + (Math.random() - 0.5) * 0.3;
            
            // 画面端まで確実に到達する長さを計算
            const lineLength = this.calculateLineToEdge(centerX, centerY, angle);
            
            // 集中線を描画（中心サイズに応じて開始位置を調整）
            const startDistance = centerSize + Math.random() * (centerSize * 0.3);
            const startX = centerX + Math.cos(angle) * startDistance;
            const startY = centerY + Math.sin(angle) * startDistance;
            const endX = centerX + Math.cos(angle) * lineLength;
            const endY = centerY + Math.sin(angle) * lineLength;
            
            if (colorMode === 'rainbow') {
                // ゲーミング風虹色三角形集中線（アニメーション対応）
                this.drawTriangleConcentrationLine(centerX, centerY, angle, startDistance, lineLength, i, lineCount, lineWidth, null, animationMode, timeOffset);
            } else {
                // 単色の三角形集中線
                this.drawTriangleConcentrationLine(centerX, centerY, angle, startDistance, lineLength, i, lineCount, lineWidth, singleColor, animationMode, timeOffset);
            }
        }
    }

    calculateLineToEdge(centerX, centerY, angle) {
        // 各画面端への距離を計算
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        let distance = 0;
        
        if (cos > 0) {
            // 右端への距離
            distance = Math.max(distance, (this.canvas.width - centerX) / cos);
        } else if (cos < 0) {
            // 左端への距離
            distance = Math.max(distance, -centerX / cos);
        }
        
        if (sin > 0) {
            // 下端への距離
            distance = Math.max(distance, (this.canvas.height - centerY) / sin);
        } else if (sin < 0) {
            // 上端への距離
            distance = Math.max(distance, -centerY / sin);
        }
        
        return Math.max(distance, Math.sqrt(this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height));
    }

    drawTriangleConcentrationLine(centerX, centerY, angle, startDistance, lineLength, index, totalLines, lineWidth, singleColor = null, animationMode = 'static', timeOffset = 0) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // 三角形の頂点を計算
        const startX = centerX + cos * startDistance;
        const startY = centerY + sin * startDistance;
        const endX = centerX + cos * lineLength;
        const endY = centerY + sin * lineLength;
        
        // 三角形の幅（線の長さに応じて調整し、中心で細くなる）
        const baseTriangleWidth = lineWidth * 0.8;
        const tipTriangleWidth = lineWidth * 0.1;
        
        // 三角形の頂点と底辺を計算（中心に向かって細くなる）
        const perpAngle = angle + Math.PI / 2;
        const perpCos = Math.cos(perpAngle);
        const perpSin = Math.sin(perpAngle);
        
        // 中心側（先端）の幅
        const tipX1 = startX + perpCos * tipTriangleWidth;
        const tipY1 = startY + perpSin * tipTriangleWidth;
        const tipX2 = startX - perpCos * tipTriangleWidth;
        const tipY2 = startY - perpSin * tipTriangleWidth;
        
        // 画面端側（底辺）の幅
        const baseX1 = endX + perpCos * baseTriangleWidth;
        const baseY1 = endY + perpSin * baseTriangleWidth;
        const baseX2 = endX - perpCos * baseTriangleWidth;
        const baseY2 = endY - perpSin * baseTriangleWidth;
        
        this.ctx.save();
        
        if (singleColor) {
            // 単色の場合（発光なし）
            this.ctx.fillStyle = singleColor;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.globalCompositeOperation = 'source-over';
        } else {
            // ゲーミング虹色の場合 - アニメーション対応
            let hue = (360 * index) / totalLines;
            let lightnessMultiplier = 1;
            let saturation = 100;
            
            // アニメーション効果を適用
            if (animationMode === 'rainbow') {
                // 虹色グラデーション：時間とともに色相が回転
                hue = (hue + timeOffset * 180) % 360;
            } else if (animationMode === 'bluepurplepink') {
                // シアン→青→紫→ピンク→赤寄りグラデーション：180°（シアン）→340°（赤寄りピンク）
                const colorCycle = (timeOffset * 2) % 1; // 0-1の範囲でループ
                const hueRange = 160; // 180°から340°まで160°の範囲
                const baseHue = 180; // シアンから開始
                
                // 滑らかな色相変化
                let targetHue = baseHue + (hueRange * colorCycle);
                if (targetHue >= 360) targetHue -= 360;
                
                hue = (targetHue + (360 * index) / totalLines) % 360; // 線ごとのオフセット
            } else if (animationMode === 'pulse') {
                // ピカピカ点滅：明度が周期的に変化
                const pulse = (Math.sin(timeOffset * Math.PI * 2 + index * 0.1) + 1) / 2;
                lightnessMultiplier = 0.7 + pulse * 0.6;
            } else if (animationMode === 'wave') {
                // 波動効果：色相と明度が波状に変化
                const wave = Math.sin(timeOffset * Math.PI + index * 0.2);
                hue = (hue + wave * 60) % 360;
                lightnessMultiplier = 0.8 + Math.abs(wave) * 0.4;
            }
            
            // 超強烈な派手なグラデーション
            const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
            
            // アニメーション効果を適用した色合い
            const hue1 = ((hue - 30) + 360) % 360;
            const hue2 = (hue + 30) % 360;
            
            gradient.addColorStop(0, `hsl(${hue1}, ${saturation}%, ${65 * lightnessMultiplier}%)`);
            gradient.addColorStop(0.2, `hsl(${hue}, ${saturation}%, ${60 * lightnessMultiplier}%)`);
            gradient.addColorStop(0.4, `hsl(${hue}, ${saturation}%, ${55 * lightnessMultiplier}%)`);
            gradient.addColorStop(0.6, `hsl(${hue}, ${saturation}%, ${50 * lightnessMultiplier}%)`);
            gradient.addColorStop(0.8, `hsl(${hue}, ${saturation}%, ${45 * lightnessMultiplier}%)`);
            gradient.addColorStop(1, `hsl(${hue2}, ${saturation}%, ${40 * lightnessMultiplier}%)`);
            
            this.ctx.fillStyle = gradient;
            
            // 発光効果なし（色を保持）
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        // 台形（中心に向かって細くなる形）を描画
        this.ctx.beginPath();
        this.ctx.moveTo(tipX1, tipY1); // 中心側の一方
        this.ctx.lineTo(tipX2, tipY2); // 中心側の他方
        this.ctx.lineTo(baseX2, baseY2); // 画面端側の他方
        this.ctx.lineTo(baseX1, baseY1); // 画面端側の一方
        this.ctx.closePath();
        this.ctx.fill();
        
        // グロー効果なし（色のみ）
        
        this.ctx.restore();
    }

    drawCenterHighlight(centerX, centerY, lineWidth, centerSize) {
        // 中心点周辺の強調効果は完全に削除
        // 元の画像が完全に透けて見えるようにする
        // 何も描画しない
    }

    downloadImage() {
        if (!this.originalImage) return;
        
        // ダウンロード用のリンクを作成
        const link = document.createElement('a');
        link.download = 'concentration_lines_' + new Date().getTime() + '.png';
        link.href = this.canvas.toDataURL();
        
        // ダウンロードを実行
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async downloadGif() {
        if (!this.originalImage) return;
        
        // 現在のアニメーションを停止
        const wasAnimating = this.animationRunning;
        this.stopAnimation();
        
        // 進行状況の表示
        this.downloadGifBtn.textContent = 'アニメーション生成中...';
        this.downloadGifBtn.disabled = true;
        
        try {
            // WebMビデオ形式でアニメーションを作成
            await this.createWebMAnimation();
            
            // ボタンを元に戻す
            this.downloadGifBtn.textContent = '動画で保存';
            this.downloadGifBtn.disabled = false;
            
            // アニメーションを再開
            if (wasAnimating) {
                this.startAnimation();
            }
        } catch (error) {
            console.error('アニメーション生成エラー:', error);
            alert('アニメーション生成中にエラーが発生しました。静止画保存を試してください。');
            this.resetGifButton(wasAnimating);
        }
    }

    async createWebMAnimation() {
        // MediaRecorder を使用してWebMビデオを作成
        const stream = this.canvas.captureStream(15); // 15 FPS
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8'
        });
        
        const chunks = [];
        
        return new Promise((resolve, reject) => {
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'concentration_lines_animated_' + new Date().getTime() + '.webm';
                link.href = url;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                resolve();
            };
            
            mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder エラー:', error);
                reject(error);
            };
            
            // 録画開始
            mediaRecorder.start();
            
            // 3秒間録画（1.5ループ分）
            const duration = 3000;
            this.downloadGifBtn.textContent = 'ビデオ録画中...';
            
            // アニメーション開始
            this.animationRunning = true;
            this.startTime = Date.now();
            this.animate();
            
            // 録画停止
            setTimeout(() => {
                mediaRecorder.stop();
                this.stopAnimation();
            }, duration);
        });
    }

    resetGifButton(wasAnimating) {
        this.downloadGifBtn.textContent = '動画で保存';
        this.downloadGifBtn.disabled = false;
        this.downloadRealGifBtn.textContent = 'GIFで保存';
        this.downloadRealGifBtn.disabled = false;
        
        // アニメーションを再開
        if (wasAnimating) {
            this.startAnimation();
        }
    }

    async downloadRealGif() {
        if (!this.originalImage) {
            alert('画像を選択してください。');
            return;
        }
        // 現在のアニメーションを停止
        const wasAnimating = this.animationRunning;
        this.stopAnimation();
        this.downloadRealGifBtn.textContent = '生成中...';
        this.downloadRealGifBtn.disabled = true;
        try {
            console.log('=== GIF生成開始 ===');
            
            // メモリ使用量をログ出力（可能な場合）
            if (window.performance && window.performance.memory) {
                const mem = window.performance.memory;
                console.log(`メモリ使用量 - 使用中: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB, 制限: ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
            }
            
            // フレームデータを収集
            console.log('フレーム収集を開始...');
            await this.captureFramesForGif();
            console.log(`フレーム収集完了: ${this.capturedFrames.length}フレーム`);
            
            const gifSize = this.getGifSize();
            console.log(`GIFサイズ: ${gifSize.width}x${gifSize.height}`);
            
            // gif.jsでGIF生成（高品質設定）
            console.log('GIFエンコーダーを初期化...');
            const gif = new GIF({
                workers: 2, // 安定性を優先してワーカー数を2に
                quality: 1, // 最高品質（1が最高、30が最低）
                width: gifSize.width,
                height: gifSize.height,
                dither: false, // ディザリングを無効にして高品質に
                globalPalette: false, // ローカルパレットで色精度向上
                background: '#000000', // 背景色を明示的に指定
                workerScript: 'gif.worker.js'
            });
            const frameCount = this.capturedFrames.length;
            console.log(`GIFエンコーダー初期化完了, フレーム数: ${frameCount}`);
            
            // アニメーション速度に基づいてGIF再生速度を調整
            const animationSpeed = parseInt(this.animationSpeed.value) || 5;
            // プレビューの2秒ループに合わせてGIF遅延時間を計算
            const baseDelay = 2000 / frameCount; // 2秒ループをフレーム数で分割
            // アニメーション速度設定に応じて遅延時間を調整（速度が高いほど短い遅延）
            const adjustedDelay = Math.max(50, Math.round(baseDelay / (animationSpeed / 5)));
            console.log(`フレーム遅延時間: ${adjustedDelay}ms`);
            
            console.log('フレームをGIFに追加中...');
            for (let i = 0; i < this.capturedFrames.length; i++) {
                const frameCanvas = this.capturedFrames[i];
                console.log(`フレーム ${i + 1}/${frameCount} を追加中...`);
                gif.addFrame(frameCanvas, {delay: adjustedDelay, copy: true});
            }
            console.log('全フレーム追加完了');
            gif.on('finished', (blob) => {
                console.log('GIF生成完了！', blob);
                console.log(`生成されたGIFサイズ: ${(blob.size / 1024).toFixed(2)}KB`);
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'concentration_lines_' + new Date().getTime() + '.gif';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                this.downloadRealGifBtn.textContent = 'GIFで保存';
                this.downloadRealGifBtn.disabled = false;
                console.log('=== GIF生成処理完了 ===');
                if (wasAnimating) {
                    this.startAnimation();
                }
            });
            
            gif.on('progress', (p) => {
                const progress = Math.round(p * 100);
                console.log(`GIF生成進行: ${progress}%`);
                this.downloadRealGifBtn.textContent = `GIF生成中... ${progress}%`;
            });
            
            gif.on('abort', () => {
                console.error('GIF生成が中断されました');
                this.downloadRealGifBtn.textContent = 'GIFで保存';
                this.downloadRealGifBtn.disabled = false;
            });
            
            console.log('GIF レンダリング開始...');
            gif.render();
        } catch (error) {
            console.error('=== GIF生成エラー詳細 ===');
            console.error('エラーメッセージ:', error.message);
            console.error('エラースタック:', error.stack);
            console.error('エラーオブジェクト:', error);
            
            // エラーの種類に応じて詳細な情報を出力
            if (error.name === 'QuotaExceededError' || error.message.includes('memory')) {
                console.error('メモリ不足エラーの可能性があります');
                alert('GIF生成に失敗しました。\nメモリ不足の可能性があります。\n・GIFサイズを小さくしてみてください\n・フレーム数を減らしてみてください');
            } else if (error.message.includes('worker') || error.message.includes('Worker')) {
                console.error('ワーカースクリプトの読み込みエラーの可能性があります');
                alert('GIF生成に失敗しました。\nワーカースクリプトの読み込みエラーです。\nページを再読み込みしてください。');
            } else {
                console.error('不明なエラーです');
                alert(`GIF生成に失敗しました。\nエラー: ${error.message}\n\nコンソールログで詳細を確認してください。`);
            }
            
            this.downloadRealGifBtn.textContent = 'GIFで保存';
            this.downloadRealGifBtn.disabled = false;
            if (wasAnimating) {
                this.startAnimation();
            }
        }
    }

    getGifSize() {
        const mode = this.gifSizeMode.value;
        if (mode === 'small') {
            return { width: 512, height: 512 }; // 小サイズを512x512に改善
        } else if (mode === 'original') {
            return { width: this.canvas.width, height: this.canvas.height };
        } else if (mode === 'custom') {
            return { 
                width: parseInt(this.gifWidth.value) || 768, 
                height: parseInt(this.gifHeight.value) || 768 
            };
        }
        // デフォルトは元画像サイズを使用（高解像度）
        return { width: this.canvas.width, height: this.canvas.height };
    }

    // 完璧なループのための最適フレーム数を自動計算
    calculateOptimalFrameCount() {
        const animationMode = this.animationMode.value;
        const animationSpeed = parseInt(this.animationSpeed.value) || 5;
        
        let optimalFrames;
        
        switch (animationMode) {
            case 'rainbow':
                // 虹色グラデーション：7色の虹色が一周するのに最適なフレーム数
                // 速度に応じて調整（速い場合は少ないフレーム、遅い場合は多いフレーム）
                const baseRainbowFrames = 14; // 7色 × 2倍の滑らかさ
                optimalFrames = Math.max(8, Math.round(baseRainbowFrames * (10 / animationSpeed)));
                break;
                
            case 'bluepurplepink':
                // シアン→青→紫→ピンク→赤寄りグラデーション：7色のグラデーション一周期
                const baseBluePurplePinkFrames = 14; // 7色 × 2倍の滑らかさ（虹色と同等）
                optimalFrames = Math.max(8, Math.round(baseBluePurplePinkFrames * (10 / animationSpeed)));
                break;
                
            case 'pulse':
                // ピカピカ点滅：sin波の一周期に最適なフレーム数
                const basePulseFrames = 12; // sin波の滑らかな一周期
                optimalFrames = Math.max(6, Math.round(basePulseFrames * (10 / animationSpeed)));
                break;
                
            case 'wave':
                // 波動効果：色相と明度の波動周期
                const baseWaveFrames = 16; // 波動の滑らかな一周期
                optimalFrames = Math.max(8, Math.round(baseWaveFrames * (10 / animationSpeed)));
                break;
                
            default:
                optimalFrames = 8; // 静止画の場合のデフォルト
        }
        
        // 24フレーム以下に制限（GIF生成時間とファイルサイズ考慮）
        return Math.min(24, optimalFrames);
    }

    async captureFramesForGif() {
        this.capturedFrames = [];
        const frameCount = this.calculateOptimalFrameCount();
        
        // プレビューと同じ2秒ループサイクル（完璧なループのため）
        const loopDuration = 2000; // 2秒 = 2000ミリ秒
        this.downloadRealGifBtn.textContent = `フレーム収集中...（${frameCount}フレーム）`;
        const originalStartTime = this.startTime;
        
        const gifSize = this.getGifSize();
        
        for (let frame = 0; frame < frameCount; frame++) {
            try {
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            // プレビューと同じ時間計算ロジックを使用
                            const baseTime = Date.now();
                            const frameTime = baseTime + (frame / frameCount) * loopDuration;
                            
                            // プレビューと完全に同じ時間計算
                            this.startTime = baseTime;
                            this.generateConcentrationLines(frameTime);
                            
                            // 指定サイズでキャプチャ（高品質レンダリング）
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = gifSize.width;
                            tempCanvas.height = gifSize.height;
                            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                            
                            // 最高品質レンダリング設定
                            tempCtx.imageSmoothingEnabled = true;
                            tempCtx.imageSmoothingQuality = 'high';
                            tempCtx.lineCap = 'round';
                            tempCtx.lineJoin = 'round';
                            tempCtx.textRenderingOptimization = 'optimizeQuality';
                            
                            tempCtx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
                            
                            this.capturedFrames.push(tempCanvas);
                            const progress = Math.round((frame + 1) / frameCount * 50);
                            this.downloadRealGifBtn.textContent = `フレーム収集中... ${frame + 1}/${frameCount} (${progress}%)`;
                            resolve();
                        } catch (error) {
                            console.error(`フレーム ${frame + 1} でエラー:`, error);
                            reject(error);
                        }
                    }, 100);
                });
            } catch (error) {
                console.error('フレーム生成エラー:', error);
                throw new Error(`フレーム ${frame + 1} の生成に失敗しました: ${error.message}`);
            }
        }
        this.startTime = originalStartTime;
    }

    async createHtmlAnimation() {
        if (this.capturedFrames.length === 0) {
            throw new Error('フレームデータがありません');
        }
        
        // HTMLコンテンツを作成
        let htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>集中線アニメーション</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            text-align: center;
            background: #000;
            font-family: Arial, sans-serif;
        }
        h1 {
            color: white;
            margin-bottom: 20px;
        }
        .animation-container {
            display: inline-block;
            position: relative;
            border: 2px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }
        .frame {
            display: none;
            max-width: 100%;
            height: auto;
        }
        .frame.active {
            display: block;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            padding: 10px 20px;
            margin: 5px;
            font-size: 16px;
            background: #333;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #555;
        }
        .info {
            color: #ccc;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>集中線アニメーション</h1>
    <div class="animation-container">`;

        // 各フレームを埋め込み
        for (let i = 0; i < this.capturedFrames.length; i++) {
            htmlContent += `        <img class="frame${i === 0 ? ' active' : ''}" src="${this.capturedFrames[i].toDataURL()}" alt="Frame ${i + 1}">\n`;
        }

        htmlContent += `    </div>
    <div class="controls">
        <button onclick="toggleAnimation()">再生/停止</button>
        <button onclick="prevFrame()">前のフレーム</button>
        <button onclick="nextFrame()">次のフレーム</button>
    </div>
    <div class="info">
        <p>フレーム: <span id="frameInfo">1 / ${this.capturedFrames.length}</span></p>
        <p>自動再生中 - クリックして操作可能</p>
    </div>

    <script>
        let currentFrame = 0;
        let isPlaying = true;
        let intervalId = null;
        const frames = document.querySelectorAll('.frame');
        const frameInfo = document.getElementById('frameInfo');
        
        function showFrame(index) {
            frames.forEach(f => f.classList.remove('active'));
            frames[index].classList.add('active');
            frameInfo.textContent = (index + 1) + ' / ' + frames.length;
        }
        
        function nextFrame() {
            currentFrame = (currentFrame + 1) % frames.length;
            showFrame(currentFrame);
        }
        
        function prevFrame() {
            currentFrame = (currentFrame - 1 + frames.length) % frames.length;
            showFrame(currentFrame);
        }
        
        function toggleAnimation() {
            if (isPlaying) {
                clearInterval(intervalId);
                isPlaying = false;
            } else {
                intervalId = setInterval(nextFrame, 1000); // 1秒間隔
                isPlaying = true;
            }
        }
        
        // 自動再生開始
        intervalId = setInterval(nextFrame, 1000);
    </script>
</body>
</html>`;

        // HTMLファイルとして保存
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'concentration_lines_animation_' + new Date().getTime() + '.html';
        link.href = url;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    async createStripImage() {
        // フォールバック: 全フレームを横に並べた長い画像として保存
        const stripCanvas = document.createElement('canvas');
        stripCanvas.width = this.canvas.width * this.capturedFrames.length;
        stripCanvas.height = this.canvas.height;
        const stripCtx = stripCanvas.getContext('2d');
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        for (let i = 0; i < this.capturedFrames.length; i++) {
            tempCtx.putImageData(this.capturedFrames[i].getContext('2d').getImageData(0, 0, this.canvas.width, this.canvas.height), 0, 0);
            stripCtx.drawImage(tempCanvas, i * this.canvas.width, 0);
        }
        
        // 画像として保存
        stripCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'concentration_lines_frames_' + new Date().getTime() + '.png';
            link.href = url;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    // デフォルト値をセット（ゲーミング虹色・虹色グラデーション）
    setDefaultParams() {
        this.colorMode.value = 'rainbow';
        this.animationMode.value = 'rainbow';
        this.toggleColorMode({ target: { value: 'rainbow' } });
    }
}

// ゲーミングテキストジェネレーター
class GamingTextGenerator {
    constructor() {
        this.textCanvas = document.getElementById('textCanvas');
        this.textCtx = this.textCanvas.getContext('2d', { willReadFrequently: true });
        this.animationRunning = false;
        this.animationFrame = null;
        this.startTime = null;
        this.capturedFrames = [];
        
        // キャンバスの背景を透明に設定
        this.textCtx.globalCompositeOperation = 'source-over';
        
        this.initializeElements();
        this.bindEvents();
        this.setupCanvas();
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.textSize = document.getElementById('textSize');
        this.textSizeValue = document.getElementById('textSizeValue');
        this.textFont = document.getElementById('textFont');
        this.textBold = document.getElementById('textBold');
        this.textAnimationMode = document.getElementById('textAnimationMode');
        this.textGradientDirection = document.getElementById('textGradientDirection');
        this.gradientDirectionGroup = document.getElementById('gradientDirectionGroup');
        this.textAnimationSpeed = document.getElementById('textAnimationSpeed');
        this.textAnimationSpeedValue = document.getElementById('textAnimationSpeedValue');
        this.textSaturation = document.getElementById('textSaturation');
        this.textSaturationValue = document.getElementById('textSaturationValue');
        this.textGradientDensity = document.getElementById('textGradientDensity');
        this.textGradientDensityValue = document.getElementById('textGradientDensityValue');
        this.gradientDensityGroup = document.getElementById('gradientDensityGroup');
        this.textBaseColor = document.getElementById('textBaseColor');
        this.textCanvasWidth = document.getElementById('textCanvasWidth');
        this.textCanvasHeight = document.getElementById('textCanvasHeight');
        this.textTransparentBg = document.getElementById('textTransparentBg');
        this.textStretch = document.getElementById('textStretch');
        this.textGlow = document.getElementById('textGlow');
        this.textImageInput = document.getElementById('textImageInput');
        this.textGenerateBtn = document.getElementById('textGenerateBtn');
        
        // 作成モード関連
        this.modeText = document.getElementById('modeText');
        this.modeImage = document.getElementById('modeImage');
        this.textInputGroup = document.getElementById('textInputGroup');
        this.imageInputGroup = document.getElementById('imageInputGroup');
        
        // 画像関連の変数
        this.uploadedImage = null;
        this.textDownloadBtn = document.getElementById('textDownloadBtn');
        this.textDownloadGifBtn = document.getElementById('textDownloadGifBtn');
        
        // テーマプレビュー関連
        this.lightCanvas = document.getElementById('lightCanvas');
        this.darkCanvas = document.getElementById('darkCanvas');
        this.lightCtx = this.lightCanvas.getContext('2d', { willReadFrequently: true });
        this.darkCtx = this.darkCanvas.getContext('2d', { willReadFrequently: true });
        
        // Slackスタンププレビュー関連（ライト・ダークモード対応）
        this.slack32LightCanvas = document.getElementById('slack32LightCanvas');
        this.slack32DarkCanvas = document.getElementById('slack32DarkCanvas');
        this.slack64LightCanvas = document.getElementById('slack64LightCanvas');
        this.slack64DarkCanvas = document.getElementById('slack64DarkCanvas');
        this.slack32LightCtx = this.slack32LightCanvas.getContext('2d', { willReadFrequently: true });
        this.slack32DarkCtx = this.slack32DarkCanvas.getContext('2d', { willReadFrequently: true });
        this.slack64LightCtx = this.slack64LightCanvas.getContext('2d', { willReadFrequently: true });
        this.slack64DarkCtx = this.slack64DarkCanvas.getContext('2d', { willReadFrequently: true });
    }

    bindEvents() {
        this.textInput.addEventListener('input', () => this.autoGeneratePreview());
        this.textSize.addEventListener('input', (e) => {
            this.textSizeValue.textContent = e.target.value + 'px';
            this.autoGeneratePreview();
        });
        this.textFont.addEventListener('change', () => this.autoGeneratePreview());
        this.textBold.addEventListener('change', () => this.autoGeneratePreview());
        this.textAnimationMode.addEventListener('change', () => this.handleAnimationModeChange());
        this.textGradientDirection.addEventListener('change', () => this.autoGeneratePreview());
        this.textAnimationSpeed.addEventListener('input', (e) => {
            this.textAnimationSpeedValue.textContent = e.target.value;
        });
        this.textSaturation.addEventListener('input', (e) => {
            this.textSaturationValue.textContent = e.target.value + '%';
            this.autoGeneratePreview();
        });
        this.textGradientDensity.addEventListener('input', (e) => {
            this.textGradientDensityValue.textContent = e.target.value;
            this.autoGeneratePreview();
        });
        this.textBaseColor.addEventListener('input', () => this.autoGeneratePreview());
        this.textCanvasWidth.addEventListener('input', () => {
            this.setupCanvas();
            this.autoGeneratePreview();
        });
        this.textCanvasHeight.addEventListener('input', () => {
            this.setupCanvas();
            this.autoGeneratePreview();
        });
        this.textTransparentBg.addEventListener('change', () => {
            this.updateCanvasBackground();
            this.autoGeneratePreview();
        });
        this.textStretch.addEventListener('change', () => this.autoGeneratePreview());
        this.textGlow.addEventListener('change', () => this.autoGeneratePreview());
        this.textImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.textGenerateBtn.addEventListener('click', () => this.generateText());
        this.textDownloadBtn.addEventListener('click', () => this.downloadImage());
        this.textDownloadGifBtn.addEventListener('click', () => this.downloadGif());
        
        // 作成モードラジオボタンのイベントリスナー
        this.modeText.addEventListener('change', () => this.handleModeChange());
        this.modeImage.addEventListener('change', () => this.handleModeChange());
        
        // 初期状態のUI表示設定
        this.handleAnimationModeChange();
        
        // 初期プレビュー生成
        setTimeout(() => this.autoGeneratePreview(), 100);
    }

    handleModeChange() {
        if (this.modeText.checked) {
            // テキストモードに切り替え
            this.textInputGroup.style.display = 'block';
            this.imageInputGroup.style.display = 'none';
            // 画像をクリア
            this.uploadedImage = null;
            this.textImageInput.value = '';
        } else {
            // 画像モードに切り替え
            this.textInputGroup.style.display = 'none';
            this.imageInputGroup.style.display = 'block';
        }
        this.autoGeneratePreview();
    }

    setupCanvas() {
        const width = parseInt(this.textCanvasWidth.value) || 64;
        const height = parseInt(this.textCanvasHeight.value) || 64;
        
        // 通常のキャンバスサイズ設定
        this.textCanvas.width = width;
        this.textCanvas.height = height;
        this.textCanvas.style.width = width + 'px';
        this.textCanvas.style.height = height + 'px';
        
        // 高品質レンダリング設定（黒縁除去＋透過対応＋品質保持）
        this.textCtx.imageSmoothingEnabled = true; // 滑らかな描画
        this.textCtx.imageSmoothingQuality = 'high'; // 高品質
        this.textCtx.textRenderingOptimization = 'optimizeQuality'; // 品質優先
        this.textCtx.lineCap = 'round'; // 滑らかな線端
        this.textCtx.lineJoin = 'round'; // 滑らかな接続
        this.textCtx.shadowColor = 'rgba(0,0,0,0)'; // シャドウ無効化
        this.textCtx.shadowBlur = 0;
        this.textCtx.globalCompositeOperation = 'source-over';
        
        // キャンバスを完全に透明にクリア（確実な透過処理）
        this.textCtx.clearRect(0, 0, width, height);
        
        // 透過背景を確実に設定
        this.textCanvas.style.backgroundColor = 'transparent';
        
        // テーマプレビューキャンバスのサイズを設定
        this.lightCanvas.width = 100;
        this.lightCanvas.height = 100;
        this.darkCanvas.width = 100;
        this.darkCanvas.height = 100;
        
        // Slackプレビューキャンバスは既にHTMLで設定済み
        
        this.updateCanvasBackground();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            this.uploadedImage = null;
            // ファイルが選択されていない場合は、テキストモードに戻る
            this.modeText.checked = true;
            this.handleModeChange();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.uploadedImage = img;
                // 画像がアップロードされたら自動的に画像モードに切り替え
                this.modeImage.checked = true;
                this.handleModeChange();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    updateCanvasBackground() {
        if (this.textTransparentBg.checked) {
            this.textCanvas.classList.add('transparent-bg');
        } else {
            this.textCanvas.classList.remove('transparent-bg');
        }
    }

    autoGeneratePreview() {
        if (this.textAnimationMode.value === 'rainbow') {
            this.startAnimation();
        } else if (this.textAnimationMode.value === 'pulse') {
            this.startAnimation();
        } else if (this.textAnimationMode.value === 'rainbowPulse') {
            this.startAnimation();
        } else {
            this.generateText();
        }
    }

    handleAnimationModeChange() {
        // グラデーション方向の選択UIの表示/非表示を制御
        if (this.textAnimationMode.value === 'rainbow' || this.textAnimationMode.value === 'bluepurplepink') {
            this.gradientDirectionGroup.style.display = 'block';
            this.gradientDensityGroup.style.display = 'block';
        } else {
            this.gradientDirectionGroup.style.display = 'none';
            this.gradientDensityGroup.style.display = 'none';
        }
        
        if (this.textAnimationMode.value === 'rainbow' || this.textAnimationMode.value === 'bluepurplepink' || this.textAnimationMode.value === 'pulse' || this.textAnimationMode.value === 'rainbowPulse') {
            this.startAnimation();
        } else {
            this.stopAnimation();
            this.generateText();
        }
    }

    startAnimation() {
        this.stopAnimation();
        this.animationRunning = true;
        this.startTime = Date.now();
        this.animate();
    }

    stopAnimation() {
        this.animationRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        if (!this.animationRunning) return;
        
        const currentTime = Date.now();
        this.generateText(currentTime);
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    generateText(currentTime = null) {
        const text = this.textInput.value || 'GAMING';
        const animationMode = this.textAnimationMode.value;
        const animationSpeed = parseInt(this.textAnimationSpeed.value);
        const isTransparent = this.textTransparentBg.checked;
        
        console.log('=== generateText デバッグ ===');
        console.log('text:', text);
        console.log('canvas size:', this.textCanvas.width, 'x', this.textCanvas.height);
        console.log('animationMode:', animationMode);
        console.log('isTransparent:', isTransparent);
        
        // キャンバスを完全透明でクリア（確実に透過処理）
        this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        this.textCtx.globalCompositeOperation = 'source-over';
        
        // 透過設定時は背景を一切描画しない（黒い部分を完全除去）
        if (!isTransparent) {
            // 非透過時のみ、白背景を使用（黒背景だと黒い部分が目立つため）
            this.textCtx.fillStyle = '#FFFFFF';
            this.textCtx.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);
            console.log('白背景を描画しました（透過OFF時）');
        } else {
            console.log('透過背景モード：背景描画をスキップ');
        }
        
        // テキストサイズを取得（スライダーの値を使用）
        const fontSize = parseInt(this.textSize.value);
        console.log('fontSize:', fontSize);
        
        // フォント設定（太字オプション対応、黒縁なし）
        const selectedFont = this.textFont ? this.textFont.value : 'Arial';
        const fontWeight = this.textBold && this.textBold.checked ? 'bold' : 'normal';
        this.textCtx.font = `${fontWeight} ${fontSize}px ${selectedFont}`;
        this.textCtx.textAlign = 'center';
        this.textCtx.textBaseline = 'middle';
        console.log('フォント設定:', this.textCtx.font);
        
        // 高品質レンダリング設定（黒縁除去、品質保持）
        this.textCtx.imageSmoothingEnabled = true; // 滑らかな描画を維持
        this.textCtx.imageSmoothingQuality = 'high'; // 高品質スムージング
        this.textCtx.textRenderingOptimization = 'optimizeQuality'; // 品質優先
        this.textCtx.lineCap = 'round'; // 滑らかな線端
        this.textCtx.lineJoin = 'round'; // 滑らかな接続
        this.textCtx.shadowColor = 'rgba(0,0,0,0)'; // シャドウは無効化
        this.textCtx.shadowBlur = 0;
        
        // アニメーション時間オフセットを計算（非線形速度）
        let timeOffset = 0;
        if (currentTime && this.startTime) {
            // 調整された非線形速度計算：速度1を実用的に、20をより高速に
            // 速度1: 現在の速度4相当, 速度10: 適度な速度, 速度20: 高速アニメーション
            const speedMultiplier = Math.pow((animationSpeed + 2) / 8, 2.0) * 0.005;
            timeOffset = (currentTime - this.startTime) * speedMultiplier;
        }
        
        // 画像またはテキストを描画
        if (this.uploadedImage) {
            // 画像アニメーションもテキストと同じ速度計算を使用
            this.drawGamingImage(this.uploadedImage, animationMode, timeOffset);
        } else {
            const isStretch = this.textStretch.checked;
            const centerX = this.textCanvas.width / 2;
            const centerY = this.textCanvas.height / 2;
            console.log('drawGamingText呼び出し:', {
                text, centerX, centerY, animationMode, timeOffset, fontSize, isStretch
            });
            this.drawGamingText(text, centerX, centerY, animationMode, timeOffset, fontSize, isStretch);
        }
        
        // ダウンロードボタンを有効化
        this.textDownloadBtn.disabled = false;
        this.textDownloadGifBtn.disabled = false;
        
        // テーマプレビューとSlackスタンププレビューを更新
        this.updateThemePreviews(currentTime);
        this.updateSlackPreviews(currentTime);
    }

    drawGamingText(text, x, y, animationMode, timeOffset, fontSize, isStretch = false) {
        console.log('=== drawGamingText 開始 ===');
        console.log('引数:', { text, x, y, animationMode, timeOffset, fontSize, isStretch });
        
        // 完全にクリーンな描画のための初期設定
        this.textCtx.shadowColor = 'transparent';
        this.textCtx.shadowBlur = 0;
        this.textCtx.shadowOffsetX = 0;
        this.textCtx.shadowOffsetY = 0;
        this.textCtx.globalCompositeOperation = 'source-over';
        this.textCtx.imageSmoothingEnabled = false; // アンチエイリアス無効化
        this.textCtx.textRenderingOptimization = 'optimizeSpeed';
        
        // 改行対応
        const lines = text.split('\n');
        let lineHeight = fontSize * 1.2;
        let actualFontSize = fontSize;
        console.log('lines:', lines, 'lineHeight:', lineHeight, 'actualFontSize:', actualFontSize);
        
        // キャンバスサイズを事前に取得（スコープ問題を回避）
        const canvasHeight = this.textCanvas.height;
        const canvasWidth = this.textCanvas.width;
        
        // テキスト引き伸ばしが有効な場合
        if (isStretch) {
            if (lines.length === 1) {
                // 単一行：キャンバス高さの95%をフォントサイズに使用（最大限フィット）
                actualFontSize = canvasHeight * 0.95;
                lineHeight = canvasHeight;
            } else {
                // 複数行：各行の高さを計算
                lineHeight = canvasHeight / lines.length;
                // フォントサイズは行高の90%（最大限フィット）
                actualFontSize = lineHeight * 0.90;
            }
        }
        
        // フォント設定（太字オプション付き、黒縁なし）
        let selectedFont = this.textFont ? this.textFont.value : 'Arial';
        
        // 小さいサイズでの最適化
        const canvasSize = Math.min(canvasWidth, canvasHeight);
        if (canvasSize <= 64 && actualFontSize <= 20) {
            selectedFont = 'Arial'; // 小さいサイズでは基本フォントのみ
            console.log(`小サイズ用基本フォント適用: ${selectedFont}`);
        }
        
        // 太字オプション（ユーザー選択可能）
        const fontWeight = this.textBold && this.textBold.checked ? 'bold' : 'normal';
        this.textCtx.font = `${fontWeight} ${actualFontSize}px ${selectedFont}`;
        console.log(`フォント設定: ${this.textCtx.font}`);
        
        // テキストベースラインを正確に設定（ぴったりフィット用）
        if (isStretch) {
            this.textCtx.textBaseline = 'alphabetic'; // 引き伸ばし時はより正確な基準線を使用
        } else {
            this.textCtx.textBaseline = 'middle'; // 通常時は中央
        }
        this.textCtx.textAlign = 'center';
        
        // 小さいサイズでの高品質描画設定
        if (canvasSize <= 64) {
            // 高品質な描画のための設定
            this.textCtx.fontKerning = 'auto'; // 自動カーニング
            this.textCtx.fontVariantCaps = 'normal';
            this.textCtx.fontStretch = 'normal';
            this.textCtx.fontDisplay = 'auto';
            this.textCtx.imageSmoothingEnabled = true; // 小サイズでも高品質
            this.textCtx.imageSmoothingQuality = 'high';
            console.log(`小サイズ用高品質描画設定適用: ${canvasSize}px`);
        }
        
        lines.forEach((line, index) => {
            console.log(`行 ${index}: "${line}"`);
            // 空白行をスキップしない（スペースのみの行も描画対象）
            if (!line && line !== '') {
                console.log('空行のためスキップ');
                return;
            }
            
            let currentY;
            
            if (isStretch) {
                if (lines.length === 1) {
                    // 単一行：alphabeticベースライン用に調整（文字の下端から85%位置で中央寄り）
                    currentY = this.textCanvas.height * 0.85;
                } else {
                    // 複数行：各行を均等に配置（alphabeticベースライン用調整）
                    const totalHeight = this.textCanvas.height;
                    const lineSpacing = totalHeight / lines.length;
                    // 各セクションの80%位置に配置（文字がセクション内に収まるように）
                    currentY = lineSpacing * index + lineSpacing * 0.8;
                }
            } else {
                // 通常モード：従来の計算
                const startY = y - ((lines.length - 1) * lineHeight) / 2;
                currentY = startY + index * lineHeight;
            }
            
            // テキスト引き伸ばしが有効な場合、各行を個別に横幅いっぱいに調整
            if (isStretch && line.trim()) {
                const stretchCanvasWidth = this.textCanvas.width;
                
                // 現在のフォントサイズでテキスト幅を測定
                const currentWidth = this.textCtx.measureText(line).width;
                
                if (currentWidth > 0) {
                    // 横方向のスケール比を計算（キャンバス幅の99%に収める - ぴったりフィット）
                    const targetWidth = stretchCanvasWidth * 0.99; // 最小限のマージンでぴったりフィット
                    const scaleX = targetWidth / currentWidth;
                    
                    // 変形を適用
                    this.textCtx.save();
                    this.textCtx.scale(scaleX, 1);
                    
                    // スケールされた座標で描画（中央揃えを維持）
                    const scaledX = (stretchCanvasWidth / 2) / scaleX; // 中央位置をスケールで調整
                    
                    // アニメーション効果を引き伸ばし後に適用
                    this.applyAnimationEffect(animationMode, timeOffset, line, scaledX, currentY);
                    
                    this.textCtx.restore();
                } else {
                    // テキスト幅が0の場合は通常描画
                    this.applyAnimationEffect(animationMode, timeOffset, line, x, currentY);
                }
            } else {
                // 通常の描画（引き伸ばしでない場合、または空白行）
                console.log('通常描画:', { line, x, currentY, animationMode });
                this.applyAnimationEffect(animationMode, timeOffset, line, x, currentY);
            }
        });
        
        // シャドウをリセット
        this.textCtx.shadowColor = 'transparent';
        this.textCtx.shadowBlur = 0;
    }



    // テーマプレビューを更新
    updateThemePreviews(currentTime = null) {
        const text = this.textInput.value || 'GAMING';
        const animationMode = this.textAnimationMode.value;
        const animationSpeed = parseInt(this.textAnimationSpeed.value);
        const fontSize = this.calculateOptimalFontSize(text, 100, 100); // 動的フォントサイズ計算
        const isTransparent = this.textTransparentBg ? this.textTransparentBg.checked : false;
        
        // アニメーション時間オフセット計算（非線形速度）
        let timeOffset = 0;
        if (currentTime && this.startTime) {
            // メインキャンバスと同じ調整された非線形速度計算
            const speedMultiplier = Math.pow((animationSpeed + 2) / 8, 2.0) * 0.005;
            timeOffset = (currentTime - this.startTime) * speedMultiplier;
        }
        
        // ライトモードプレビュー（白背景）
        this.lightCanvas.width = 100;
        this.lightCanvas.height = 100;
        this.lightCtx.clearRect(0, 0, 100, 100);
        
        // 背景処理（メインキャンバスと同じロジック）
        if (!isTransparent) {
            this.lightCtx.fillStyle = '#ffffff';
            this.lightCtx.fillRect(0, 0, 100, 100);
        }
        
        if (this.uploadedImage) {
            this.drawPreviewImage(this.lightCtx, this.lightCanvas, this.uploadedImage, animationMode, timeOffset);
        } else {
            this.drawPreviewText(this.lightCtx, this.lightCanvas, text, animationMode, timeOffset, fontSize, false);
        }
        
        // ダークモードプレビュー（黒背景）
        this.darkCanvas.width = 100;
        this.darkCanvas.height = 100;
        this.darkCtx.clearRect(0, 0, 100, 100);
        
        // 背景処理（メインキャンバスと同じロジック）
        if (!isTransparent) {
            this.darkCtx.fillStyle = '#2c2c2c';
            this.darkCtx.fillRect(0, 0, 100, 100);
        }
        
        if (this.uploadedImage) {
            this.drawPreviewImage(this.darkCtx, this.darkCanvas, this.uploadedImage, animationMode, timeOffset);
        } else {
            this.drawPreviewText(this.darkCtx, this.darkCanvas, text, animationMode, timeOffset, fontSize, true);
        }
    }

    // Slackスタンププレビューを更新
    updateSlackPreviews(currentTime = null) {
        const text = this.textInput.value || 'GAMING';
        const animationMode = this.textAnimationMode.value;
        const animationSpeed = parseInt(this.textAnimationSpeed.value);
        const isTransparent = this.textTransparentBg ? this.textTransparentBg.checked : false;
        
        // アニメーション時間オフセット計算（非線形速度）
        let timeOffset = 0;
        if (currentTime && this.startTime) {
            // メインキャンバスと同じ調整された非線形速度計算
            const speedMultiplier = Math.pow((animationSpeed + 2) / 8, 2.0) * 0.005;
            timeOffset = (currentTime - this.startTime) * speedMultiplier;
        }
        
        // 32x32px ライトモードプレビュー
        this.slack32LightCtx.clearRect(0, 0, 32, 32);
        if (!isTransparent) {
            this.slack32LightCtx.fillStyle = '#ffffff';
            this.slack32LightCtx.fillRect(0, 0, 32, 32);
        }
        if (this.uploadedImage) {
            this.drawPreviewImage(this.slack32LightCtx, this.slack32LightCanvas, this.uploadedImage, animationMode, timeOffset);
        } else {
            const fontSize32 = this.calculateOptimalFontSize(text, 32, 32);
            this.drawPreviewText(this.slack32LightCtx, this.slack32LightCanvas, text, animationMode, timeOffset, fontSize32, false);
        }
        
        // 32x32px ダークモードプレビュー
        this.slack32DarkCtx.clearRect(0, 0, 32, 32);
        if (!isTransparent) {
            this.slack32DarkCtx.fillStyle = '#2c2c2c';
            this.slack32DarkCtx.fillRect(0, 0, 32, 32);
        }
        if (this.uploadedImage) {
            this.drawPreviewImage(this.slack32DarkCtx, this.slack32DarkCanvas, this.uploadedImage, animationMode, timeOffset);
        } else {
            const fontSize32 = this.calculateOptimalFontSize(text, 32, 32);
            this.drawPreviewText(this.slack32DarkCtx, this.slack32DarkCanvas, text, animationMode, timeOffset, fontSize32, true);
        }
        
        // 64x64px ライトモードプレビュー
        this.slack64LightCtx.clearRect(0, 0, 64, 64);
        if (!isTransparent) {
            this.slack64LightCtx.fillStyle = '#ffffff';
            this.slack64LightCtx.fillRect(0, 0, 64, 64);
        }
        if (this.uploadedImage) {
            this.drawPreviewImage(this.slack64LightCtx, this.slack64LightCanvas, this.uploadedImage, animationMode, timeOffset);
        } else {
            const fontSize64 = this.calculateOptimalFontSize(text, 64, 64);
            this.drawPreviewText(this.slack64LightCtx, this.slack64LightCanvas, text, animationMode, timeOffset, fontSize64, false);
        }
        
        // 64x64px ダークモードプレビュー
        this.slack64DarkCtx.clearRect(0, 0, 64, 64);
        if (!isTransparent) {
            this.slack64DarkCtx.fillStyle = '#2c2c2c';
            this.slack64DarkCtx.fillRect(0, 0, 64, 64);
        }
        if (this.uploadedImage) {
            this.drawPreviewImage(this.slack64DarkCtx, this.slack64DarkCanvas, this.uploadedImage, animationMode, timeOffset);
        } else {
            const fontSize64 = this.calculateOptimalFontSize(text, 64, 64);
            this.drawPreviewText(this.slack64DarkCtx, this.slack64DarkCanvas, text, animationMode, timeOffset, fontSize64, true);
        }
    }

    // 最適なフォントサイズを計算（テキスト引き伸ばし設定を考慮）
    calculateOptimalFontSize(text, width, height) {
        const lines = text.split('\n');
        const maxLines = lines.length;
        const isStretch = this.textStretch ? this.textStretch.checked : false;
        
        let fontSize;
        
        if (isStretch) {
            // テキスト引き伸ばしが有効な場合：メインキャンバスと同じロジック
            if (lines.length === 1) {
                // 単一行：キャンバス高さの95%をフォントサイズに使用
                fontSize = height * 0.95;
            } else {
                // 複数行：各行の高さを計算してフォントサイズは行高の90%
                const lineHeight = height / lines.length;
                fontSize = lineHeight * 0.90;
            }
        } else {
            // 通常モード：従来の計算
            fontSize = Math.min(width, height) / maxLines * 0.6;
        }
        
        // 最小・最大フォントサイズを制限
        fontSize = Math.max(8, Math.min(fontSize, width * 0.8));
        
        return fontSize;
    }

    // プレビュー用のテキスト描画（メインキャンバスと完全に同じロジック）
    drawPreviewText(ctx, canvas, text, animationMode, timeOffset, fontSize, isDarkMode) {
        // 一時的にメインコンテキストを切り替えてメインの描画メソッドを使用
        const originalCtx = this.textCtx;
        const originalCanvas = this.textCanvas;
        
        // プレビューキャンバスに切り替え
        this.textCtx = ctx;
        this.textCanvas = canvas;
        
        try {
            // メインキャンバスと同じ設定を使用
            const isStretch = this.textStretch ? this.textStretch.checked : false;
            
            // メインの描画メソッドを完全に同じ設定で使用
            this.drawGamingText(text, canvas.width / 2, canvas.height / 2, animationMode, timeOffset, fontSize, isStretch);
        } finally {
            // 元のコンテキストに戻す
            this.textCtx = originalCtx;
            this.textCanvas = originalCanvas;
        }
    }

    // プレビュー用の画像描画（メインキャンバスと完全に同じロジック）
    drawPreviewImage(ctx, canvas, image, animationMode, timeOffset) {
        // 一時的にメインコンテキストを切り替えてメインの描画メソッドを使用
        const originalCtx = this.textCtx;
        const originalCanvas = this.textCanvas;
        
        // プレビューキャンバスに切り替え
        this.textCtx = ctx;
        this.textCanvas = canvas;
        
        try {
            // メインの描画メソッドを完全に同じ設定で使用
            this.drawGamingImage(image, animationMode, timeOffset);
        } finally {
            // 元のコンテキストに戻す
            this.textCtx = originalCtx;
            this.textCanvas = originalCanvas;
        }
    }





    applyAnimationEffect(animationMode, timeOffset, line, x, currentY) {
        // timeOffsetの安全性チェック
        if (isNaN(timeOffset) || !isFinite(timeOffset)) {
            timeOffset = 0;
        }
        
        // 彩度設定を取得（0-200%）
        const saturationLevel = this.textSaturation ? parseInt(this.textSaturation.value) / 100 : 1.0;
        
        if (animationMode === 'rainbow') {
            // 自然な虹色の順番（ROYGBIV）
            let gamingColors = [
                '#FF0000', // 赤
                '#FF8000', // オレンジ
                '#FFFF00', // 黄
                '#00FF00', // 緑
                '#0080FF', // 青
                '#4000FF', // 藍
                '#8000FF'  // 紫
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => this.adjustColorSaturation(color, saturationLevel));
            }
            
            // 小さいサイズでの色強化適用
            const smallCanvasSize = Math.min(this.textCanvas.width, this.textCanvas.height);
            if (smallCanvasSize <= 64) {
                gamingColors = gamingColors.map(color => this.enhanceColorForSmallSize(color));
                console.log(`小サイズ用虹色強化適用: ${smallCanvasSize}px`);
            }
            
            // グラデーション方向に応じてグラデーションを作成
            const textWidth = this.textCtx.measureText(line).width;
            const fontSize = parseInt(this.textCtx.font.match(/\d+/)[0]) || 32; // フォントサイズを取得
            const direction = this.textGradientDirection ? this.textGradientDirection.value : 'horizontal';
            let gradient;
            
            switch (direction) {
                case 'horizontal':
                    // 横方向（左→右）
                    gradient = this.textCtx.createLinearGradient(x - textWidth/2, currentY, x + textWidth/2, currentY);
                    break;
                case 'vertical':
                    // 縦方向（上→下）
                    gradient = this.textCtx.createLinearGradient(x, currentY - fontSize/2, x, currentY + fontSize/2);
                    break;
                case 'diagonal1':
                    // 斜め方向（左上→右下）
                    gradient = this.textCtx.createLinearGradient(
                        x - textWidth/2, currentY - fontSize/2,
                        x + textWidth/2, currentY + fontSize/2
                    );
                    break;
                case 'diagonal2':
                    // 斜め方向（右上→左下）
                    gradient = this.textCtx.createLinearGradient(
                        x + textWidth/2, currentY - fontSize/2,
                        x - textWidth/2, currentY + fontSize/2
                    );
                    break;
                default:
                    // デフォルトは横方向
                    gradient = this.textCtx.createLinearGradient(x - textWidth/2, currentY, x + textWidth/2, currentY);
            }
            
            // 時間ベースの色変化を修正（完璧なループのため）
            const normalizedTime = (timeOffset % 1 + 1) % 1; // 0-1の範囲で正規化
            const colorShift = normalizedTime * gamingColors.length; // 0-配列長の範囲
            
            // グラデーション密度を取得（ユーザー設定）
            const gradientDensity = this.textGradientDensity ? parseFloat(this.textGradientDensity.value) : 7;
            
            for (let i = 0; i <= 10; i++) {
                // 各グラデーション位置での色インデックスを計算
                const position = i / 10; // 0-1の範囲
                const colorFloat = (position * gradientDensity + colorShift) % gamingColors.length;
                
                // 安全なインデックス計算
                const colorIndex = Math.floor(Math.abs(colorFloat)) % gamingColors.length;
                const nextColorIndex = (colorIndex + 1) % gamingColors.length;
                const blend = Math.max(0, Math.min(1, colorFloat - Math.floor(colorFloat))); // 0-1の範囲に確実に制限
                
                // 2つの色をブレンド（彩度を保持）
                const color1 = gamingColors[colorIndex];
                const color2 = gamingColors[nextColorIndex];
                
                // 安全性チェック付きでブレンド
                let blendedColor;
                if (color1 && color2) {
                try {
                    blendedColor = this.blendColorsVivid(color1, color2, blend);
                } catch (error) {
                    console.error('Vivid blend error, falling back to normal blend:', error);
                    blendedColor = this.blendColors(color1, color2, blend);
                    }
                } else {
                    // フォールバック色
                    blendedColor = color1 || color2 || '#FF0000';
                }
                
                gradient.addColorStop(position, blendedColor);
            }
            
            this.textCtx.fillStyle = gradient;
            
            // シャドウ効果を完全に無効化（クリーンな描画のため）
            this.textCtx.shadowColor = 'transparent';
            this.textCtx.shadowBlur = 0;
            
        } else if (animationMode === 'pulse') {
            // ベースカラーから白へのピカピカ点滅
            const pulseSpeed = 6;
            const pulse = Math.sin(timeOffset * Math.PI * pulseSpeed);
            
            // ベースカラーを取得し、彩度を調整
            let baseColor = this.textBaseColor ? this.textBaseColor.value : '#FF0000';
            if (saturationLevel !== 1.0) {
                baseColor = this.adjustColorSaturation(baseColor, saturationLevel);
            }
            
            // パルスの値に基づいて白との混合比を決定
            const pulseIntensity = (pulse + 1) / 2; // 0-1の範囲に正規化
            
            // ベースカラーと白を混合
            const blendedColor = this.blendColors(baseColor, '#FFFFFF', pulseIntensity);
            
            this.textCtx.fillStyle = blendedColor;
            
            // シャドウ効果を完全に無効化（クリーンな描画のため）
            this.textCtx.shadowColor = 'transparent';
            this.textCtx.shadowBlur = 0;
            
        } else if (animationMode === 'rainbowPulse') {
            // 虹色ピカピカ（単一色+アニメーション+パルス効果）
            const pulseSpeed = 6;
            const pulse = Math.sin(timeOffset * Math.PI * pulseSpeed);
            
            // 自然な虹色の順番（ROYGBIV）
            let gamingColors = [
                '#FF0000', // 赤
                '#FF8000', // オレンジ
                '#FFFF00', // 黄
                '#00FF00', // 緑
                '#0080FF', // 青
                '#4000FF', // 藍
                '#8000FF'  // 紫
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => this.adjustColorSaturation(color, saturationLevel));
            }
            
            // 小さいサイズでの色強化適用
            const smallCanvasSize2 = Math.min(this.textCanvas.width, this.textCanvas.height);
            if (smallCanvasSize2 <= 64) {
                gamingColors = gamingColors.map(color => this.enhanceColorForSmallSize(color));
                console.log(`小サイズ用虹色パルス強化適用: ${smallCanvasSize2}px`);
            }
            
            // 時間に基づいて色を順番に選択（アニメーションで色が変化）
            const colorCycleSpeed = 2.0; // 色の変化速度
            const colorIndex = Math.floor(Math.abs(timeOffset * colorCycleSpeed)) % gamingColors.length;
            const rainbowColor = gamingColors[colorIndex];
            
            // パルス効果（0.6-1.0の範囲で明るさを変化）
            const pulseIntensity = 0.6 + (Math.abs(pulse) * 0.4);
            
            // 選択された色にパルス効果を適用
            const hex = rainbowColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            // パルス強度を適用
            const pulsedR = Math.min(255, Math.round(r * pulseIntensity));
            const pulsedG = Math.min(255, Math.round(g * pulseIntensity));
            const pulsedB = Math.min(255, Math.round(b * pulseIntensity));
            
            const pulsedColor = `#${pulsedR.toString(16).padStart(2, '0')}${pulsedG.toString(16).padStart(2, '0')}${pulsedB.toString(16).padStart(2, '0')}`;
            
            // 単一色で塗りつぶし
            this.textCtx.fillStyle = pulsedColor;
            
            // シャドウ効果を完全に無効化（クリーンな描画のため）
            this.textCtx.shadowColor = 'transparent';
            this.textCtx.shadowBlur = 0;

        } else if (animationMode === 'bluepurplepink') {
            // シアン→青→紫→ピンク→赤寄りグラデーション
            let gamingColors = [
                '#00FFFF', // シアン
                '#0080FF', // 青
                '#4040FF', // 青紫
                '#8000FF', // 紫
                '#C040FF', // ピンク紫
                '#FF40C0', // ピンク
                '#FF6080'  // 赤寄りピンク
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => this.adjustColorSaturation(color, saturationLevel));
            }
            
            // 小さいサイズでの色強化適用
            const smallCanvasSize3 = Math.min(this.textCanvas.width, this.textCanvas.height);
            if (smallCanvasSize3 <= 64) {
                gamingColors = gamingColors.map(color => this.enhanceColorForSmallSize(color));
                console.log(`小サイズ用青紫ピンク強化適用: ${smallCanvasSize3}px`);
            }
            
            // グラデーション方向に応じてグラデーションを作成
            const textWidth = this.textCtx.measureText(line).width;
            const fontSize = parseInt(this.textCtx.font.match(/\d+/)[0]) || 32; // フォントサイズを取得
            const direction = this.textGradientDirection ? this.textGradientDirection.value : 'horizontal';
            let gradient;
            
            switch (direction) {
                case 'horizontal':
                    // 横方向（左→右）
                    gradient = this.textCtx.createLinearGradient(x - textWidth/2, currentY, x + textWidth/2, currentY);
                    break;
                case 'vertical':
                    // 縦方向（上→下）
                    gradient = this.textCtx.createLinearGradient(x, currentY - fontSize/2, x, currentY + fontSize/2);
                    break;
                case 'diagonal1':
                    // 斜め方向（左上→右下）
                    gradient = this.textCtx.createLinearGradient(
                        x - textWidth/2, currentY - fontSize/2,
                        x + textWidth/2, currentY + fontSize/2
                    );
                    break;
                case 'diagonal2':
                    // 斜め方向（右上→左下）
                    gradient = this.textCtx.createLinearGradient(
                        x + textWidth/2, currentY - fontSize/2,
                        x - textWidth/2, currentY + fontSize/2
                    );
                    break;
                default:
                    // デフォルトは横方向
                    gradient = this.textCtx.createLinearGradient(x - textWidth/2, currentY, x + textWidth/2, currentY);
            }
            
            // 時間ベースの色変化を修正（完璧なループのため）
            const normalizedTime = (timeOffset % 1 + 1) % 1; // 0-1の範囲で正規化
            const colorShift = normalizedTime * gamingColors.length; // 0-配列長の範囲
            
            // グラデーション密度を取得（ユーザー設定）
            const gradientDensity2 = this.textGradientDensity ? parseFloat(this.textGradientDensity.value) : 7;
            
            for (let i = 0; i <= 10; i++) {
                // 各グラデーション位置での色インデックスを計算
                const position = i / 10; // 0-1の範囲
                const colorFloat = (position * gradientDensity2 + colorShift) % gamingColors.length;
                
                // 安全なインデックス計算
                const colorIndex = Math.floor(Math.abs(colorFloat)) % gamingColors.length;
                const nextColorIndex = (colorIndex + 1) % gamingColors.length;
                const blend = Math.max(0, Math.min(1, colorFloat - Math.floor(colorFloat))); // 0-1の範囲に確実に制限
                
                // 2つの色をブレンド（彩度を保持）
                const color1 = gamingColors[colorIndex];
                const color2 = gamingColors[nextColorIndex];
                
                // 安全性チェック付きでブレンド
                let blendedColor;
                if (color1 && color2) {
                try {
                    blendedColor = this.blendColorsVivid(color1, color2, blend);
                } catch (error) {
                    console.error('Vivid blend error, falling back to normal blend:', error);
                    blendedColor = this.blendColors(color1, color2, blend);
                    }
                } else {
                    // フォールバック色
                    blendedColor = color1 || color2 || '#FF0000';
                }
                
                gradient.addColorStop(position, blendedColor);
            }
            
            this.textCtx.fillStyle = gradient;
            
            // シャドウ効果を完全に無効化（クリーンな描画のため）
            this.textCtx.shadowColor = 'transparent';
            this.textCtx.shadowBlur = 0;
        }
        
        // テキストを描画
        console.log('テキスト描画実行:', {
            line, x: x, y: currentY, 
            fillStyle: this.textCtx.fillStyle,
            font: this.textCtx.font
        });
        
        // 高品質な描画のための設定
        this.textCtx.imageSmoothingEnabled = true; // アンチエイリアス有効化
        this.textCtx.imageSmoothingQuality = 'high'; // 高品質スムージング
        this.textCtx.textRenderingOptimization = 'optimizeQuality'; // 品質優先描画
        
        // シャドウ設定を確実に無効化
        this.textCtx.shadowColor = 'transparent';
        this.textCtx.shadowBlur = 0;
        this.textCtx.shadowOffsetX = 0;
        this.textCtx.shadowOffsetY = 0;
        
        // 小さいフォントサイズの場合の特別な品質向上
        const fontSize = parseInt(this.textCtx.font.match(/\d+/)[0]) || 32;
        const canvasSize = Math.min(this.textCanvas.width, this.textCanvas.height);
        
        if (fontSize <= 24 || canvasSize <= 64) {
            // 小さいフォント/小さいキャンバスでも高品質を維持
            this.textCtx.textRenderingOptimization = 'optimizeQuality'; // 品質優先
            this.textCtx.fontKerning = 'auto'; // 自動カーニング
            this.textCtx.fontVariantCaps = 'normal';
            this.textCtx.imageSmoothingEnabled = true; // 小サイズでもスムージング
            this.textCtx.imageSmoothingQuality = 'high'; // 高品質
            
            console.log(`小サイズ用高品質描画適用 - fontSize: ${fontSize}, canvasSize: ${canvasSize}`);
        }
        
        // 描画直前の高品質設定（太字対応、品質保持）
        this.textCtx.save(); // 現在の状態を保存
        
        // シャドウのみ無効化、その他は高品質維持
        this.textCtx.shadowColor = 'rgba(0,0,0,0)';
        this.textCtx.shadowBlur = 0;
        this.textCtx.shadowOffsetX = 0;
        this.textCtx.shadowOffsetY = 0;
        this.textCtx.imageSmoothingEnabled = true; // 高品質スムージング維持
        this.textCtx.imageSmoothingQuality = 'high';
        this.textCtx.textRenderingOptimization = 'optimizeQuality'; // 品質優先
        this.textCtx.globalCompositeOperation = 'source-over';
        this.textCtx.lineCap = 'round'; // 滑らかな線端
        this.textCtx.lineJoin = 'round'; // 滑らかな接続
        
        // 太字フォント使用時の設定
        const isBold = this.textBold && this.textBold.checked;
        if (isBold) {
            // 太字時も品質優先を維持
            this.textCtx.globalCompositeOperation = 'source-over';
            this.textCtx.textRenderingOptimization = 'optimizeQuality';
            console.log('太字モード：高品質描画適用');
        }
        
        // フォントレンダリングの詳細設定
        this.textCtx.textBaseline = this.textCtx.textBaseline; // 現在の設定を維持
        this.textCtx.textAlign = this.textCtx.textAlign; // 現在の設定を維持
        
        // 座標を整数に丸めてピクセル境界に正確に配置（黒縁除去）
        const roundedX = Math.round(x);
        const roundedY = Math.round(currentY);
        
        // テキスト描画（完全にクリーンな塗りつぶしのみ）
        this.textCtx.fillText(line, roundedX, roundedY);
        
        this.textCtx.restore(); // 状態を復元
        console.log('高品質テキスト描画完了 - 座標:', roundedX, roundedY, '太字:', isBold);
    }

    drawGamingImage(image, animationMode, timeOffset) {
        // 画像をキャンバスサイズに合わせて描画
        const canvasWidth = this.textCanvas.width;
        const canvasHeight = this.textCanvas.height;
        
        // 画像のアスペクト比を保持しながらキャンバスに収める
        const imageAspect = image.width / image.height;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imageAspect > canvasAspect) {
            // 画像が横長の場合
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imageAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        } else {
            // 画像が縦長の場合
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imageAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        }
        
        // 一時キャンバスに画像を描画
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        
        // アニメーション効果を適用
        this.applyImageAnimation(tempCanvas, animationMode, timeOffset);
        
        // 結果をメインキャンバスに描画
        this.textCtx.drawImage(tempCanvas, 0, 0);
    }

    applyImageAnimation(sourceCanvas, animationMode, timeOffset) {
        const imageData = sourceCanvas.getContext('2d').getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = imageData.data;
        
        // 彩度設定を取得（0-200%）
        const saturationLevel = this.textSaturation ? parseInt(this.textSaturation.value) / 100 : 1.0;
        
        if (animationMode === 'rainbow') {
            // 自然な虹色の順番（ROYGBIV）
            let gamingColors = [
                [255, 0, 0],     // 赤
                [255, 128, 0],   // オレンジ
                [255, 255, 0],   // 黄
                [0, 255, 0],     // 緑
                [0, 128, 255],   // 青
                [64, 0, 255],    // 藍
                [128, 0, 255]    // 紫
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => {
                    const hexColor = `#${color[0].toString(16).padStart(2, '0')}${color[1].toString(16).padStart(2, '0')}${color[2].toString(16).padStart(2, '0')}`;
                    const adjustedHex = this.adjustColorSaturation(hexColor, saturationLevel);
                    const r = parseInt(adjustedHex.substr(1, 2), 16);
                    const g = parseInt(adjustedHex.substr(3, 2), 16);
                    const b = parseInt(adjustedHex.substr(5, 2), 16);
                    return [r, g, b];
                });
            }
            
            // 時間ベースの色変化を修正（完璧なループのため）
            const normalizedTime = (timeOffset % 1 + 1) % 1; // 0-1の範囲で正規化
            const colorShift = normalizedTime * gamingColors.length; // 0-配列長の範囲
            
            // グラデーション方向を取得
            const direction = this.textGradientDirection ? this.textGradientDirection.value : 'horizontal';
            
            // グラデーション密度を取得
            const gradientDensity = this.gradientDensity ? parseFloat(this.gradientDensity.value) : 7;
            
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                const x = pixelIndex % sourceCanvas.width;
                const y = Math.floor(pixelIndex / sourceCanvas.width);
                
                // グラデーション方向に応じて位置を計算
                let position;
                switch (direction) {
                    case 'horizontal':
                        position = x / sourceCanvas.width; // 0-1の範囲
                        break;
                    case 'vertical':
                        position = y / sourceCanvas.height; // 0-1の範囲
                        break;
                    case 'diagonal1':
                        // 左上→右下
                        position = (x / sourceCanvas.width + y / sourceCanvas.height) / 2; // 0-1の範囲
                        break;
                    case 'diagonal2':
                        // 右上→左下
                        position = ((sourceCanvas.width - x) / sourceCanvas.width + y / sourceCanvas.height) / 2; // 0-1の範囲
                        break;
                    default:
                        position = x / sourceCanvas.width; // デフォルトは横方向
                }
                
                // グラデーション密度を適用
                const colorFloat = (position * gamingColors.length * gradientDensity + colorShift) % gamingColors.length;
                const colorIndex = Math.floor(Math.abs(colorFloat)) % gamingColors.length;
                const nextColorIndex = (colorIndex + 1) % gamingColors.length;
                const blend = Math.max(0, Math.min(1, colorFloat - Math.floor(colorFloat))); // 0-1の範囲に確実に制限
                
                const color1 = gamingColors[colorIndex];
                const color2 = gamingColors[nextColorIndex];
                
                // 色の安全性チェック
                if (!color1 || !color2) continue;
                
                // 2つの色を線形補間
                const blendedColor = [
                    Math.round(color1[0] + (color2[0] - color1[0]) * blend),
                    Math.round(color1[1] + (color2[1] - color1[1]) * blend),
                    Math.round(color1[2] + (color2[2] - color1[2]) * blend)
                ];
                
                if (data[i + 3] > 0) { // 透明でないピクセルのみ
                    // 元画像の色を取得
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像のRGBをHSLに変換
                    const originalHSL = this.rgbToHsl(originalR, originalG, originalB);
                    
                    // 元の色相をベースに色相シフトを適用
                    let newHue = originalHSL[0]; // 元の色相
                    
                    // グラデーション方向に応じた位置計算
                    const pixelIndex = i / 4;
                    const x = pixelIndex % sourceCanvas.width;
                    const y = Math.floor(pixelIndex / sourceCanvas.width);
                    
                    const direction = this.textGradientDirection ? this.textGradientDirection.value : 'horizontal';
                    let position;
                    switch (direction) {
                        case 'horizontal':
                            position = x / sourceCanvas.width;
                            break;
                        case 'vertical':
                            position = y / sourceCanvas.height;
                            break;
                        case 'diagonal1':
                            position = (x / sourceCanvas.width + y / sourceCanvas.height) / 2;
                            break;
                        case 'diagonal2':
                            position = ((sourceCanvas.width - x) / sourceCanvas.width + y / sourceCanvas.height) / 2;
                            break;
                        default:
                            position = x / sourceCanvas.width;
                    }
                    
                    // 時間とポジションに基づいて色相をシフト
                    const hueShift = (timeOffset * 2 + position * 2) % 1; // 0-1の範囲
                    newHue = (originalHSL[0] + hueShift) % 1;
                    
                    // 彩度を調整（元の彩度をベースに強化）
                    let newSaturation = originalHSL[1];
                    if (newSaturation < 0.3) {
                        // 元々彩度が低い部分は適度に強化
                        newSaturation = Math.min(0.8, newSaturation + 0.4) * saturationLevel;
                    } else {
                        // 元々彩度がある部分は元の値を活かしつつ調整
                        newSaturation = Math.min(1.0, newSaturation * 1.2) * saturationLevel;
                    }
                    
                    // 明度を適度に調整（元の明暗を保持）
                    let newLightness = originalHSL[2];
                    if (originalHSL[2] < 0.2) {
                        // 暗い部分は少し明るく
                        newLightness = Math.min(0.6, originalHSL[2] * 1.5);
                    } else if (originalHSL[2] > 0.8) {
                        // 明るい部分は少し抑制
                        newLightness = Math.max(0.4, originalHSL[2] * 0.9);
                    } else {
                        // 中間の明度は元の値を活かす
                        newLightness = originalHSL[2];
                    }
                    
                    // HSLからRGBに変換
                    const newRGB = this.hslToRgb(newHue, newSaturation, newLightness);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(newRGB[0])));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(newRGB[1]))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(newRGB[2]))); // B
                }
            }
            
        } else if (animationMode === 'pulse') {
            // ピカピカ点滅効果
            const pulseSpeed = 6;
            const pulse = Math.sin(timeOffset * Math.PI * pulseSpeed);
            const intensity = (pulse + 1) / 2; // 0-1の範囲
            
            // ベースカラーを取得し、彩度を調整
            let baseColor = this.textBaseColor ? this.textBaseColor.value : '#FF0000';
            if (saturationLevel !== 1.0) {
                baseColor = this.adjustColorSaturation(baseColor, saturationLevel);
            }
            const baseR = parseInt(baseColor.substr(1, 2), 16);
            const baseG = parseInt(baseColor.substr(3, 2), 16);
            const baseB = parseInt(baseColor.substr(5, 2), 16);
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // 透明でないピクセルのみ
                    // 元画像の色を取得
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像のRGBをHSLに変換
                    const originalHSL = this.rgbToHsl(originalR, originalG, originalB);
                    
                    // ベースカラーのHSLを取得
                    const baseHSL = this.rgbToHsl(baseR, baseG, baseB);
                    
                    // 元の色相をベースに、ベースカラーの色相方向にシフト
                    const hueBlend = 0.3; // ベースカラーの影響度
                    let newHue = originalHSL[0] * (1 - hueBlend) + baseHSL[0] * hueBlend;
                    newHue = newHue % 1; // 0-1の範囲に正規化
                    
                    // 彩度を調整（元の彩度をベースに強化）
                    let newSaturation = originalHSL[1];
                    if (newSaturation < 0.3) {
                        // 元々彩度が低い部分は適度に強化
                        newSaturation = Math.min(0.8, newSaturation + 0.4) * saturationLevel;
                    } else {
                        // 元々彩度がある部分は元の値を活かしつつ調整
                        newSaturation = Math.min(1.0, newSaturation * 1.2) * saturationLevel;
                    }
                    
                    // 明度にパルス効果を適用
                    let newLightness = originalHSL[2];
                    if (originalHSL[2] < 0.2) {
                        // 暗い部分は少し明るく
                        newLightness = Math.min(0.6, originalHSL[2] * 1.5);
                    } else if (originalHSL[2] > 0.8) {
                        // 明るい部分は少し抑制
                        newLightness = Math.max(0.4, originalHSL[2] * 0.9);
                    }
                    
                    // パルス効果で明度を変化
                    newLightness = Math.max(0.1, Math.min(0.9, newLightness * (0.6 + intensity * 0.4)));
                    
                    // HSLからRGBに変換
                    const newRGB = this.hslToRgb(newHue, newSaturation, newLightness);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(newRGB[0])));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(newRGB[1]))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(newRGB[2]))); // B
                }
            }
            
        } else if (animationMode === 'rainbowPulse') {
            // 虹色ピカピカ効果（テキストと同じ処理）
            const pulseSpeed = 6;
            const pulse = Math.sin(timeOffset * Math.PI * pulseSpeed);
            const pulseIntensity = 0.6 + (Math.abs(pulse) * 0.4); // テキストと同じ範囲：0.6-1.0
            
            let gamingColors = [
                [255, 0, 0],     // 赤
                [255, 128, 0],   // オレンジ
                [255, 255, 0],   // 黄
                [0, 255, 0],     // 緑
                [0, 128, 255],   // 青
                [64, 0, 255],    // 藍
                [128, 0, 255]    // 紫
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => {
                    const hexColor = `#${color[0].toString(16).padStart(2, '0')}${color[1].toString(16).padStart(2, '0')}${color[2].toString(16).padStart(2, '0')}`;
                    const adjustedHex = this.adjustColorSaturation(hexColor, saturationLevel);
                    const r = parseInt(adjustedHex.substr(1, 2), 16);
                    const g = parseInt(adjustedHex.substr(3, 2), 16);
                    const b = parseInt(adjustedHex.substr(5, 2), 16);
                    return [r, g, b];
                });
            }
            
            // 時間に基づいて色を順番に選択（アニメーション速度を考慮）
            // timeOffsetには既にanimationSpeedが反映されているので、追加の速度調整
            const baseSpeed = 2.0; // ベースとなる色の変化速度
            const colorIndex = Math.floor(Math.abs(timeOffset * baseSpeed)) % gamingColors.length;
            const rainbowColor = gamingColors[colorIndex];
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // 透明でないピクセルのみ
                    // 元画像の色を取得
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像のRGBをHSLに変換
                    const originalHSL = this.rgbToHsl(originalR, originalG, originalB);
                    
                    // 虹色の色相を取得
                    const rainbowHSL = this.rgbToHsl(rainbowColor[0], rainbowColor[1], rainbowColor[2]);
                    
                    // 元の色相をベースに、時間に応じて色相をシフト
                    const baseSpeed = 2.0; // 色相変化速度
                    const hueShift = Math.abs(timeOffset * baseSpeed) % 1; // 0-1の範囲
                    let newHue = (originalHSL[0] + hueShift) % 1;
                    
                    // 彩度を調整（元の彩度をベースに強化）
                    let newSaturation = originalHSL[1];
                    if (newSaturation < 0.3) {
                        // 元々彩度が低い部分は適度に強化
                        newSaturation = Math.min(0.8, newSaturation + 0.4) * saturationLevel;
                    } else {
                        // 元々彩度がある部分は元の値を活かしつつ調整
                        newSaturation = Math.min(1.0, newSaturation * 1.2) * saturationLevel;
                    }
                    
                    // 明度にパルス効果を適用
                    let newLightness = originalHSL[2];
                    if (originalHSL[2] < 0.2) {
                        // 暗い部分は少し明るく
                        newLightness = Math.min(0.6, originalHSL[2] * 1.5);
                    } else if (originalHSL[2] > 0.8) {
                        // 明るい部分は少し抑制
                        newLightness = Math.max(0.4, originalHSL[2] * 0.9);
                    }
                    
                    // パルス効果で明度を変化
                    newLightness = Math.max(0.1, Math.min(0.9, newLightness * pulseIntensity));
                    
                    // HSLからRGBに変換
                    const newRGB = this.hslToRgb(newHue, newSaturation, newLightness);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(newRGB[0])));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(newRGB[1]))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(newRGB[2]))); // B
                }
            }

        } else if (animationMode === 'bluepurplepink') {
            // シアン→青→紫→ピンク→赤寄りグラデーション（虹色グラデーションと同じ構造）
            let gamingColors = [
                [0, 255, 255],   // シアン
                [0, 128, 255],   // 青
                [64, 64, 255],   // 青紫
                [128, 0, 255],   // 紫
                [192, 64, 255],  // ピンク紫
                [255, 64, 192],  // ピンク
                [255, 96, 128]   // 赤寄りピンク
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => {
                    const hexColor = `#${color[0].toString(16).padStart(2, '0')}${color[1].toString(16).padStart(2, '0')}${color[2].toString(16).padStart(2, '0')}`;
                    const adjustedHex = this.adjustColorSaturation(hexColor, saturationLevel);
                    const r = parseInt(adjustedHex.substr(1, 2), 16);
                    const g = parseInt(adjustedHex.substr(3, 2), 16);
                    const b = parseInt(adjustedHex.substr(5, 2), 16);
                    return [r, g, b];
                });
            }
            
            // 時間ベースの色変化を修正（完璧なループのため）
            const normalizedTime = (timeOffset % 1 + 1) % 1; // 0-1の範囲で正規化
            const colorShift = normalizedTime * gamingColors.length; // 0-配列長の範囲
            
            // グラデーション方向を取得
            const direction = this.textGradientDirection ? this.textGradientDirection.value : 'horizontal';
            
            // グラデーション密度を取得
            const gradientDensity = this.gradientDensity ? parseFloat(this.gradientDensity.value) : 7;
            
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                const x = pixelIndex % sourceCanvas.width;
                const y = Math.floor(pixelIndex / sourceCanvas.width);
                
                // グラデーション方向に応じて位置を計算
                let position;
                switch (direction) {
                    case 'horizontal':
                        position = x / sourceCanvas.width; // 0-1の範囲
                        break;
                    case 'vertical':
                        position = y / sourceCanvas.height; // 0-1の範囲
                        break;
                    case 'diagonal1':
                        // 左上→右下
                        position = (x / sourceCanvas.width + y / sourceCanvas.height) / 2; // 0-1の範囲
                        break;
                    case 'diagonal2':
                        // 右上→左下
                        position = ((sourceCanvas.width - x) / sourceCanvas.width + y / sourceCanvas.height) / 2; // 0-1の範囲
                        break;
                    default:
                        position = x / sourceCanvas.width; // デフォルトは横方向
                }
                
                // グラデーション密度を適用
                const colorFloat = (position * gamingColors.length * gradientDensity + colorShift) % gamingColors.length;
                const colorIndex = Math.floor(Math.abs(colorFloat)) % gamingColors.length;
                const nextColorIndex = (colorIndex + 1) % gamingColors.length;
                const blend = Math.max(0, Math.min(1, colorFloat - Math.floor(colorFloat))); // 0-1の範囲に確実に制限
                
                const color1 = gamingColors[colorIndex];
                const color2 = gamingColors[nextColorIndex];
                
                // 色の安全性チェック
                if (!color1 || !color2) continue;
                
                // 2つの色を線形補間
                const blendedColor = [
                    Math.round(color1[0] + (color2[0] - color1[0]) * blend),
                    Math.round(color1[1] + (color2[1] - color1[1]) * blend),
                    Math.round(color1[2] + (color2[2] - color1[2]) * blend)
                ];
                
                if (data[i + 3] > 0) { // 透明でないピクセルのみ
                    // 元画像の色を取得
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像のRGBをHSLに変換
                    const originalHSL = this.rgbToHsl(originalR, originalG, originalB);
                    
                    // ブレンド色から基準色相を取得（青→紫→ピンクの範囲）
                    const targetHSL = this.rgbToHsl(blendedColor[0], blendedColor[1], blendedColor[2]);
                    
                    // 元の色相をベースに、青→紫→ピンクの範囲で色相をシフト
                    let newHue = originalHSL[0]; // 元の色相
                    
                    // 時間とポジションに基づいて色相をシフト（シアン→青→紫→ピンク→赤寄りの範囲内）
                    const baseHue = 180 / 360; // シアンの色相（0-1の範囲）
                    const hueRange = 160 / 360; // 160°の色相範囲（シアンから赤寄りピンクまで）
                    const hueShift = (timeOffset * 2 + position * 2) % 1; // 0-1の範囲
                    
                    // シアン→青→紫→ピンク→赤寄りの範囲内での色相を計算
                    let targetHueInRange = (baseHue + hueRange * hueShift);
                    if (targetHueInRange >= 1) targetHueInRange -= 1; // 0-1の範囲に正規化
                    
                    // 元の色相と目標色相をブレンド（シアン→青→紫→ピンク→赤寄りの影響を適用）
                    const hueBlend = 0.7; // グラデーションの影響度
                    newHue = (originalHSL[0] * (1 - hueBlend) + targetHueInRange * hueBlend);
                    if (newHue >= 1) newHue -= 1; // 0-1の範囲に正規化
                    
                    // 彩度を調整（元の彩度をベースに強化）
                    let newSaturation = originalHSL[1];
                    if (newSaturation < 0.3) {
                        // 元々彩度が低い部分は適度に強化
                        newSaturation = Math.min(0.8, newSaturation + 0.4) * saturationLevel;
                    } else {
                        // 元々彩度がある部分は元の値を活かしつつ調整
                        newSaturation = Math.min(1.0, newSaturation * 1.2) * saturationLevel;
                    }
                    
                    // 明度を適度に調整（元の明暗を保持）
                    let newLightness = originalHSL[2];
                    if (originalHSL[2] < 0.2) {
                        // 暗い部分は少し明るく
                        newLightness = Math.min(0.6, originalHSL[2] * 1.5);
                    } else if (originalHSL[2] > 0.8) {
                        // 明るい部分は少し抑制
                        newLightness = Math.max(0.4, originalHSL[2] * 0.9);
                    } else {
                        // 中間の明度は元の値を活かす
                        newLightness = originalHSL[2];
                    }
                    
                    // HSLからRGBに変換
                    const newRGB = this.hslToRgb(newHue, newSaturation, newLightness);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(newRGB[0])));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(newRGB[1]))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(newRGB[2]))); // B
                }
            }
        }
        
        // 処理した画像データを一時キャンバスに描画
        sourceCanvas.getContext('2d').putImageData(imageData, 0, 0);
    }

    // RGB (0-255) を HSL (0-1) に変換
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // グレースケール
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return [h, s, l];
    }
    
    // HSL (0-1) を RGB (0-255) に変換
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // グレースケール
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    hslToHex(h, s, l) {
        // HSLをHEXに変換
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    multiplyColors(color1, color2) {
        // 2つの色を乗算合成
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // 乗算合成（0-1の範囲で計算）
        const r = Math.round((r1 / 255) * (r2 / 255) * 255);
        const g = Math.round((g1 / 255) * (g2 / 255) * 255);
        const b = Math.round((b1 / 255) * (b2 / 255) * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    blendColors(color1, color2, ratio) {
        // 2つの色を線形補間でブレンド
        // 入力値の安全性チェック
        if (!color1 || !color2 || typeof color1 !== 'string' || typeof color2 !== 'string') {
            return color1 || color2 || '#FF0000';
        }
        
        // ratio値を0-1の範囲に制限
        ratio = Math.max(0, Math.min(1, ratio || 0));
        
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // NaNチェック
        if (isNaN(r1) || isNaN(g1) || isNaN(b1) || isNaN(r2) || isNaN(g2) || isNaN(b2)) {
            return color1;
        }
        
        // 線形補間
        let r = Math.round(r1 + (r2 - r1) * ratio);
        let g = Math.round(g1 + (g2 - g1) * ratio);
        let b = Math.round(b1 + (b2 - b1) * ratio);
        
        // 値を0-255の範囲に制限
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    blendColorsVivid(color1, color2, ratio) {
        // 高彩度を保持する色ブレンド
        // エラーハンドリングを追加
        if (!color1 || !color2 || typeof color1 !== 'string' || typeof color2 !== 'string') {
            console.error('blendColorsVivid: Invalid color parameters', color1, color2);
            return color1 || color2 || '#FF0000'; // フォールバック色
        }
        
        // ratio値を0-1の範囲に制限
        ratio = Math.max(0, Math.min(1, ratio || 0));
        
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // NaNチェック
        if (isNaN(r1) || isNaN(g1) || isNaN(b1) || isNaN(r2) || isNaN(g2) || isNaN(b2)) {
            console.error('blendColorsVivid: Invalid color format', color1, color2);
            return color1; // フォールバック
        }
        
        // 線形補間
        let r = Math.round(r1 + (r2 - r1) * ratio);
        let g = Math.round(g1 + (g2 - g1) * ratio);
        let b = Math.round(b1 + (b2 - b1) * ratio);
        
        // 彩度を向上させる（最大値を255に近づける）
        const maxComponent = Math.max(r, g, b);
        if (maxComponent > 0 && maxComponent < 255) {
            const boost = 255 / maxComponent;
            r = Math.min(255, Math.round(r * boost * 0.9)); // 0.9で少し抑制
            g = Math.min(255, Math.round(g * boost * 0.9));
            b = Math.min(255, Math.round(b * boost * 0.9));
        }
        
        // 最終的に値を0-255の範囲に制限
        r = Math.max(0, Math.min(255, Math.floor(r)));
        g = Math.max(0, Math.min(255, Math.floor(g)));
        b = Math.max(0, Math.min(255, Math.floor(b)));
        
        // 16進数変換の安全性を確保
        const hexR = r.toString(16).padStart(2, '0');
        const hexG = g.toString(16).padStart(2, '0');
        const hexB = b.toString(16).padStart(2, '0');
        
        return `#${hexR}${hexG}${hexB}`;
    }

    lightenColor(color, percent) {
        // 色を明るくするヘルパー関数
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    getColorIntensity(color) {
        // 色の明度を0-1の範囲で取得
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        // 明度計算（人間の視覚に基づく重み付け）
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    adjustColorIntensity(color, intensity) {
        // 色の明度を指定した強度に調整（明るさを保持）
        // 入力値の安全性チェック
        if (!color || typeof color !== 'string') {
            console.error('adjustColorIntensity: Invalid color parameter', color);
            return '#FF0000'; // フォールバック色
        }
        
        if (isNaN(intensity) || !isFinite(intensity)) {
            intensity = 1.0; // デフォルト値
        }
        
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // NaNチェック
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.error('adjustColorIntensity: Invalid color format', color);
            return color; // 元の色を返す
        }
        
        // 強度を適用（0.8-1.2の範囲で明るさを保持）
        const clampedIntensity = Math.max(0.8, Math.min(1.2, intensity));
        
        const adjustedR = Math.min(255, Math.round(r * clampedIntensity));
        const adjustedG = Math.min(255, Math.round(g * clampedIntensity));
        const adjustedB = Math.min(255, Math.round(b * clampedIntensity));
        
        return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    }

    adjustColorSaturation(color, saturationMultiplier) {
        // 色の彩度を指定した倍率で調整
        // 入力値の安全性チェック
        if (!color || typeof color !== 'string') {
            console.error('adjustColorSaturation: Invalid color parameter', color);
            return '#FF0000'; // フォールバック色
        }
        
        if (isNaN(saturationMultiplier) || !isFinite(saturationMultiplier)) {
            saturationMultiplier = 1.0; // デフォルト値
        }
        
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // NaNチェック
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.error('adjustColorSaturation: Invalid color format', color);
            return color; // 元の色を返す
        }
        
        // RGBをHSLに変換
        const hsl = this.rgbToHsl(r, g, b);
        
        // 彩度を調整（0-2の範囲で制限）
        let newSaturation = hsl[1] * saturationMultiplier;
        newSaturation = Math.max(0, Math.min(1, newSaturation));
        
        // HSLからRGBに戻す
        const rgb = this.hslToRgb(hsl[0], newSaturation, hsl[2]);
        
        const adjustedR = Math.round(rgb[0]);
        const adjustedG = Math.round(rgb[1]);
        const adjustedB = Math.round(rgb[2]);
        
        return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    }

    // 小さいサイズ用の色強化メソッド
    enhanceColorForSmallSize(color) {
        // 小さいサイズ（64px以下）での視認性向上のための色強化
        if (!color || typeof color !== 'string') {
            return '#FF0000'; // フォールバック色
        }
        
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return color; // 無効な色の場合は元の色を返す
        }
        
        // RGBをHSLに変換
        const hsl = this.rgbToHsl(r, g, b);
        
        // 小さいサイズ用の調整
        let newHue = hsl[0];
        let newSaturation = hsl[1];
        let newLightness = hsl[2];
        
        // 彩度を強化（視認性向上）
        newSaturation = Math.min(1.0, newSaturation * 1.3);
        
        // 明度を調整（コントラスト向上）
        if (newLightness < 0.5) {
            // 暗い色は少し明るく
            newLightness = Math.min(0.7, newLightness * 1.4);
        } else {
            // 明るい色は適度に調整
            newLightness = Math.max(0.3, newLightness * 0.9);
        }
        
        // HSLからRGBに変換
        const enhancedRGB = this.hslToRgb(newHue, newSaturation, newLightness);
        
        const enhancedR = Math.round(enhancedRGB[0]);
        const enhancedG = Math.round(enhancedRGB[1]);
        const enhancedB = Math.round(enhancedRGB[2]);
        
        return `#${enhancedR.toString(16).padStart(2, '0')}${enhancedG.toString(16).padStart(2, '0')}${enhancedB.toString(16).padStart(2, '0')}`;
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = 'gaming_text_' + new Date().getTime() + '.png';
        
        // 透過背景の場合はPNG形式で保存
        if (this.textTransparentBg.checked) {
            link.href = this.textCanvas.toDataURL('image/png');
        } else {
            link.href = this.textCanvas.toDataURL();
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async downloadGif() {
        this.textDownloadGifBtn.textContent = '生成中...';
        this.textDownloadGifBtn.disabled = true;
        
        try {
            console.log('=== テキストGIF生成開始 ===');
            
            // メモリ使用量をログ出力（可能な場合）
            if (window.performance && window.performance.memory) {
                const mem = window.performance.memory;
                console.log(`テキストGIF用メモリ使用量 - 使用中: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB, 制限: ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
            }
            
            console.log('テキストフレーム収集を開始...');
            await this.captureFramesForGif();
            console.log(`テキストフレーム収集完了: ${this.capturedFrames.length}フレーム`);
            
            const gifOptions = {
                workers: 2, // 安定性を優先してワーカー数を2に
                quality: 1, // 最高品質（1が最高、30が最低）
                width: this.textCanvas.width,
                height: this.textCanvas.height,
                dither: false, // ディザリングを無効にして高品質に
                globalPalette: false, // ローカルパレットで色精度向上
                background: '#000000', // 背景色を明示的に指定
                workerScript: 'gif.worker.js',
                // 64x64以下のサイズでの追加最適化
                repeat: 0, // 無限ループ
                transparent: null, // 透明色なし（品質優先）
                dispose: -1 // 自動処理
            };
            
            // 小さいサイズの場合の特別な最適化
            if (this.textCanvas.width <= 64 || this.textCanvas.height <= 64) {
                gifOptions.quality = 1; // 64x64以下では必ず最高品質
                gifOptions.dither = false; // ディザリング完全無効
                gifOptions.globalPalette = false; // ローカルパレット使用
                console.log('小サイズ用画質最適化を適用');
            }
            console.log(`テキストGIFサイズ: ${this.textCanvas.width}x${this.textCanvas.height}`);
            
            // 透過背景の場合の設定
            if (this.textTransparentBg.checked) {
                gifOptions.transparent = 'rgba(0,0,0,0)'; // 透明色を指定
                gifOptions.background = null;             // 背景色をnullに設定
                gifOptions.dispose = 2;                   // フレーム間で背景をクリア
                gifOptions.globalPalette = false;         // ローカルパレットを使用
                gifOptions.dither = false;                // ディザリングを無効化
            }
            
            console.log('テキストGIFエンコーダーを初期化...');
            const gif = new GIF(gifOptions);
            
            const frameCount = this.capturedFrames.length;
            
            // アニメーション速度設定を考慮したGIF遅延時間を計算（プレビューと同じ非線形計算）
            const animationSpeed = parseInt(this.textAnimationSpeed.value) || 5;
            
            // プレビューと同じ非線形速度計算でFPSを決定
            const speedMultiplier = Math.pow((animationSpeed + 2) / 8, 2.0) * 0.005;
            
            // 基準FPS: 12FPS、速度倍率に応じて調整
            const baseFPS = 12;
            // speedMultiplierを基準にFPSを計算（速度5で基準FPS）
            const speedRatio = speedMultiplier / (Math.pow((5 + 2) / 8, 2.0) * 0.005); // 速度5との比率
            const targetFPS = Math.max(6, Math.min(24, Math.round(baseFPS * speedRatio))); // 6-24FPSの範囲
            
            // フレーム間隔（ミリ秒）を計算
            const delay = Math.round(1000 / targetFPS); // 1秒 ÷ FPS
            console.log(`テキストフレーム遅延時間: ${delay}ms, FPS: ${targetFPS}`);
            
            console.log('テキストフレームをGIFに追加中...');
            for (let i = 0; i < this.capturedFrames.length; i++) {
                const frameCanvas = this.capturedFrames[i];
                console.log(`テキストフレーム ${i + 1}/${frameCount} を追加中...`);
                const frameOptions = {delay: delay, copy: true};
                
                // 透過背景の場合の追加設定
                if (this.textTransparentBg.checked) {
                    frameOptions.transparent = true;
                    frameOptions.dispose = 2;        // 背景をクリア
                    frameOptions.preserveTransparency = true; // 透明度を保持
                }
                
                gif.addFrame(frameCanvas, frameOptions);
            }
            console.log('テキスト全フレーム追加完了');
            
            gif.on('finished', (blob) => {
                console.log('テキストGIF生成完了！', blob);
                console.log(`生成されたテキストGIFサイズ: ${(blob.size / 1024).toFixed(2)}KB`);
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'gaming_text_' + new Date().getTime() + '.gif';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                this.textDownloadGifBtn.textContent = 'GIFで保存';
                this.textDownloadGifBtn.disabled = false;
                console.log('=== テキストGIF生成処理完了 ===');
            });
            
            gif.on('progress', (p) => {
                const progress = Math.round(p * 100);
                console.log(`テキストGIF生成進行: ${progress}%`);
                this.textDownloadGifBtn.textContent = `GIF生成中... ${progress}%`;
            });
            
            gif.on('abort', () => {
                console.error('テキストGIF生成が中断されました');
                this.textDownloadGifBtn.textContent = 'GIFで保存';
                this.textDownloadGifBtn.disabled = false;
            });
            
            console.log('テキストGIF レンダリング開始...');
            gif.render();
        } catch (error) {
            console.error('=== テキストGIF生成エラー詳細 ===');
            console.error('エラーメッセージ:', error.message);
            console.error('エラースタック:', error.stack);
            console.error('エラーオブジェクト:', error);
            
            // エラーの種類に応じて詳細な情報を出力
            if (error.name === 'QuotaExceededError' || error.message.includes('memory')) {
                console.error('テキストGIF: メモリ不足エラーの可能性があります');
                alert('テキストGIF生成に失敗しました。\nメモリ不足の可能性があります。\n・テキストサイズを小さくしてみてください\n・フレーム数を減らしてみてください');
            } else if (error.message.includes('worker') || error.message.includes('Worker')) {
                console.error('テキストGIF: ワーカースクリプトの読み込みエラーの可能性があります');
                alert('テキストGIF生成に失敗しました。\nワーカースクリプトの読み込みエラーです。\nページを再読み込みしてください。');
            } else {
                console.error('テキストGIF: 不明なエラーです');
                alert(`テキストGIF生成に失敗しました。\nエラー: ${error.message}\n\nコンソールログで詳細を確認してください。`);
            }
            
            this.textDownloadGifBtn.textContent = 'GIFで保存';
            this.textDownloadGifBtn.disabled = false;
        }
    }

    // 完璧なループのための最適フレーム数を自動計算（テキスト用）
    calculateOptimalFrameCount() {
        const animationMode = this.textAnimationMode.value;
        const animationSpeed = parseInt(this.textAnimationSpeed.value) || 5;
        
        let optimalFrames;
        
        switch (animationMode) {
            case 'rainbow':
                // 虹色グラデーション：7色の虹色が一周するのに最適なフレーム数
                const baseRainbowFrames = 14; // 7色 × 2倍の滑らかさ
                optimalFrames = Math.max(8, Math.round(baseRainbowFrames * (10 / animationSpeed)));
                break;
                
            case 'bluepurplepink':
                // シアン→青→紫→ピンク→赤寄りグラデーション：7色のグラデーション一周期
                const baseBluePurplePinkFrames = 14; // 7色 × 2倍の滑らかさ（虹色と同等）
                optimalFrames = Math.max(8, Math.round(baseBluePurplePinkFrames * (10 / animationSpeed)));
                break;
                
            case 'pulse':
                // ピカピカ点滅：sin波の一周期に最適なフレーム数
                const basePulseFrames = 12; // sin波の滑らかな一周期  
                optimalFrames = Math.max(6, Math.round(basePulseFrames * (10 / animationSpeed)));
                break;
                
            case 'rainbowPulse':
                // 虹色ピカピカ：色変化とパルスの最小公倍数
                // 7色の色変化とsin波パルスの組み合わせ
                const colorCycleFrames = 14; // 7色 × 2
                const pulseCycleFrames = 12; // sin波一周期
                // 最小公倍数的な考えで、両方の周期が自然に重なるフレーム数
                optimalFrames = Math.max(12, Math.round((colorCycleFrames + pulseCycleFrames) / 2 * (10 / animationSpeed)));
                break;
                
            default:
                optimalFrames = 8; // 静止画の場合のデフォルト
        }
        
        // 24フレーム以下に制限（GIF生成時間とファイルサイズ考慮）
        return Math.min(24, optimalFrames);
    }

    async captureFramesForGif() {
        this.capturedFrames = [];
        const frameCount = this.calculateOptimalFrameCount();
        
        // アニメーション速度設定からGIF再生間隔を計算（プレビューと同じ非線形計算）
        const animationSpeed = parseInt(this.textAnimationSpeed.value) || 5;
        
        // プレビューと同じ非線形速度計算でFPSを決定
        const speedMultiplier = Math.pow((animationSpeed + 2) / 8, 2.0) * 0.005;
        
        // 基準FPS: 12FPS、速度倍率に応じて調整
        const baseFPS = 12;
        // speedMultiplierを基準にFPSを計算（速度5で基準FPS）
        const speedRatio = speedMultiplier / (Math.pow((5 + 2) / 8, 2.0) * 0.005); // 速度5との比率
        const targetFPS = Math.max(6, Math.min(24, Math.round(baseFPS * speedRatio))); // 6-24FPSの範囲
        const frameInterval = 1000 / targetFPS; // フレーム間の実際の時間間隔（ms）
        
        // アニメーション状態を保存
        const wasAnimating = this.isAnimating;
        if (wasAnimating) {
            this.stopAnimation();
        }
        
        const originalStartTime = this.startTime;
        
        // 通常サイズでの高品質レンダリング（スーパーサンプリングを一時的に無効化）
        const finalWidth = this.textCanvas.width;
        const finalHeight = this.textCanvas.height;
        
        // フレームを生成（GIF再生間隔と完全に一致させる）
        for (let frame = 0; frame < frameCount; frame++) {
            // GIF再生と同じ時間間隔でフレームを生成
            const baseTime = Date.now();
            const frameTime = baseTime + (frame * frameInterval); // 実際のGIF再生間隔を使用
            
            // プレビューと完全に同じ時間計算
            this.startTime = baseTime;
            
            // キャンバスをクリア（完全に透明にリセット）
            this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
            
            // 透過でない場合のみ黒背景を描画
            if (!this.textTransparentBg.checked) {
                this.textCtx.fillStyle = '#000000';
                this.textCtx.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);
            }
            
            // プレビューと同じ時間オフセット計算
            const text = this.textInput.value || 'GAMING';
            const animationMode = this.textAnimationMode.value;
            const animationSpeed = parseInt(this.textAnimationSpeed.value) || 5;
            const fontSize = parseInt(this.textSize.value);
            
            // プレビューと完全に同じ調整された非線形速度計算を使用
            let timeOffset = 0;
            const speedMultiplier = Math.pow((animationSpeed + 2) / 8, 2.0) * 0.005;
            timeOffset = (frameTime - baseTime) * speedMultiplier;
            
            // フォント設定（選択されたフォントを使用）
            const selectedFont = this.textFont ? this.textFont.value : 'Arial';
            this.textCtx.font = `bold ${fontSize}px ${selectedFont}`;
            this.textCtx.textAlign = 'center';
            this.textCtx.textBaseline = 'middle';
            
            // フレーム生成時の最高品質レンダリング設定
            this.textCtx.imageSmoothingEnabled = true;
            this.textCtx.imageSmoothingQuality = 'high';
            this.textCtx.lineCap = 'round';
            this.textCtx.lineJoin = 'round';
            if (this.textCtx.textRenderingOptimization) {
                this.textCtx.textRenderingOptimization = 'optimizeQuality';
            }
            
            // 小さいサイズでの特別な品質最適化
            const canvasSize = Math.min(this.textCanvas.width, this.textCanvas.height);
            if (canvasSize <= 64) {
                // 64x64以下では特別な高品質設定
                this.textCtx.fontKerning = 'normal';
                this.textCtx.fontVariantCaps = 'normal';
                this.textCtx.fontStretch = 'normal';
                this.textCtx.fontDisplay = 'block';
                console.log(`フレーム生成時小サイズ最適化適用: ${canvasSize}px`);
            }
            
            // 画像またはテキストを描画（プレビューと完全に同じロジック）
            if (this.uploadedImage) {
                // 画像アニメーションもテキストと同じtimeOffsetを使用
                this.drawGamingImage(this.uploadedImage, animationMode, timeOffset);
            } else {
                const isStretch = this.textStretch.checked;
                this.drawGamingText(text, this.textCanvas.width / 2, this.textCanvas.height / 2, animationMode, timeOffset, fontSize, isStretch);
            }
            
            // ダウンロードボタンを有効化（最初のフレーム生成時のみ）
            if (frame === 0) {
                this.textDownloadBtn.disabled = false;
                this.textDownloadGifBtn.disabled = false;
            }
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.textCanvas.width;
            tempCanvas.height = this.textCanvas.height;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            
            // 最高品質レンダリング設定
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            tempCtx.lineCap = 'round';
            tempCtx.lineJoin = 'round';
            if (tempCtx.textRenderingOptimization) {
                tempCtx.textRenderingOptimization = 'optimizeQuality';
            }
            
            // フレーム用キャンバスにコピー
            if (this.textTransparentBg.checked) {
                // 透過背景の場合：アルファチャンネルを保持してコピー
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(this.textCanvas, 0, 0);
            } else {
                // 不透明背景の場合：通常のコピー
                tempCtx.drawImage(this.textCanvas, 0, 0);
            }
            this.capturedFrames.push(tempCanvas);
        }
        

        
        // 元の状態を復元
        this.startTime = originalStartTime;
        if (wasAnimating) {
            this.startAnimation();
        }
    }
}

// タブ切り替え機能
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // すべてのタブボタンとコンテンツからactiveクラスを削除
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // クリックされたタブボタンとコンテンツにactiveクラスを追加
            btn.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// グローバルダークモード機能
function initializeGlobalDarkMode() {
    const darkModeToggle = document.getElementById('globalDarkModeToggle');
    const body = document.body;
    
    if (!darkModeToggle) {
        console.warn('ダークモード切り替えボタンが見つかりません');
        return;
    }
    
    // ローカルストレージからダークモード設定を読み込み
    const savedDarkMode = localStorage.getItem('globalDarkMode');
    const isDarkMode = savedDarkMode === 'true';
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
    }
    
    // ダークモード切り替えボタンのイベントリスナー
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isCurrentlyDark = body.classList.contains('dark-mode');
        
        // ローカルストレージに設定を保存
        localStorage.setItem('globalDarkMode', isCurrentlyDark.toString());
    });
}

// デバッグ用グローバル関数を追加
window.debugGaming = {
    checkMemory: () => {
        if (window.performance && window.performance.memory) {
            const mem = window.performance.memory;
            console.log('=== メモリ使用状況 ===');
            console.log(`使用中: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`制限: ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
            console.log(`使用率: ${((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1)}%`);
            return mem;
        } else {
            console.log('メモリ情報は利用できません（Chromeでのみ利用可能）');
            return null;
        }
    },
    
    checkGifWorker: () => {
        console.log('GIFワーカースクリプトの確認...');
        fetch('./gif.worker.js')
            .then(response => {
                if (response.ok) {
                    console.log('✓ gif.worker.js は正常に読み込み可能です');
                } else {
                    console.error('✗ gif.worker.js の読み込みに失敗:', response.status);
                }
            })
            .catch(error => {
                console.error('✗ gif.worker.js の確認エラー:', error);
            });
    },
    
    testSmallGif: async () => {
        console.log('小さなテストGIFを生成してみます...');
        try {
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 64;
            testCanvas.height = 64;
            const ctx = testCanvas.getContext('2d');
            
            // 簡単な赤い四角を描画
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 64, 64);
            
            const gif = new GIF({
                workers: 1,
                quality: 10,
                width: 64,
                height: 64,
                workerScript: 'gif.worker.js'
            });
            
            gif.addFrame(testCanvas, {delay: 100});
            
            gif.on('finished', (blob) => {
                console.log('✓ テストGIF生成成功:', blob);
                console.log(`サイズ: ${blob.size}バイト`);
            });
            
            gif.on('abort', () => {
                console.error('✗ テストGIF生成が中断されました');
            });
            
            gif.render();
        } catch (error) {
            console.error('✗ テストGIF生成エラー:', error);
        }
    }
};

console.log('🎮 ゲーミングツール デバッグ機能が利用可能です:');
console.log('- window.debugGaming.checkMemory() : メモリ使用量確認');
console.log('- window.debugGaming.checkGifWorker() : GIFワーカー確認');
console.log('- window.debugGaming.testSmallGif() : 小さなテストGIF生成');

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    const concentrationGenerator = new ConcentrationLineGenerator();
    concentrationGenerator.setDefaultParams();
    
    const textGenerator = new GamingTextGenerator();
    
    initializeTabs();
    initializeGlobalDarkMode();
    
    // 初期メモリ状況を表示
    console.log('=== アプリケーション初期化完了 ===');
    window.debugGaming.checkMemory();
}); 