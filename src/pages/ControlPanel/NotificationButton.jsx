// src/ControlPanel/NotificationButton.jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function NotificationButton({ recipientId, children }) {
  // Local state for modal visibility, form fields and loading
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  // Handler to send the notification
  const sendNotification = async () => {
    if (!title || !body) {
      return message.warning('Please enter both a title and a body.');
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,            // the user ID to receive this notification
        title,                  // notification title
        message: body,          // notification body
        type: 'manual',         // custom/manual notification
        timestamp: serverTimestamp(), // store server timestamp
      });
      message.success('Notification sent successfully');
      // Reset form & close modal
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
      {/* Clicking this span will open the modal */}
      <span
        style={{ display: 'inline-block', cursor: 'pointer' }}
        onClick={() => setVisible(true)}
      >
        {children}
      </span>

      <Modal
        title="Send Notification"
        visible={visible}            // use `visible` for AntD v4
        onCancel={() => setVisible(false)}
        onOk={sendNotification}
        okText="Send"
        cancelText="Cancel"
        confirmLoading={loading}
      >
        {/* Title input */}
        <Input
          placeholder="Notification Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-2"
        />
        {/* Body textarea */}
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
