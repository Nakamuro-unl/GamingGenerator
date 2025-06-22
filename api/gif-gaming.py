from http.server import BaseHTTPRequestHandler
import json
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
            'message': 'GIF Gaming API (Test version)',
            'python_version': sys.version,
            'approach': 'Simple echo mode'
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            # 基本的なレスポンスヘッダーを設定
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # リクエスト情報の収集
            content_length = int(self.headers.get('Content-Length', 0))
            
            # リクエストボディを読み取り
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                # シンプルなレスポンス（元データをエコーバック）
                response = {
                    'success': True,
                    'message': 'GIF processed successfully (echo mode)',
                    'gifData': request_data.get('gifData', ''),
                    'debug': {
                        'received_keys': list(request_data.keys()),
                        'gif_data_length': len(request_data.get('gifData', '')),
                        'settings': request_data.get('settings', {})
                    }
                }
            else:
                response = {
                    'success': False,
                    'error': 'No data received',
                    'message': 'Empty request body'
                }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            # エラーハンドリング
            try:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'success': False,
                    'error': 'POST processing failed',
                    'details': str(e),
                    'type': type(e).__name__
                }
                
                self.wfile.write(json.dumps(error_response).encode())
            except:
                # 最後の手段
                self.wfile.write(b'{"success": false, "error": "critical_failure"}')