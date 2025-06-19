"""
Vercel Function for GIF Gaming Effect Processing (Python版)
PILを使用した確実なGIFフレーム処理
"""

import json
import base64
import io
import math
from PIL import Image, ImageDraw

def handler(request):
    # CORS ヘッダー
    headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
        'Content-Type': 'application/json'
    }
    
    if request.method == 'OPTIONS':
        return ('', 200, headers)
    
    if request.method != 'POST':
        return (json.dumps({'error': 'Method not allowed'}), 405, headers)
    
    try:
        # リクエストデータ取得
        request_data = request.get_json()
        
        print("🚀 GIF Gaming処理開始")
        
        gif_data = request_data.get('gifData')
        settings = request_data.get('settings', {})
        
        if not gif_data:
            return (json.dumps({'error': 'GIFデータが見つかりません'}), 400, headers)

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
        
        # より簡単で確実なGIFフレーム抽出（イテレーター使用）
        try:
            print(f"📐 GIFサイズ: {gif_image.width}x{gif_image.height}")
            print(f"🔍 GIF情報: format={gif_image.format}, mode={gif_image.mode}")
            print(f"🎬 is_animated: {getattr(gif_image, 'is_animated', False)}")
            print(f"📈 n_frames: {getattr(gif_image, 'n_frames', 1)}")
            
            # フレーム数を確認
            total_frames = getattr(gif_image, 'n_frames', 1)
            print(f"📊 総フレーム数: {total_frames}")
            
            # 各フレームを順次処理
            for frame_index in range(total_frames):
                try:
                    # フレームにシーク
                    gif_image.seek(frame_index)
                    
                    # フレーム情報を取得
                    duration = gif_image.info.get('duration', 100)
                    disposal = gif_image.info.get('disposal', 0)
                    
                    print(f"🎞️ フレーム {frame_index}: duration={duration}ms, disposal={disposal}, mode={gif_image.mode}")
                    
                    # フレームをRGBA形式で取得
                    current_frame = gif_image.convert('RGBA')
                    
                    # 最初のフレームの場合、または単純にコピー
                    if frame_index == 0 or total_frames == 1:
                        final_frame = current_frame.copy()
                    else:
                        # 後続フレームは前フレームとの差分を考慮
                        # 単純な方法: 直接使用（disposal methodは後で対応）
                        final_frame = current_frame.copy()
                    
                    frames.append(final_frame)
                    durations.append(duration)
                    
                    print(f"✅ フレーム {frame_index} 処理完了: {final_frame.size}")
                    
                except Exception as frame_error:
                    print(f"⚠️ フレーム {frame_index} 処理エラー: {frame_error}")
                    # フレーム処理に失敗した場合、前フレームをコピー
                    if frames:
                        frames.append(frames[-1].copy())
                        durations.append(durations[-1] if durations else 100)
                    break
            
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
                raise fallback_error
        
        print(f"📝 検出フレーム数: {len(frames)}")
        
        if len(frames) == 0:
            return (json.dumps({'error': 'フレームが検出されませんでした'}), 400, headers)
        
        # フレーム重複チェック（デバッグ用）
        print("🔍 フレーム差分チェック...")
        for i in range(min(5, len(frames))):  # 最初の5フレームをチェック
            if i > 0:
                # フレーム間の差分を計算
                diff_pixels = 0
                total_pixels = frames[i].width * frames[i].height
                for y in range(frames[i].height):
                    for x in range(frames[i].width):
                        if frames[i].getpixel((x, y)) != frames[i-1].getpixel((x, y)):
                            diff_pixels += 1
                diff_percentage = (diff_pixels / total_pixels) * 100
                print(f"📊 フレーム {i-1} vs {i}: {diff_pixels}/{total_pixels} 画素 ({diff_percentage:.1f}%) の差分")
                
                # フレーム内容の詳細確認
                if i <= 2:  # 最初の2フレームの詳細分析
                    frame_info = analyze_frame_content(frames[i])
                    print(f"🎞️ フレーム {i} 内容: {frame_info}")
        
        # 各フレームにゲーミング効果を適用
        print("🎨 フレーム処理開始...")
        processed_frames = []
        
        for i, frame in enumerate(frames):
            processed_frame = apply_gaming_effect(frame, i, len(frames), settings)
            processed_frames.append(processed_frame)
            if i < 5 or i % 5 == 0:  # 最初の5フレームまたは5フレームごとに出力
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
        
        return (json.dumps(response), 200, headers)
        
    except Exception as error:
        print(f"❌ GIF処理エラー: {error}")
        import traceback
        error_traceback = traceback.format_exc()
        print(f"📍 詳細エラー情報:\n{error_traceback}")
        
        # エラー箇所の特定
        if "seek" in str(error).lower():
            error_type = "GIFフレームシーク失敗"
        elif "save" in str(error).lower():
            error_type = "GIF保存失敗"
        elif "memory" in str(error).lower():
            error_type = "メモリ不足"
        elif "pillow" in str(error).lower() or "pil" in str(error).lower():
            error_type = "PIL/Pillowライブラリエラー"
        else:
            error_type = "不明なエラー"
        
        error_response = {
            'error': 'GIF処理に失敗しました',
            'error_type': error_type,
            'details': str(error),
            'traceback': error_traceback.split('\n')[-3:-1] if error_traceback else []
        }
        return (json.dumps(error_response), 500, headers)


