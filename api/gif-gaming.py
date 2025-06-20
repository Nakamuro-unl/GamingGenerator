"""
GIFアニメーションにゲーミング効果を適用するAPI
"""

from http.server import BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageSequence
import io
import base64
import json
import math

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.end_headers()
    
    def do_POST(self):
        try:
            print("🚀 GIF Gaming処理開始")
            
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
            
            # より確実なGIFフレーム抽出
            try:
                print(f"📐 GIFサイズ: {gif_image.width}x{gif_image.height}")
                print(f"🔍 GIF情報: format={gif_image.format}, mode={gif_image.mode}")
                print(f"🎬 is_animated: {getattr(gif_image, 'is_animated', False)}")
                print(f"📈 n_frames: {getattr(gif_image, 'n_frames', 1)}")
                
                # フレーム数を確認
                total_frames = getattr(gif_image, 'n_frames', 1)
                
                # アニメーションGIFでない場合も適切に処理
                if not getattr(gif_image, 'is_animated', False):
                    print("📸 静的GIFとして検出")
                    total_frames = 1
                
                print(f"📊 総フレーム数: {total_frames}")
                
                # フレーム抽出
                if total_frames > 1:
                    print("🔬 標準フレーム抽出")
                    frames, durations = self.extract_frames_method1(gif_image, total_frames)
                
                # フレーム抽出が失敗した場合は代替方法
                if len(frames) <= 1 and total_frames > 1:
                    print("🔬 代替フレーム抽出")
                    try:
                        frames, durations = self.extract_frames_method2(gif_bytes)
                    except Exception as method2_error:
                        print(f"⚠️ 代替方法失敗: {method2_error}")
                
                # フォールバック
                if len(frames) == 0:
                    print("🔄 フォールバック: 単一フレーム処理")
                    gif_image.seek(0)
                    single_frame = gif_image.convert('RGBA')
                    frames = [single_frame]
                    durations = [100]
                
                print(f"📹 フレーム抽出完了: {len(frames)} フレーム検出")
                
            except Exception as extraction_error:
                print(f"❌ フレーム抽出エラー: {extraction_error}")
                # フォールバック: 最初のフレームのみ
                try:
                    gif_image.seek(0)
                    first_frame = gif_image.convert('RGBA')
                    frames = [first_frame]
                    durations = [100]
                    print("🔄 フォールバック: 最初のフレームのみ使用")
                except Exception as fallback_error:
                    print(f"❌ フォールバックも失敗: {fallback_error}")
                    error_response = {'error': 'フレーム抽出に失敗しました', 'details': str(fallback_error)}
                    self.send_error_response(error_response, 500)
                    return
            
            print(f"📝 検出フレーム数: {len(frames)}")
            
            if len(frames) == 0:
                error_response = {'error': 'フレームが検出されませんでした'}
                self.send_error_response(error_response, 400)
                return
            
            # 各フレームにゲーミング効果を適用
            print("🎨 フレーム処理開始...")
            processed_frames = []
            
            for i, frame in enumerate(frames):
                processed_frame = self.apply_gaming_effect(frame, i, len(frames), settings)
                processed_frames.append(processed_frame)
                if i < 5 or i % 5 == 0:
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
                loop=0,
                optimize=False,
                disposal=2
            )
            
            # 結果をBase64エンコード
            output_buffer.seek(0)
            output_bytes = output_buffer.getvalue()
            output_base64 = base64.b64encode(output_bytes).decode('utf-8')
            
            print("🎉 GIF生成完了")
            
            # 成功レスポンス
            response = {
                'success': True,
                'gifData': f'data:image/gif;base64,{output_base64}',
                'frameCount': len(frames),
                'size': len(output_bytes)
            }
            
            self.send_success_response(response)
            
        except Exception as error:
            print(f"❌ GIF処理エラー: {error}")
            import traceback
            error_traceback = traceback.format_exc()
            print(f"📍 詳細エラー情報:\n{error_traceback}")
            
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
                
                print(f"✅ フレーム {frame_index} 処理完了: {current_frame.size}")
                
            except Exception as frame_error:
                print(f"⚠️ フレーム {frame_index} 処理エラー: {frame_error}")
                break
        
        return frames, durations
    
    def extract_frames_method2(self, gif_bytes):
        """代替フレーム抽出方法"""
        gif_image = Image.open(io.BytesIO(gif_bytes))
        frames = []
        durations = []
        
        print("🔄 ImageSequenceイテレーターを使用")
        
        for i, frame in enumerate(ImageSequence.Iterator(gif_image)):
            try:
                duration = frame.info.get('duration', 100)
                rgba_frame = frame.convert('RGBA')
                
                frames.append(rgba_frame)
                durations.append(duration)
                
                print(f"📊 フレーム {i}: {rgba_frame.size}, duration={duration}ms")
                
                if i >= 100:  # フレーム数制限
                    print("⚠️ フレーム数制限に達しました")
                    break
                    
            except Exception as frame_error:
                print(f"⚠️ フレーム {i} 処理エラー: {frame_error}")
                break
        
        return frames, durations
    
    def apply_gaming_effect(self, frame, frame_index, total_frames, settings):
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
                hue = int((x / width * 360 + progress * 36) % 360)
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
                
                color = (r, g, b, 150)
                draw.line([(x, 0), (x, height)], fill=color)
        
        elif animation_type == 'golden':
            # 金ピカグラデーション
            for x in range(width):
                base_hue = 45
                hue_variation = int(math.sin(progress + x * 0.02) * 20)
                final_hue = (base_hue + hue_variation) % 360
                
                lightness = int(127 + math.sin(progress * 2 + x * 0.02) * 50)
                
                r = min(255, lightness + 50)
                g = min(255, lightness)
                b = max(0, lightness - 100)
                
                color = (r, g, b, 150)
                draw.line([(x, 0), (x, height)], fill=color)
        
        # 高速合成
        try:
            result = Image.alpha_composite(frame, overlay)
            return result
        except Exception as e:
            print(f"⚠️ 高速合成失敗: {e}")
            return frame