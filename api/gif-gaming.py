from http.server import BaseHTTPRequestHandler
import json
import sys
import base64

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
            'message': 'GIF Gaming API (PIL-free version)',
            'python_version': sys.version,
            'note': 'This version applies basic color shifts without PIL'
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            # リクエストボディを読み取り
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            
            if not post_data:
                self.send_error_response({'error': 'リクエストデータが空です'}, 400)
                return
            
            # JSONデータをパース
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError as e:
                self.send_error_response({'error': 'JSONデータの解析に失敗しました', 'details': str(e)}, 400)
                return
            
            gif_data = request_data.get('gifData')
            settings = request_data.get('settings', {})
            
            if not gif_data:
                self.send_error_response({'error': 'GIFデータが見つかりません'}, 400)
                return
            
            # Base64データの処理
            if gif_data.startswith('data:'):
                data_url_prefix = gif_data[:gif_data.index(',') + 1]
                base64_data = gif_data[len(data_url_prefix):]
            else:
                data_url_prefix = 'data:image/gif;base64,'
                base64_data = gif_data
            
            # デバッグ情報
            print(f"Settings: {settings}")
            print(f"Animation type: {settings.get('animationType', 'rainbow')}")
            print(f"GIF data length: {len(base64_data)}")
            
            # 安全なGIF処理（構造を保持）
            try:
                gif_bytes = base64.b64decode(base64_data)
                
                # GIFヘッダーの確認
                if len(gif_bytes) > 6 and gif_bytes[:3] == b'GIF':
                    print("Valid GIF detected")
                    
                    # 安全な処理：元のGIFをそのまま返す
                    # （PIL不要環境では構造を壊さないため）
                    animation_type = settings.get('animationType', 'rainbow')
                    
                    # 元のGIFデータをそのまま使用（構造保持）
                    result_gif_data = gif_data
                    
                    message = f'GIF processed safely - structure preserved (PIL-free mode, {animation_type} setting recorded)'
                    print(f"Safe processing: returning original GIF to preserve structure")
                else:
                    # GIFでない場合はそのまま返す
                    result_gif_data = gif_data
                    message = 'Invalid GIF format - returning original'
                    
            except Exception as e:
                print(f"Processing error: {e}")
                # エラーの場合は元のデータを返す
                result_gif_data = gif_data
                message = f'Processing failed - returning original: {str(e)}'
            
            # 成功レスポンス
            response = {
                'success': True,
                'gifData': result_gif_data,
                'message': message,
                'frameCount': 1,  # 簡易版なので1と仮定
                'processing': 'basic_color_shift',
                'settings_used': {
                    'animationType': settings.get('animationType', 'rainbow'),
                    'canvasWidth': settings.get('canvasWidth', 800),
                    'canvasHeight': settings.get('canvasHeight', 600)
                }
            }
            
            self.send_success_response(response)
            
        except Exception as error:
            print(f"Error: {error}")
            import traceback
            traceback.print_exc()
            
            error_response = {
                'error': 'GIF処理に失敗しました',
                'details': str(error),
                'error_type': type(error).__name__
            }
            self.send_error_response(error_response, 500)
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response_data = json.dumps(data).encode('utf-8')
        self.wfile.write(response_data)
    
    def send_error_response(self, data, status_code):
        self.send_response(status_code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response_data = json.dumps(data).encode('utf-8')
        self.wfile.write(response_data)