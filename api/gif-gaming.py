"""
Vercel Functions完全対応版 GIF Gaming API
"""

import json
import sys

def handler(request):
    """
    Vercel Functions用のメインhandler
    Args:
        request: HTTPリクエストオブジェクト
    Returns:
        dict: レスポンスオブジェクト
    """
    
    # 共通ヘッダー
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    try:
        # メソッド別処理
        method = getattr(request, 'method', 'GET')
        
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        elif method == 'GET':
            # デバッグ情報を返す
            debug_info = get_debug_info()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(debug_info)
            }
        
        elif method == 'POST':
            # POST処理
            return handle_post_request(request, headers)
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({
                    'error': f'Method {method} not allowed',
                    'success': False
                })
            }
            
    except Exception as e:
        # 最終的なエラーハンドリング
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e),
                'python_version': sys.version,
                'success': False
            })
        }

def get_debug_info():
    """デバッグ情報を取得"""
    
    # 基本情報
    info = {
        'status': 'ok',
        'message': 'GIF Gaming API v3 (Vercel Functions)',
        'python_version': sys.version,
        'timestamp': '2024-01-01T00:00:00Z'
    }
    
    # PIL可用性チェック
    try:
        from PIL import Image
        info['pil_available'] = True
        info['pil_version'] = Image.__version__ if hasattr(Image, '__version__') else 'unknown'
        info['pil_error'] = None
    except ImportError as e:
        info['pil_available'] = False
        info['pil_error'] = str(e)
        info['pil_version'] = None
    except Exception as e:
        info['pil_available'] = False
        info['pil_error'] = f'Unexpected error: {str(e)}'
        info['pil_version'] = None
    
    # その他の基本ライブラリ
    try:
        import io, base64, math
        info['basic_libs'] = True
    except Exception as e:
        info['basic_libs'] = False
        info['basic_libs_error'] = str(e)
    
    return info

def handle_post_request(request, headers):
    """POSTリクエストを処理"""
    
    try:
        # PIL可用性チェック
        try:
            from PIL import Image, ImageDraw
            import io, base64
        except ImportError as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Required libraries not available',
                    'details': str(e),
                    'success': False
                })
            }
        
        # リクエストボディの取得
        body = None
        if hasattr(request, 'body'):
            body = request.body
        elif hasattr(request, 'data'):
            body = request.data
        elif hasattr(request, 'get_json'):
            try:
                body = request.get_json()
            except:
                pass
        
        if not body:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'No request body found',
                    'success': False
                })
            }
        
        # JSONパース
        if isinstance(body, (str, bytes)):
            try:
                if isinstance(body, bytes):
                    body = body.decode('utf-8')
                request_data = json.loads(body)
            except json.JSONDecodeError as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'error': 'Invalid JSON',
                        'details': str(e),
                        'success': False
                    })
                }
        else:
            request_data = body
        
        # 必要なデータの確認
        gif_data = request_data.get('gifData')
        settings = request_data.get('settings', {})
        
        if not gif_data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'gifData is required',
                    'success': False
                })
            }
        
        # 簡単なGIF処理（テスト版）
        try:
            processed_gif = process_gif_simple(gif_data, settings)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'gifData': processed_gif,
                    'message': 'GIF processing completed (test version)'
                })
            }
            
        except Exception as processing_error:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    'error': 'GIF processing failed',
                    'details': str(processing_error),
                    'success': False
                })
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'POST request handling failed',
                'details': str(e),
                'success': False
            })
        }

def process_gif_simple(gif_data, settings):
    """
    簡単なGIF処理（テスト用）
    """
    import io
    import base64
    from PIL import Image
    
    try:
        # Base64デコード
        gif_bytes = base64.b64decode(gif_data)
        
        # PIL Imageとして読み込み
        gif_image = Image.open(io.BytesIO(gif_bytes))
        
        # 最初のフレームを取得
        gif_image.seek(0)
        frame = gif_image.copy()
        
        # RGBA変換
        if frame.mode != 'RGBA':
            frame = frame.convert('RGBA')
        
        # 簡単な処理（そのまま返す）
        output_buffer = io.BytesIO()
        frame.save(output_buffer, format='PNG')  # テスト用でPNG出力
        output_buffer.seek(0)
        
        # Base64エンコード
        processed_data = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
        return processed_data
        
    except Exception as e:
        raise Exception(f"Simple GIF processing failed: {str(e)}")