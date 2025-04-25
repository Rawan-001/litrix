import React, { useState, useEffect } from 'react';
import { Steps, Button, Form, Input, message } from 'antd';
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Step } = Steps;

const SignUpPageAdmin = () => {
  const [current, setCurrent] = useState(0);
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    googleScholarLink: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const departmentParam = searchParams.get('department');
    setRole(roleParam || '');
    setDepartment(departmentParam || '');
  }, [searchParams]);

  const handleNext = () => {
    if (current === 0 && formData.password !== formData.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    setCurrent((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrent((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateScholarUrl = (url) => {
    const regex = /^https?:\/\/scholar\.google\.com\/citations\?(?:.*&)?user=([a-zA-Z0-9_-]+)(?:&.*)?$/;
    const match = url.trim().match(regex);
    return match ? match[1] : null;
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    const scholarId = (role === 'department_admin' || role === 'academic_admin')
      ? validateScholarUrl(formData.googleScholarLink)
      : null;

    if ((role === 'department_admin' || role === 'academic_admin') && !scholarId) {
      message.error('Invalid Google Scholar profile link');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userDocRef = doc(db, `${role === 'academic_admin' ? 'academicAdmins' : role === 'department_admin' ? 'departmentAdmins' : 'admins'}/${user.uid}`);

      await setDoc(userDocRef, {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role,
        ...(department && { department }),
        ...(scholarId && {
          googleScholarLink: formData.googleScholarLink,
          scholarId,
          scholar_id: scholarId,
        })
      });

      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      message.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  const steps = [
    {
      title: 'Account Info',
      content: (
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
        </Form>
      ),
    },
    {
      title: 'Personal Info',
      content: (
        <Form layout="vertical">
          <Form.Item label="First Name" required>
            <Input value={formData.firstName} name="firstName" onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Last Name" required>
            <Input value={formData.lastName} name="lastName" onChange={handleChange} />
          </Form.Item>
          {(role === 'department_admin' || role === 'academic_admin') && (
            <Form.Item label="Google Scholar Profile Link" required>
              <Input
                prefix={<LinkOutlined />}
                placeholder="https://scholar.google.com/citations?user=XXXX"
                value={formData.googleScholarLink}
                name="googleScholarLink"
                onChange={handleChange}
              />
            </Form.Item>
          )}
        </Form>
      ),
    }
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
          Back to Home
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
    minHeight: '100vh',
    backgroundColor: '#f0f2f5'
  },
  card: {
    width: '100%',
    maxWidth: '600px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)'
  },
  backButton: {
    marginBottom: 16
  },
  buttons: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  }
};

export default SignUpPageAdmin;