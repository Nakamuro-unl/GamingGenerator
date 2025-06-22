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
            'message': 'GIF Gaming API (Debug version)',
            'python_version': sys.version,
            'approach': 'Debug mode - minimal response'
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
            
            debug_response = {
                'debug': True,
                'message': 'POST endpoint reached successfully',
                'content_length': content_length,
                'headers': dict(self.headers),
                'method': 'POST',
                'success': True
            }
            
            # リクエストボディを読み取り（安全に）
            if content_length > 0:
                try:
                    post_data = self.rfile.read(min(content_length, 1000))  # 最大1000バイトまで
                    debug_response['has_body'] = True
                    debug_response['body_length'] = len(post_data)
                    
                    # JSONパースを試行
                    try:
                        request_data = json.loads(post_data.decode('utf-8'))
                        debug_response['json_valid'] = True
                        debug_response['received_keys'] = list(request_data.keys())
                        
                        # gifDataの有無確認
                        if 'gifData' in request_data:
                            debug_response['gif_data_present'] = True
                            debug_response['gif_data_length'] = len(request_data['gifData'])
                            # デバッグ用：元のGIFデータをそのまま返す
                            debug_response['success'] = True
                            debug_response['gifData'] = request_data['gifData']
                            debug_response['message'] = 'GIF data echoed back (no processing applied)'
                        else:
                            debug_response['gif_data_present'] = False
                            
                    except json.JSONDecodeError as e:
                        debug_response['json_valid'] = False
                        debug_response['json_error'] = str(e)
                        debug_response['body_preview'] = post_data[:100].decode('utf-8', errors='ignore')
                        
                except Exception as e:
                    debug_response['body_read_error'] = str(e)
            else:
                debug_response['has_body'] = False
            
            self.wfile.write(json.dumps(debug_response).encode())
            
        except Exception as e:
            # 最終的なエラーハンドリング
            try:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'error': 'POST processing failed',
                    'details': str(e),
                    'type': type(e).__name__,
                    'success': False
                }
                
                self.wfile.write(json.dumps(error_response).encode())
            except:
                # 最後の手段
                self.wfile.write(b'{"error": "critical_failure", "success": false}')