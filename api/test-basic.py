def handler(req, res):
    res.status(200).json({
        'message': 'Hello from Vercel Functions!',
        'status': 'success'
    })