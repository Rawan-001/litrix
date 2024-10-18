import scholarly
from scholarly import scholarly
import json
import logging
import time
import random
import requests


# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

# List of proxies 
proxy_pool = [
   '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823'
   '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823'
   '542bd662984a24e6624b__cr.gb,us,no,ie,au:31bb55cc5004a097@gw.dataimpulse.com:823'
]

def get_random_proxy():
    return random.choice(proxy_pool)

def fetch_author_and_publications(scholar_id, filename):
    proxy = get_random_proxy()  # Get a random proxy
    try:
        author = scholarly.search_author_id(scholar_id)
        author_filled = scholarly.fill(author)

        # Fetch each publication's details
        publications = []
        for pub in author_filled['publications']:
            pub_filled = scholarly.fill(pub)  # Fill each publication with full details
            publications.append(pub_filled)

        author_filled['publications'] = publications
        logging.info(f"Successfully scraped data for {author_filled['name']}")

        # Convert the author's data to JSON format
        author_json = json.dumps(author_filled, indent=4)

        # Save the JSON data to a file
        with open(filename, 'w') as json_file:
            json.dump(author_filled, json_file, indent=4)
            logging.info(f"Data for scholar {scholar_id} exported to {filename}")

    except Exception as e:
        logging.error(f"Error fetching or exporting data for scholar {scholar_id}: {e}")
        logging.error(f"Retrying after delay...")
        time.sleep(5)
        fetch_author_and_publications(scholar_id, filename)
        
# Function to export multiple authors in smaller batches
def export_multiple_authors(authors_data, batch_size=5):
    total_authors = len(authors_data)
    for start_idx in range(0, total_authors, batch_size):
        end_idx = min(start_idx + batch_size, total_authors)
        logging.info(f"Processing batch {start_idx + 1} to {end_idx}")

        # Process each author in the batch
        for author in authors_data[start_idx:end_idx]:
            scholar_id = author['scholar_id']
            filename = f"{author['name'].replace(' ', '_')}_data.json"  # Create a filename based on the author's name
            fetch_author_and_publications(scholar_id, filename)
        
        # Delay between batches
        batch_delay = random.uniform(5, 7)  # Delay between 5 to 7 seconds between batches
        logging.info(f"Waiting for {batch_delay:.2f} seconds before the next batch...")
        time.sleep(batch_delay)

# data for multiple authors
cs_authors_list = [
  {"name": "Abdul Hannan Abdul Mannan Shaikh", "scholar_id": "blwPeXQAAAAJ", "email":"ahannan@bu.edu.sa" },
  {"name": "Abdulkareem Aodah Alzahrani", "scholar_id": "JSQbyBgAAAAJ", "email":"ao.alzahrani@bu.edu.sa"},
  {"name": "Abdullah Alomari", "scholar_id": "1u1Vah8AAAAJ", "email":"alomari@bu.edu.sa"},
  {"name": "Eidah Mohamed Alzahrani", "scholar_id": "MQeK2TUAAAAJ", "email":"em.alzahrani@bu.edu.sa"},
  {"name": "Esam Alzahrani", "scholar_id": "05Jx6QkAAAAJ", "email":"esalzahrani@bu.edu.sa"},
  {"name": "Fahad Ali Ghamdi", "scholar_id": "BqE8XJUAAAAJ", "email": "fghamdi@bu.edu.sa"},
  {"name": "Hani Ali Harb", "scholar_id": "VS2klEgAAAAJ", "email":"haharb@bu.edu.sa"},
  {"name": "Hassan Alkhiri", "scholar_id": "jDrt2XUAAAAJ", "email": "halkhiri@bu.edu.sa"},
  {"name": "Ibrahim Alghamdi", "scholar_id": "-Ee7QMYAAAAJ", "email":"ia.alghamdi@bu.edu.sa"},
  {"name": "Majzoob Kamalaldin Omer", "scholar_id": "KF-CfgoAAAAJ", "email": "mkomer@bu.edu.sa"},
  {"name": "Mohammed Abdulrahman Alliheedi", "scholar_id": "Wcoweq8AAAAJ", "email":"malliheedi@bu.edu.sa"},
  {"name": "Mohammed Alghamdi", "scholar_id": "Gtbbx1YAAAAJ", "email":"mialmushilah@bu.edu.sa"},
  {"name": "Musaad Alzahrani", "scholar_id": "g-tdUbYAAAAJ", "email":"malzahr@bu.edu.sa"},
  {"name": "Nizar Hasan Alsharif", "scholar_id": "budxbSoAAAAJ", "email":"nizar@bu.edu.sa"},
  {"name": "Rahmat Budiarto", "scholar_id": "Qi24UpwAAAAJ", "email":"rahmat@bu.edu.sa"},
  {"name": "Rami Jamaan Saeed Alzahrani", "scholar_id": "IzsoS9MAAAAJ", "email":"rjsaeed@bu.edu.sa"},
  {"name": "Saad Alqithami", "scholar_id": "HkgKEAsAAAAJ", "email":"salqithami@bu.edu.sa"},
  {"name": "Sami Abdulrahman Alghamdi", "scholar_id": "CiEU7s8AAAAJ","email":"samialghamdi@bu.edu.sa"},
  {"name": "Walid Kamal Ghamry Elsayed", "scholar_id": "YeUTzMwAAAAJ","email":"wkamal@bu.edu.sa"},
  {"name": "Taghreed Abdalwahab Alghamdi", "scholar_id":"32NV4n4AAAAJ", "email":"talshurihi@bu.edu.sa"},
  {"name": "Muhammad Qaiser Saleem", "scholar_id": "XCxbNmoAAAAJ", "email":"qsaleem@bu.edu.sa"},
  {"name": "Ikram Mohamed Moalla", "scholar_id": "xKsDNWQAAAAJ", "email":"imoalla@bu.edu.sa"},
  {"name": "Adil Fahad Al harthi", "scholar_id": "0_1pixgAAAAJ", "email":"afalharthi@bu.edu.sa"},
  {"name": "Muneer Abdullah Saif Saeed", "scholar_id": "Ut7IZtYAAAAJ", "email":"masaeed@bu.edu.sa"},
  {"name": "Ahmed S. Khalaf", "scholar_id": "vySNGjYAAAAJ", "email":"akhalaf@bu.edu.s"},
  {"name": "Abdullah Saeed Ibrahim Alghotmi Alghamdi", "scholar_id": "UFX6LxEAAAAJ", "email":"aalghotmi@bu.edu.sa"},
  {"name": "Mohammad Eid Alzahrani", "scholar_id": "0rfEfNkAAAAJ", "email":"meid@bu.edu.sa"},
  {"name": "Amel Ben Slimane", "scholar_id": "_Eyk9OwAAAAJ", "email":"aslimane@bu.edu.sa"},
  {"name": "Dr. Mohammed Abdullah Al Qurashi", "scholar_id": "_Eyk9OwAAAAJ", "email":"malqurashi@bu.edu.sa"}
]

