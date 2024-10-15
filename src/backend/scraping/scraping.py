import firebase_admin
from firebase_admin import credentials, firestore
import scholarly
from scholarly import scholarly
from scholarly import ProxyGenerator
import time
import random
import json
import logging
import re


# Set Up List of Proxies
proxy_pool = [
    '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823',
    '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823',
    '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823'
]

def get_random_proxy():
    return random.choice(proxy_pool)

# Initialize Firebase with service account
cred = credentials.Certificate('/Users/majds./Downloads/litrix-698fe-firebase-adminsdk-9d1cb-e0f2bf25bd.json')
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

# Store faculty data in Firestore
def store_faculty_data(college_id, department_id, faculty_data):
    for faculty in faculty_data:
        try:
            scholar_id = faculty.get('scholar_id')
            if not scholar_id:
                logging.error(f"Missing scholar_id for {faculty.get('name', 'Unknown')}")
                continue

            author = scholarly.search_author_id(faculty['scholar_id'])
            if not author:
                logging.error(f"Author not found for {faculty['name']}")
                continue

            author_filled = scholarly.fill(author)

            logging.info(f"Storing or updating faculty member with scholar_id: {scholar_id}")

            # Reference to the faculty member document in Firestore
            faculty_ref = db.collection("colleges").document(college_id).collection("departments").document(department_id).collection("faculty_members").document(scholar_id)

            # Check if the faculty member exists
            existing_data = get_faculty_member_data(faculty_ref)

            if existing_data:
                logging.info(f"Faculty member {scholar_id} already exists. Updating fields.")
            else:
                logging.info(f"Storing new faculty member {scholar_id}.")

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

            # Handle publications in batches of 400 
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

        except Exception as e:
            logging.error(f"Error processing faculty data for {faculty.get('name', 'Unknown')}: {e}")

#  Export all authors in the cs list
cs_department = [
  {"name": "Abdul Hannan Abdul Mannan Shaikh", "scholar_id": "blwPeXQAAAAJ", "email":"ahannan@bu.edu.sa","department_id": "dept_cs" },
  {"name": "Abdulkareem Aodah Alzahrani", "scholar_id": "JSQbyBgAAAAJ", "email":"ao.alzahrani@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Abdullah Alomari", "scholar_id": "1u1Vah8AAAAJ", "email":"alomari@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Eidah Mohamed Alzahrani", "scholar_id": "MQeK2TUAAAAJ", "email":"em.alzahrani@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Esam Alzahrani", "scholar_id": "05Jx6QkAAAAJ", "email":"esalzahrani@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Fahad Ali Ghamdi", "scholar_id": "BqE8XJUAAAAJ", "email": "fghamdi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Hani Ali Harb", "scholar_id": "VS2klEgAAAAJ", "email":"haharb@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Hassan Alkhiri", "scholar_id": "jDrt2XUAAAAJ", "email": "halkhiri@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Ibrahim Alghamdi", "scholar_id": "-Ee7QMYAAAAJ", "email":"ia.alghamdi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Majzoob Kamalaldin Omer", "scholar_id": "KF-CfgoAAAAJ", "email": "mkomer@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Mohammed Abdulrahman Alliheedi", "scholar_id": "Wcoweq8AAAAJ", "email":"malliheedi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Mohammed Alghamdi", "scholar_id": "Gtbbx1YAAAAJ", "email":"mialmushilah@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Musaad Alzahrani", "scholar_id": "g-tdUbYAAAAJ", "email":"malzahr@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Nizar Hasan Alsharif", "scholar_id": "budxbSoAAAAJ", "email":"nizar@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Rahmat Budiarto", "scholar_id": "Qi24UpwAAAAJ", "email":"rahmat@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Rami Jamaan Saeed Alzahrani", "scholar_id": "IzsoS9MAAAAJ", "email":"rjsaeed@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Saad Alqithami", "scholar_id": "HkgKEAsAAAAJ", "email":"salqithami@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Sami Abdulrahman Alghamdi", "scholar_id": "CiEU7s8AAAAJ","email":"samialghamdi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Walid Kamal Ghamry Elsayed", "scholar_id": "YeUTzMwAAAAJ","email":"wkamal@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Taghreed Abdalwahab Alghamdi", "scholar_id":"32NV4n4AAAAJ", "email":"talshurihi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Muhammad Qaiser Saleem", "scholar_id": "XCxbNmoAAAAJ", "email":"qsaleem@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Ikram Mohamed Moalla", "scholar_id": "xKsDNWQAAAAJ", "email":"imoalla@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Adil Fahad Al harthi", "scholar_id": "0_1pixgAAAAJ", "email":"afalharthi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Muneer Abdullah Saif Saeed", "scholar_id": "Ut7IZtYAAAAJ", "email":"masaeed@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Ahmed S. Khalaf", "scholar_id": "vySNGjYAAAAJ", "email":"akhalaf@bu.edu.s","department_id": "dept_cs"},
  {"name": "Abdullah Saeed Ibrahim Alghotmi Alghamdi", "scholar_id": "UFX6LxEAAAAJ", "email":"aalghotmi@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Mohammad Eid Alzahrani", "scholar_id": "0rfEfNkAAAAJ", "email":"meid@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Amel Ben Slimane", "scholar_id": "_Eyk9OwAAAAJ", "email":"aslimane@bu.edu.sa","department_id": "dept_cs"},
  {"name": "Dr. Mohammed Abdullah Al Qurashi", "scholar_id": "_Eyk9OwAAAAJ", "email":"malqurashi@bu.edu.sa","department_id": "dept_cs"}
]

