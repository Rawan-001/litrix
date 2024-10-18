import React, { useState } from 'react';
import { Steps, Button, Form, Input, message } from 'antd';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Step } = Steps;

const AdminSignUpPage = () => {
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    adminCode: '', // للتحقق من كود الإدمن
  });
  const navigate = useNavigate();

  const handleNext = async () => {
    if (current === 0 && formData.adminCode) {
      // تأكيد صحة كود الإدمن إذا كان مطلوبًا
      setCurrent(current + 1);
    } else if (current === 1 && formData.password !== formData.confirmPassword) {
      message.error('Passwords do not match');
    } else {
      setCurrent(current + 1);
    }
  };

  const handlePrev = () => {
    setCurrent(current - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // إضافة الحساب إلى كولكشن "admins" عند التسجيل
      const adminDocRef = doc(db, `admins/${user.uid}`);
      await setDoc(adminDocRef, {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'admin'  // تعيين الدور كإدمن
      });

      message.success('Admin account created successfully!');
      navigate('/admin-dashboard');  // التوجيه إلى لوحة تحكم الإدمن
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  const steps = [
    {
      title: 'Verify Admin Code',
      content: (
        <Form layout="vertical">
          <Form.Item label="Admin Code" required>
            <Input value={formData.adminCode} name="adminCode" onChange={handleChange} />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Set Account Details',
      content: (
        <Form layout="vertical">
          <div style={styles.gridContainer}>
            <Form.Item label="First Name" required>
              <Input value={formData.firstName} name="firstName" onChange={handleChange} />
            </Form.Item>
            <Form.Item label="Last Name" required>
              <Input value={formData.lastName} name="lastName" onChange={handleChange} />
            </Form.Item>
          </div>
          <Form.Item label="Email" required>
            <Input type="email" value={formData.email} name="email" onChange={handleChange} />
          </Form.Item>
          <div style={styles.gridContainer}>
            <Form.Item label="Password" required>
              <Input.Password value={formData.password} name="password" onChange={handleChange} />
            </Form.Item>
            <Form.Item label="Confirm Password" required>
              <Input.Password value={formData.confirmPassword} name="confirmPassword" onChange={handleChange} />
            </Form.Item>
          </div>
        </Form>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={styles.backButton}
        >
          Back to Homepage
        </Button>

        <Steps current={current} style={{ marginBottom: 20 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>
        <div>{steps[current].content}</div>
        <div style={styles.buttons}>
          {current > 0 && <Button onClick={handlePrev}>Previous</Button>}
          {current < steps.length - 1 && <Button type="primary" onClick={handleNext}>Next</Button>}
          {current === steps.length - 1 && <Button type="primary" onClick={handleSignUp}>Submit</Button>}
        </div>
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
    maxWidth: '600px',
    padding: '40px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: '-50px',
    left: '16px',
    fontSize: '16px',
    color: '#1890ff',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
  },
  buttons: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'flex-end',
  },
};

export default AdminSignUpPage;
