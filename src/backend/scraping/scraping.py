import firebase_admin
from firebase_admin import credentials, firestore
import scholarly
from scholarly import scholarly
import random
import logging
from database.firestore import store_publications

# Set Up List of Proxies
proxy_pool = [
    '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823',
    '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823',
    '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823'
]

def get_random_proxy():
    return random.choice(proxy_pool)

# Initialize Firebase with service account
cred = credentials.Certificate('/Users/ruba/Downloads/litrix-main/litrix-698fe-firebase-adminsdk-9d1cb-6e9330d347.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("scrape_litrix.log"),
        logging.StreamHandler()
    ]
)



def extract_and_store_profile(scholar_id, college, department):
    try:
        # Extract data from Google Scholar
        author = scholarly.search_author_id(scholar_id)
        author_filled = scholarly.fill(author)

        # Store data in Firestore
        faculty_ref = db.collection('colleges').document(college).collection('departments').document(department).collection('faculty_members').document(scholar_id)
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
        }, merge=True)

        store_publications(scholar_id, college, department)
        logging.info(f"Stored data for scholar_id: {scholar_id}")
        return True
        
    except Exception as e:
        print(f'Error scraping {scholar_id}: {e}')




