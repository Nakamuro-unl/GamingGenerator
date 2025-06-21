from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import traceback

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 環境情報の収集
            info = {
                'python_version': sys.version,
                'python_path': sys.path[:5],  # 最初の5つのパス
                'environment_vars': {
                    key: value for key, value in os.environ.items() 
                    if key.startswith(('VERCEL_', 'PYTHON_', 'PATH'))
                },
                'modules_available': {}
            }
            
            # モジュールの可用性チェック
            modules_to_check = ['json', 'sys', 'os', 'http.server', 'PIL', 'flask']
            for module_name in modules_to_check:
                try:
                    __import__(module_name)
                    info['modules_available'][module_name] = True
                except ImportError as e:
                    info['modules_available'][module_name] = f"ImportError: {str(e)}"
                except Exception as e:
                    info['modules_available'][module_name] = f"Error: {str(e)}"
            
            # レスポンス送信
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(info, indent=2).encode())
            
        except Exception as e:
            # エラーが発生した場合
            error_info = {
                'error': 'Diagnosis failed',
                'details': str(e),
                'traceback': traceback.format_exc()
            }
            
            try:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_info).encode())
            except:
                # 最後の手段
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'{"error": "Critical diagnosis failure"}')