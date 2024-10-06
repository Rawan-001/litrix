import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card } from 'antd';
import { db } from '../firebaseConfig'; // تأكد من استيراد Firebase config
import { doc, setDoc } from 'firebase/firestore'; // Firestore methods

const LinkScholarIdPage = ({ user }) => {
  const [scholarId, setScholarId] = useState('');
  const navigate = useNavigate();

  const handleSaveScholarId = async () => {
    try {
      // حفظ معرف Google Scholar في Firestore
      const userDoc = doc(db, "users", user.uid);
      await setDoc(userDoc, { scholarId: scholarId }, { merge: true });
      alert('Scholar ID saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(`Failed to save Scholar ID: ${error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <Form layout="vertical" onFinish={handleSaveScholarId}>
          <Form.Item label="Google Scholar ID" required>
            <Input
              type="text"
              value={scholarId}
              onChange={(e) => setScholarId(e.target.value)}
              placeholder="Enter your Google Scholar ID"
              required
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Save Scholar ID
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: '#fff' },
  card: { width: '400px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' },
};

export default LinkScholarIdPage;
