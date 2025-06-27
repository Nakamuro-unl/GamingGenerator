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
        
        # PILライブラリの検証
        pil_status = "unavailable"
        pil_error = None
        
        try:
            from PIL import Image, ImageDraw, ImageSequence
            pil_status = "available"
        except ImportError as e:
            pil_error = str(e)
        except Exception as e:
            pil_error = f"Unexpected error: {str(e)}"
        
        data = {
            'status': 'ok',
            'message': 'GIF Gaming API Diagnostic',
            'python_version': sys.version,
            'pil_status': pil_status,
            'pil_error': pil_error
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # PILライブラリのテスト
            try:
                from PIL import Image, ImageDraw, ImageSequence
                pil_available = True
                pil_error = None
            except Exception as e:
                pil_available = False
                pil_error = str(e)
            
            # リクエストボディを読み取り
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                response = {
                    'success': True,
                    'message': 'Diagnostic POST response',
                    'pil_available': pil_available,
                    'pil_error': pil_error,
                    'received_data_keys': list(request_data.keys()),
                    'gif_data_present': 'gifData' in request_data,
                    'gif_data_length': len(request_data.get('gifData', ''))
                }
                
                # PILが利用可能な場合は元データをエコーバック
                if pil_available and 'gifData' in request_data:
                    response['gifData'] = request_data['gifData']
                    response['message'] = 'PIL available - echoing GIF data'
                
            else:
                response = {
                    'success': False,
                    'error': 'No request body'
                }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            try:
                error_response = {
                    'success': False,
                    'error': f'POST processing failed: {str(e)}',
                    'error_type': type(e).__name__
                }
                self.wfile.write(json.dumps(error_response).encode())
            except:
                self.wfile.write(b'{"success": false, "error": "critical_failure"}')