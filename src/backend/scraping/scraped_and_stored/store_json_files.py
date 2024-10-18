import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
import re

# Initialize Firebase with your service account credentials
cred = credentials.Certificate('/Users/ruba/Downloads/Majd/litrix/litrix-f06e0-firebase-adminsdk-5uspj-5aecd2badc.json')
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# Function to check if a faculty member exists and retrieve their data
def get_faculty_member_data(faculty_ref):
    doc = faculty_ref.get()
    if doc.exists:
        return doc.to_dict()  # Return existing data if the document exists
    return None

# Function to store or update a single faculty member and their publications in Firestore
def store_faculty_data(college_id, department_id, faculty_data):
    scholar_id = faculty_data.get('scholar_id')

    # Validate that scholar_id is not None
    if not scholar_id:
        print("Error: Missing scholar_id in the faculty data. Skipping.")
        return

    # Log the scholar_id to ensure it's correct
    print(f"Storing or updating faculty member with scholar_id: {scholar_id}")

    # Reference to the faculty member document in Firestore
    faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(scholar_id)

    # Check if the faculty member exists
    existing_data = get_faculty_member_data(faculty_ref)

    if existing_data:
        print(f"Faculty member {scholar_id} already exists. Updating fields.")
    else:
        print(f"Storing new faculty member {scholar_id}.")

    # Add or update faculty member data (using merge=True to avoid overwriting existing fields)
    faculty_ref.set({
        "scholar_id": faculty_data.get("scholar_id"),
        "name": faculty_data.get("name"),
        "affiliation": faculty_data.get("affiliation"),
        "email_domain": faculty_data.get("email_domain"),
        "homepage": faculty_data.get("homepage"),
        "interests": faculty_data.get("interests", []),
        "hindex": faculty_data.get("hindex"),
        "hindex5y": faculty_data.get("hindex5y"),
        "i10index": faculty_data.get("i10index"),
        "i10index5y": faculty_data.get("i10index5y"),
        "citedby": faculty_data.get("citedby"),
        "citedby5y": faculty_data.get("citedby5y"),
        "cites_per_year": faculty_data.get("cites_per_year", {}),
        "coauthors": faculty_data.get("coauthors", []),
        "url_picture": faculty_data.get("url_picture", "")
    }, merge=True)

    print(f"Committed faculty member data for {scholar_id}")

# Handle publications in batches of 400 (or less if remaining publications are fewer)
    batch = db.batch()
    publication_count = 0
    # Add or update faculty member's publications as a subcollection
    if 'publications' in faculty_data:
        for publication in faculty_data['publications']:
            # First choice: Use 'author_pub_id' if available
            pub_id = publication.get('author_pub_id')

            # Second choice: Use the extracted DOI if 'author_pub_id' is not available
            if not pub_id:
                pub_url = publication.get('pub_url', "")
                pub_id = extract_doi(pub_url)
            
            # If neither author_pub_id nor DOI is available, skip the publication
            if not pub_id:
                print(f"Invalid pub_id for publication '{publication.get('title', '')}' in faculty {scholar_id}. Skipping publication.")
                continue

            # Reference to the publication document
            pub_ref = faculty_ref.collection("publications").document(pub_id)

            # Add or update publication data (using merge=True to avoid overwriting everything)
            batch.set(pub_ref, {
                "title": publication.get('bib', {}).get("title"),
                "authors": publication.get('bib', {}).get("author", ""),
                "pub_year": publication.get('bib', {}).get("pub_year", ""),
                "journal": publication.get('bib', {}).get("journal", ""),
                "pages": publication.get('bib', {}).get("pages", ""),
                "volume": publication.get('bib', {}).get("volume", ""),
                "number": publication.get('bib', {}).get("number", ""),
                "citation": publication.get('bib', {}).get("citation", ""),
                "publisher": publication.get('bib', {}).get("publisher", ""),
                "abstract": publication.get('bib', {}).get("abstract", ""),
                "num_citations": publication.get('num_citations', 0),
                "pub_url": publication.get('pub_url', ""),
                "cites_per_year": publication.get("cites_per_year", {}),
                "filled": publication.get("filled", False),
                "author_pub_id": publication.get("author_pub_id", ""),
                "citedby_url": publication.get("citedby_url", ""),
                "cites_id": publication.get("cites_id", [])
            }, merge=True)
            publication_count += 1
              # Commit the batch if we've added 400 publications
            if publication_count % 400 == 0:
                batch.commit()
                print(f"Committed batch of 400 publications for {scholar_id}")
                batch = db.batch()
        # Commit any remaining publications
        if publication_count % 400 != 0:
            batch.commit()
            print(f"Committed final batch of {publication_count % 400} publications for {scholar_id}")
        
# Function to upload all JSON files from a folder
def upload_faculty_data(json_folder):
    for filename in os.listdir(json_folder):
        if filename.endswith('.json'):
            filepath = os.path.join(json_folder, filename)

            # Load JSON data
            with open(filepath, 'r') as f:
                try:
                    faculty_data = json.load(f)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON from file {filename}: {e}")
                    continue  # Skip this file and continue with the next one

            # Assuming the JSON includes `college_id` and `department_id`
            college_id = faculty_data.get('college_id', 'faculty_computing')  # Default or extracted from JSON
            department_id = faculty_data.get('department_id', 'dept_it')  # Default or extracted from JSON
            
            # Store faculty data in Firestore
            store_faculty_data(college_id, department_id, faculty_data)

# Run the function to upload all JSON files from the specified folder
#upload_faculty_data('/Users/majds./Documents/GitHub/Litrix/src/backend/scraping/it_json_files')


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

scholar_ids_to_delete =[
    'AeYwTUYAAAAJ', 'BqE8XJUAAAAJ', 'CiEU7s8AAAAJ', 'Gtbbx1YAAAAJ',
    'HkgKEAsAAAAJ', 'IzsoS9MAAAAJ', 'JSQbyBgAAAAJ', 'KF-CfgoAAAAJ',
    'MQeK2TUAAAAJ', 'SknhXP0AAAAJ', 'VS2klEgAAAAJ' , 'Wcoweq8AAAAJ',
    'YeUTzMwAAAAJ', 'blwPeXQAAAAJ', 'budxbSoAAAAJ', 'g-tdUbYAAAAJ',
    'jDrt2XUAAAAJ'

]


wrong_college_id = "faculty_computing"  
wrong_department_id = "dept_it"
delete_selected_faculty(wrong_college_id, wrong_department_id, scholar_ids_to_delete)