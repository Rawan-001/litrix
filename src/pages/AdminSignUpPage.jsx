import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'; // إضافة signInWithEmailAndPassword
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const AdminSignUpPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    role: 'admin', // ثابت على admin
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    try {
      // إنشاء حساب في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // تخزين البيانات في Firestore
      const userDocRef = doc(db, `users/${user.uid}`);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        role: formData.role, // تخزين الـ role كـ admin
      });

      message.success('Admin account created successfully!');

      // تسجيل الدخول مباشرة بعد إنشاء الحساب
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // إعادة توجيه المستخدم إلى صفحة الهوم بعد تسجيل الدخول
      navigate('/');

    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <Form layout="vertical" style={styles.form}>
          <Form.Item label="First Name" required>
            <Input value={formData.firstName} name="firstName" onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Email" required>
            <Input type="email" value={formData.email} name="email" onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Password" required>
            <Input.Password value={formData.password} name="password" onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Confirm Password" required>
            <Input.Password value={formData.confirmPassword} name="confirmPassword" onChange={handleChange} />
          </Form.Item>
          <Button type="primary" onClick={handleSignUp}>Sign Up as Administrator</Button>
        </Form>
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
  },
  formWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  form: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
};

export default AdminSignUpPage;