# Export all authors in the cs list
export_multiple_authors(cs_authors_list)


sn_authors_list = [
  {"name": "Maha Marzoog Alamri", "scholar_id": "R3hUdWoAAAAJ", "email":"m.alamri@bu.edu.sa"},
  {"name": "Hassan Abdullah Ahmad", "scholar_id": "RHTOwC4AAAAJ", "email":"haalghamdi@bu.edu.sa"},
  {"name": "Ahmed Abdulrahman Alghamdi", "scholar_id": "9iW6AKAAAAAJ", "email":"alhabish@bu.edu.sa"},
  {"name": "Mohammed Sirelkhtem Adrees", "scholar_id": "x0DZnTgAAAAJ", "email":"midress@bu.edu.sa"},
  {"name": "Rabea Alghamdi", "scholar_id": "iHvu2-YAAAAJ", "email":"raralghamdi@bu.edu.sa"},
  {"name": "Ahlam Altuhami", "scholar_id": "lURTCEIAAAAJ", "email":"anabli@bu.edu.sa"},
  {"name": "Waleed Mahmoud Ead", "scholar_id": "Zs28nxwAAAAJ", "email":"waleed.m@bu.edu.sa"}
]

# Export all authors in the sn list
export_multiple_authors(sn_authors_list)

it_authors_list = [
  {"name": "Ahmad Alqarni", "scholar_id": "WdKJwQUAAAAJ","email":"aaalqarni@bu.edu.sa"},
  {"name": "Nouf Alzahrani", "scholar_id": "lmQMvCUAAAAJ","email":"noufalzahrani@bu.edu.sa"},
  {"name": "Ali Alowayr", "scholar_id": "B_ZvEtEAAAAJ", "email":"aalowayr@bu.edu.sa"},
  {"name": "Abdullah Ahmad Alshehri", "scholar_id": "0N86D0QAAAAJ", "email":"aashehri@bu.edu.sa"},
  {"name": "Badeen Kerim", "scholar_id": "7INLDbgAAAAJ", "email":"bkerim@bu.edu.sa"},
  {"name": "Ahmed Mahmoud Mostafa Youssef", "scholar_id": "9NPfxXYAAAAJ", "email":"amyosof@bu.edu.sa"},
  {"name": "Nejib Ben Aoun", "scholar_id": "XzD4xzoAAAAJ", "email":"nbenaoun@bu.edu.sa"},
  {"name": "Nayeem Ahmad Khan", "scholar_id": "kxhHWnkAAAAJ", "email":"nayeem@bu.edu.sa"},
  {"name": "Sonia Saeed Lajmi", "scholar_id": "h9j1S48AAAAJ", "email":"slajmi@bu.edu.sa"},
  {"name": "Ali Huseein Tahoun", "scholar_id": "vo8ofv4AAAAJ", "email":"aabutahoun@bu.edu.sa"},
  {"name": "Bader Alghamdi  ", "scholar_id": "bCZ-uAwAAAAJ", "email":"baalghamdi@bu.edu.sa"},
  {"name": "Ahmad Alshaflut  ", "scholar_id": "3Wo0U6gAAAAJ", "email":"a.alshaflut@bu.edu.sa"},
  {"name": "Ahmad Ali Alshehri", "scholar_id": "AgM-jXIAAAAJ", "email":"a.alyehyawi@bu.edu.sa"} 
]

# Export all authors in the sn list
export_multiple_authors(it_authors_list)

se_authors_list = [
 {"name": "Anwar Saeed Saleh Alsokari", "scholar_id": "SknhXP0AAAAJ", "email":"asalsoakri@bu.edu.sa"},
 {"name":"Yomna Mohammad Ali Ibrahim ", "scholar_id": "RGF5OxIAAAAJ", "email":"y.ibrahim@bu.edu.sa" },
 {"name":"Moez Krichen ", "scholar_id": "yaX8Tu4AAAAJ", "email" : "mkreishan@bu.edu.sa"}
]  
# Export all authors in the se list
export_multiple_authors(se_authors_list)