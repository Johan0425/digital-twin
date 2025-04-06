from flask import Flask, jsonify, send_from_directory, render_template
from flask_cors import CORS
import psutil
import time
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/metrics')
def get_metrics():
    cpu_usage = psutil.cpu_percent(interval=0.5)  # Reducido el intervalo para respuesta más rápida
    ram_usage = psutil.virtual_memory().percent
    return jsonify({
        'cpu': cpu_usage,
        'ram': ram_usage,
        'timestamp': time.time()
    })

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# @app.route('/js/<path:path>')
# def serve_js(path):
#     return send_from_directory('js', path)

# @app.route('/css/<path:path>')
# def serve_css(path):
#     return send_from_directory('css', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)