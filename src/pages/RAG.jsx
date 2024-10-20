// src/pages/LitrixChatPage.jsx
import React, { useState } from 'react';
import { db } from '../firebaseConfig'; // Adjust the path as necessary
import { collection, getDocs } from 'firebase/firestore';

const LitrixChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');


    const retrieveRelevantData = async (input, college, department) => {
        const keywords = input.toLowerCase().split(' ');

        // Fetching faculty members from Firestore
        const facultyMembersRef = collection(db, 'colleges', college, 'departments', department, 'faculty_members');
        const facultyMembersSnapshot = await getDocs(facultyMembersRef);
        
        let relevantPublications = [];

        // Iterate through each faculty member
        for (const facultyDoc of facultyMembersSnapshot.docs) {
            const scholarId = facultyDoc.id;
            const publicationsRef = collection(facultyMembersRef, scholarId, 'publications');
            const publicationsSnapshot = await getDocs(publicationsRef);
            
            // Check each publication for relevant data
            publicationsSnapshot.docs.forEach(pubDoc => {
                const publicationData = pubDoc.data();
                if (keywords.some(keyword => 
                    publicationData.title.toLowerCase().includes(keyword) || 
                    publicationData.abstract.toLowerCase().includes(keyword)
                )) {
                    relevantPublications.push(publicationData);
                }
            });
        }

        return relevantPublications;
    };

    const generateResponse = async (input, relevantData) => {
        if (relevantData.length === 0) {
            return "I'm sorry, I couldn't find any relevant publications.";
        }

        const apiKey = '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'; // Replace with your actual API key
        const prompt = `User input: ${input}\nRelevant publications:\n${relevantData.map(pub => `${pub.title}: ${pub.abstract}`).join('\n')}\nGenerate a response:`;

        const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        return data.choices[0].text.trim();
    };

    const handleSendMessage = async () => {
        const newMessage = { role: 'user', text: input };
        setMessages([...messages, newMessage]);

        // Specify the college and department based on user context or hardcoded values
        const college = "Faculty of Computing and Information"; 
        const department = "Department of Computer Science"; 

        // Fetch relevant publications
        const relevantData = await retrieveRelevantData(input, college, department);
        
        // Generate response based on relevant data
        const response = await generateResponse(input, relevantData);
        setMessages([...messages, newMessage, { role: 'bot', text: response }]);
        setInput('');
    };

    return (
        <div className="chatbot">
            <h2>Litrix Chatbot</h2>
            <div className="messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        {message.text}
                    </div>
                ))}
            </div>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
            <button onClick={handleSendMessage}>Send</button>
        </div>
    );
};

export default LitrixChatPage;