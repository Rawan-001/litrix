import React, { useState } from 'react';
import { Steps, Button, Form, Input, message, Modal, Select, Alert, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined, InfoCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;
const { Option } = Select;
const { Paragraph, Text } = Typography;

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
      setScholarIdError("Invalid Google Scholar profile link. Please verify the correct format.");
      message.error("Invalid Google Scholar profile link");
      return;
    }

    const docRef = doc(db, `colleges/${formData.college}/departments/${formData.department}/faculty_members/${extractedScholarId}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      
      try {
        const pendingDocRef = doc(db, 'pending_profiles', extractedScholarId);
        await setDoc(pendingDocRef, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          googleScholarLink: formData.googleScholarLink,
          college: formData.college,
          department: formData.department,
          status: 'pending', 
        });

        message.success('Profile link is pending approval. We will scrape the information soon.');
        return; 
      } catch (error) {
        message.error(`Error saving pending profile: ${error.message}`);
        return;
      }
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        personalEmail: formData.personalEmail,
        phoneNumber: formData.phoneNumber,
        institution: formData.institution,
        googleScholarLink: formData.googleScholarLink
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
          <Alert
            message="How to Get the Correct Google Scholar Link"
            description={
              <div style={styles.scholarInstructions}>
                <Paragraph>
                  <Text strong>Steps:</Text>
                </Paragraph>
                <ol style={styles.instructionsList}>
                  <li>Visit <a href="https://scholar.google.com/" target="_blank" rel="noopener noreferrer">Google Scholar</a></li>
                  <li>Click on "My Profile" in the top menu</li>
                  <li>Copy the URL from your browser's address bar</li>
                </ol>
                <Paragraph>
                  <Text strong>The correct link format should look like this:</Text>
                  <div style={styles.urlExample}>
                    <LinkOutlined /> https://scholar.google.com/citations?user=XXXXXXXX
                  </div>
                </Paragraph>
                <Paragraph>
                  <Text type="danger">Note: Make sure the link contains "user=" followed by your unique identifier.</Text>
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
            style={styles.alertBox}
          />
          
          <Form.Item 
            label={
              <span>
                Google Scholar Profile Link
                <Tooltip title="The link should be in the format https://scholar.google.com/citations?user=XXXXXXXX">
                  <InfoCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </span>
            } 
            required 
            validateStatus={scholarIdError ? 'error' : ''} 
            help={scholarIdError}
          >
            <Input 
              placeholder="https://scholar.google.com/citations?user=XXXXXXXX" 
              value={formData.googleScholarLink} 
              name="googleScholarLink" 
              onChange={(e) => {
                handleChange(e);
                setScholarIdError('');
              }} 
              prefix={<LinkOutlined />}
            />
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

        <Typography.Title level={2} style={styles.pageTitle}>Create New Account</Typography.Title>

        <Steps current={current} style={{ marginBottom: 30, width: '100%' }} progressDot>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>
        <div style={styles.formContainer}>{steps[current].content}</div>
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
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#f0f2f5',
    padding: '20px 0',
  },
  card: {
    width: '100%',
    maxWidth: '1000px',
    padding: '40px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
  },
  pageTitle: {
    marginBottom: '30px',
    color: '#1890ff',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    fontSize: '16px',
    color: '#1890ff',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
  },
  formContainer: {
    width: '100%',
    maxWidth: '800px',
  },
  buttons: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: '800px',
  },
  alertBox: {
    marginBottom: '24px',
  },
  scholarInstructions: {
    padding: '10px',
  },
  instructionsList: {
    margin: '10px 0',
    paddingLeft: '20px',
  },
  urlExample: {
    backgroundColor: '#f5f5f5',
    padding: '8px 12px',
    borderRadius: '4px',
    marginTop: '8px',
    fontFamily: 'monospace',
    display: 'inline-block',
  }
};

export default SignUpPage;