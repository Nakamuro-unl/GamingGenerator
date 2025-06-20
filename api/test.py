"""
Vercel API テスト用エンドポイント
"""

from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.end_headers()
    
    def do_POST(self):
        try:
            print("🧪 テストAPI呼び出し確認")
            print(f"📝 Method: POST")
            
            # リクエストボディを読み取り
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            
            data = None
            if post_data:
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    print(f"📝 Request data keys: {list(data.keys()) if data else 'データなし'}")
                except:
                    print("📝 Request data: バイナリデータ")
            
            response = {
                'success': True,
                'message': 'テストAPI正常動作',
                'method': 'POST',
                'data_received': bool(data),
                'timestamp': 'test'
            }
            
            print("✅ テストAPI完了")
            
            # レスポンスを送信
            self.send_response(200)
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
            self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response_data = json.dumps(response).encode('utf-8')
            self.wfile.write(response_data)
            
        except Exception as error:
            print(f"❌ テストAPIエラー: {error}")
            
            error_response = {
                'error': 'テストAPI失敗',
                'details': str(error)
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_data = json.dumps(error_response).encode('utf-8')
            self.wfile.write(error_data)
    
    def do_GET(self):
        self.do_POST()  # GETもPOSTと同じ処理