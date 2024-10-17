import time
import random
import re
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import traceback

# Initialize Firebase with service account
cred = credentials.Certificate('/Users/ruba/Downloads/litrix-main/litrix-698fe-firebase-adminsdk-9d1cb-6e9330d347.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Delay to avoid rate-limiting issues
def delay():
    sleep_time = random.uniform(3, 10)
    time.sleep(sleep_time)

# Extract DOI from publication URL
def extract_doi(pub_url):
    if not pub_url:
        return None
    doi_pattern = r'10.\d{4,9}/[-._;()/:A-Z0-9]+'
    match = re.search(doi_pattern, pub_url, re.IGNORECASE)
    return match.group(0) if match else None


# Function to selectively delete faculty members and their publications
def delete_selected_faculty(college_id, department_id, scholar_ids_to_delete):
    faculty_members_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members")
    
    # Get all faculty members in the department
    faculty_members = faculty_members_ref.stream()

    for faculty in faculty_members:
        if faculty.id in scholar_ids_to_delete:
            # Delete all publications for the faculty member
            faculty_ref = faculty_members_ref.document(faculty.id)
            publications_ref = faculty_ref.collection("publications")
            publications = publications_ref.stream()
            
            for publication in publications:
                publications_ref.document(publication.id).delete()
                print(f"Deleted publication {publication.id} for faculty {faculty.id}")
            
            # Delete the faculty member
            faculty_ref.delete()
            print(f"Deleted faculty member {faculty.id}")
        else:
            print(f"Skipped faculty member {faculty.id}, not in deletion list.")

# Helper function to convert non-string fields to strings where necessary
def sanitize_field(field):
    if isinstance(field, (int, float, dict, list)):
        return str(field)
    return field if field else 'N/A'
# Sanitize profile data to ensure all fields are valid
def sanitize_profile_data(profile_data):
    for key, value in profile_data.items():
        profile_data[key] = sanitize_field(value)
    return profile_data



def validate_data_type(value, expected_type, default_value=None):
    if isinstance(value, expected_type):
        return value
    elif value is None or value == "":
        return default_value
    else:
        logging.warning(f"Unexpected data type for value {value}. Expected {expected_type}.")
        return default_value


# Function to store the faculty profile in Firestore
def store_faculty_profile(profile_data):
    college_id = profile_data['department_id']  # Storing department ID in profile_data
    department_id = profile_data['department_id']

    try:
        # Debugging print to check Firestore path
        print(f"Storing profile for {profile_data['name']} at {college_id}/{department_id}")
        
        faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(profile_data['scholar_id'])
        faculty_ref.set(profile_data, merge=True)
        logging.info(f"Stored faculty profile for {profile_data['scholar_id']} in {college_id}/{department_id}.")
    except Exception as e:
        logging.error(f"Error storing faculty profile: {e}")
        print(f"Full error: {traceback.format_exc()}")  # Print stack trace for better debugging'''

def store_faculty_profile(profile_data):
    college_id = profile_data['department_id']  # Storing department ID in profile_data
    department_id = profile_data['department_id']
    try:
        faculty_ref = db.collection("departments").document(department_id).collection("faculty_members").document(profile_data['scholar_id'])
        # Check if the faculty member exists
        if faculty_ref.get().exists:
            # Update existing faculty profile
            faculty_ref.update(profile_data)
            logging.info(f"Updated faculty profile for {profile_data['scholar_id']} in {department_id}")
        else:
            # Create new faculty profile
            faculty_ref.set(profile_data)
            logging.info(f"Stored faculty profile for {profile_data['scholar_id']} in {department_id}")

        return faculty_ref
    except Exception as e:
        logging.error(f"Error storing faculty profile: {e}")
        return None


# Function to store publications in Firestore
def store_publications(scholar_id, publications):
    try:
        faculty_ref = db.collection("faculty_members").document(scholar_id)
        batch = db.batch()

        for pub in publications:
            # Safely get the title, or use a default if it’s missing
            title = pub.get('bib', {}).get('title', f"Unknown_Title_{pub.get('author_pub_id', 'N/A')}")
            if not title.strip():
                logging.error(f"Publication missing title: {pub}")
                continue  # Skip this publication if it doesn't have a valid title

            # Sanitize and generate document ID from the title
            doc_id = title.replace(" ", "_").replace("/", "_")
            doc_ref = faculty_ref.collection("publications").document(doc_id)
            batch.set(doc_ref, pub)

        batch.commit()
        logging.info(f"Stored {len(publications)} new publications.")
    except Exception as e:
        logging.error(f"Error storing publications: {e}")
        print(f"Full error: {traceback.format_exc()}")

# Functions to check if documents exist in Firestore

# 1 Check if faculty member exists
def get_faculty_member_data(faculty_ref):
    doc = faculty_ref.get()
    if doc.exists:
        return doc.to_dict()  # Return existing data if the document exists
    return None

# 2 Check if a publication exists
def publication_exists(faculty_ref, pub_id):
    pub_ref = faculty_ref.collection("publications").document(pub_id)
    return pub_ref.get().exists


def store_publications(college_id, department_id, faculty_data):
    faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(faculty_data["scholar_id"])
    faculty_ref.set(faculty_data, merge=True)

    # Storing publications as subcollection
    batch = db.batch()
    for pub in faculty_data["publications"]:
        pub_ref = faculty_ref.collection("publications").document(pub.get("author_pub_id"))
        batch.set(pub_ref, pub, merge=True)

    batch.commit()
