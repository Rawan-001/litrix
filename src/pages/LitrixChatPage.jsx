import React, { useState } from 'react';
import { PaperAirplaneIcon,  } from '@heroicons/react/24/solid';
import Header from '../components/common/Header';

function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { user: 'user', text: input }]);
      setInput('');
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
      </div>
      <Header title="Litrix Chat" />
      <div style={styles.chatWindow}>
        {messages.map((message, index) => (
          <div key={index} style={message.user === 'user' ? styles.userMessage : styles.botMessage}>
            <div style={styles.messageContent}>{message.text}</div>
          </div>
        ))}
        <div style={styles.botResponse}>
          <div style={styles.botMessage}>
            <div style={styles.messageContent}> How can I help you today? 🤖</div>
          </div>
        </div>
      </div>

      <div style={styles.chatInputContainer}>
        <input
          style={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter"
        />
        <button style={styles.sendButton} onClick={sendMessage}>
          <PaperAirplaneIcon style={styles.sendIcon} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    justifyContent: 'flex-start',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#779ecb', 
    padding: '5px',
    color: 'white',
  },
  chatHeaderIcon: {
    width: '30px',
    height: '30px',
    marginRight: '10px',
  },
  chatTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Cairo, sans-serif',
  },
  chatWindow: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#fff',
  },
  userMessage: {
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: '#e5e7eb',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '15px',
    fontFamily: 'Cairo, sans-serif',
  },
  botMessage: {
    display: 'flex',
    justifyContent: 'flex-start',
    backgroundColor: '#f3f4f6',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '15px',
    fontFamily: 'Cairo, sans-serif',
  },
  messageContent: {
    padding: '10px 20px',
    borderRadius: '15px',
    fontSize: '16px',
  },
  chatInputContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '50px',
    marginTop: '50px',
  },
  chatInput: {
    width: '50%',
    padding: '10px 15px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '25px',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.20)',
    outline: 'none',
  },
  sendButton: {
    backgroundColor: '#779ecb', 
    border: 'none',
    padding: '15px 15px',
    marginLeft: '10px',
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  sendIcon: {
    width: '20px',
    height: '20px',
  },
};

export default ChatBot;
