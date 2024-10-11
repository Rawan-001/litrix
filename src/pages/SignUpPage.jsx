import React, { useState } from 'react';
import { Steps, Button, Form, Input, message, Modal, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;
const { Option } = Select;

const SignUpPage = () => {
  const [current, setCurrent] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scholarIdError, setScholarIdError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    personalEmail: '',
    institution: '',
    googleScholarLink: '',
    college: '',
    department: '',
  });

  const navigate = useNavigate();

  const handleNext = () => {
    if (current === 0 && formData.password !== formData.confirmPassword) {
      message.error("Passwords do not match");
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

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateScholarUrl = (url) => {
    const regex = /^https?:\/\/scholar\.google\.com\/citations\?(?:.*&)?user=([a-zA-Z0-9_-]+)(?:&.*)?$/;
    const match = url.trim().match(regex);
    return match ? match[1] : null;
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }
  
    const extractedScholarId = validateScholarUrl(formData.googleScholarLink);
    if (!extractedScholarId) {
      message.error("Invalid Google Scholar profile link");
      return;
    }
  
    // Ensure college and department are selected
    if (!formData.college || !formData.department) {
      message.error("Please select a college and a department");
      return;
    }
  
    console.log(`colleges/${formData.college}/departments/${formData.department}/faculty_members/${extractedScholarId}`);
  
    const docRef = doc(db, `colleges/${formData.college}/departments/${formData.department}/faculty_members/${extractedScholarId}`);
    const docSnap = await getDoc(docRef);
  
    if (!docSnap.exists()) {
      message.error('Scholar ID not found in our records. Please create a Google Scholar account or contact support.');
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
  
      const userDocRef = doc(db, `users/${user.uid}`);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: formData.email,
        scholar_id: extractedScholarId,
        role: 'researcher',
        college: formData.college,
        department: formData.department,
        ...formData,
      });
  
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

  const steps = [
    {
      title: 'Account Details',
      content: (
        <Form layout="vertical">
          <div style={styles.gridContainer}>
            <Form.Item label="Email" required>
              <Input type="email" value={formData.email} name="email" onChange={handleChange} />
            </Form.Item>
            <Form.Item label="Password" required>
              <Input.Password value={formData.password} name="password" onChange={handleChange} />
            </Form.Item>
          </div>
          <Form.Item label="Confirm Password" required>
            <Input.Password value={formData.confirmPassword} name="confirmPassword" onChange={handleChange} />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Profile Information',
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
          <div style={styles.gridContainer}>
            <Form.Item label="Phone Number">
              <Input value={formData.phoneNumber} name="phoneNumber" onChange={handleChange} />
            </Form.Item>
            <Form.Item label="Personal Email">
              <Input type="email" value={formData.personalEmail} name="personalEmail" onChange={handleChange} />
            </Form.Item>
          </div>
          <div style={styles.gridContainer}>
            <Form.Item label="Institution" required>
              <Select value={formData.institution} onChange={(value) => handleSelectChange(value, 'institution')}>
                <Option value="Al Baha University">Al-Baha University</Option>
              </Select>
            </Form.Item>
            <Form.Item label="College" required>
              <Select value={formData.college} onChange={(value) => handleSelectChange(value, 'college')}>
                <Option value="faculty_computing">Faculty of Computing</Option>
                <Option value="faculty_engineering">Faculty of Engineering</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Department" required>
            <Select value={formData.department} onChange={(value) => handleSelectChange(value, 'department')}>
              {formData.college === "faculty_computing" && (
                <>
                  <Option value="dept_cs">Computer Science</Option>
                  <Option value="dept_it">Information Technology</Option>
                  <Option value="dept_se">Software Engineering</Option>
                  <Option value="dept_sn">Systems and Networks</Option>
                </>
              )}
              {formData.college === "faculty_engineering" && (
                <>
                  <Option value="dept_ece">Electrical Engineering</Option>
                  <Option value="dept_me">Mechanical Engineering</Option>
                </>
              )}
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Google Scholar Verification',
      content: (
        <Form layout="vertical">
          <Form.Item label="Google Scholar Profile Link" required validateStatus={scholarIdError ? 'error' : ''} help={scholarIdError}>
            <Input value={formData.googleScholarLink} name="googleScholarLink" onChange={(e) => {
              handleChange(e);
              setScholarIdError('');
            }} />
          </Form.Item>
          <p>Verify your Google Scholar profile to continue.</p>
        </Form>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={styles.backButton}>
          Back to Homepage
        </Button>

        <Steps current={current} style={{ marginBottom: 20 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>
        <div>{steps[current].content}</div>
        <div style={styles.buttons}>
          {current > 0 && <Button style={{ margin: '0 8px' }} onClick={handlePrev}>Previous</Button>}
          {current < steps.length - 1 && <Button type="primary" onClick={handleNext}>Next</Button>}
          {current === steps.length - 1 && <Button type="primary" onClick={handleSignUp}>Submit</Button>}
        </div>
        <Modal title="Profile Confirmation" open={isModalVisible} onOk={handleConfirm} onCancel={() => setIsModalVisible(false)}>
          <p><strong>Name:</strong> {`${formData.firstName} ${formData.lastName}`}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Phone Number:</strong> {formData.phoneNumber}</p>
          <p><strong>Institution:</strong> {formData.institution}</p>
          <p><strong>Google Scholar Link:</strong> {formData.googleScholarLink}</p>
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
    maxWidth: '1000px',
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

export default SignUpPage;
