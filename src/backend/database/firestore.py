import firebase_admin
from firebase_admin import credentials, firestore
import os

# Firebase Admin Initialization
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "/Users/ruba/Downloads/Majd/litrix/litrix-f06e0-firebase-adminsdk-5uspj-5aecd2badc.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

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
