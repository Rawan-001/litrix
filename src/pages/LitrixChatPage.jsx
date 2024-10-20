import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import Header from "../components/common/Header";

const LitrixChatPage = ({ college, department, scholarId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // Fetch recent publications by scholarId
    const fetchRecentPublications = async (scholarId) => {
        try {
            const publicationsRef = collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`);
            const publicationsSnapshot = await getDocs(publicationsRef);

            const recentPublications = publicationsSnapshot.docs
                .map(doc => doc.data())
                .filter(pub => pub.pub_year === 2024)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            return recentPublications;
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
            const collaboratorsSet = new Set();

            for (const facultyDoc of facultyMembersSnapshot.docs) {
                const facultyData = facultyDoc.data();
                const publicationsRef = collection(facultyMembersRef, facultyDoc.id, 'publications');
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
            return [];
        }
    };

    // Suggest a new research idea
    const suggestResearchIdea = async () => {
        try {
            const recentPublications = await fetchRecentPublications(scholarId);
            const prompt = `Based on the following recent publications:\n${recentPublications.map(pub => `${pub.title}: ${pub.abstract}`).join('\n')}\nSuggest a creative new research idea for this faculty member.`;

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
        } catch (error) {
            console.error("Error suggesting research idea:", error);
            return "I'm unable to suggest a research idea at this moment.";
        }
    };

    // Handle sending message
    const handleSendMessage = async () => {
        const newMessage = { role: 'user', text: input };
        setMessages([...messages, newMessage]);

        if (input.toLowerCase().includes("recent publications")) {
            const recentPublications = await fetchRecentPublications(scholarId);
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `Here are your recent publications: ${recentPublications.map(pub => pub.title).join(', ')}` }]);
        } else if (input.toLowerCase().includes("find collaborators in ai research")) {
            const collaborators = await findCollaboratorsInAI();
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `Here are potential collaborators in AI: ${collaborators.join(', ')}` }]);
        } else if (input.toLowerCase().includes("suggest a new research idea")) {
            const researchIdea = await suggestResearchIdea();
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: `Here's a creative research idea for you: ${researchIdea}` }]);
        } else {
            setMessages(prevMessages => [...prevMessages, { role: 'bot', text: "Sorry, I didn't understand that." }]);
        }

        setInput(''); // Clear input
    };

    // Design similar to ChatGPT with messages aligned left (bot) and right (user)
    const styles = {
        chatbotContainer: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '90vh', // تصغير المساحة بحيث يكون بار الكتابة مرئي
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: '#fff', // خلفية بيضاء
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            padding: '20px',
        },
        messagesContainer: {
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
        },
        messageRow: {
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '10px', // إضافة مسافة بين الرسائل
        },
        messageBubble: {
            padding: '12px 18px',
            borderRadius: '20px',
            maxWidth: '75%', // عرض أقصى للرسالة
            display: 'inline-block', // لنجعل الفقاعة تأخذ حجم النص
            wordWrap: 'break-word',
            fontSize: '16px',
        },
        userMessage: {
            backgroundColor: '#007bff',
            color: 'white',
            textAlign: 'right',
            borderRadius: '20px 20px 0 20px', // حواف مستديرة من الطرف الأيسر العلوي
            marginLeft: 'auto', // تأكيد وضع الرسالة في اليمين
        },
        botMessage: {
            backgroundColor: '#eaeaea',
            color: '#333',
            textAlign: 'left',
            borderRadius: '20px 20px 20px 0',
            marginRight: 'auto', // تأكيد وضع الرسالة في اليسار
        },
        avatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#ccc', // لون مميز للأفتار (رمادي)
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '10px', // إضافة مسافة بين الأفتار والرسالة
        },
        avatarUser: {
            marginLeft: '10px', // مسافة بين الرسالة والأفتار للمستخدم
            marginRight: '0', // إلغاء المسافة اليمنى للمستخدم
        },
        inputArea: {
            display: 'flex',
            padding: '10px',
            borderTop: '1px solid #ddd',
            backgroundColor: '#fff',
            borderRadius: '30px', // مستطيل دائري للبار
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        },
        inputBox: {
            flex: 1,
            padding: '10px',
            borderRadius: '20px',
            border: '1px solid #ccc',
            fontSize: '16px',
            marginRight: '10px',
        },
        sendButton: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px',
        },
    };

    return (
      <div className="flex-1 relative z-10 overflow-auto">
        <Header title="Litrix Chat" />
        <div style={styles.chatbotContainer}>
            <div style={styles.messagesContainer}>
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        style={{
                            ...styles.messageRow,
                            ...(message.role === 'user' ? { flexDirection: 'row-reverse' } : {}),
                        }} // وضع الأفتار على اليمين لرسائل المستخدم وعلى اليسار للبوت
                    >
                        <div 
                            style={{
                                ...styles.avatar, 
                                ...(message.role === 'user' ? styles.avatarUser : {}),
                            }}
                        >
                            {message.role === 'user' ? 'U' : 'I'}
                        </div>
                        <div 
                            style={{ 
                                ...styles.messageBubble, 
                                ...(message.role === 'user' ? styles.userMessage : styles.botMessage),
                            }}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
            </div>
            <div style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    style={styles.inputBox}
                />
                <button onClick={handleSendMessage} style={styles.sendButton}>
                    Send
                </button>
            </div>
        </div>
      </div>
    );
};

export default LitrixChatPage;