# Export all authors in the sn list
sn_department = [
  {"name": "Maha Marzoog Alamri", "scholar_id": "R3hUdWoAAAAJ", "department_id": "dept_sn"},
  {"name": "Hassan Abdullah Ahmad", "scholar_id": "RHTOwC4AAAAJ", "department_id": "dept_sn"},
  {"name": "Ahmed Abdulrahman Alghamdi", "scholar_id": "9iW6AKAAAAAJ","department_id": "dept_sn"},
  {"name": "Mohammed Sirelkhtem Adrees", "scholar_id": "x0DZnTgAAAAJ", "department_id": "dept_sn"},
  {"name": "Rabea Alghamdi", "scholar_id": "iHvu2-YAAAAJ","department_id": "dept_sn"},
  {"name": "Ahlam Altuhami", "scholar_id": "lURTCEIAAAAJ","department_id": "dept_sn"},
  {"name": "Waleed Mahmoud Ead", "scholar_id": "Zs28nxwAAAAJ", "department_id": "dept_sn"}
]

# Export all authors in the it list
it_department = [
  {"name": "Ahmad Alqarni", "scholar_id": "WdKJwQUAAAAJ", "department_id": "dept_it"},
  {"name": "Nouf Alzahrani", "scholar_id": "lmQMvCUAAAAJ", "department_id": "dept_it"},
  {"name": "Ali Alowayr", "scholar_id": "B_ZvEtEAAAAJ", "department_id": "dept_it"},
  {"name": "Abdullah Ahmad Alshehri", "scholar_id": "0N86D0QAAAAJ", "department_id": "dept_it"},
  {"name": "Badeen Kerim", "scholar_id": "7INLDbgAAAAJ", "department_id": "dept_it"},
  {"name": "Ahmed Mahmoud Mostafa Youssef", "scholar_id": "9NPfxXYAAAAJ", "department_id": "dept_it"},
  {"name": "Nejib Ben Aoun", "scholar_id": "XzD4xzoAAAAJ", "department_id": "dept_it"},
  {"name": "Nayeem Ahmad Khan", "scholar_id": "kxhHWnkAAAAJ", "department_id": "dept_it"},
  {"name": "Sonia Saeed Lajmi", "scholar_id": "h9j1S48AAAAJ", "department_id": "dept_it"},
  {"name": "Ali Huseein Tahoun", "scholar_id": "vo8ofv4AAAAJ", "department_id": "dept_it"},
  {"name": "Bader Alghamdi  ", "scholar_id": "bCZ-uAwAAAAJ", "department_id": "dept_it"},
  {"name": "Ahmad Alshaflut  ", "scholar_id": "3Wo0U6gAAAAJ", "department_id": "dept_it"},
  {"name": "Moez Krichen  ", "scholar_id": "yaX8Tu4AAAAJ", "department_id": "dept_it"},
  {"name": "Ahmad Ali Alshehri", "scholar_id": "AgM-jXIAAAAJ", "department_id": "dept_it"} 
]

# Export all authors in the se list
se_department = [
 # {"name": "Anwar Saeed Saleh Alsokari", "scholar_id": "SknhXP0AAAAJ", "department_id": "dept_se"},
  {"name":"Yomna Mohammad Ali Ibrahim ", "scholar_id": "RGF5OxIAAAAJ", "department_id": "dept_se"},
  {"name":"Moez Krichen ", "scholar_id": "yaX8Tu4AAAAJ", "department_id": "dept_se"}
]  

# Function to extract faculty profiles and store them
def extract_faculty_profiles_and_store(department_data):
    college_id = "faculty_computing"
    for faculty in department_data:
        department_id = faculty['department_id']
        store_faculty_data(college_id, department_id, faculty)

# Run the extraction for CS department
#extract_faculty_profiles_and_store(cs_department)
# Run the extraction for SN department
#extract_faculty_profiles_and_store(sn_department)
# Run the extraction for IT department
#extract_faculty_profiles_and_store(it_department)
# Run the extraction for SE department

extract_faculty_profiles_and_store(se_department)