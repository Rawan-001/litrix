import firebase_admin
from firebase_admin import credentials, firestore
from scholarly import scholarly
import logging
import random
from flask import Flask, request, jsonify

# Initialize Firebase Admin SDK
cred = credentials.Certificate('/Users/majds./Downloads/litrix-698fe-firebase-adminsdk-9d1cb-e0f2bf25bd.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Setup Flask for API endpoints to interact with the React frontend
app = Flask(__name__)

# Logging setup
logging.basicConfig(level=logging.INFO)

# Function to get faculty member data from Firestore
def get_faculty_member_data(faculty_name):
    faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(scholar_id)
    faculty_data = faculty_ref.get()
    if faculty_data.exists:
        return faculty_data.to_dict()
    return None

# Check if publication exists for the given faculty member
def publication_exists(publication_title, faculty_name):
    publications_ref = faculty_ref.collection("publications").document(pub_id)
    docs = publications_ref.where("title", "==", publication_title).stream()
    return any(docs)

# Store faculty data including Google Scholar profiles and publications
def store_faculty_data(faculty_name, scholar_profile, department_name):
    faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(scholar_id)
    
    # Check if the faculty already exists in the database
    if not get_faculty_member_data(faculty_name):
        faculty_data = {
            'name': faculty_name,
            'scholar_id': scholar_profile['scholar_id'],
            'department': department_name,
            'email': scholar_profile.get('email', 'N/A'),
        }
        faculty_ref.set(faculty_data)
        logging.info(f"Stored profile data for {faculty_name}")
    else:
        logging.info(f"Faculty {faculty_name} already exists in the database.")

    # Store publications if they do not exist
    for publication in scholar_profile['publications']:
        if not publication_exists(publication['title'], faculty_name):
            publications_ref = faculty_ref.collection('publications').document(publications['title'])
            publications_ref.set(publication)
            logging.info(f"Stored publication '{publication['title']}' for {faculty_name}")
        else:
            logging.info(f"Publication '{publication['title']}' already exists for {faculty_name}")

# Function to extract faculty profiles by department and return a dictionary
def extract_department_profiles(department_data):
    faculty_dict = {}
    for faculty in department_data:
        name = faculty.get('name')
        email = faculty.get('email', 'N/A')  # Default to 'N/A' if email is missing
        scholar_id = faculty.get('scholar_id')
        
        if name and scholar_id:
            # Search for scholar profiles using `scholarly`
            search_query = scholarly.search_author_id(scholar_id)
            scholar_profile = next(search_query, None)
            
            if scholar_profile:
                scholarly.fill(scholar_profile, sections=['publications'])  # Fill the profile with publications
                faculty_dict[name] = {
                    'email': email,
                    'scholar_id': scholar_id,
                    'publications': [
                        {'title': pub.bib['title'], 'year': pub.bib.get('year', 'N/A')}
                        for pub in scholar_profile.get('publications', [])
                    ]
                }
                # Store profile data in Firestore
                store_faculty_data(name, faculty_dict[name], faculty.get('department', 'Unknown'))
            else:
                logging.warning(f"Could not find a Scholar profile for {name}")
    return faculty_dict

# Sample data for multiple departments (expand as needed)
departments = {
    "Computer Science": [
       {"name": "Ikram Mohamed Moalla","email":"imoalla@bu.edu.sa", "scholar_id": "xKsDNWQAAAAJ"},
       {"name": "Muneer Abdullah Saif Saeed", "email": "masaeed@bu.edu.sa", "scholar_id": "Ut7IZtYAAAAJ"}
    ],
    "Information Technology": [
        {"name": "Ahmad Alqarni", "email": "charlie.brown@university.edu", "scholar_id": "WdKJwQUAAAAJ"}
    ]
}

# Extract and print profiles for each department
for department_name, faculty_list in departments.items():
    logging.info(f"Extracting profiles for department: {department_name}")
    faculty_profiles = extract_department_profiles(faculty_list)
    logging.info(f"Extracted {len(faculty_profiles)} profiles for {department_name}")

# Flask route to handle Scholar profile input from React frontend
@app.route('/add-scholar', methods=['POST'])
def add_scholar_profile():
    data = request.json
    name = data.get('name')
    scholar_id = data.get('scholar_id')
    email = data.get('email', 'N/A')
    department = data.get('department', 'Unknown')

    if not name or not scholar_id:
        return jsonify({'error': 'Invalid input'}), 400

    # Simulate Scholar API search and store in Firestore
    search_query = scholarly.search_author_id(scholar_id)
    scholar_profile = next(search_query, None)
    
    if scholar_profile:
        scholarly.fill(scholar_profile, sections=['publications'])
        faculty_data = {
            'email': email,
            'scholar_id': scholar_id,
            'publications': [
                {'title': pub.bib['title'], 'year': pub.bib.get('year', 'N/A')}
                for pub in scholar_profile.get('publications', [])
            ]
        }
        store_faculty_data(name, faculty_data, department)
        return jsonify({'success': True, 'message': f'{name} added with Scholar ID {scholar_id}'}), 200
    else:
        return jsonify({'error': 'Google Scholar profile not found'}), 404

if __name__ == "__main__":
    app.run(debug=True)

