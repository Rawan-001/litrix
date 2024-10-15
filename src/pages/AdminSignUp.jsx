import React, { useState } from 'react';
import { Form, Input, Button, message, Modal } from 'antd';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const SignUpPageForAdministrators = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    try {
      // إنشاء مستخدم جديد باستخدام Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // إضافة بيانات المستخدم إلى Firestore
      const adminDocRef = doc(db, `users/administrators/${user.uid}`);
      await setDoc(adminDocRef, {
        uid: user.uid,
        email: formData.email,
        role: 'administrator',
      });

      // تسجيل دخول الإداري تلقائياً بعد التسجيل
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setIsModalVisible(true);
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  const handleConfirm = () => {
    setIsModalVisible(false);
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Form layout="vertical">
          <Form.Item label="Email" required>
            <Input type="email" value={formData.email} name="email" onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Password" required>
            <Input.Password value={formData.password} name="password" onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Confirm Password" required>
            <Input.Password value={formData.confirmPassword} name="confirmPassword" onChange={handleChange} />
          </Form.Item>
          <Button type="primary" onClick={handleAdminSignUp}>Sign Up as Administrator</Button>
        </Form>
        <Modal
          title="Admin Profile Confirmation"
          open={isModalVisible}
          onOk={handleConfirm}
          onCancel={() => setIsModalVisible(false)}
        >
          <p><strong>Email:</strong> {formData.email}</p>
        </Modal>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f0f2f5',
    position: 'relative',
  },
  card: {
    width: '100%',
    maxWidth: '500px',
    padding: '40px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
};

export default SignUpPageForAdministrators;
