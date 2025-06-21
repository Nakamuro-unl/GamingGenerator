from http.server import BaseHTTPRequestHandler
import json
import base64
import sys

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
            'approach': 'Direct binary manipulation without PIL'
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            # リクエストボディ読み取り
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response({'error': 'No request body'}, 400)
                return
            
            post_data = self.rfile.read(content_length)
            
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError as e:
                self.send_error_response({'error': 'Invalid JSON', 'details': str(e)}, 400)
                return
            
            gif_data = request_data.get('gifData')
            settings = request_data.get('settings', {})
            
            if not gif_data:
                self.send_error_response({'error': 'gifData required'}, 400)
                return
            
            # PIL不要のGIF処理
            try:
                processed_gif = self.process_gif_without_pil(gif_data, settings)
                
                result = {
                    'success': True,
                    'gifData': processed_gif,
                    'message': 'GIF processed without PIL (simulated)',
                    'method': 'binary_manipulation'
                }
                
                self.send_success_response(result)
                
            except Exception as e:
                self.send_error_response({
                    'error': 'GIF processing failed',
                    'details': str(e)
                }, 500)
            
        except Exception as e:
            self.send_error_response({
                'error': 'Request processing failed',
                'details': str(e)
            }, 500)
    
    def process_gif_without_pil(self, gif_data, settings):
        """
        PIL不要のGIF処理（簡易版）
        実際の実装では、GIFバイナリを直接操作
        """
        try:
            # Base64デコード
            gif_bytes = base64.b64decode(gif_data)
            
            # 簡易的な処理（実際の色調操作は複雑）
            # ここでは、GIFヘッダーを検証して有効性を確認
            if not gif_bytes.startswith(b'GIF8'):
                raise Exception('Invalid GIF format')
            
            # 簡易処理: データをそのまま返す（概念実証）
            # 実際の実装では、GIFのフレームデータを解析し、
            # 各ピクセルに対してゲーミング効果を適用
            
            animation_type = settings.get('animation_type', 'rainbow')
            
            # 処理済みGIFデータとしてBase64エンコードして返す
            # 実際は処理されたバイナリを返すが、今回は元データを返す
            processed_data = base64.b64encode(gif_bytes).decode('utf-8')
            
            return processed_data
            
        except Exception as e:
            raise Exception(f"PIL-free GIF processing failed: {str(e)}")
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_error_response(self, data, status_code):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        data['success'] = False
        self.wfile.write(json.dumps(data).encode())