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
        
        // デフォルトキャンバスサイズを設定
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.width = '800px';
        this.canvas.style.height = '600px';
        
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
        if (event.target.value === 'rainbow' || event.target.value === 'golden' || event.target.value === 'bluepurplepink') {
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
        // 少し遅延を入れてスムーズな操作感を保つ
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
        
        this.previewTimeout = setTimeout(() => {
            const animationMode = this.animationMode.value;
            
            if (animationMode === 'static') {
                this.generateConcentrationLines();
            } else {
                // アニメーションモード
                this.startAnimation();
            }
        }, 100);
    }

    handleAnimationModeChange() {
        const animationMode = this.animationMode.value;
        
        if (animationMode === 'static') {
            this.stopAnimation();
            this.autoGeneratePreview();
        } else {
            // アニメーションモード
            this.startAnimation();
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (backgroundMode === 'dark') {
            // 黒背景を描画
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.originalImage) {
            // 元の画像を描画
            this.ctx.drawImage(this.originalImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 画像がない場合は白背景を描画
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    generateConcentrationLines(currentTime = null) {
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
        
        // キャンバスサイズが設定されていない場合はデフォルトサイズを設定
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
        
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
        
        // 画像がある場合のみダウンロードボタンを有効化
        if (this.originalImage) {
            this.downloadBtn.disabled = false;
            this.downloadGifBtn.disabled = false;
            this.downloadRealGifBtn.disabled = false;
        }
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
            } else if (colorMode === 'golden') {
                // 金ピカ三角形集中線（アニメーション対応）
                this.drawTriangleConcentrationLine(centerX, centerY, angle, startDistance, lineLength, i, lineCount, lineWidth, 'golden', animationMode, timeOffset);
            } else if (colorMode === 'bluepurplepink') {
                // 青→紫→ピンク三角形集中線（アニメーション対応）
                this.drawTriangleConcentrationLine(centerX, centerY, angle, startDistance, lineLength, i, lineCount, lineWidth, 'bluepurplepink', animationMode, timeOffset);
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
        
        // 色またはグラデーションを先に設定
        if (singleColor === 'golden') {
            // 金ピカグラデーションの場合
            let goldenColors = [
                '#8B4513', // ダークブロンズ
                '#CD7F32', // ブロンズ
                '#B8860B', // ダークゴールド
                '#DAA520', // ゴールデンロッド
                '#FFD700', // ゴールド
                '#FFF700', // イエローゴールド
                '#FFFACD'  // クリーム
            ];
            
            this.drawColorGradient(startX, startY, endX, endY, goldenColors, index, animationMode, timeOffset);
            
        } else if (singleColor === 'bluepurplepink') {
            // 青→紫→ピンクグラデーションの場合
            let bluepurplepinkColors = [
                '#00FFFF', // シアン
                '#0080FF', // 青
                '#4040FF', // 青紫
                '#8000FF', // 紫
                '#C040FF', // ピンク紫
                '#FF40C0', // ピンク
                '#FF6080'  // 赤寄りピンク
            ];
            
            this.drawColorGradient(startX, startY, endX, endY, bluepurplepinkColors, index, animationMode, timeOffset);
            
        } else if (singleColor) {
            // 単色の場合（発光なし）
            this.ctx.fillStyle = singleColor;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.globalCompositeOperation = 'source-over';
        } else {
            // ゲーミング虹色の場合
            let rainbowColors = [
                '#FF0000', // 赤
                '#FF8000', // オレンジ
                '#FFFF00', // 黄
                '#00FF00', // 緑
                '#0080FF', // 青
                '#4000FF', // 藍
                '#8000FF'  // 紫
            ];
            
            this.drawColorGradient(startX, startY, endX, endY, rainbowColors, index, animationMode, timeOffset);
        }
        
        // 色設定後に台形のパスを定義して描画
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

    drawColorGradient(startX, startY, endX, endY, colors, index, animationMode, timeOffset) {
        // 円状グラデーション用の中心点と半径を計算
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
        
        // 放射状グラデーションを作成（中心から外側へ）
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        
        // アニメーションモードチェック（'animated'モードまたはtimeOffsetが存在する場合）
        if ((animationMode === 'animated' || animationMode !== 'static') && timeOffset !== 0) {
            // アニメーション：時間とともに色相が回転
            const normalizedTime = Math.abs(timeOffset % 1);
            const colorShift = normalizedTime * colors.length;
            
            // 放射状グラデーションのためのより滑らかな色変化
            for (let i = 0; i <= 12; i++) {
                const position = i / 12;
                
                // 円状アニメーションのための色計算（中心から外側に向かって色が変化）
                const colorFloat = (position * 4 + colorShift + index * 0.5) % colors.length;
                const colorIndex = Math.floor(Math.abs(colorFloat)) % colors.length;
                const nextColorIndex = (colorIndex + 1) % colors.length;
                const blend = Math.abs(colorFloat - Math.floor(colorFloat));
                
                const color1 = colors[colorIndex];
                const color2 = colors[nextColorIndex];
                
                // 安全なブレンド関数を使用
                let blendedColor;
                try {
                    blendedColor = this.blendColorsVivid(color1, color2, blend);
                } catch (error) {
                    // フォールバック：シンプルなブレンド
                    blendedColor = this.blendColors(color1, color2, blend);
                }
                
                gradient.addColorStop(position, blendedColor);
            }
        } else {
            // 静止画での円状グラデーション
            const colorIndex = index % colors.length;
            const nextColorIndex = (colorIndex + 1) % colors.length;
            const thirdColorIndex = (colorIndex + 2) % colors.length;
            
            // 中心から外側に向かって色が変化
            gradient.addColorStop(0, colors[colorIndex]);           // 中心
            gradient.addColorStop(0.4, colors[nextColorIndex]);     // 中間
            gradient.addColorStop(0.8, colors[thirdColorIndex]);    // 外側
            gradient.addColorStop(1, colors[colorIndex]);           // 端（少し暗く）
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.globalCompositeOperation = 'source-over';
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
            // フレームデータを収集
            await this.captureFramesForGif();
            
            const gifSize = this.getGifSize();
            
            // gif.jsでGIF生成（高品質設定）
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
            
            // アニメーション速度に基づいてGIF再生速度を調整
            const animationSpeed = parseInt(this.animationSpeed.value) || 5;
            // プレビューの2秒ループに合わせてGIF遅延時間を計算
            const baseDelay = 2000 / frameCount; // 2秒ループをフレーム数で分割
            // アニメーション速度設定に応じて遅延時間を調整（速度が高いほど短い遅延）
            const adjustedDelay = Math.max(50, Math.round(baseDelay / (animationSpeed / 5)));
            
            for (let i = 0; i < this.capturedFrames.length; i++) {
                const frameCanvas = this.capturedFrames[i];
                gif.addFrame(frameCanvas, {delay: adjustedDelay, copy: true});
            }
            
            gif.on('finished', (blob) => {
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
                if (wasAnimating) {
                    this.startAnimation();
                }
            });
            
            gif.on('progress', (p) => {
                const progress = Math.round(p * 100);
                this.downloadRealGifBtn.textContent = `GIF生成中... ${progress}%`;
            });
            
            gif.on('abort', () => {
                this.downloadRealGifBtn.textContent = 'GIFで保存';
                this.downloadRealGifBtn.disabled = false;
            });
            
            gif.render();
        } catch (error) {
            // エラーの種類に応じて詳細な情報を出力
            if (error.name === 'QuotaExceededError' || error.message.includes('memory')) {
                alert('GIF生成に失敗しました。\nメモリ不足の可能性があります。\n・GIFサイズを小さくしてみてください\n・フレーム数を減らしてみてください');
            } else if (error.message.includes('worker') || error.message.includes('Worker')) {
                alert('GIF生成に失敗しました。\nワーカースクリプトの読み込みエラーです。\nページを再読み込みしてください。');
            } else {
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
            case 'animated':
                // グラデーション移動：色が一周するのに最適なフレーム数
                const baseAnimatedFrames = 14; // 7色 × 2倍の滑らかさ
                optimalFrames = Math.max(8, Math.round(baseAnimatedFrames * (10 / animationSpeed)));
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
                            reject(error);
                        }
                    }, 100);
                });
            } catch (error) {
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

    // デフォルト値をセット（ゲーミング虹色・円状グラデーションアニメーション）
    setDefaultParams() {
        this.colorMode.value = 'rainbow';
        this.animationMode.value = 'animated';
        this.animationSpeed.value = 8; // 円状アニメーションに最適な速度
        this.animationSpeedValue.textContent = '8';
        this.toggleColorMode({ target: { value: 'rainbow' } });
        
        // 初期アニメーションを開始
        setTimeout(() => {
            this.autoGeneratePreview();
        }, 100);
    }

    // カラーブレンドメソッド
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
        
        // 作成モードを初期化
        this.creationMode = 'text'; // デフォルトはテキストモード
        this.gifFrames = null;
        
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
        this.debugTestBtn = document.getElementById('debugTestBtn');
        
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
            // GIFプレビューの場合は速度変更を反映
            if (this.creationMode === 'image' && this.gifFrames && this.gifFrames.length > 0) {
                // GIFプレビューを再起動して新しい速度を反映
                this.startGifPreview();
            }
        });
        this.textSaturation.addEventListener('input', (e) => {
            this.textSaturationValue.textContent = e.target.value + '%';
            // GIFプレビューの場合はGIFプレビューを更新
            if (this.creationMode === 'image' && this.gifFrames && this.gifFrames.length > 0) {
                this.startGifPreview();
            } else {
                this.autoGeneratePreview();
            }
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
        this.debugTestBtn.addEventListener('click', () => this.runDebugTest());
        
        // 作成モードラジオボタンのイベントリスナー
        this.modeText.addEventListener('change', () => this.handleModeChange());
        this.modeImage.addEventListener('change', () => this.handleModeChange());
        
        // 初期モードを設定
        this.updateCreationMode();
        
        // 初期状態のUI表示設定
        this.handleAnimationModeChange();
        
        // 初期プレビュー生成
        setTimeout(() => this.autoGeneratePreview(), 100);
    }

    handleModeChange() {
        this.updateCreationMode();
        
        if (this.modeText.checked) {
            // テキストモードに切り替え
            this.textInputGroup.style.display = 'block';
            this.imageInputGroup.style.display = 'none';
            // 画像をクリア
            this.uploadedImage = null;
            this.textImageInput.value = '';
            this.gifFrames = null;
        } else {
            // 画像モードに切り替え
            this.textInputGroup.style.display = 'none';
            this.imageInputGroup.style.display = 'block';
        }
        this.autoGeneratePreview();
    }
    
    updateCreationMode() {
        // ラジオボタンの状態から作成モードを更新
        if (this.modeText.checked) {
            this.creationMode = 'text';
        } else if (this.modeImage.checked) {
            this.creationMode = 'image';
        }
        console.log('🔄 作成モード更新:', this.creationMode);
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
            this.gifFrames = [];
            this.stopGifPreview();
            // ファイルが選択されていない場合は、テキストモードに戻る
            this.modeText.checked = true;
            this.handleModeChange();
            return;
        }

        // GIFファイルかどうかをチェック
        const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (isGif) {
                console.log('📂 GIFファイル検出 - 動的プレビューを作成');
                this.setupGifPreview(e.target.result, file);
            } else {
                console.log('📂 静的画像ファイル検出');
                const img = new Image();
                img.onload = () => {
                    this.uploadedImage = img;
                    this.gifFrames = [];
                    this.stopGifPreview();
                    // 画像がアップロードされたら自動的に画像モードに切り替え
                    this.modeImage.checked = true;
                    this.handleModeChange();
                };
                img.src = e.target.result;
            }
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
        // 全てのモードで統一されたアニメーション処理を使用
        if (this.textAnimationMode.value === 'rainbow') {
            this.startAnimation();
        } else if (this.textAnimationMode.value === 'bluepurplepink') {
            this.startAnimation();
        } else if (this.textAnimationMode.value === 'golden') {
            this.startAnimation();
        } else if (this.textAnimationMode.value === 'pulse') {
            this.startAnimation();
        } else if (this.textAnimationMode.value === 'rainbowPulse') {
            this.startAnimation();
        } else {
            this.generateText();
        }
    }

    // GIFプレビューのセットアップ（改善版）
    async setupGifPreview(dataUrl, file) {
        console.log('🎬 GIFプレビューセットアップ開始');
        
        try {
            // まず通常のImage要素として読み込み
            const gifImg = new Image();
            await new Promise((resolve, reject) => {
                gifImg.onload = resolve;
                gifImg.onerror = reject;
                gifImg.src = dataUrl;
            });
            
            console.log(`📐 GIFサイズ: ${gifImg.width}x${gifImg.height}`);
            
            // シンプルなGIF情報検出（詳細分解はサーバーサイドで実行）
            let frameCount = 1;
            try {
                // 基本的なGIF情報のみをチェック
                frameCount = await this.getGifFrameCount(file);
                console.log(`🎞️ GIF情報: ${frameCount}フレーム検出（推定）`);
            } catch (error) {
                console.warn('⚠️ フレーム数検出失敗、1フレームとして処理:', error);
                frameCount = 1;
            }
            
            // 常に元画像を使用（詳細分解はサーバーサイドで実行）
            this.gifFrames = [{
                img: gifImg,
                originalFile: file,
                dataUrl: dataUrl,
                frameIndex: 0,
                estimatedFrameCount: frameCount
            }];
            
            if (frameCount > 1) {
                console.log(`✅ ${frameCount}フレームのアニメーションGIFを検出（サーバー処理で詳細分解予定）`);
            } else {
                console.log('📸 静的GIFまたは1フレームGIFとして処理');
            }
            
            this.uploadedImage = gifImg;
            
            // 画像モードに切り替え
            this.modeImage.checked = true;
            this.handleModeChange();
            
            // GIFも通常の画像と同じ処理を使用（プレビューをautoGeneratePreviewに統一）
            this.autoGeneratePreview();
            
        } catch (error) {
            console.error('❌ GIFセットアップエラー:', error);
            alert('GIFファイルの読み込みに失敗しました。');
        }
    }

    // GIFプレビューアニメーション開始（DOM overlay方式）
    startGifPreview() {
        console.log('▶️ GIFプレビューアニメーション開始（DOM overlay方式）');
        
        this.stopGifPreview(); // 既存のアニメーションを停止
        
        if (!this.gifFrames || this.gifFrames.length === 0) {
            console.log('⚠️ GIFフレームが見つかりません');
            return;
        }
        
        // DOM overlay方式でプレビューを作成
        this.createGifDOMPreview();
        
        // ゲーミングオーバーレイアニメーション
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            
            const elapsed = currentTime - startTime;
            
            // ゲーミング効果のプログレス
            const progress = (elapsed * 0.001) * (parseInt(this.textAnimationSpeed.value) || 5);
            
            // オーバーレイキャンバスにゲーミング効果を描画
            if (this.gifOverlayCanvas) {
                const ctx = this.gifOverlayCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.gifOverlayCanvas.width, this.gifOverlayCanvas.height);
                this.drawGamingOverlay(ctx, progress);
            }
            
            // 次のフレームをリクエスト
            this.gifPreviewAnimationFrame = requestAnimationFrame(animate);
        };
        
        this.gifPreviewAnimationFrame = requestAnimationFrame(animate);
    }

    // GIFプレビューアニメーション停止
    stopGifPreview() {
        if (this.gifPreviewAnimationFrame) {
            cancelAnimationFrame(this.gifPreviewAnimationFrame);
            this.gifPreviewAnimationFrame = null;
            console.log('⏹️ GIFプレビューアニメーション停止');
        }
        // DOM要素をクリーンアップ
        this.cleanupGifDOMPreview();
    }

    // DOM overlay方式でGIFプレビュー作成
    createGifDOMPreview() {
        console.log('🏗️ DOM overlay方式でプレビュー作成');
        
        // 既存のDOM要素をクリーンアップ
        this.cleanupGifDOMPreview();
        
        if (!this.uploadedImage) return;
        
        // キャンバスコンテナを取得
        const canvasSection = this.textCanvas.parentElement;
        
        // プレビューコンテナを作成
        this.gifPreviewContainer = document.createElement('div');
        this.gifPreviewContainer.style.cssText = `
            position: relative;
            display: inline-block;
            max-width: 400px;
            max-height: 400px;
        `;
        
        // GIF画像要素を作成
        this.gifImageElement = document.createElement('img');
        this.gifImageElement.src = this.gifFrames[0].dataUrl;
        this.gifImageElement.style.cssText = `
            display: block;
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
        `;
        
        // オーバーレイキャンバスを作成
        this.gifOverlayCanvas = document.createElement('canvas');
        this.gifOverlayCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            mix-blend-mode: screen;
        `;
        
        // 画像ロード完了時にキャンバスサイズを調整
        this.gifImageElement.onload = () => {
            const rect = this.gifImageElement.getBoundingClientRect();
            this.gifOverlayCanvas.width = this.gifImageElement.naturalWidth;
            this.gifOverlayCanvas.height = this.gifImageElement.naturalHeight;
            this.gifOverlayCanvas.style.width = rect.width + 'px';
            this.gifOverlayCanvas.style.height = rect.height + 'px';
            
            console.log(`🖼️ GIFサイズ: ${this.gifImageElement.naturalWidth}x${this.gifImageElement.naturalHeight}`);
            console.log(`📐 表示サイズ: ${rect.width}x${rect.height}`);
        };
        
        // 要素を組み立て
        this.gifPreviewContainer.appendChild(this.gifImageElement);
        this.gifPreviewContainer.appendChild(this.gifOverlayCanvas);
        
        // 既存のキャンバスを非表示にして、プレビューコンテナを表示
        this.textCanvas.style.display = 'none';
        canvasSection.appendChild(this.gifPreviewContainer);
    }

    // DOM要素のクリーンアップ
    cleanupGifDOMPreview() {
        if (this.gifPreviewContainer) {
            this.gifPreviewContainer.remove();
            this.gifPreviewContainer = null;
        }
        if (this.gifImageElement) {
            this.gifImageElement = null;
        }
        if (this.gifOverlayCanvas) {
            this.gifOverlayCanvas = null;
        }
        // 元のキャンバスを表示
        this.textCanvas.style.display = 'block';
    }

    // ゲーミング効果オーバーレイ描画
    drawGamingOverlay(ctx, progress) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const animationType = this.textAnimationMode.value;
        const saturation = parseInt(this.textSaturation.value) || 100;
        
        // グラデーション作成
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        
        if (animationType === 'rainbow') {
            // 虹色グラデーション
            for (let i = 0; i <= 10; i++) {
                const hue = ((i * 36 + progress * 36) % 360);
                const color = `hsl(${hue}, ${saturation}%, 50%)`;
                gradient.addColorStop(i / 10, color);
            }
        } else if (animationType === 'golden') {
            // 金ピカグラデーション
            const baseHue = 45; // 金色
            for (let i = 0; i <= 10; i++) {
                const hue = baseHue + Math.sin(progress + i) * 20;
                const lightness = 50 + Math.sin(progress * 2 + i) * 20;
                const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                gradient.addColorStop(i / 10, color);
            }
        } else if (animationType === 'bluepurplepink') {
            // 青→紫→ピンク
            const colors = [
                `hsl(240, ${saturation}%, 50%)`, // 青
                `hsl(270, ${saturation}%, 50%)`, // 紫
                `hsl(300, ${saturation}%, 50%)`, // ピンク
            ];
            for (let i = 0; i <= 10; i++) {
                const colorIndex = Math.floor((i + progress) % colors.length);
                gradient.addColorStop(i / 10, colors[colorIndex]);
            }
        }

        // スクリーンブレンドモードでオーバーレイ
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 元の描画モードに戻す
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
    }

    handleAnimationModeChange() {
        // グラデーション方向の選択UIの表示/非表示を制御
        if (this.textAnimationMode.value === 'rainbow' || this.textAnimationMode.value === 'bluepurplepink' || this.textAnimationMode.value === 'golden') {
            this.gradientDirectionGroup.style.display = 'block';
            this.gradientDensityGroup.style.display = 'block';
        } else {
            this.gradientDirectionGroup.style.display = 'none';
            this.gradientDensityGroup.style.display = 'none';
        }
        
        if (this.textAnimationMode.value === 'rainbow' || this.textAnimationMode.value === 'bluepurplepink' || this.textAnimationMode.value === 'golden' || this.textAnimationMode.value === 'pulse' || this.textAnimationMode.value === 'rainbowPulse') {
            // 画像モードかつGIFの場合はGIFプレビューを再開
            if (this.creationMode === 'image' && this.gifFrames && this.gifFrames.length > 0) {
                this.startGifPreview();
            } else {
                this.startAnimation();
            }
        } else {
            this.stopAnimation();
            this.stopGifPreview();
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
        
        
        // キャンバスを完全透明でクリア（確実に透過処理）
        this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        this.textCtx.globalCompositeOperation = 'source-over';
        
        // 透過設定時は背景を一切描画しない（黒い部分を完全除去）
        if (!isTransparent) {
            // 非透過時のみ、白背景を使用（黒背景だと黒い部分が目立つため）
            this.textCtx.fillStyle = '#FFFFFF';
            this.textCtx.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        } else {
        }
        
        // テキストサイズを取得（スライダーの値を使用）
        const fontSize = parseInt(this.textSize.value);
        
        // フォント設定（太字オプション対応、黒縁なし）
        const selectedFont = this.textFont ? this.textFont.value : 'Arial';
        const fontWeight = this.textBold && this.textBold.checked ? 'bold' : 'normal';
        this.textCtx.font = `${fontWeight} ${fontSize}px ${selectedFont}`;
        this.textCtx.textAlign = 'center';
        this.textCtx.textBaseline = 'middle';
        
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
            // GIFの場合は静的プレビューを表示（アニメーションプレビューは処理が重いため）
            if (this.gifFrames && this.gifFrames.length > 0) {
                this.drawStaticGifPreview();
            } else {
                // 通常の画像処理
                this.drawGamingImage(this.uploadedImage, animationMode, timeOffset);
            }
        } else {
            const isStretch = this.textStretch.checked;
            const centerX = this.textCanvas.width / 2;
            const centerY = this.textCanvas.height / 2;
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
        }
        
        // 太字オプション（ユーザー選択可能）
        const fontWeight = this.textBold && this.textBold.checked ? 'bold' : 'normal';
        this.textCtx.font = `${fontWeight} ${actualFontSize}px ${selectedFont}`;
        
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
        }
        
        lines.forEach((line, index) => {
            // 空白行をスキップしない（スペースのみの行も描画対象）
            if (!line && line !== '') {
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
                    // 斜め方向（左上→右下）- より明確に45度斜めに
                    const diagLength1 = Math.max(textWidth, fontSize);
                    gradient = this.textCtx.createLinearGradient(
                        x - diagLength1/2, currentY - diagLength1/2,
                        x + diagLength1/2, currentY + diagLength1/2
                    );
                    break;
                case 'diagonal2':
                    // 斜め方向（右上→左下）- より明確に45度斜めに
                    const diagLength2 = Math.max(textWidth, fontSize);
                    gradient = this.textCtx.createLinearGradient(
                        x + diagLength2/2, currentY - diagLength2/2,
                        x - diagLength2/2, currentY + diagLength2/2
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
                    // 斜め方向（左上→右下）- より明確に45度斜めに
                    const diagLength3 = Math.max(textWidth, fontSize);
                    gradient = this.textCtx.createLinearGradient(
                        x - diagLength3/2, currentY - diagLength3/2,
                        x + diagLength3/2, currentY + diagLength3/2
                    );
                    break;
                case 'diagonal2':
                    // 斜め方向（右上→左下）- より明確に45度斜めに
                    const diagLength4 = Math.max(textWidth, fontSize);
                    gradient = this.textCtx.createLinearGradient(
                        x + diagLength4/2, currentY - diagLength4/2,
                        x - diagLength4/2, currentY + diagLength4/2
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
            
        } else if (animationMode === 'golden') {
            // 金ピカグラデーション
            let gamingColors = [
                '#8B4513', // ダークブロンズ
                '#CD7F32', // ブロンズ
                '#B8860B', // ダークゴールド
                '#DAA520', // ゴールデンロッド
                '#FFD700', // ゴールド
                '#FFF700', // イエローゴールド
                '#FFFACD'  // クリーム
            ];
            
            // 彩度に応じて色を調整
            if (saturationLevel !== 1.0) {
                gamingColors = gamingColors.map(color => this.adjustColorSaturation(color, saturationLevel));
            }
            
            // 小さいサイズでの色強化適用
            const smallCanvasSize4 = Math.min(this.textCanvas.width, this.textCanvas.height);
            if (smallCanvasSize4 <= 64) {
                gamingColors = gamingColors.map(color => this.enhanceColorForSmallSize(color));
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
                    // 斜め方向（左上→右下）- より明確に45度斜めに
                    const diagLength3 = Math.max(textWidth, fontSize);
                    gradient = this.textCtx.createLinearGradient(
                        x - diagLength3/2, currentY - diagLength3/2,
                        x + diagLength3/2, currentY + diagLength3/2
                    );
                    break;
                case 'diagonal2':
                    // 斜め方向（右上→左下）- より明確に45度斜めに
                    const diagLength4 = Math.max(textWidth, fontSize);
                    gradient = this.textCtx.createLinearGradient(
                        x + diagLength4/2, currentY - diagLength4/2,
                        x - diagLength4/2, currentY + diagLength4/2
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
            const gradientDensity = this.textGradientDensity ? parseFloat(this.textGradientDensity.value) : 7;
            
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
                        // 左上→右下 - より明確に45度斜めに
                        const maxDim1 = Math.max(sourceCanvas.width, sourceCanvas.height);
                        const dx1 = x - sourceCanvas.width / 2;
                        const dy1 = y - sourceCanvas.height / 2;
                        const diagonalPos1 = (dx1 + dy1) / maxDim1 + 0.5; // 正規化
                        position = Math.max(0, Math.min(1, diagonalPos1)); // 0-1の範囲に制限
                        break;
                    case 'diagonal2':
                        // 右上→左下 - より明確に45度斜めに
                        const maxDim2 = Math.max(sourceCanvas.width, sourceCanvas.height);
                        const dx2 = sourceCanvas.width / 2 - x;
                        const dy2 = y - sourceCanvas.height / 2;
                        const diagonalPos2 = (dx2 + dy2) / maxDim2 + 0.5; // 正規化
                        position = Math.max(0, Math.min(1, diagonalPos2)); // 0-1の範囲に制限
                        break;
                    default:
                        position = x / sourceCanvas.width; // デフォルトは横方向
                }
                
                // グラデーション密度を適用（テキストと同じ計算方式）
                const colorFloat = (position * gradientDensity + colorShift) % gamingColors.length;
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
                    // 元画像の明度を保持しながら、ブレンド色を適用（明度改善版）
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像の明度を計算（下限を設定して暗くなりすぎないようにする）
                    const originalLuminance = (originalR * 0.299 + originalG * 0.587 + originalB * 0.114) / 255;
                    const adjustedLuminance = Math.max(0.3, Math.min(1.0, originalLuminance * 1.4)); // 明度を40%向上＋下限30%
                    
                    // ブレンド色に調整された明度を適用
                    const targetR = blendedColor[0] * adjustedLuminance;
                    const targetG = blendedColor[1] * adjustedLuminance;
                    const targetB = blendedColor[2] * adjustedLuminance;
                    
                    // 彩度レベルを適用
                    const finalR = targetR * saturationLevel + originalR * (1 - saturationLevel);
                    const finalG = targetG * saturationLevel + originalG * (1 - saturationLevel);
                    const finalB = targetB * saturationLevel + originalB * (1 - saturationLevel);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(finalR)));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(finalG))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(finalB))); // B
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
            const gradientDensity = this.textGradientDensity ? parseFloat(this.textGradientDensity.value) : 7;
            
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
                        // 左上→右下 - より明確に45度斜めに
                        const maxDim3 = Math.max(sourceCanvas.width, sourceCanvas.height);
                        const dx3 = x - sourceCanvas.width / 2;
                        const dy3 = y - sourceCanvas.height / 2;
                        const diagonalPos3 = (dx3 + dy3) / maxDim3 + 0.5; // 正規化
                        position = Math.max(0, Math.min(1, diagonalPos3)); // 0-1の範囲に制限
                        break;
                    case 'diagonal2':
                        // 右上→左下 - より明確に45度斜めに
                        const maxDim4 = Math.max(sourceCanvas.width, sourceCanvas.height);
                        const dx4 = sourceCanvas.width / 2 - x;
                        const dy4 = y - sourceCanvas.height / 2;
                        const diagonalPos4 = (dx4 + dy4) / maxDim4 + 0.5; // 正規化
                        position = Math.max(0, Math.min(1, diagonalPos4)); // 0-1の範囲に制限
                        break;
                    default:
                        position = x / sourceCanvas.width; // デフォルトは横方向
                }
                
                // グラデーション密度を適用（テキストと同じ計算方式）
                const colorFloat = (position * gradientDensity + colorShift) % gamingColors.length;
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
                    // 元画像の明度を保持しながら、ブレンド色を適用（明度改善版）
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像の明度を計算（下限を設定して暗くなりすぎないようにする）
                    const originalLuminance = (originalR * 0.299 + originalG * 0.587 + originalB * 0.114) / 255;
                    const adjustedLuminance = Math.max(0.3, Math.min(1.0, originalLuminance * 1.4)); // 明度を40%向上＋下限30%
                    
                    // ブレンド色に調整された明度を適用
                    const targetR = blendedColor[0] * adjustedLuminance;
                    const targetG = blendedColor[1] * adjustedLuminance;
                    const targetB = blendedColor[2] * adjustedLuminance;
                    
                    // 彩度レベルを適用
                    const finalR = targetR * saturationLevel + originalR * (1 - saturationLevel);
                    const finalG = targetG * saturationLevel + originalG * (1 - saturationLevel);
                    const finalB = targetB * saturationLevel + originalB * (1 - saturationLevel);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(finalR)));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(finalG))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(finalB))); // B
                }
            }
            
        } else if (animationMode === 'golden') {
            // 金ピカグラデーション（画像版）
            let gamingColors = [
                [139, 69, 19],   // ダークブロンズ
                [205, 127, 50],  // ブロンズ
                [184, 134, 11],  // ダークゴールド
                [218, 165, 32],  // ゴールデンロッド
                [255, 215, 0],   // ゴールド
                [255, 247, 0],   // イエローゴールド
                [255, 250, 205]  // クリーム
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
            const gradientDensity = this.textGradientDensity ? parseFloat(this.textGradientDensity.value) : 7;
            
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
                        // 左上→右下 - より明確に45度斜めに
                        const maxDim3 = Math.max(sourceCanvas.width, sourceCanvas.height);
                        const dx3 = x - sourceCanvas.width / 2;
                        const dy3 = y - sourceCanvas.height / 2;
                        const diagonalPos3 = (dx3 + dy3) / maxDim3 + 0.5; // 正規化
                        position = Math.max(0, Math.min(1, diagonalPos3)); // 0-1の範囲に制限
                        break;
                    case 'diagonal2':
                        // 右上→左下 - より明確に45度斜めに
                        const maxDim4 = Math.max(sourceCanvas.width, sourceCanvas.height);
                        const dx4 = sourceCanvas.width / 2 - x;
                        const dy4 = y - sourceCanvas.height / 2;
                        const diagonalPos4 = (dx4 + dy4) / maxDim4 + 0.5; // 正規化
                        position = Math.max(0, Math.min(1, diagonalPos4)); // 0-1の範囲に制限
                        break;
                    default:
                        position = x / sourceCanvas.width; // デフォルトは横方向
                }
                
                // グラデーション密度を適用（テキストと同じ計算方式）
                const colorFloat = (position * gradientDensity + colorShift) % gamingColors.length;
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
                    // 元画像の明度を保持しながら、ブレンド色を適用（明度改善版）
                    const originalR = data[i];
                    const originalG = data[i + 1];
                    const originalB = data[i + 2];
                    
                    // 元画像の明度を計算（下限を設定して暗くなりすぎないようにする）
                    const originalLuminance = (originalR * 0.299 + originalG * 0.587 + originalB * 0.114) / 255;
                    const adjustedLuminance = Math.max(0.3, Math.min(1.0, originalLuminance * 1.4)); // 明度を40%向上＋下限30%
                    
                    // ブレンド色に調整された明度を適用
                    const targetR = blendedColor[0] * adjustedLuminance;
                    const targetG = blendedColor[1] * adjustedLuminance;
                    const targetB = blendedColor[2] * adjustedLuminance;
                    
                    // 彩度レベルを適用
                    const finalR = targetR * saturationLevel + originalR * (1 - saturationLevel);
                    const finalG = targetG * saturationLevel + originalG * (1 - saturationLevel);
                    const finalB = targetB * saturationLevel + originalB * (1 - saturationLevel);
                    
                    data[i] = Math.max(0, Math.min(255, Math.round(finalR)));     // R
                    data[i + 1] = Math.max(0, Math.min(255, Math.round(finalG))); // G
                    data[i + 2] = Math.max(0, Math.min(255, Math.round(finalB))); // B
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
        console.log('🚀 downloadGif開始');
        console.log('🔍 creationMode:', this.creationMode);
        console.log('🔍 gifFrames:', this.gifFrames ? this.gifFrames.length : 'null');
        console.log('🔍 originalFile:', this.gifFrames && this.gifFrames[0] ? !!this.gifFrames[0].originalFile : 'false');
        
        this.textDownloadGifBtn.textContent = '生成中...';
        this.textDownloadGifBtn.disabled = true;
        
        try {
            // 画像モードの場合はVercel APIを使用
            if (this.creationMode === 'image' && this.gifFrames && this.gifFrames.length > 0 && this.gifFrames[0].originalFile) {
                console.log('🌐 Vercel API でGIF処理を開始...');
                await this.processGifWithVercelAPI();
                return;
            } else {
                console.log('⚠️ 条件不一致 - 通常のテキストモード処理に移行');
            }
            
            // テキストモードの場合は従来の方法
            await this.captureFramesForGif();
            
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
            }
            
            // 透過背景の場合の設定
            if (this.textTransparentBg.checked) {
                gifOptions.transparent = 'rgba(0,0,0,0)'; // 透明色を指定
                gifOptions.background = null;             // 背景色をnullに設定
                gifOptions.dispose = 2;                   // フレーム間で背景をクリア
                gifOptions.globalPalette = false;         // ローカルパレットを使用
                gifOptions.dither = false;                // ディザリングを無効化
            }
            
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
            
            for (let i = 0; i < this.capturedFrames.length; i++) {
                const frameCanvas = this.capturedFrames[i];
                const frameOptions = {delay: delay, copy: true};
                
                // 透過背景の場合の追加設定
                if (this.textTransparentBg.checked) {
                    frameOptions.transparent = true;
                    frameOptions.dispose = 2;        // 背景をクリア
                    frameOptions.preserveTransparency = true; // 透明度を保持
                }
                
                gif.addFrame(frameCanvas, frameOptions);
            }
            
            gif.on('finished', (blob) => {
                
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
            });
            
            gif.on('progress', (p) => {
                const progress = Math.round(p * 100);
                this.textDownloadGifBtn.textContent = `GIF生成中... ${progress}%`;
            });
            
            gif.on('abort', () => {
                this.textDownloadGifBtn.textContent = 'GIFで保存';
                this.textDownloadGifBtn.disabled = false;
            });
            
            gif.render();
        } catch (error) {
            
            // エラーの種類に応じて詳細な情報を出力
            if (error.name === 'QuotaExceededError' || error.message.includes('memory')) {
                alert('テキストGIF生成に失敗しました。\nメモリ不足の可能性があります。\n・テキストサイズを小さくしてみてください\n・フレーム数を減らしてみてください');
            } else if (error.message.includes('worker') || error.message.includes('Worker')) {
                alert('テキストGIF生成に失敗しました。\nワーカースクリプトの読み込みエラーです。\nページを再読み込みしてください。');
            } else {
                alert(`テキストGIF生成に失敗しました。\nエラー: ${error.message}\n\nコンソールログで詳細を確認してください。`);
            }
            
            this.textDownloadGifBtn.textContent = 'GIFで保存';
            this.textDownloadGifBtn.disabled = false;
        }
    }

    // Vercel APIでGIF処理を行う
    async processGifWithVercelAPI() {
        const originalFile = this.gifFrames[0].originalFile;
        
        // 処理中は全てのボタンを無効化
        this.setUIBlocked(true);
        
        // まずテストAPIで接続確認
        await this.testVercelConnection();
        
        try {
            // GIFファイルをBase64に変換
            const base64Data = await this.fileToBase64(originalFile);
            
            // 設定を取得（全てのエフェクトパラメータを含む）
            const settings = {
                animationType: this.textAnimationMode.value || 'rainbow',
                speed: parseInt(this.textAnimationSpeed.value) || 5,
                saturation: parseInt(this.textSaturation.value) || 100,
                concentrationLines: this.textAnimationMode.value === 'concentration',
                canvasWidth: this.textCanvas.width,
                canvasHeight: this.textCanvas.height,
                // グラデーション関連設定を追加
                gradientDirection: this.textGradientDirection ? this.textGradientDirection.value : 'horizontal',
                gradientDensity: this.textGradientDensity ? parseFloat(this.textGradientDensity.value) : 7.0,
                // 背景設定
                transparentBg: this.textBgTransparent ? this.textBgTransparent.checked : false,
                backgroundColor: this.textBgColor ? this.textBgColor.value : '#000000'
            };
            
            console.log('📊 GIF処理設定:', settings);
            
            this.textDownloadGifBtn.textContent = 'サーバー処理中...';
            
            // Vercel APIを呼び出し
            // 現在のドメインを優先してAPIを呼び出し（CORS回避）
            const currentDomain = window.location.origin;
            const apiUrls = [
                currentDomain, // 現在のドメイン（CORS回避）
                'https://gaming-generator-qjlika608-nakamuros-projects-f99bfc51.vercel.app', // 最新
                'https://gaming-generator-kdcyoa64v-nakamuros-projects-f99bfc51.vercel.app', // 以前
                'https://gaming-generator.vercel.app' // カスタムドメイン候補
            ];
            
            console.log('🌐 現在のドメイン:', currentDomain);
            
            let response = null;
            let lastError = null;
            
            for (const apiUrl of apiUrls) {
                try {
                    console.log(`🌐 API試行: ${apiUrl}`);
                    response = await fetch(`${apiUrl}/api/gif-gaming.py`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            gifData: base64Data,
                            settings: settings
                        })
                    });
                    
                    if (response.ok) {
                        console.log(`✅ ${apiUrl} で接続成功`);
                        break; // 成功したのでループを抜ける
                    } else {
                        throw new Error(`API Error: ${response.status} ${response.statusText}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ ${apiUrl} 接続失敗:`, error.message);
                    lastError = error;
                    response = null;
                }
            }
            
            if (!response || !response.ok) {
                throw lastError || new Error('すべてのAPIエンドポイントで接続に失敗しました');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                const apiError = new Error(result.error || 'API処理に失敗しました');
                apiError.serverData = result;  // サーバーからの詳細情報を保持
                throw apiError;
            }
            
            console.log(`✅ GIF処理完了: ${result.frameCount}フレーム, サイズ: ${result.size}bytes`);
            
            // 結果をダウンロード
            const blob = this.base64ToBlob(result.gifData);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'gaming_gif_' + new Date().getTime() + '.gif';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.textDownloadGifBtn.textContent = 'GIFで保存';
            this.textDownloadGifBtn.disabled = false;
            
            // UIブロックを解除
            this.setUIBlocked(false);
            
            // 成功通知を表示
            alert('GIFの処理が完了し、ダウンロードされました！');
            
        } catch (error) {
            console.error('❌ Vercel API エラー:', error);
            
            // 詳細なエラー情報を表示
            let errorMessage = `GIF処理に失敗しました。\nエラー: ${error.message}`;
            
            // サーバーからの詳細エラー情報を取得
            if (error.serverData) {
                errorMessage += `\n\n詳細:\nタイプ: ${error.serverData.error_type || '不明'}\n内容: ${error.serverData.details || 'なし'}`;
                if (error.serverData.traceback && error.serverData.traceback.length > 0) {
                    errorMessage += `\nトレースバック: ${error.serverData.traceback.join(' → ')}`;
                }
                console.error('🔍 サーバーエラー詳細:', error.serverData);
            }
            
            alert(errorMessage);
            this.textDownloadGifBtn.textContent = 'GIFで保存';
            this.textDownloadGifBtn.disabled = false;
            
            // UIブロックを解除
            this.setUIBlocked(false);
        }
    }
    
    // アニメーションGIF用静的プレビュー（最初のフレームのみ表示）
    drawStaticGifPreview() {
        // キャンバスをクリア
        this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // 背景処理
        if (this.textBgTransparent && this.textBgTransparent.checked) {
            // 透明背景の場合は何もしない
        } else {
            // 背景色を設定
            this.textCtx.fillStyle = this.textBgColor ? this.textBgColor.value : '#000000';
            this.textCtx.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        }
        
        // 静的画像として描画（アニメーション効果なし）
        this.textCtx.save();
        
        // キャンバスのアスペクト比に合わせて画像をフィットさせる
        const canvasAspect = this.textCanvas.width / this.textCanvas.height;
        const imageAspect = this.uploadedImage.width / this.uploadedImage.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasAspect > imageAspect) {
            // キャンバスが横長の場合
            drawHeight = this.textCanvas.height;
            drawWidth = drawHeight * imageAspect;
            drawX = (this.textCanvas.width - drawWidth) / 2;
            drawY = 0;
        } else {
            // キャンバスが縦長の場合
            drawWidth = this.textCanvas.width;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (this.textCanvas.height - drawHeight) / 2;
        }
        
        // GIF画像を静的に描画
        this.textCtx.drawImage(this.uploadedImage, drawX, drawY, drawWidth, drawHeight);
        
        // プレビュー用メッセージを表示
        this.textCtx.font = '16px sans-serif';
        this.textCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.textCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.textCtx.lineWidth = 2;
        const message = 'アニメーションGIF - プレビューは静止画表示';
        const textWidth = this.textCtx.measureText(message).width;
        const textX = (this.textCanvas.width - textWidth) / 2;
        const textY = 30;
        
        this.textCtx.strokeText(message, textX, textY);
        this.textCtx.fillText(message, textX, textY);
        
        this.textCtx.restore();
    }
    
    // UIブロック機能（全体のボタンとUIコントロールを無効化/有効化）
    setUIBlocked(blocked) {
        // ゲーミングテキスト生成のボタン類
        if (this.textDownloadBtn) this.textDownloadBtn.disabled = blocked;
        if (this.textDownloadGifBtn) this.textDownloadGifBtn.disabled = blocked;
        if (this.textImageInput) this.textImageInput.disabled = blocked;
        if (this.textInput) this.textInput.disabled = blocked;
        if (this.textAnimationMode) this.textAnimationMode.disabled = blocked;
        if (this.textAnimationSpeed) this.textAnimationSpeed.disabled = blocked;
        if (this.textSaturation) this.textSaturation.disabled = blocked;
        
        // 集中線生成のボタン類（存在する場合）
        if (window.concentrationLineGenerator) {
            const clg = window.concentrationLineGenerator;
            if (clg.downloadBtn) clg.downloadBtn.disabled = blocked;
            if (clg.downloadGifBtn) clg.downloadGifBtn.disabled = blocked;
            if (clg.downloadRealGifBtn) clg.downloadRealGifBtn.disabled = blocked;
            if (clg.imageInput) clg.imageInput.disabled = blocked;
        }
        
        // タブ切り替えも無効化
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.disabled = blocked;
            if (blocked) {
                tab.style.opacity = '0.5';
                tab.style.pointerEvents = 'none';
            } else {
                tab.style.opacity = '1';
                tab.style.pointerEvents = 'auto';
            }
        });
        
        // 処理中表示
        if (blocked) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = 'default';
        }
    }
    
    // デバッグテスト実行
    async runDebugTest() {
        console.log('🧪🧪🧪 === デバッグテスト開始 === 🧪🧪🧪');
        console.log('📍 現在の状態確認:');
        console.log('  - creationMode:', this.creationMode);
        console.log('  - gifFrames:', this.gifFrames);
        console.log('  - uploadedImage:', this.uploadedImage);
        console.log('  - textImageInput files:', this.textImageInput.files.length);
        
        // 基本的なAPI接続テスト
        await this.testVercelConnection();
        
        // GIFファイルがある場合の詳細テスト
        if (this.gifFrames && this.gifFrames.length > 0) {
            console.log('🎬 GIFファイル詳細:');
            console.log('  - フレーム数:', this.gifFrames.length);
            console.log('  - originalFile:', !!this.gifFrames[0].originalFile);
            console.log('  - ファイルサイズ:', this.gifFrames[0].originalFile ? this.gifFrames[0].originalFile.size : 'なし');
            console.log('  - ファイル名:', this.gifFrames[0].originalFile ? this.gifFrames[0].originalFile.name : 'なし');
            
            // Vercel API呼び出しテスト
            if (this.gifFrames[0].originalFile) {
                console.log('🌐 Vercel GIF API呼び出しテスト開始...');
                try {
                    await this.processGifWithVercelAPI();
                } catch (error) {
                    console.error('❌ Vercel GIF APIテスト失敗:', error);
                }
            }
        } else {
            console.log('⚠️ GIFファイルがアップロードされていません');
            alert('デバッグテストを実行するには、まずGIFファイルをアップロードしてください。');
        }
        
        console.log('🧪🧪🧪 === デバッグテスト完了 === 🧪🧪🧪');
    }
    
    // Vercel接続テスト
    async testVercelConnection() {
        try {
            console.log('🧪 Vercel接続テスト開始');
            // 現在のドメインを優先してAPIを呼び出し（CORS回避）
            const currentDomain = window.location.origin;
            const apiUrls = [
                currentDomain, // 現在のドメイン（CORS回避）
                'https://gaming-generator-qjlika608-nakamuros-projects-f99bfc51.vercel.app', // 最新
                'https://gaming-generator-kdcyoa64v-nakamuros-projects-f99bfc51.vercel.app', // 以前
                'https://gaming-generator.vercel.app' // カスタムドメイン候補
            ];
            
            console.log('🌐 現在のドメイン:', currentDomain);
            
            let response = null;
            let lastError = null;
            
            for (const apiUrl of apiUrls) {
                try {
                    console.log(`🧪 テストAPI試行: ${apiUrl}`);
                    response = await fetch(`${apiUrl}/api/test`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            test: 'connection',
                            timestamp: new Date().toISOString()
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('🧪 テストAPI結果:', result);
                        
                        if (result.success) {
                            console.log(`✅ ${apiUrl} で接続成功`);
                            return; // 成功したので終了
                        } else {
                            console.warn('⚠️ Vercel接続に問題あり:', result);
                        }
                    } else {
                        throw new Error(`${response.status} ${response.statusText}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ ${apiUrl} テスト失敗:`, error.message);
                    lastError = error;
                }
            }
            
            // すべて失敗した場合
            console.error('❌ すべてのAPIエンドポイントで接続テスト失敗:', lastError);
        } catch (error) {
            console.error('❌ Vercel接続テスト失敗:', error);
        }
    }
    
    // ファイルをBase64に変換
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Base64をBlobに変換
    base64ToBlob(base64Data) {
        const byteCharacters = atob(base64Data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], {type: 'image/gif'});
    }
    
    // シンプルなGIFフレーム数検出
    async getGifFrameCount(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const buffer = e.target.result;
                    const frameCount = this.countGifFrames(buffer);
                    resolve(frameCount);
                } catch (error) {
                    console.error('❌ フレーム数検出エラー:', error);
                    resolve(1); // エラー時は1フレームとして処理
                }
            };
            reader.onerror = () => resolve(1);
            reader.readAsArrayBuffer(file);
        });
    }
    
    // GIFフレーム数をカウント（軽量版）
    countGifFrames(buffer) {
        const view = new DataView(buffer);
        const uint8View = new Uint8Array(buffer);
        
        // GIFヘッダー確認
        const header = String.fromCharCode(...new Uint8Array(buffer, 0, 6));
        if (!header.startsWith('GIF')) {
            return 1; // GIFでない場合は1フレーム
        }
        
        console.log(`📋 GIFヘッダー: ${header}`);
        
        // 論理画面記述子をスキップ
        let pos = 13;
        
        // グローバルカラーテーブルをスキップ
        const globalColorTableFlag = (view.getUint8(10) & 0x80) !== 0;
        if (globalColorTableFlag) {
            const globalColorTableSize = 2 << (view.getUint8(10) & 0x07);
            pos += globalColorTableSize * 3;
        }
        
        let frameCount = 0;
        const maxCheck = Math.min(buffer.byteLength, 10000); // 最初の10KBのみチェック
        
        while (pos < maxCheck - 1) {
            const separator = uint8View[pos];
            
            if (separator === 0x2C) { // Image Descriptor (フレーム)
                frameCount++;
                console.log(`🖼️ フレーム ${frameCount} 発見`);
                
                // フレーム位置をスキップ（8バイト）
                pos += 9;
                
                // 簡易的にLZWデータをスキップ
                const lzwMinimumCodeSize = uint8View[pos];
                pos++;
                
                // データブロックをスキップ
                while (pos < maxCheck) {
                    const blockSize = uint8View[pos];
                    pos++;
                    if (blockSize === 0) break;
                    pos += blockSize;
                }
            } else if (separator === 0x21) { // Extension
                pos += 2;
                // Extension data blocks をスキップ
                while (pos < maxCheck) {
                    const blockSize = uint8View[pos];
                    pos++;
                    if (blockSize === 0) break;
                    pos += blockSize;
                }
            } else if (separator === 0x3B) { // Trailer
                break;
            } else {
                pos++;
            }
        }
        
        return Math.max(1, frameCount); // 最低1フレーム
    }

    // 完璧なループのための最適フレーム数を自動計算（テキスト用）
    calculateOptimalFrameCount() {
        const animationMode = this.textAnimationMode.value;
        const animationSpeed = parseInt(this.textAnimationSpeed.value) || 5;
        
        let optimalFrames;
        
        switch (animationMode) {
            case 'rainbow':
            case 'bluepurplepink':
            case 'golden':
                // グラデーション系：7色が一周するのに最適なフレーム数
                const baseGradientFrames = 14; // 7色 × 2倍の滑らかさ
                optimalFrames = Math.max(8, Math.round(baseGradientFrames * (10 / animationSpeed)));
                break;
                
            case 'pulse':
                // ピカピカ点滅：sin波の一周期に最適なフレーム数
                const basePulseFrames = 12; // sin波の滑らかな一周期  
                optimalFrames = Math.max(6, Math.round(basePulseFrames * (10 / animationSpeed)));
                break;
                
            case 'rainbowPulse':
                // 虹色ピカピカ：色変化とパルスの最小公倍数
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

    drawGamingGifPreview(animationMode, timeOffset, currentTime) {
        // キャンバスをクリア
        this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // GIFのフレーム数取得（推定）
        const estimatedFrameCount = this.gifFrames[0]?.estimatedFrameCount || 10;
        
        // フレーム同期: GIFアニメーションのフレーム数に合わせてゲーミング効果を同期
        const frameSync = currentTime ? (currentTime / 100) % estimatedFrameCount : 0;
        const frameSyncProgress = frameSync / estimatedFrameCount;
        
        // 元のGIF画像を描画（アニメーション効果）
        this.textCtx.save();
        
        // キャンバスのアスペクト比に合わせて画像をフィットさせる
        const canvasAspect = this.textCanvas.width / this.textCanvas.height;
        const imageAspect = this.uploadedImage.width / this.uploadedImage.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasAspect > imageAspect) {
            // キャンバスが横長の場合
            drawHeight = this.textCanvas.height;
            drawWidth = drawHeight * imageAspect;
            drawX = (this.textCanvas.width - drawWidth) / 2;
            drawY = 0;
        } else {
            // キャンバスが縦長の場合
            drawWidth = this.textCanvas.width;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (this.textCanvas.height - drawHeight) / 2;
        }
        
        // 背景を透明にする場合の背景色設定
        if (this.textBgTransparent && this.textBgTransparent.checked) {
            // 透明背景の場合は何もしない
        } else {
            // 背景色を設定
            this.textCtx.fillStyle = this.textBgColor ? this.textBgColor.value : '#000000';
            this.textCtx.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        }
        
        // GIF画像を描画
        this.textCtx.drawImage(this.uploadedImage, drawX, drawY, drawWidth, drawHeight);
        
        // ゲーミング効果をオーバーレイとして適用（フレーム同期）
        this.applyGamingOverlayToCanvas(animationMode, timeOffset, frameSyncProgress);
        
        this.textCtx.restore();
    }

    applyGamingOverlayToCanvas(animationMode, timeOffset, frameSyncProgress = 0) {
        const width = this.textCanvas.width;
        const height = this.textCanvas.height;
        
        // フレーム同期されたアニメーション進行度
        const progress = frameSyncProgress > 0 ? frameSyncProgress * 10 : (timeOffset || 0);
        
        // エフェクト別の描画
        this.textCtx.save();
        this.textCtx.globalCompositeOperation = 'screen'; // スクリーンブレンドモード
        this.textCtx.globalAlpha = 0.6; // 60%の透明度
        
        if (animationMode === 'rainbow') {
            // 虹色グラデーション
            for (let x = 0; x < width; x += 2) {
                const hue = (x / width * 360 + progress * 36) % 360;
                const color = this.hsvToRgb(hue, 100, 100);
                this.textCtx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                this.textCtx.lineWidth = 2;
                this.textCtx.beginPath();
                this.textCtx.moveTo(x, 0);
                this.textCtx.lineTo(x, height);
                this.textCtx.stroke();
            }
        } else if (animationMode === 'golden') {
            // 金ピカ効果
            for (let x = 0; x < width; x += 2) {
                const lightness = Math.sin(progress * 2 + x * 0.02) * 50 + 127;
                const r = Math.min(255, lightness + 50);
                const g = Math.min(255, lightness);
                const b = Math.max(0, lightness - 100);
                this.textCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                this.textCtx.lineWidth = 2;
                this.textCtx.beginPath();
                this.textCtx.moveTo(x, 0);
                this.textCtx.lineTo(x, height);
                this.textCtx.stroke();
            }
        } else if (animationMode === 'bluepurplepink') {
            // ピンク青グラデーション
            for (let x = 0; x < width; x += 2) {
                const pos = (x / width + progress * 0.1) % 1.0;
                let r, g, b;
                
                if (pos < 0.33) {
                    const t = pos / 0.33;
                    r = 100 + t * 155;
                    g = 150 * (1 - t);
                    b = 255 - t * 100;
                } else if (pos < 0.66) {
                    const t = (pos - 0.33) / 0.33;
                    r = 255 - t * 100;
                    g = t * 100;
                    b = 155 + t * 100;
                } else {
                    const t = (pos - 0.66) / 0.34;
                    r = 155 - t * 55;
                    g = 100 + t * 50;
                    b = 255;
                }
                
                this.textCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                this.textCtx.lineWidth = 2;
                this.textCtx.beginPath();
                this.textCtx.moveTo(x, 0);
                this.textCtx.lineTo(x, height);
                this.textCtx.stroke();
            }
        }
        // 他のエフェクト（pulse、rainbowPulse、concentration）も必要に応じて追加
        
        this.textCtx.restore();
    }

    hsvToRgb(h, s, v) {
        h = h / 60;
        s = s / 100;
        v = v / 100;
        
        const c = v * s;
        const x = c * (1 - Math.abs((h % 2) - 1));
        const m = v - c;
        
        let r, g, b;
        if (h >= 0 && h < 1) {
            r = c; g = x; b = 0;
        } else if (h >= 1 && h < 2) {
            r = x; g = c; b = 0;
        } else if (h >= 2 && h < 3) {
            r = 0; g = c; b = x;
        } else if (h >= 3 && h < 4) {
            r = 0; g = x; b = c;
        } else if (h >= 4 && h < 5) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
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
            return mem;
        } else {
            return null;
        }
    },
    
    checkGifWorker: () => {
        fetch('./gif.worker.js')
            .then(response => {
                if (response.ok) {
                } else {
                }
            })
            .catch(error => {
            });
    },
    
    testSmallGif: async () => {
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
            });
            
            gif.on('abort', () => {
            });
            
            gif.render();
        } catch (error) {
        }
    }
};


// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    const concentrationGenerator = new ConcentrationLineGenerator();
    concentrationGenerator.setDefaultParams();
    
    const textGenerator = new GamingTextGenerator();
    
    initializeTabs();
    initializeGlobalDarkMode();
    
    // 初期メモリ状況を表示
    window.debugGaming.checkMemory();
}); 