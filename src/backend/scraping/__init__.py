
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from scholarly import scholarly
import logging
import openai

# Initialize Firebase
cred = credentials.Certificate('/Users/ruba/Downloads/Majd/litrix/litrix-f06e0-firebase-adminsdk-5uspj-5aecd2badc.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize Flask
app = Flask(__name__)
CORS(app, origins=["https://litrix-f06e0.web.app"])

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get("query")
    college = data.get("college")
    department = data.get("department")

    # Retrieve relevant docs from Firestore
    relevant_docs = retrieve_relevant_docs(query, college, department)

    # Prepare context for GPT
    context = "\n".join([f"{doc['name']}: {doc['interests']}" for doc in relevant_docs])
    prompt = f"User Query: {query}\nContext:\n{context}"

    # Generate a response using OpenAI GPT
    generated_response = generate_response(prompt)
    
    return jsonify({"response": generated_response})

def retrieve_relevant_docs(query, college, department):
    collection_ref = db.collection("colleges").document(college).collection("departments").document(department).collection("faculty_members")
    results = collection_ref.stream()
    
    relevant_docs = []
    
    for doc in results:
        data = doc.to_dict()
        if query.lower() in data.get("interests", "") or query.lower() in data.get("name", "").lower():
            relevant_docs.append(data)

    return relevant_docs

def generate_response(prompt):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are an AI-powered assistant for faculty research management."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
    )
    
    return response['choices'][0]['message']['content']
