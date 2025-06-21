from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({
        'message': 'Modern Vercel Functions test',
        'status': 'success',
        'path': path,
        'method': request.method
    })

if __name__ == '__main__':
    app.run()