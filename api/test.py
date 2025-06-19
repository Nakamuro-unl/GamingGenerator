"""
Vercel API テスト用エンドポイント
"""

import json

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
    
    print("🧪 テストAPI呼び出し確認")
    print(f"📝 Method: {request.method}")
    print(f"📝 Headers: {dict(request.headers) if hasattr(request, 'headers') else 'なし'}")
    
    try:
        if request.method == 'POST':
            data = request.get_json()
            print(f"📝 Request data keys: {list(data.keys()) if data else 'データなし'}")
        else:
            data = None
        
        response = {
            'success': True,
            'message': 'テストAPI正常動作',
            'method': request.method,
            'data_received': bool(data),
            'timestamp': 'test'
        }
        
        print("✅ テストAPI完了")
        return (json.dumps(response), 200, headers)
        
    except Exception as error:
        print(f"❌ テストAPIエラー: {error}")
        error_response = {
            'error': 'テストAPI失敗',
            'details': str(error)
        }
        return (json.dumps(error_response), 500, headers)