def analyze_frame_content(frame):
    """フレームの内容を分析してデバッグ情報を返す"""
    width, height = frame.size
    
    # 色の分布を確認
    colors = {}
    for y in range(0, height, max(1, height//10)):  # サンプリング
        for x in range(0, width, max(1, width//10)):
            pixel = frame.getpixel((x, y))
            if len(pixel) == 4:
                r, g, b, a = pixel
                if a > 0:  # 透明でない
                    color_key = f"rgb({r},{g},{b})"
                    colors[color_key] = colors.get(color_key, 0) + 1
            else:
                r, g, b = pixel
                color_key = f"rgb({r},{g},{b})"
                colors[color_key] = colors.get(color_key, 0) + 1
    
    # 主要色を取得
    top_colors = sorted(colors.items(), key=lambda x: x[1], reverse=True)[:3]
    return f"size={width}x{height}, top_colors={top_colors}"


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
    
    # 高速化: PIL Image.blend を使用したスクリーンブレンド
    try:
        # オーバーレイのアルファを調整
        overlay_adjusted = Image.new('RGBA', frame.size)
        overlay_pixels = overlay.load()
        overlay_adj_pixels = overlay_adjusted.load()
        
        for y in range(height):
            for x in range(width):
                r, g, b, a = overlay_pixels[x, y]
                # アルファ値を0.6倍に調整
                new_alpha = int(a * 0.6)
                overlay_adj_pixels[x, y] = (r, g, b, new_alpha)
        
        # PIL の composite を使用して高速合成
        result = Image.alpha_composite(frame, overlay_adjusted)
        return result
        
    except Exception as e:
        print(f"⚠️ 高速合成失敗、フォールバックします: {e}")
        # フォールバック: 元の手動実装
        result = Image.new('RGBA', frame.size)
        
        for y in range(height):
            for x in range(width):
                orig_pixel = frame.getpixel((x, y))
                overlay_pixel = overlay.getpixel((x, y))
                
                if len(orig_pixel) == 4:
                    orig_r, orig_g, orig_b, orig_a = orig_pixel
                else:
                    orig_r, orig_g, orig_b = orig_pixel
                    orig_a = 255
                
                overlay_r, overlay_g, overlay_b, overlay_a = overlay_pixel
                
                if overlay_a > 0:
                    alpha = overlay_a / 255.0 * 0.6
                    new_r = int(255 - (255 - orig_r) * (255 - overlay_r) / 255)
                    new_g = int(255 - (255 - orig_g) * (255 - overlay_g) / 255)
                    new_b = int(255 - (255 - orig_b) * (255 - overlay_b) / 255)
                    
                    final_r = int(orig_r * (1 - alpha) + new_r * alpha)
                    final_g = int(orig_g * (1 - alpha) + new_g * alpha)
                    final_b = int(orig_b * (1 - alpha) + new_b * alpha)
                    
                    result.putpixel((x, y), (final_r, final_g, final_b, orig_a))
                else:
                    result.putpixel((x, y), (orig_r, orig_g, orig_b, orig_a))
        
        return result