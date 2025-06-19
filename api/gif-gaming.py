"""
Vercel Function for GIF Gaming Effect Processing (Python版)
PILを使用した確実なGIFフレーム処理
"""

import json
import base64
import io
import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # CORS設定
            self.send_response(200)
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
            self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            # リクエストデータ取得
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            print("🚀 GIF Gaming処理開始")
            
            gif_data = request_data.get('gifData')
            settings = request_data.get('settings', {})
            
            if not gif_data:
                self.wfile.write(json.dumps({'error': 'GIFデータが見つかりません'}).encode())
                return

            print("📊 設定:", settings)
            
            # Base64デコード
            if gif_data.startswith('data:'):
                gif_data = gif_data.split(',')[1]
            
            gif_bytes = base64.b64decode(gif_data)
            
            # PILでGIF解析
            print("🔍 GIF解析中...")
            gif_image = Image.open(io.BytesIO(gif_bytes))
            
            frames = []
            durations = []
            
            # 全フレームを抽出
            try:
                frame_count = 0
                while True:
                    # フレームをRGBAに変換
                    frame = gif_image.convert('RGBA')
                    frames.append(frame)
                    
                    # フレーム間隔を取得（ミリ秒）
                    duration = gif_image.info.get('duration', 100)
                    durations.append(duration)
                    
                    frame_count += 1
                    gif_image.seek(frame_count)
                    
            except EOFError:
                # 全フレーム読み込み完了
                pass
            
            print(f"📝 検出フレーム数: {len(frames)}")
            
            if len(frames) == 0:
                self.wfile.write(json.dumps({'error': 'フレームが検出されませんでした'}).encode())
                return
            
            # 各フレームにゲーミング効果を適用
            print("🎨 フレーム処理開始...")
            processed_frames = []
            
            for i, frame in enumerate(frames):
                processed_frame = apply_gaming_effect(frame, i, len(frames), settings)
                processed_frames.append(processed_frame)
                print(f"✅ フレーム {i + 1}/{len(frames)} 完了")
            
            # GIF保存
            print("💾 GIF生成中...")
            output_buffer = io.BytesIO()
            
            # 最初のフレームでGIFを初期化
            processed_frames[0].save(
                output_buffer,
                format='GIF',
                save_all=True,
                append_images=processed_frames[1:],
                duration=durations,
                loop=0,  # 無限ループ
                optimize=False,  # 品質優先
                disposal=2  # フレーム間でクリア
            )
            
            # 結果をBase64エンコード
            output_buffer.seek(0)
            output_bytes = output_buffer.getvalue()
            output_base64 = base64.b64encode(output_bytes).decode('utf-8')
            
            print("🎉 GIF生成完了")
            
            # レスポンス
            response = {
                'success': True,
                'gifData': f'data:image/gif;base64,{output_base64}',
                'frameCount': len(frames),
                'size': len(output_bytes)
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as error:
            print(f"❌ GIF処理エラー: {error}")
            import traceback
            traceback.print_exc()
            
            error_response = {
                'error': 'GIF処理に失敗しました',
                'details': str(error)
            }
            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        # プリフライトリクエスト対応
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.end_headers()


def apply_gaming_effect(frame, frame_index, total_frames, settings):
    """ゲーミング効果をフレームに適用"""
    animation_type = settings.get('animationType', 'rainbow')
    speed = settings.get('speed', 5)
    saturation = settings.get('saturation', 100)
    
    # アニメーション進行度
    progress = (frame_index / total_frames) * speed
    
    # エフェクトオーバーレイを作成
    overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    width, height = frame.size
    
    if animation_type == 'rainbow':
        # 虹色グラデーション
        for x in range(width):
            # 横方向のグラデーション + アニメーション
            hue = int((x / width * 360 + progress * 36) % 360)
            saturation_val = min(255, int(saturation * 2.55))
            
            # HSVからRGBに変換（簡易版）
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
            
            # 縦線を描画
            color = (r, g, b, 150)  # 透明度150
            draw.line([(x, 0), (x, height)], fill=color)
    
    elif animation_type == 'golden':
        # 金ピカグラデーション
        for x in range(width):
            # 金色系のグラデーション
            base_hue = 45  # 金色
            hue_variation = int(math.sin(progress + x * 0.02) * 20)
            final_hue = (base_hue + hue_variation) % 360
            
            # 明度変化
            lightness = int(127 + math.sin(progress * 2 + x * 0.02) * 50)
            
            # 簡易HSLからRGB変換
            r = min(255, lightness + 50)
            g = min(255, lightness)
            b = max(0, lightness - 100)
            
            color = (r, g, b, 150)
            draw.line([(x, 0), (x, height)], fill=color)
    
    # スクリーンブレンドモード的な合成
    # PILではMultiplyやScreenモードが限定的なので、手動で計算
    result = Image.new('RGBA', frame.size)
    
    for y in range(height):
        for x in range(width):
            # 元フレームのピクセル
            orig_pixel = frame.getpixel((x, y))
            overlay_pixel = overlay.getpixel((x, y))
            
            if len(orig_pixel) == 4:
                orig_r, orig_g, orig_b, orig_a = orig_pixel
            else:
                orig_r, orig_g, orig_b = orig_pixel
                orig_a = 255
            
            overlay_r, overlay_g, overlay_b, overlay_a = overlay_pixel
            
            # スクリーンブレンド効果
            if overlay_a > 0:
                # アルファ合成
                alpha = overlay_a / 255.0 * 0.6  # 透明度調整
                
                # スクリーンブレンド: 1 - (1-A) * (1-B)
                new_r = int(255 - (255 - orig_r) * (255 - overlay_r) / 255)
                new_g = int(255 - (255 - orig_g) * (255 - overlay_g) / 255)
                new_b = int(255 - (255 - orig_b) * (255 - overlay_b) / 255)
                
                # アルファブレンド
                final_r = int(orig_r * (1 - alpha) + new_r * alpha)
                final_g = int(orig_g * (1 - alpha) + new_g * alpha)
                final_b = int(orig_b * (1 - alpha) + new_b * alpha)
                
                result.putpixel((x, y), (final_r, final_g, final_b, orig_a))
            else:
                result.putpixel((x, y), (orig_r, orig_g, orig_b, orig_a))
    
    return result