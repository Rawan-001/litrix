import React, { useState } from 'react';
import { Layout, Button, Row, Col, Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import FYP2 from '../../assets/FYP2.png';
import './HomePage.css';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function HomePage() {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleAdminLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      navigate('/admin-dashboard');
    } catch (error) {
      alert('Admin login failed: ' + error.message);
    }
  };

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    aboutSection.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout className="layout">
      <Header className="navbar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="flex items-center">
              <img src={FYP2} alt="Litrix Logo" className="logo" />
              <Button type="link" style={{ color: 'white', marginLeft: '30px' }} onClick={scrollToAbout}>
                About Us
              </Button>
              <Button type="link" style={{ color: 'white', marginLeft: '20px' }} onClick={() => setShowEmail(true)}>
                Contact Us
              </Button>
            </div>
          </Col>
          <Col>
            <Button type="primary" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '0 50px', marginTop: '64px', overflow: 'auto' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <div className="hero-section">
              <div className="typewriter">
                <h1 className="typewriter-text">Litrix</h1>
              </div>
              <Title level={1} className="hero-title">
                Automating Research Data with Precision and Intelligence
              </Title>
              <Paragraph className="hero-subtitle">
                We provide innovative solutions for research data management, supported by AI technologies to streamline research processes and reduce errors.
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="login-container" style={{ position: 'relative' }}>
              {!isAdminLogin && (
                <div className="login-card">
                  <h2 className="login-title">Login as Researcher</h2>
                  <input
                    type="email"
                    placeholder="Researcher Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                  />
                  <button className="login-btn-main" onClick={handleLogin}>Login</button>
                  <p className="login-text">
                    Don't have an account?{' '}
                    <span className="login-link" onClick={() => navigate('/signup')}>
                      Sign Up
                    </span>
                  </p>

                  <Button
                    type="link"
                    style={{ marginTop: '10px', color: '#506d94' }}
                    onClick={() => setIsAdminLogin(true)}
                  >
                    Login as Administrator
                  </Button>
                </div>
              )}

              {isAdminLogin && (
                <div className="login-card">
                  <h2 className="login-title">Login as Administrator</h2>
                  <input
                    type="email"
                    placeholder="Administrator Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="login-input"
                  />
                  <button className="login-btn-main" onClick={handleAdminLogin}>Login</button>

                  <Button
                    type="link"
                    style={{ marginTop: '10px', color: '#506d94' }}
                    onClick={() => setIsAdminLogin(false)}
                  >
                    Login as Researcher
                  </Button>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <section id="about" className="about-section" style={{ marginTop: '50px' }}>
          <Title level={2}>About the Litrix</Title>
          <Paragraph>
            Our system facilitates the collection of research data from primary sources like Google Scholar and provides smart analysis tools to simplify research management.
          </Paragraph>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12} lg={8}>
              <Card className="custom-card" title="Integration of Advanced AI Technologies">
                <Paragraph>
                  Current manual data management processes are error-prone, often resulting in data duplication, inaccuracies, and incompleteness.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card className="custom-card" title="Real-Time Citation Tracking and Analysis">
                <Paragraph>
                  Implementing real-time citation tracking enables the platform to provide immediate insights into research impact.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card className="custom-card" title="Duplication Detection">
                <Paragraph>
                  The system will leverage AI to detect potential duplicates by analyzing patterns and similarities in the data entries.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card className="custom-card" title="User-Friendly Interface and Training">
                <Paragraph>
                  The platform will feature a user-friendly interface and provide comprehensive training resources to ensure smooth adoption.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </section>

        {showEmail && (
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '18px', fontWeight: 'bold' }}>
            Contact us at: litrix@gmail.com
          </div>
        )}

        <footer style={{ textAlign: 'center', padding: '20px 0', backgroundColor: '#001529', color: 'white', marginTop: '50px' }}>
          <p>© 2024</p>
        </footer>
      </Content>
    </Layout>
  );
}

export default HomePage;
