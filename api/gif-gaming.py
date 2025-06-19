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
        
        # 最も確実なGIFフレーム抽出方法を実装
        try:
            # ベース画像のサイズを確定
            gif_width = gif_image.width
            gif_height = gif_image.height
            print(f"📐 GIFサイズ: {gif_width}x{gif_height}")
            
            # 背景色を取得（存在する場合）
            background = gif_image.info.get('background', 0)
            transparency = gif_image.info.get('transparency', None)
            
            # フレーム累積用のベース画像
            base_canvas = Image.new('RGBA', (gif_width, gif_height), (0, 0, 0, 0))
            
            frame_count = 0
            while True:
                # フレームにシーク
                gif_image.seek(frame_count)
                
                # フレーム情報を取得
                duration = gif_image.info.get('duration', 100)
                disposal = gif_image.info.get('disposal', 0)
                
                # フレームを完全な画像として構築
                if frame_count == 0:
                    # 最初のフレーム: 全体をコピー
                    current_frame = gif_image.convert('RGBA')
                    base_canvas = current_frame.copy()
                    final_frame = current_frame.copy()
                else:
                    # 後続フレーム: disposal methodに従って処理
                    current_frame = gif_image.convert('RGBA')
                    
                    if disposal == 1:
                        # Do not dispose: 前フレームを保持
                        working_canvas = base_canvas.copy()
                    elif disposal == 2:
                        # Restore to background: 背景色で初期化
                        working_canvas = Image.new('RGBA', (gif_width, gif_height), (0, 0, 0, 0))
                    elif disposal == 3:
                        # Restore to previous: 前フレームに戻す（簡易実装）
                        working_canvas = base_canvas.copy()
                    else:
                        # 不明な場合は保持
                        working_canvas = base_canvas.copy()
                    
                    # 現在のフレームを重ね合わせ
                    # 透明ピクセルを考慮して合成
                    for y in range(gif_height):
                        for x in range(gif_width):
                            pixel = current_frame.getpixel((x, y))
                            if len(pixel) == 4 and pixel[3] > 0:  # アルファ値が0でない
                                working_canvas.putpixel((x, y), pixel)
                            elif len(pixel) == 3:  # RGB（アルファなし）
                                # 透明色チェック
                                if transparency is None or pixel != transparency:
                                    working_canvas.putpixel((x, y), pixel + (255,))
                    
                    final_frame = working_canvas.copy()
                    
                    # 次フレーム用にベースを更新
                    if disposal != 2:  # 背景色復元でない場合のみ
                        base_canvas = final_frame.copy()
                
                frames.append(final_frame)
                durations.append(duration)
                
                print(f"🎞️ フレーム {frame_count}: duration={duration}ms, disposal={disposal}")
                
                frame_count += 1
                
        except EOFError:
            # 全フレーム読み込み完了
            print(f"📹 GIF解析完了: {frame_count} フレーム検出")
            pass
        
        print(f"📝 検出フレーム数: {len(frames)}")
        
        if len(frames) == 0:
            return (json.dumps({'error': 'フレームが検出されませんでした'}), 400, headers)
        
        # フレーム重複チェック（デバッグ用）
        print("🔍 フレーム差分チェック...")
        for i in range(min(3, len(frames))):  # 最初の3フレームをチェック
            if i > 0:
                # フレーム間の差分を計算
                diff_pixels = 0
                for y in range(frames[i].height):
                    for x in range(frames[i].width):
                        if frames[i].getpixel((x, y)) != frames[i-1].getpixel((x, y)):
                            diff_pixels += 1
                print(f"📊 フレーム {i-1} vs {i}: {diff_pixels} 画素の差分")
        
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
        traceback.print_exc()
        
        error_response = {
            'error': 'GIF処理に失敗しました',
            'details': str(error)
        }
        return (json.dumps(error_response), 500, headers)


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