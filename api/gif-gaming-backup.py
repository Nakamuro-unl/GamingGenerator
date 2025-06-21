"""
GIFアニメーションにゲーミング効果を適用するAPI (Vercel Functions対応版)
"""

import sys
import traceback
import json

try:
    import io
    import base64
    import math
    BASIC_IMPORTS_OK = True
    BASIC_IMPORT_ERROR = None
except Exception as e:
    BASIC_IMPORTS_OK = False
    BASIC_IMPORT_ERROR = str(e)

try:
    from PIL import Image, ImageDraw, ImageSequence
    PIL_AVAILABLE = True
    PIL_ERROR = None
except ImportError as e:
    PIL_AVAILABLE = False
    PIL_ERROR = str(e)
except Exception as e:
    PIL_AVAILABLE = False
    PIL_ERROR = f"Unexpected PIL error: {str(e)}"

def handler(request):
    """
    Vercel Functions用のメインhandler
    """
    try:
        # CORS ヘッダー
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        }
        
        # OPTIONSリクエストの処理
        if request.method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # GETリクエストの処理（デバッグ用）
        if request.method == 'GET':
            status_data = {
                'status': 'ok',
                'message': 'GIF Gaming API v2 is running',
                'basic_imports_ok': BASIC_IMPORTS_OK,
                'basic_import_error': BASIC_IMPORT_ERROR,
                'pil_available': PIL_AVAILABLE,
                'pil_error': PIL_ERROR,
                'python_version': sys.version,
                'request_method': request.method,
                'timestamp': '2024-01-01T00:00:00Z'
            }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(status_data)
            }
        
        # POSTリクエストの処理
        if request.method == 'POST':
            # 基本インポートのチェック
            if not BASIC_IMPORTS_OK:
                error_response = {
                    'error': 'Basic Python libraries are not available',
                    'details': BASIC_IMPORT_ERROR,
                    'success': False
                }
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps(error_response)
                }
            
            # PILの可用性をチェック
            if not PIL_AVAILABLE:
                error_response = {
                    'error': 'PIL (Pillow) library is not available',
                    'details': PIL_ERROR,
                    'success': False
                }
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps(error_response)
                }
            
            # リクエストデータの解析
            try:
                if hasattr(request, 'body') and request.body:
                    if isinstance(request.body, bytes):
                        request_data = json.loads(request.body.decode('utf-8'))
                    else:
                        request_data = json.loads(request.body)
                elif hasattr(request, 'json') and request.json:
                    request_data = request.json
                else:
                    error_response = {
                        'error': 'リクエストデータが見つかりません',
                        'success': False
                    }
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps(error_response)
                    }
                    
            except json.JSONDecodeError as e:
                error_response = {
                    'error': 'JSONデータの解析に失敗しました',
                    'details': str(e),
                    'success': False
                }
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps(error_response)
                }
            
            gif_data = request_data.get('gifData')
            settings = request_data.get('settings', {})
            
            if not gif_data:
                error_response = {
                    'error': 'GIFデータが見つかりません',
                    'success': False
                }
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps(error_response)
                }
            
            # 実際のGIF処理（簡略版）
            try:
                processed_gif_data = process_gif_simple(gif_data, settings)
                
                success_response = {
                    'success': True,
                    'gifData': processed_gif_data,
                    'message': 'GIF処理が完了しました'
                }
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(success_response)
                }
                
            except Exception as processing_error:
                error_response = {
                    'error': 'GIF処理中にエラーが発生しました',
                    'details': str(processing_error),
                    'traceback': traceback.format_exc().split('\n')[-3:-1],
                    'success': False
                }
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps(error_response)
                }
        
        # その他のメソッド
        error_response = {
            'error': f'Method {request.method} not allowed',
            'success': False
        }
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps(error_response)
        }
        
    except Exception as e:
        # 最終的なエラーハンドリング
        try:
            error_response = {
                'error': 'Unexpected server error',
                'details': str(e),
                'traceback': traceback.format_exc().split('\n')[-3:-1],
                'success': False
            }
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(error_response)
            }
        except:
            # 最終的なフォールバック
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'text/plain'
                },
                'body': f'Critical error: {str(e)}'
            }

def process_gif_simple(gif_data, settings):
    """
    簡略版のGIF処理（テスト用）
    実際の実装では、元のコードの処理ロジックを移植
    """
    try:
        # Base64デコード
        gif_bytes = base64.b64decode(gif_data)
        
        # PIL Imageとして読み込み
        gif_image = Image.open(io.BytesIO(gif_bytes))
        
        # 最初のフレームのみを処理（簡略版）
        gif_image.seek(0)
        frame = gif_image.copy()
        
        # 簡単なエフェクト適用（色調補正）
        if frame.mode != 'RGBA':
            frame = frame.convert('RGBA')
        
        # エフェクト処理の代わりに、単純に元の画像を返す
        output_buffer = io.BytesIO()
        frame.save(output_buffer, format='GIF')
        output_buffer.seek(0)
        
        # Base64エンコードして返す
        processed_data = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
        return processed_data
        
    except Exception as e:
        raise Exception(f"GIF processing failed: {str(e)}")
