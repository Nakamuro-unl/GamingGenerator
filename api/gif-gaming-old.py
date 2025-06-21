"""
GIFアニメーションにゲーミング効果を適用するAPI
"""

import sys
import traceback

try:
    from http.server import BaseHTTPRequestHandler
    import io
    import base64
    import json
    import math
    BASIC_IMPORTS_OK = True
    BASIC_IMPORT_ERROR = None
except Exception as e:
    BASIC_IMPORTS_OK = False
    BASIC_IMPORT_ERROR = str(e)

try:
    from PIL import Image, ImageDraw, ImageSequence
    PIL_AVAILABLE = True
    PIL_ERROR = None
except ImportError as e:
    PIL_AVAILABLE = False
    PIL_ERROR = str(e)
except Exception as e:
    PIL_AVAILABLE = False
    PIL_ERROR = f"Unexpected PIL error: {str(e)}"

# フォールバック用の簡単なhandler関数（クラスベースが失敗した場合）
def handler_fallback(event, context):
    """
    関数ベースのフォールバック handler
    """
    return {
        'statusCode': 500,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'error': 'Handler class initialization failed',
            'basic_imports_ok': BASIC_IMPORTS_OK,
            'basic_import_error': BASIC_IMPORT_ERROR,
            'pil_available': PIL_AVAILABLE,
            'pil_error': PIL_ERROR
        }) if BASIC_IMPORTS_OK else '{"error": "Critical import failure"}'
    }

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """デバッグ用GETエンドポイント"""
        try:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
            self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            status_data = {
                'status': 'ok',
                'message': 'GIF Gaming API is running',
                'basic_imports_ok': BASIC_IMPORTS_OK,
                'basic_import_error': BASIC_IMPORT_ERROR,
                'pil_available': PIL_AVAILABLE,
                'pil_error': PIL_ERROR,
                'python_version': sys.version,
                'python_path': sys.path[:3],  # 最初の3つのパスのみ
                'timestamp': '2024-01-01T00:00:00Z'
            }
            
            if BASIC_IMPORTS_OK:
                response_data = json.dumps(status_data).encode('utf-8')
                self.wfile.write(response_data)
            else:
                # 基本importが失敗している場合の緊急対応
                error_text = f"Basic imports failed: {BASIC_IMPORT_ERROR}"
                self.wfile.write(error_text.encode('utf-8'))
                
        except Exception as e:
            # 最終的なフォールバック
            error_text = f"GET endpoint error: {str(e)}"
            try:
                self.wfile.write(error_text.encode('utf-8'))
            except:
                pass
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.end_headers()
    
    def do_POST(self):
        try:
            # 基本インポートのチェック
            if not BASIC_IMPORTS_OK:
                error_response = {
                    'error': 'Basic Python libraries are not available',
                    'details': BASIC_IMPORT_ERROR
                }
                self.send_error_response(error_response, 500)
                return
            
            # PILの可用性をチェック
            if not PIL_AVAILABLE:
                error_response = {
                    'error': 'PIL (Pillow) library is not available',
                    'details': PIL_ERROR
                }
                self.send_error_response(error_response, 500)
                return
            
            # リクエストボディを読み取り
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            
            if not post_data:
                error_response = {'error': 'リクエストデータが空です'}
                self.send_error_response(error_response, 400)
                return
            
            # JSONデータをパース
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError as e:
                error_response = {'error': 'JSONデータの解析に失敗しました', 'details': str(e)}
                self.send_error_response(error_response, 400)
                return
            
            gif_data = request_data.get('gifData')
            settings = request_data.get('settings', {})
            
            if not gif_data:
                error_response = {'error': 'GIFデータが見つかりません'}
                self.send_error_response(error_response, 400)
                return

            
            # Base64デコード
            if gif_data.startswith('data:'):
                gif_data = gif_data.split(',')[1]
            
            gif_bytes = base64.b64decode(gif_data)
            
            # PILでGIF解析
            gif_image = Image.open(io.BytesIO(gif_bytes))
            
            frames = []
            durations = []
            
            # より確実なGIFフレーム抽出
            try:
                
                # フレーム数を確認
                total_frames = getattr(gif_image, 'n_frames', 1)
                
                # アニメーションGIFでない場合も適切に処理
                if not getattr(gif_image, 'is_animated', False):
                    total_frames = 1
                
                
                # フレーム抽出
                if total_frames > 1:
                    frames, durations = self.extract_frames_method1(gif_image, total_frames)
                
                # フレーム抽出が失敗した場合は代替方法
                if len(frames) <= 1 and total_frames > 1:
                    try:
                        frames, durations = self.extract_frames_method2(gif_bytes)
                    except Exception as method2_error:
                
                # フォールバック
                if len(frames) == 0:
                    gif_image.seek(0)
                    single_frame = gif_image.convert('RGBA')
                    frames = [single_frame]
                    durations = [100]
                
                
            except Exception as extraction_error:
                # フォールバック: 最初のフレームのみ
                try:
                    gif_image.seek(0)
                    first_frame = gif_image.convert('RGBA')
                    frames = [first_frame]
                    durations = [100]
                except Exception as fallback_error:
                    error_response = {'error': 'フレーム抽出に失敗しました', 'details': str(fallback_error)}
                    self.send_error_response(error_response, 500)
                    return
            
            
            if len(frames) == 0:
                error_response = {'error': 'フレームが検出されませんでした'}
                self.send_error_response(error_response, 400)
                return
            
            # 各フレームにゲーミング効果を適用（フレーム数に基づく同期）
            processed_frames = []
            
            # フレーム同期: エフェクト1周期をGIF全体で完結させる
            effect_cycle_frames = len(frames)
            
            # キャンバスサイズを取得（ゲーミングテキスト生成のキャンバスサイズに合わせる）
            canvas_width = settings.get('canvasWidth', 800)
            canvas_height = settings.get('canvasHeight', 600)
            
            for i, frame in enumerate(frames):
                # フレーム進行度を0-1の範囲で計算（完全同期）
                frame_progress = i / effect_cycle_frames if effect_cycle_frames > 1 else 0
                
                # フレームをキャンバスサイズにリサイズ
                resized_frame = self.resize_frame_to_canvas(frame, canvas_width, canvas_height)
                
                processed_frame = self.apply_gaming_effect(resized_frame, i, len(frames), settings, frame_progress)
                processed_frames.append(processed_frame)
                if i < 5 or i % 5 == 0:
            
            # GIF保存
            output_buffer = io.BytesIO()
            
            # 最初のフレームでGIFを初期化
            processed_frames[0].save(
                output_buffer,
                format='GIF',
                save_all=True,
                append_images=processed_frames[1:],
                duration=durations,
                loop=0,
                optimize=False,
                disposal=2
            )
            
            # 結果をBase64エンコード
            output_buffer.seek(0)
            output_bytes = output_buffer.getvalue()
            output_base64 = base64.b64encode(output_bytes).decode('utf-8')
            
            
            # 成功レスポンス
            response = {
                'success': True,
                'gifData': f'data:image/gif;base64,{output_base64}',
                'frameCount': len(frames),
                'size': len(output_bytes)
            }
            
            self.send_success_response(response)
            
        except Exception as error:
            import traceback
            error_traceback = traceback.format_exc()
            
            error_response = {
                'error': 'GIF処理に失敗しました',
                'details': str(error),
                'traceback': error_traceback.split('\n')[-3:-1] if error_traceback else []
            }
            self.send_error_response(error_response, 500)
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response_data = json.dumps(data).encode('utf-8')
        self.wfile.write(response_data)
    
    def send_error_response(self, data, status_code):
        self.send_response(status_code)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response_data = json.dumps(data).encode('utf-8')
        self.wfile.write(response_data)
    
    def extract_frames_method1(self, gif_image, total_frames):
        """標準的なフレーム抽出方法"""
        frames = []
        durations = []
        
        for frame_index in range(total_frames):
            try:
                gif_image.seek(frame_index)
                duration = gif_image.info.get('duration', 100)
                current_frame = gif_image.convert('RGBA')
                
                frames.append(current_frame)
                durations.append(duration)
                
                
            except Exception as frame_error:
                break
        
        return frames, durations
    
    def extract_frames_method2(self, gif_bytes):
        """代替フレーム抽出方法"""
        gif_image = Image.open(io.BytesIO(gif_bytes))
        frames = []
        durations = []
        
        
        for i, frame in enumerate(ImageSequence.Iterator(gif_image)):
            try:
                duration = frame.info.get('duration', 100)
                rgba_frame = frame.convert('RGBA')
                
                frames.append(rgba_frame)
                durations.append(duration)
                
                
                if i >= 100:  # フレーム数制限
                    break
                    
            except Exception as frame_error:
                break
        
        return frames, durations
    
    def apply_gaming_effect(self, frame, frame_index, total_frames, settings, frame_progress=None):
        """ゲーミング効果をフレームに適用（透過部分を除く、フレーム同期）"""
        animation_type = settings.get('animationType', 'rainbow')
        speed = settings.get('speed', 5)
        saturation = settings.get('saturation', 100)
        concentration_lines = settings.get('concentrationLines', False)
        
        # フレーム同期されたアニメーション進行度
        if frame_progress is not None:
            # GIFのフレーム数に基づいて1周期で完結するように調整
            progress = frame_progress * speed * 10  # speed倍率でエフェクト速度調整
        else:
            # 従来の方式（フォールバック）
            progress = (frame_index / total_frames) * speed
        
        # 結果画像を作成
        result = Image.new('RGBA', frame.size)
        width, height = frame.size
        
        # 高速化: エフェクトオーバーレイを作成してアルファブレンド
        overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # エフェクト別の描画
        if animation_type == 'rainbow':
            # クライアントサイドと完全同じRGBグラデーション処理を使用
            frame_array = list(frame.getdata())
            result_pixels = []
            
            # クライアントサイドと同じ虹色パレット
            gaming_colors = [
                [255, 0, 0],     # 赤
                [255, 128, 0],   # オレンジ
                [255, 255, 0],   # 黄
                [0, 255, 0],     # 緑
                [0, 128, 255],   # 青
                [64, 0, 255],    # 藍
                [128, 0, 255]    # 紫
            ]
            
            # 彩度調整
            if saturation != 100:
                saturation_factor = saturation / 100.0
                gaming_colors = [
                    [
                        int(r * saturation_factor + 128 * (1 - saturation_factor)),
                        int(g * saturation_factor + 128 * (1 - saturation_factor)),
                        int(b * saturation_factor + 128 * (1 - saturation_factor))
                    ] for r, g, b in gaming_colors
                ]
            
            # 時間正規化とカラーシフト（クライアントサイドと同じ）
            normalized_time = (progress % 1 + 1) % 1  # 0-1の範囲
            color_shift = normalized_time * len(gaming_colors)
            
            # グラデーション設定（クライアントサイドから取得）
            gradient_direction = settings.get('gradientDirection', 'horizontal')
            gradient_density = settings.get('gradientDensity', 7.0)
            
            # 彩度レベル（クライアントサイド準拠）
            saturation_level = saturation / 100.0
            
            for i, pixel in enumerate(frame_array):
                if len(pixel) == 4 and pixel[3] == 0:  # 透過
                    result_pixels.append((0, 0, 0, 0))
                else:
                    # ピクセル位置計算
                    x = i % width
                    y = i // width
                    
                    # 元画像の色を取得
                    original_r, original_g, original_b = pixel[0], pixel[1], pixel[2]
                    original_a = pixel[3] if len(pixel) == 4 else 255
                    
                    # グラデーション方向に基づく位置計算（クライアントサイドと同じ）
                    if gradient_direction == 'horizontal':
                        position = x / width
                    elif gradient_direction == 'vertical':
                        position = y / height
                    elif gradient_direction == 'diagonal1':  # 左上から右下
                        center_x, center_y = width / 2, height / 2
                        position = ((x - center_x) + (y - center_y) + width + height) / (2 * (width + height))
                    elif gradient_direction == 'diagonal2':  # 右上から左下
                        center_x, center_y = width / 2, height / 2
                        position = ((center_x - x) + (y - center_y) + width + height) / (2 * (width + height))
                    else:
                        position = x / width  # デフォルトは水平
                    
                    # グラデーション密度を適用してカラーインデックスを計算
                    color_float = (position * gradient_density + color_shift) % len(gaming_colors)
                    color_index = int(abs(color_float)) % len(gaming_colors)
                    next_color_index = (color_index + 1) % len(gaming_colors)
                    
                    # 線形補間のブレンド率
                    blend = max(0, min(1, color_float - math.floor(color_float)))
                    
                    # 隣接色間の線形補間
                    color1 = gaming_colors[color_index]
                    color2 = gaming_colors[next_color_index]
                    
                    blended_color = [
                        round(color1[0] + (color2[0] - color1[0]) * blend),
                        round(color1[1] + (color2[1] - color1[1]) * blend),
                        round(color1[2] + (color2[2] - color1[2]) * blend)
                    ]
                    
                    # 元画像の輝度を計算（重み付きRGB）
                    original_luminance = (original_r * 0.299 + original_g * 0.587 + original_b * 0.114) / 255
                    
                    # 輝度強化（40%ブースト + 30%最小値）
                    adjusted_luminance = max(0.3, min(1.0, original_luminance * 1.4))
                    
                    # 虹色に輝度を適用
                    target_r = blended_color[0] * adjusted_luminance
                    target_g = blended_color[1] * adjusted_luminance
                    target_b = blended_color[2] * adjusted_luminance
                    
                    # 彩度レベルに基づいて元画像とブレンド
                    final_r = target_r * saturation_level + original_r * (1 - saturation_level)
                    final_g = target_g * saturation_level + original_g * (1 - saturation_level)
                    final_b = target_b * saturation_level + original_b * (1 - saturation_level)
                    
                    # RGB範囲にクランプ
                    final_r = max(0, min(255, round(final_r)))
                    final_g = max(0, min(255, round(final_g)))
                    final_b = max(0, min(255, round(final_b)))
                    
                    result_pixels.append((final_r, final_g, final_b, original_a))
            
            # 直接フレームを変更
            result = Image.new('RGBA', frame.size)
            result.putdata(result_pixels)
            return result
                    
        elif animation_type == 'golden':
            for x in range(0, width, 2):
                effect_color = self.get_golden_color(x, 0, width, height, progress)
                color = (*effect_color, 200)  # アルファ値を上げて色味を強化
                draw.line([(x, 0), (x, height)], fill=color)
                if x + 1 < width:
                    draw.line([(x + 1, 0), (x + 1, height)], fill=color)
                    
        elif animation_type == 'bluepurplepink':
            for x in range(0, width, 2):
                effect_color = self.get_blue_purple_pink_color(x, 0, width, height, progress)
                color = (*effect_color, 200)  # アルファ値を上げて色味を強化
                draw.line([(x, 0), (x, height)], fill=color)
                if x + 1 < width:
                    draw.line([(x + 1, 0), (x + 1, height)], fill=color)
                    
        elif animation_type == 'rainbowPulse':
            # rainbowPulseは特別に高速化
            for x in range(0, width, 4):  # ステップ4で更に高速化
                effect_color = self.get_rainbow_pulse_color(x, height//2, width, height, progress, saturation)
                color = (*effect_color, 120)  # アルファ値を下げて軽量化
                for dx in range(4):
                    if x + dx < width:
                        draw.line([(x + dx, 0), (x + dx, height)], fill=color)
        else:
            # その他のエフェクトはピクセル単位処理（高速化版）
            frame_array = list(frame.getdata())
            overlay_pixels = []
            
            for i, pixel in enumerate(frame_array):
                x = i % width
                y = i // width
                
                if len(pixel) == 4 and pixel[3] == 0:  # 透過
                    overlay_pixels.append((0, 0, 0, 0))
                else:
                    if animation_type == 'concentration':
                        effect_color = self.get_concentration_color(x, y, width, height, progress)
                    elif animation_type == 'pulse':
                        effect_color = self.get_pulse_color(x, y, width, height, progress, saturation)
                    else:
                        effect_color = self.get_rainbow_color(x, y, width, height, progress, saturation)
                    
                    overlay_pixels.append((*effect_color, 220))  # アルファ値を更に強化
            
            overlay.putdata(overlay_pixels)
        
        # 高速アルファブレンド
        try:
            # フレームとマスクを作成
            frame_mask = Image.new('L', frame.size, 0)
            if frame.mode == 'RGBA':
                frame_mask = frame.split()[3]  # アルファチャンネル
            else:
                frame_mask = Image.new('L', frame.size, 255)  # 完全不透明
                
            # エフェクトマスクを作成（透過部分を除外）
            effect_mask = Image.new('L', frame.size, 0)
            effect_pixels = []
            for i, pixel in enumerate(frame.getdata()):
                if len(pixel) == 4 and pixel[3] == 0:
                    effect_pixels.append(0)  # 透過部分は効果なし
                else:
                    effect_pixels.append(int(255 * 0.8))  # 80%の強度（静止画と統一）
            effect_mask.putdata(effect_pixels)
            
            # 最終合成
            result = Image.composite(overlay, frame, effect_mask)
            return result
            
        except Exception as e:
            # フォールバック: シンプルなアルファブレンド
            return Image.alpha_composite(frame, overlay)
        
        return result
    
    def get_rainbow_color(self, x, y, width, height, progress, saturation):
        """虹色エフェクト計算（フレーム同期）"""
        # フレーム同期: 1周期で360度完結
        hue = int((x / width * 360 + progress * 360) % 360)
        saturation_val = min(255, int(saturation * 2.55))
        
        # HSVからRGBに変換
        h = hue / 60.0
        c = saturation_val
        x_val = int(c * (1 - abs((h % 2) - 1)))
        
        if 0 <= h < 1:
            r, g, b = c, x_val, 0
        elif 1 <= h < 2:
            r, g, b = x_val, c, 0
        elif 2 <= h < 3:
            r, g, b = 0, c, x_val
        elif 3 <= h < 4:
            r, g, b = 0, x_val, c
        elif 4 <= h < 5:
            r, g, b = x_val, 0, c
        else:
            r, g, b = c, 0, x_val
        
        return (r, g, b)
    
    def get_golden_color(self, x, y, width, height, progress):
        """金ピカエフェクト計算（フレーム同期）"""
        base_hue = 45
        # フレーム同期: 1周期で完結
        hue_variation = int(math.sin(progress * 2 * math.pi + x * 0.02) * 20)
        
        lightness = int(127 + math.sin(progress * 4 * math.pi + x * 0.02) * 50)
        
        r = min(255, lightness + 50)
        g = min(255, lightness)
        b = max(0, lightness - 100)
        
        return (r, g, b)
    
    def get_concentration_color(self, x, y, width, height, progress):
        """集中線エフェクト計算（フレーム同期）"""
        center_x = width / 2
        center_y = height / 2
        
        # 中心からの角度
        angle = math.atan2(y - center_y, x - center_x)
        distance = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
        
        # フレーム同期: 集中線パターン
        line_intensity = abs(math.sin(angle * 8 + progress * 2 * math.pi))
        fade = max(0, 1 - distance / max(width, height))
        
        intensity = int(line_intensity * fade * 255)
        
        # 白い集中線
        return (intensity, intensity, intensity)
    
    def get_blue_purple_pink_color(self, x, y, width, height, progress):
        """ピンク・青グラデーション効果計算（フレーム同期）"""
        # フレーム同期: 横方向のグラデーション位置
        pos = (x / width + progress) % 1.0
        
        if pos < 0.33:
            # 青からピンクへ
            t = pos / 0.33
            r = int(100 + t * 155)  # 100 -> 255
            g = int(150 * (1 - t))  # 150 -> 0
            b = int(255 - t * 100)  # 255 -> 155
        elif pos < 0.66:
            # ピンクから紫へ
            t = (pos - 0.33) / 0.33
            r = int(255 - t * 100)  # 255 -> 155
            g = int(t * 100)        # 0 -> 100
            b = int(155 + t * 100)  # 155 -> 255
        else:
            # 紫から青へ
            t = (pos - 0.66) / 0.34
            r = int(155 - t * 55)   # 155 -> 100
            g = int(100 + t * 50)   # 100 -> 150
            b = 255                 # 255
        
        return (r, g, b)
    
    def get_pulse_color(self, x, y, width, height, progress, saturation):
        """パルス効果計算（フレーム同期）"""
        # 中心からの距離でパルス効果
        center_x = width / 2
        center_y = height / 2
        distance = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
        max_distance = math.sqrt(center_x ** 2 + center_y ** 2)
        
        # フレーム同期: パルス波
        pulse = abs(math.sin(progress * 2 * math.pi * 3 - distance / max_distance * 6))
        
        # 虹色をベースにパルス強度を適用（フレーム同期）
        hue = int((distance / max_distance * 360 + progress * 360) % 360)
        intensity = int(pulse * saturation * 2.55)
        
        # HSVからRGB変換（簡易版）
        h = hue / 60.0
        c = intensity
        x_val = int(c * (1 - abs((h % 2) - 1)))
        
        if 0 <= h < 1:
            r, g, b = c, x_val, 0
        elif 1 <= h < 2:
            r, g, b = x_val, c, 0
        elif 2 <= h < 3:
            r, g, b = 0, c, x_val
        elif 3 <= h < 4:
            r, g, b = 0, x_val, c
        elif 4 <= h < 5:
            r, g, b = x_val, 0, c
        else:
            r, g, b = c, 0, x_val
        
        return (r, g, b)
    
    def get_rainbow_pulse_color(self, x, y, width, height, progress, saturation):
        """レインボーパルス効果計算（フレーム同期・最適化版）"""
        # 高速化: 虹色計算を簡略化
        hue = int((x / width * 360 + progress * 360) % 360)
        saturation_val = min(255, int(saturation * 2.55))
        
        # 高速化: パルス効果の計算を簡略化
        center_x = width / 2
        center_y = height / 2
        # 距離計算を簡略化
        distance_norm = abs(x - center_x) / center_x + abs(y - center_y) / center_y
        
        # フレーム同期: パルス効果（計算を簡略化）
        pulse = abs(math.sin(progress * 2 * math.pi * 2 - distance_norm * 4)) * 0.5 + 0.5
        
        # HSVからRGBに変換（最適化版）
        h = hue / 60.0
        c = int(saturation_val * pulse)
        x_val = int(c * (1 - abs((h % 2) - 1)))
        
        if 0 <= h < 1:
            r, g, b = c, x_val, 0
        elif 1 <= h < 2:
            r, g, b = x_val, c, 0
        elif 2 <= h < 3:
            r, g, b = 0, c, x_val
        elif 3 <= h < 4:
            r, g, b = 0, x_val, c
        elif 4 <= h < 5:
            r, g, b = x_val, 0, c
        else:
            r, g, b = c, 0, x_val
        
        return (r, g, b)
    
    def resize_frame_to_canvas(self, frame, canvas_width, canvas_height):
        """フレームをキャンバスサイズに合わせてリサイズ"""
        # アスペクト比を保持してリサイズ
        frame_width, frame_height = frame.size
        frame_aspect = frame_width / frame_height
        canvas_aspect = canvas_width / canvas_height
        
        if canvas_aspect > frame_aspect:
            # キャンバスが横長の場合、高さを基準にリサイズ
            new_height = canvas_height
            new_width = int(new_height * frame_aspect)
        else:
            # キャンバスが縦長の場合、幅を基準にリサイズ
            new_width = canvas_width
            new_height = int(new_width / frame_aspect)
        
        # リサイズしてキャンバスサイズの画像を作成
        resized_frame = frame.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # キャンバスサイズの透明背景を作成
        canvas_frame = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))
        
        # 中央に配置
        x_offset = (canvas_width - new_width) // 2
        y_offset = (canvas_height - new_height) // 2
        canvas_frame.paste(resized_frame, (x_offset, y_offset), resized_frame if resized_frame.mode == 'RGBA' else None)
        
        return canvas_frame
    
    def rgb_to_hsl(self, r, g, b):
        """RGBからHSLに変換（クライアントサイドと同じロジック）"""
        r, g, b = r / 255.0, g / 255.0, b / 255.0
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        diff = max_val - min_val
        
        # 明度
        lightness = (max_val + min_val) / 2.0
        
        if diff == 0:
            hue = 0
            saturation = 0
        else:
            # 彩度
            if lightness < 0.5:
                saturation = diff / (max_val + min_val)
            else:
                saturation = diff / (2.0 - max_val - min_val)
            
            # 色相
            if max_val == r:
                hue = (g - b) / diff + (6 if g < b else 0)
            elif max_val == g:
                hue = (b - r) / diff + 2
            else:
                hue = (r - g) / diff + 4
            hue /= 6.0
        
        return (hue, saturation, lightness)
    
    def hsl_to_rgb(self, h, s, l):
        """HSLからRGBに変換（クライアントサイドと同じロジック）"""
        if s == 0:
            r = g = b = l  # 無彩色
        else:
            def hue_to_rgb(p, q, t):
                if t < 0:
                    t += 1
                if t > 1:
                    t -= 1
                if t < 1/6:
                    return p + (q - p) * 6 * t
                if t < 1/2:
                    return q
                if t < 2/3:
                    return p + (q - p) * (2/3 - t) * 6
                return p
            
            if l < 0.5:
                q = l * (1 + s)
            else:
                q = l + s - l * s
            p = 2 * l - q
            
            r = hue_to_rgb(p, q, h + 1/3)
            g = hue_to_rgb(p, q, h)
            b = hue_to_rgb(p, q, h - 1/3)
        
        return (
            max(0, min(255, round(r * 255))),
            max(0, min(255, round(g * 255))),
            max(0, min(255, round(b * 255)))
        )