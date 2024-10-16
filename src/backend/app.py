from flask import Flask, request, jsonify, redirect
from scraping import extract_and_store_profile
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS to allow communication with React frontend

@app.route('/')
def home():
    return jsonify({'message': 'Litrix API is running'}), 200

@app.route('/api/scrape', methods=['POST'])
def start_scraping():
    try:
        data = request.json
        scholar_id = data.get('scholar_id')
        college = data.get('college')
        department = data.get('department')

        if not scholar_id or not college or not department:
            return jsonify({'error': 'Missing required fields'}), 400

        # Call the scraping function
        extract_and_store_profile(scholar_id, college, department)

        return jsonify({'message': 'Scraping started successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
