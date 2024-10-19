import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const LitrixChatPage = ({ college, department, scholarId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // Fetch recent publications by scholarId
    const fetchRecentPublications = async (scholarId) => {
        try {
            const publicationsRef = collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`);
            const publicationsSnapshot = await getDocs(publicationsRef);
            return publicationsSnapshot.docs
                .map(doc => doc.year())
                .sort((a, b) => new Date(b.year) - new Date(a.yera)); 
        } catch (error) {
            console.error("Error fetching recent publications:", error);
            return [];
        }
    };

    // Find collaborators in AI research
    const findCollaboratorsInAI = async () => {
        try {
            const facultyMembersRef = collection(db, `colleges/${college}/departments/${department}/faculty_members`);
            const facultyMembersSnapshot = await getDocs(facultyMembersRef);
            return facultyMembersSnapshot.docs.filter(doc => {
                const data = doc.data();
                return data.researchInterests && data.researchInterests.includes('Artificial Intelligence');
            }).map(doc => doc.data());
        } catch (error) {
            console.error("Error finding collaborators:", error);
            return [];
        }
    };

    // Summarize research output for the department
    const summarizeResearchOutput = async () => {
        try {
            const publicationsRef = collection(db, `colleges/${college}/departments/${department}/publications`);
            const publicationsSnapshot = await getDocs(publicationsRef);
            return { totalPublications: publicationsSnapshot.size };
        } catch (error) {
            console.error("Error summarizing research output:", error);
            return { totalPublications: 0 };
        }
    };

    // Generate response using OpenAI API
    const generateResponse = async (input, relevantData) => {
        if (relevantData.length === 0) {
            return "I'm sorry, I couldn't find any relevant publications.";
        }

        const prompt = `User input: ${input}\nRelevant publications:\n${relevantData.map(pub => `${pub.title}: ${pub.abstract}`).join('\n')}\nGenerate a response:`;

        try {
            const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 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` 
                },
                body: JSON.stringify({
                    prompt: prompt,
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            return data.choices[0].text.trim();
        } catch (error) {
            console.error("Error generating response:", error);
            return "I'm having trouble generating a response right now.";
        }
    };

    // Suggest a new research idea based on stored data
    const suggestResearchIdea = async () => {
        try {
            // Fetch recent publications or user interests
            const recentPublications = await fetchRecentPublications(scholarId);
            const prompt = `Based on the following recent publications:\n${recentPublications.map(pub => `${pub.title}: ${pub.abstract}`).join('\n')}\nSuggest a creative new research idea for this faculty member.`;

            const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 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` 
                },
                body: JSON.stringify({
                    prompt: prompt,
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            return data.choices[0].text.trim();
        } catch (error) {
            console.error("Error suggesting research idea:", error);
            return "I'm unable to suggest a research idea at this moment.";
        }
    };

    // Handle sending message and bot response
    const handleSendMessage = async () => {
        const newMessage = { role: 'user', text: input };
        setMessages([...messages, newMessage]);

        if (input.toLowerCase().includes("recent publications")) {
            const recentPublications = await fetchRecentPublications(scholarId);
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `Here are your recent publications: ${recentPublications.map(pub => pub.title).join(', ')}` }]);
        } else if (input.toLowerCase().includes("find collaborators in ai research")) {
            const collaborators = await findCollaboratorsInAI();
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `Here are potential collaborators in AI: ${collaborators.map(c => c.name).join(', ')}` }]);
        } else if (input.toLowerCase().includes("research output of the computer science department")) {
            const outputSummary = await summarizeResearchOutput();
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `The ${department} department has produced ${outputSummary.totalPublications} publications.` }]);
        } else if (input.toLowerCase().includes("suggest a new research idea")) {
            const researchIdea = await suggestResearchIdea();
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `Here's a creative research idea for you: ${researchIdea}` }]);
        } else {
            const botResponse = await generateResponse(input, []); 
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: botResponse }]);
        }

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