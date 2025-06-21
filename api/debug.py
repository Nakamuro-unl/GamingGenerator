"""
最小限のデバッグ用API
"""

def handler(request, context):
    """
    Vercel Functions用の最小限handler
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': '{"status": "ok", "message": "Debug API working", "timestamp": "2024-01-01"}'
    }