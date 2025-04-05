import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc } from 'firebase/firestore';
import Header from "../components/common/Header";

const LitrixChatPage = ({ college, department, scholarId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Validate path segments to avoid double slashes
    const validatePath = (segments) => {
        return segments.filter(segment => segment && segment.trim() !== '');
    };

    // Get reference to publications collection with validated path
    const getPublicationsRef = (scholarId) => {
        const validSegments = validatePath(['colleges', college, 'departments', department, 'faculty_members', scholarId, 'publications']);
        
        if (validSegments.length < 7) {
            throw new Error("Invalid path: Missing required segments (college, department, or scholarId)");
        }
        
        return collection(db, validSegments.join('/'));
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch recent publications by scholarId
    const fetchRecentPublications = async (scholarId) => {
        try {
            if (!scholarId) {
                throw new Error("Scholar ID is required");
            }
            
            const publicationsRef = getPublicationsRef(scholarId);
            const publicationsSnapshot = await getDocs(publicationsRef);

            const recentPublications = publicationsSnapshot.docs
                .map(doc => doc.data())
                .filter(pub => pub.pub_year === 2024)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            return recentPublications;
        } catch (error) {
            console.error("Error fetching recent publications:", error);
            setError(`Unable to fetch publications: ${error.message}`);
            return [];
        }
    };

    // Find collaborators in AI research
    const findCollaboratorsInAI = async () => {
        try {
            if (!college || !department) {
                throw new Error("College and department information is required");
            }
            
            const segments = validatePath(['colleges', college, 'departments', department, 'faculty_members']);
            const facultyMembersRef = collection(db, segments.join('/'));
            const facultyMembersSnapshot = await getDocs(facultyMembersRef);
            const collaboratorsSet = new Set();

            for (const facultyDoc of facultyMembersSnapshot.docs) {
                const facultyData = facultyDoc.data();
                const publicationsRef = collection(db, segments.join('/'), facultyDoc.id, 'publications');
                const publicationsSnapshot = await getDocs(publicationsRef);

                publicationsSnapshot.docs.forEach(pubDoc => {
                    const publicationData = pubDoc.data();
                    if (publicationData.abstract && publicationData.abstract.includes("Artificial Intelligence")) {
                        collaboratorsSet.add(facultyData.name);
                    }
                });
            }

            return Array.from(collaboratorsSet);
        } catch (error) {
            console.error("Error finding collaborators:", error);
            setError(`Unable to find collaborators: ${error.message}`);
            return [];
        }
    };

    // Suggest a new research idea
    const suggestResearchIdea = async () => {
        try {
            const recentPublications = await fetchRecentPublications(scholarId);
            
            if (recentPublications.length === 0) {
                return "I couldn't find recent publications to base a suggestion on. Please make sure your publication data is available.";
            }
            
            const prompt = `Based on the following recent publications:\n${recentPublications.map(pub => `${pub.title}: ${pub.abstract}`).join('\n')}\nSuggest a creative new research idea for this faculty member.`;

            // For demo purposes, return a generic suggestion
            // In production, you would use your OpenAI API call
            return "Based on your recent publications, I suggest exploring the intersection of machine learning and data visualization techniques to create more intuitive representations of complex research findings.";
            
            /* Uncomment for actual API usage:
            const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_OPENAI_API_KEY`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            return data.choices[0].text.trim();
            */
        } catch (error) {
            console.error("Error suggesting research idea:", error);
            setError("Unable to suggest a research idea at this time.");
            return "I'm unable to suggest a research idea at this moment.";
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Trigger file input click
    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    // Handle sending message
    const handleSendMessage = async () => {
        if (!input.trim() && !selectedFile) return;
        
        // Clear any previous errors
        setError(null);
        
        let newMessage = { role: 'user', text: input };
        
        // If there's a file selected, add it to the message
        if (selectedFile) {
            newMessage.file = {
                name: selectedFile.name,
                type: selectedFile.type,
                // In a real app, you would upload the file to storage and get a URL
                // This is just a placeholder
                url: URL.createObjectURL(selectedFile)
            };
        }
        
        setMessages([...messages, newMessage]);
        setInput('');
        setSelectedFile(null);
        setIsLoading(true);

        try {
            let botResponse = "";

            if (input.toLowerCase().includes("recent publications")) {
                const recentPublications = await fetchRecentPublications(scholarId);
                
                if (recentPublications.length > 0) {
                    botResponse = `Here are your recent publications: ${recentPublications.map(pub => pub.title).join(', ')}`;
                } else {
                    botResponse = "I couldn't find any recent publications. Please make sure your data is properly configured.";
                }
            } else if (input.toLowerCase().includes("find collaborators in ai research")) {
                const collaborators = await findCollaboratorsInAI();
                
                if (collaborators.length > 0) {
                    botResponse = `Here are potential collaborators in AI: ${collaborators.join(', ')}`;
                } else {
                    botResponse = "I couldn't find any AI research collaborators at this time.";
                }
            } else if (input.toLowerCase().includes("suggest a new research idea")) {
                const researchIdea = await suggestResearchIdea();
                botResponse = `Here's a creative research idea for you: ${researchIdea}`;
            } else if (selectedFile && !input.trim()) {
                botResponse = `I've received your file: ${selectedFile.name}. How would you like me to analyze this document?`;
            } else {
                botResponse = "Sorry, I didn't understand that. You can ask me about recent publications, finding collaborators in AI research, or suggesting new research ideas.";
            }

            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Error processing message:", error);
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: "An error occurred while processing your request. Please check the console for details." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 relative z-10 overflow-hidden flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
            <Header title="Litrix Chat" />
            
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 h-[calc(100vh-64px)]">
                {/* Error message display */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 shadow-sm border border-red-200 animate-fade-in">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            
                {/* Chat container */}
                <div className="flex-1 overflow-y-auto mb-4 pr-2">
                    <div className="space-y-4 py-2">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <div className="flex justify-center my-8">
                                <div className="bg-white rounded-lg p-6 shadow-md max-w-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Litrix Chat</h3>
                                    <p className="text-gray-600 mb-3">
                                        You can ask me about:
                                    </p>
                                    <ul className="space-y-2 text-gray-600 mb-2">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                            Recent scientific publications
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                            Finding AI research collaborators
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                            Suggesting new research ideas
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                                style={{animationDelay: `${index * 0.1}s`}}
                            >
                                {message.role === 'bot' && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md mr-2">
                                        L
                                    </div>
                                )}
                                
                                <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                                    message.role === 'user' 
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 rounded-tl-none'
                                }`}>
                                    {message.file && (
                                        <div className="mb-2">
                                            <div className="flex items-center p-2 bg-white bg-opacity-20 rounded-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                <span className="text-sm truncate">{message.file.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm md:text-base whitespace-pre-wrap">{message.text}</p>
                                </div>
                                
                                {message.role === 'user' && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-medium shadow-sm ml-2">
                                        U
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md mr-2">
                                    L
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm rounded-tl-none">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Selected file preview */}
                {selectedFile && (
                    <div className="bg-blue-50 p-2 rounded-lg mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-sm text-blue-700 truncate">{selectedFile.name}</span>
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)} 
                            className="text-blue-500 hover:text-blue-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Input area */}
                <div className="sticky bottom-0 bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
                    <div className="flex items-center">
                        {/* Hidden file input */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
                        />
                        
                        {/* Attachment button */}
                        <button 
                            onClick={handleAttachmentClick}
                            className="p-2 text-gray-500 hover:text-blue-500 transition"
                            title="Attach file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 p-3 focus:outline-none text-gray-700 placeholder-gray-400 text-base"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isLoading || (!input.trim() && !selectedFile)}
                            className={`ml-2 p-2 rounded-full ${
                                isLoading || (!input.trim() && !selectedFile)
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-500 text-white hover:bg-blue-600 transition'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform rotate-90">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add CSS animation for fade-in effect
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-fade-in-up {
        animation: fadeInUp 0.3s ease-out forwards;
    }
    
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

export default LitrixChatPage;