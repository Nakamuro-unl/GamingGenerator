from http.server import BaseHTTPRequestHandler
import json
import sys
import base64
import math
import time

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        data = {
            'status': 'ok',
            'message': 'GIF Gaming API (Gaming Effects Ready)',
            'python_version': sys.version,
            'supported_effects': ['rainbow', 'bluepurplepink', 'golden', 'pulse', 'rainbowPulse']
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                # GIFデータと設定を取得
                gif_data = request_data.get('gifData', '')
                settings = request_data.get('settings', {})
                
                # ゲーミングエフェクトを適用
                processed_gif = self.apply_gaming_effects(gif_data, settings)
                
                response = {
                    'success': True,
                    'message': 'GIF processed with gaming effects',
                    'gifData': processed_gif,
                    'appliedSettings': settings,
                    'effectType': settings.get('animationType', 'rainbow')
                }
            else:
                response = {
                    'success': False,
                    'error': 'No data received',
                    'message': 'Empty request body'
                }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            try:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'success': False,
                    'error': 'Processing failed',
                    'details': str(e),
                    'type': type(e).__name__
                }
                
                self.wfile.write(json.dumps(error_response).encode())
            except:
                self.wfile.write(b'{"success": false, "error": "critical_failure"}')
    
    def apply_gaming_effects(self, gif_data, settings):
        """ゲーミングエフェクトを適用"""
        try:
            if not gif_data:
                return gif_data
            
            # Data URLの処理
            data_url_prefix = ""
            base64_data = gif_data
            
            if gif_data.startswith('data:image/gif;base64,'):
                data_url_prefix = 'data:image/gif;base64,'
                base64_data = gif_data[len(data_url_prefix):]
            
            # Base64デコード
            try:
                gif_bytes = base64.b64decode(base64_data)
            except:
                return gif_data
            
            # エフェクトタイプを取得
            effect_type = settings.get('animationType', 'rainbow')
            speed = settings.get('speed', 5)
            saturation = settings.get('saturation', 100)
            
            # エフェクトを適用
            modified_bytes = self.apply_color_effect(gif_bytes, effect_type, speed, saturation)
            
            # Base64エンコード
            modified_base64 = base64.b64encode(modified_bytes).decode('utf-8')
            
            return data_url_prefix + modified_base64
            
        except Exception as e:
            # エラー時は元データを返す
            return gif_data
    
    def apply_color_effect(self, gif_bytes, effect_type, speed, saturation):
        """色エフェクトを適用"""
        modified_bytes = bytearray(gif_bytes)
        
        # GIFヘッダーのスキップ（6バイト：GIF89a または GIF87a）
        if len(modified_bytes) < 13:
            return bytes(modified_bytes)
        
        # ロジカルスクリーンディスクリプタ（7バイト）の後からカラーテーブルを探す
        header_end = 13
        
        # グローバルカラーテーブルフラグをチェック
        if len(modified_bytes) > 10:
            packed_field = modified_bytes[10]
            global_color_table_flag = (packed_field & 0x80) >> 7
            
            if global_color_table_flag:
                color_table_size = 2 ** ((packed_field & 0x07) + 1)
                color_table_start = header_end
                color_table_end = color_table_start + (color_table_size * 3)
                
                # カラーテーブルの範囲内でエフェクトを適用
                if color_table_end <= len(modified_bytes):
                    self.modify_color_table(modified_bytes, color_table_start, color_table_end, effect_type, speed, saturation)
        
        # 追加のカラーデータ検索（より多くの色情報を変更）
        self.enhance_colors_throughout(modified_bytes, effect_type, speed, saturation)
        
        return bytes(modified_bytes)
    
    def modify_color_table(self, data, start, end, effect_type, speed, saturation):
        """カラーテーブルを変更"""
        current_time = time.time() * 1000 * speed / 5  # 時間ベースのアニメーション
        
        for i in range(start, end, 3):
            if i + 2 < len(data):
                r, g, b = data[i], data[i+1], data[i+2]
                
                # エフェクトタイプに応じて色変更
                if effect_type == 'rainbow':
                    r, g, b = self.rainbow_effect(r, g, b, i, current_time, saturation)
                elif effect_type == 'bluepurplepink':
                    r, g, b = self.blue_purple_pink_effect(r, g, b, i, current_time, saturation)
                elif effect_type == 'golden':
                    r, g, b = self.golden_effect(r, g, b, saturation)
                elif effect_type == 'pulse':
                    r, g, b = self.pulse_effect(r, g, b, current_time, saturation)
                elif effect_type == 'rainbowPulse':
                    r, g, b = self.rainbow_pulse_effect(r, g, b, i, current_time, saturation)
                
                data[i] = max(0, min(255, int(r)))
                data[i+1] = max(0, min(255, int(g)))
                data[i+2] = max(0, min(255, int(b)))
    
    def enhance_colors_throughout(self, data, effect_type, speed, saturation):
        """データ全体で色の強化を行う"""
        current_time = time.time() * 1000 * speed / 5
        
        # データの中間部分で色パターンを探して変更
        for i in range(100, min(len(data) - 100, 5000), 3):
            if i + 2 < len(data):
                # RGB パターンらしき場所を検出
                if self.is_likely_color_data(data[i], data[i+1], data[i+2]):
                    r, g, b = data[i], data[i+1], data[i+2]
                    
                    if effect_type == 'rainbow':
                        r, g, b = self.rainbow_effect(r, g, b, i, current_time, saturation)
                    elif effect_type == 'golden':
                        r, g, b = self.golden_effect(r, g, b, saturation)
                    
                    data[i] = max(0, min(255, int(r)))
                    data[i+1] = max(0, min(255, int(g)))
                    data[i+2] = max(0, min(255, int(b)))
    
    def is_likely_color_data(self, r, g, b):
        """RGB色データらしいかどうかを判定"""
        # 全て0は透明なのでスキップ
        if r == 0 and g == 0 and b == 0:
            return False
        # 極端に大きい値は制御データの可能性
        if r > 250 and g > 250 and b > 250:
            return False
        return True
    
    def rainbow_effect(self, r, g, b, index, time, saturation):
        """虹色エフェクト"""
        # HSV変換して色相を変更
        hue_shift = (time / 1000 + index * 0.01) % 1.0
        intensity = saturation / 100.0
        
        # 簡易HSV変換
        hue = hue_shift * 360
        
        # 虹色の計算
        c = 255 * intensity
        x = c * (1 - abs((hue / 60) % 2 - 1))
        m = 255 - c
        
        if 0 <= hue < 60:
            r_new, g_new, b_new = c, x, 0
        elif 60 <= hue < 120:
            r_new, g_new, b_new = x, c, 0
        elif 120 <= hue < 180:
            r_new, g_new, b_new = 0, c, x
        elif 180 <= hue < 240:
            r_new, g_new, b_new = 0, x, c
        elif 240 <= hue < 300:
            r_new, g_new, b_new = x, 0, c
        else:
            r_new, g_new, b_new = c, 0, x
        
        # 元の明度を保持
        original_brightness = (r + g + b) / 3
        new_brightness = (r_new + g_new + b_new) / 3
        
        if new_brightness > 0:
            factor = original_brightness / new_brightness
            r_new *= factor
            g_new *= factor
            b_new *= factor
        
        return r_new + m, g_new + m, b_new + m
    
    def blue_purple_pink_effect(self, r, g, b, index, time, saturation):
        """青→紫→ピンクエフェクト"""
        phase = (time / 2000 + index * 0.02) % 1.0
        intensity = saturation / 100.0
        
        if phase < 0.33:  # 青
            factor = intensity
            return r * (1 - factor), g * (1 - factor) + 100 * factor, b * (1 - factor) + 255 * factor
        elif phase < 0.66:  # 紫
            factor = intensity
            return r * (1 - factor) + 128 * factor, g * (1 - factor), b * (1 - factor) + 255 * factor
        else:  # ピンク
            factor = intensity
            return r * (1 - factor) + 255 * factor, g * (1 - factor) + 192 * factor, b * (1 - factor) + 203 * factor
    
    def golden_effect(self, r, g, b, saturation):
        """金ピカエフェクト"""
        intensity = saturation / 100.0
        
        # 金色への変換
        golden_r = min(255, r + 50 * intensity)
        golden_g = min(255, g + 35 * intensity) 
        golden_b = max(0, b - 30 * intensity)
        
        return golden_r, golden_g, golden_b
    
    def pulse_effect(self, r, g, b, time, saturation):
        """ピカピカ点滅エフェクト"""
        pulse = (math.sin(time / 200) + 1) / 2  # 0-1の範囲で振動
        intensity = saturation / 100.0 * pulse
        
        return min(255, r + 100 * intensity), min(255, g + 100 * intensity), min(255, b + 100 * intensity)
    
    def rainbow_pulse_effect(self, r, g, b, index, time, saturation):
        """虹色ピカピカエフェクト"""
        # 虹色と点滅を組み合わせ
        r_rainbow, g_rainbow, b_rainbow = self.rainbow_effect(r, g, b, index, time, saturation)
        return self.pulse_effect(r_rainbow, g_rainbow, b_rainbow, time, saturation)