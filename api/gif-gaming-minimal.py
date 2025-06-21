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
        
        # PIL可用性チェック
        pil_info = self.check_pil()
        
        data = {
            'status': 'ok',
            'message': 'GIF Gaming API Minimal',
            'python_version': sys.version,
            'pil_available': pil_info['available'],
            'pil_error': pil_info['error']
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            # PIL可用性チェック
            pil_info = self.check_pil()
            if not pil_info['available']:
                self.send_error_response({
                    'error': 'PIL not available',
                    'details': pil_info['error']
                }, 500)
                return
            
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
            if not gif_data:
                self.send_error_response({'error': 'gifData required'}, 400)
                return
            
            # 簡単な処理（エコーバック）
            result = {
                'success': True,
                'gifData': gif_data,  # そのまま返す
                'message': 'Minimal processing completed'
            }
            
            self.send_success_response(result)
            
        except Exception as e:
            self.send_error_response({
                'error': 'Processing failed',
                'details': str(e)
            }, 500)
    
    def check_pil(self):
        try:
            from PIL import Image
            return {'available': True, 'error': None}
        except ImportError as e:
            return {'available': False, 'error': str(e)}
        except Exception as e:
            return {'available': False, 'error': f'Unexpected: {str(e)}'}
    
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