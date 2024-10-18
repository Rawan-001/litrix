import firebase_admin
from firebase_admin import credentials, firestore
import os
# Initialize Firebase with your service account credentials
cred = credentials.Certificate('/Users/majds./Downloads/litrix-698fe-firebase-adminsdk-9d1cb-e0f2bf25bd.json')
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()


def create_colleges():
    colleges = [
        {
            "college_id": "faculty_computing",
            "name": "Faculty of Computing and Information"
        }
    ]
    
    for college in colleges:
        db.collection("colleges").document(college['college_id']).set({
            "name": college["name"]
        })
        print(f"Added {college['name']} with ID: {college['college_id']}")

# Create the colleges
create_colleges()

def add_departments_to_college(college_id, departments):
    for dept in departments:
        db.collection("colleges").document(college_id).collection("departments").document(dept['department_id']).set({
            "name": dept["name"],
            "head_of_department": dept["head_of_department"],
            "contact_email": dept["contact_email"]
        })
        print(f"Added department {dept['name']} to {college_id}")


# Store faculty profile in Firestore with dynamic college_id
def store_faculty_profile(college_id, department_id, faculty):
    try:
        faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(faculty['scholar_id'])
        faculty_ref.set(faculty)
        print(f"Stored faculty profile for {faculty['scholar_id']} in {college_id}/{department_id}")
        return faculty_ref
    except Exception as e:
        print(f"Error storing faculty profile: {e}")
        return None


# Store publications in batches to Firestore using the title as document ID
def store_publications(faculty_ref, publications):
    try:
        stored_publications = faculty_ref.collection("publications").stream()
        stored_titles = {pub.to_dict().get('title', '') for pub in stored_publications}

        batch = db.batch()
        new_publications = []
        BATCH_SIZE = 500
        for i, pub in enumerate(publications):
            if pub['title'] not in stored_titles:
                doc_id = pub['title'].replace(" ", "_").replace("/", "_")
                doc_ref = faculty_ref.collection("publications").document(doc_id)
                batch.set(doc_ref, pub)
                new_publications.append(pub['title'])

            if (i + 1) % BATCH_SIZE == 0:
                batch.commit()
                batch = db.batch()

        batch.commit()
        print(f"Stored {len(new_publications)} new publications.")
        return len(new_publications)
    except Exception as e:
        print(f"Error storing publications: {e}")
        return 0


# Define departments for the Faculty of Computing and Information
departments_computing = [
    {
        "department_id": "dept_cs",
        "name": "Department of Computer Science",
        "head_of_department": "Dr. Fahad Ali Ghamdi",
        "contact_email": "cs-dept@bu.edu.sa"
    },
    {
        "department_id": "dept_sn",
        "name": "Systems and Networks Department",
        "head_of_department": "Dr. Eidah Juman Alzahrani",
        "contact_email": "cis-dept@bu.edu.sa"
    },
    {
        "department_id": "dept_it",
        "name": "Department of Information Technology",
        "head_of_department": "Dr.Ahmad Alqarni",
        "contact_email": "it-dept@bu.edu.sa"
    },
    {
        "department_id": "dept_se",
        "name": "Department of Software Engineering",
        "head_of_department": "Dr.Anwar Saeed Alsokari",
        "contact_email": "swe-dept@bu.edu.sa"
    }
]

# Add departments to the Faculty of Computing and Information
add_departments_to_college('faculty_computing', departments_computing)
























