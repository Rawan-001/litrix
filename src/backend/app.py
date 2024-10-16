from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from scholarly import scholarly
import re
import logging

# Initialize Firebase
cred = credentials.Certificate('/Users/ruba/Downloads/Majd/litrix/litrix-f06e0-firebase-adminsdk-5uspj-5aecd2badc.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize Flask
app = Flask(__name__)
CORS(app, origins=["https://litrix-f06e0.web.app"])

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

def extract_scholar_id(scholar_url):
    pattern = r'user=([a-zA-Z0-9_-]+)'
    match = re.search(pattern, scholar_url)
    return match.group(1) if match else None

@app.route('/api/scrape', methods=['POST'])
def scrape_data():
    data = request.json
    scholar_url = data.get('googleScholarLink')
    college = data.get('college')
    department = data.get('department')

    scholar_id = extract_scholar_id(scholar_url)
    if not scholar_id:
        return jsonify({"error": "Invalid Google Scholar URL"}), 400

    try:
        author = scholarly.search_author_id(scholar_id)
        author_filled = scholarly.fill(author)

        faculty_ref = db.collection("colleges").document(college) \
            .collection("departments").document(department) \
            .collection("faculty_members").document(scholar_id)

        faculty_ref.set({
            "name": author_filled.get("name", ""),
            "scholar_id": scholar_id,
            "affiliation": author_filled.get("affiliation", ""),
            "interests": author_filled.get("interests", []),
            "hindex": author_filled.get("hindex", 0),
            "email_domain": author_filled.get("email_domain", ""),
            "homepage": author_filled.get("homepage", ""),
            "hindex5y": author_filled.get("hindex5y", 0),
            "i10index": author_filled.get("i10index", 0),
            "i10index5y": author_filled.get("i10index5y", 0),
            "citedby": author_filled.get("citedby", 0),
            "citedby5y": author_filled.get("citedby5y", 0),
            "cites_per_year": author_filled.get("cites_per_year", {}),
            "coauthors": author_filled.get("coauthors", []),
            "url_picture": author_filled.get("url_picture", ""),
            "publications": author_filled.get("publications", [])
        })

        return jsonify({"message": "Data scraped and stored successfully"}), 200

    except Exception as e:
        logging.error(f"Error scraping data: {e}")
        return jsonify({"error": "Failed to scrape data"}), 500

if __name__ == '__main__':
    app.run(debug=True)
