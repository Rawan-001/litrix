import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function NotificationButton({ recipientId, children }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const sendNotification = async () => {
    if (!title || !body) {
      return message.warning('Please enter both a title and a body.');
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,            
        title,                  
        message: body,          
        type: 'manual',        
        timestamp: serverTimestamp(), 
      });
      message.success('Notification sent successfully');
      setVisible(false);
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Error sending notification:', error);
      message.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <span
        style={{ display: 'inline-block', cursor: 'pointer' }}
        onClick={() => setVisible(true)}
      >
        {children}
      </span>

      <Modal
        title="Send Notification"
        visible={visible}            
        onCancel={() => setVisible(false)}
        onOk={sendNotification}
        okText="Send"
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <Input
          placeholder="Notification Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-2"
        />
        <Input.TextArea
          placeholder="Notification Body"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
        />
      </Modal>
    </>
  );
}
