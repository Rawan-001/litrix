import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button, Modal, Form, Input, notification, Spin, Switch, Tooltip, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { 
  UserOutlined, 
  LockOutlined, 
  LoginOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import './HomePage.css';

const { Header, Content } = Layout;
const { Option } = Select;

function HomePage() {
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('none');
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [backgroundDarkness, setBackgroundDarkness] = useState(0);
  
  const contentRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const impactRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem('litrix-theme-mode');
    if (savedMode) {
      setIsDarkMode(savedMode === 'dark');
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('litrix-theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      setScrollPosition(currentScrollPos);
      
      if (currentScrollPos > 80) {
        setHeaderSolid(true);
      } else {
        setHeaderSolid(false);
      }
      
      if (currentScrollPos > lastScrollTop) {
        setScrollDirection('down');
      } else if (currentScrollPos < lastScrollTop) {
        setScrollDirection('up');
      }
      
      setLastScrollTop(currentScrollPos <= 0 ? 0 : currentScrollPos);
      
      const aboutOffset = aboutRef.current?.offsetTop - 200 || 0;
      const featuresOffset = featuresRef.current?.offsetTop - 200 || 0;
      const impactOffset = impactRef.current?.offsetTop - 200 || 0;
      
      if (currentScrollPos < aboutOffset) {
        setActiveSection('hero');
      } else if (currentScrollPos < featuresOffset) {
        setActiveSection('about');
      } else if (currentScrollPos < impactOffset) {
        setActiveSection('features');
      } else {
        setActiveSection('impact');
      }
      
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const darkness = Math.min(currentScrollPos / maxScroll * 0.7, 0.7);
      setBackgroundDarkness(darkness);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [lastScrollTop]);

  const handleUnifiedLogin = async () => {
    if (!email || !password) {
      notification.error({
        message: 'Error',
        description: 'Please enter both email and password',
        duration: 3
      });
      return;
    }
  
    if (isLoggingIn) {
      return;
    }
  
    setIsLoggingIn(true);
    
    try {
      // Sign in with Firebase auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (user) {
        // Check all possible role collections
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);
        
        const academicAdminDocRef = doc(db, "academicAdmins", user.uid);
        const academicAdminDoc = await getDoc(academicAdminDocRef);
        
        const departmentAdminDocRef = doc(db, "departmentAdmins", user.uid);
        const departmentAdminDoc = await getDoc(departmentAdminDocRef);
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // First close modal and clear form regardless of user type
        setIsLoginModalVisible(false);
        clearForm();
        
        // Check roles in priority order
        if (adminDoc.exists()) {
          notification.success({
            message: 'Success',
            description: 'Admin login successful!',
            duration: 2
          });
          navigate('/admin-dashboard');
        } else if (academicAdminDoc.exists()) {
          notification.success({
            message: 'Success',
            description: 'Academic Admin login successful!',
            duration: 2
          });
          navigate('/academic-dashboard');
        } else if (departmentAdminDoc.exists()) {
          notification.success({
            message: 'Success',
            description: 'Department Admin login successful!',
            duration: 2
          });
          navigate('/academic-dashboard'); // Might need a different dashboard path based on your routing
        } else if (userDoc.exists()) {
          notification.success({
            message: 'Success',
            description: 'Login successful!',
            duration: 2
          });
          navigate('/dashboard');
        } else {
          // User exists in Auth but not in any role collection
          // Create a default user document
          try {
            await setDoc(userDocRef, {
              email: user.email,
              firstName: user.displayName ? user.displayName.split(' ')[0] : '',
              lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
              createdAt: new Date()
            });
            
            notification.success({
              message: 'Success',
              description: 'Login successful!',
              duration: 2
            });
            
            navigate('/dashboard');
          } catch (error) {
            console.error("Error creating default user document:", error);
            notification.error({
              message: 'Login Error',
              description: 'Could not complete login process. Please contact support.',
              duration: 4
            });
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email not registered';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      notification.error({
        message: 'Login Failed',
        description: errorMessage,
        duration: 4
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSquareStyles = (index) => {
    const mouseFactorX = (mousePosition.x / window.innerWidth - 0.5) * 10;
    const mouseFactorY = (mousePosition.y / window.innerHeight - 0.5) * 10;
    
    const scrollFactor = scrollPosition * 0.05;
    
    const baseSpeed = 0.05;
    const positionSpeed = baseSpeed * (index + 1);
    
    const translateY = scrollPosition * positionSpeed;
    const translateX = mouseFactorX * (index + 1);
    const translateZ = scrollDirection === 'down' ? -50 : 0;
    const rotation = 10 + (scrollDirection === 'down' ? 1 : -1) * scrollPosition * 0.02 * (index + 1);
    const scale = 1 + Math.sin(scrollPosition * 0.001) * 0.05;
    
    const hue = (index * 30 + scrollPosition * 0.05) % 360;
    const saturation = 70 + Math.sin(scrollPosition * 0.001) * 20;
    const lightness = isDarkMode ? 
      (50 + Math.cos(scrollPosition * 0.002) * 10) - (backgroundDarkness * 30) : 
      (80 + Math.cos(scrollPosition * 0.002) * 10) - (backgroundDarkness * 30);
    const opacity = isDarkMode ? 
      (0.07 + Math.sin(scrollPosition * 0.001) * 0.03) : 
      (0.1 + Math.sin(scrollPosition * 0.001) * 0.05);
    
    return {
      transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotate(${rotation}deg) scale(${scale})`,
      backgroundColor: `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`,
      boxShadow: isDarkMode ?
        `0 0 ${30 + Math.sin(scrollPosition * 0.01) * 20}px rgba(255, 255, 255, 0.1)` :
        `0 0 ${30 + Math.sin(scrollPosition * 0.01) * 20}px rgba(0, 0, 0, 0.1)`,
      filter: `blur(${scrollDirection === 'down' ? 3 : 0}px)`,
      transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.5s, filter 0.5s',
    };
  };

  const toggleThemeMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  const getBackgroundStyle = () => {
    const darkenFactor = isDarkMode ? 
      `rgba(0, 0, 0, ${backgroundDarkness})` : 
      `rgba(0, 0, 0, ${backgroundDarkness * 0.5})`;
    
    return {
      background: `linear-gradient(${darkenFactor}, ${darkenFactor}), var(--bg-primary)`,
      transition: 'background 0.3s ease-out'
    };
  };

  const handleLoginKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUnifiedLogin();
    }
  };

  return (
    <Layout className={`gradient-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`} style={getBackgroundStyle()}>
      <div className="background-squares">
        <div className="square square-1" style={getSquareStyles(0)}></div>
        <div className="square square-2" style={getSquareStyles(1)}></div>
        <div className="square square-3" style={getSquareStyles(2)}></div>
        <div className="square square-4" style={getSquareStyles(3)}></div>
        <div className="square square-5" style={getSquareStyles(4)}></div>
        
        <div className="particles-container">
          {Array.from({ length: 30 }).map((_, index) => (
            <div key={index} className={`particle particle-${index % 4}`}></div>
          ))}
        </div>
      </div>
      
      <Header className={`transparent-header ${headerSolid ? 'header-solid' : ''}`}>
        <div className="header-content">
          <div className="logo">
            <span className="logo-text">Litrix</span>
            <div className="logo-icon-container"></div>
          </div>
          <div className="header-right">
            <nav className="nav-menu">
              <Button 
                type="link" 
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`} 
                onClick={() => scrollToSection('about')}
              >
                About Us
              </Button>
              <Button 
                type="link" 
                className={`nav-link ${activeSection === 'features' ? 'active' : ''}`} 
                onClick={() => scrollToSection('features')}
              >
                Features
              </Button>
              <Button 
                type="link" 
                className={`nav-link ${activeSection === 'impact' ? 'active' : ''}`} 
                onClick={() => scrollToSection('impact')}
              >
                Impact
              </Button>
            </nav>
            
            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <div className="theme-toggle">
                <Switch 
                  checked={isDarkMode}
                  onChange={toggleThemeMode}
                  checkedChildren={<BulbFilled />}
                  unCheckedChildren={<BulbOutlined />}
                  className="theme-switch"
                />
              </div>
            </Tooltip>
          </div>
        </div>
      </Header>

      <Content className="main-content" ref={contentRef}>
        <section className="hero-section" id="hero">
          <div className="hero-content fade-in-element">
            <h1 className="main-title">
              <span className="animate-text">Automating</span>
            </h1>
            <h2 className="subtitle">
              <span className="animate-text-delay">Research Data with</span> <br /> 
              <span className="animate-text-delay-2">Precision & Intelligence</span>
            </h2>
            
            <div className="action-buttons">
              {/* Unified login button */}
              <Button 
                className="animated-button researcher-btn" 
                onClick={() => setIsLoginModalVisible(true)}
              >
                Login
              </Button>
            </div>
            
            <div className="signup-prompt">
              Don't have an account? <a onClick={() => navigate('/signup')}>Sign Up</a>
            </div>
          </div>
          
          <div className="scroll-indicator">
            <div className="mouse">
              <div className="wheel"></div>
            </div>
            <div className="arrow-scroll">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </section>

        <section className="about-section" id="about" ref={aboutRef}>
          <div className={`section-content ${activeSection === 'about' ? 'section-active' : ''}`}>
            <h2 className="section-title">About Us</h2>
            <div className="underline"></div>
            <p className="section-text">
              Litrix is a cutting-edge platform designed to automate and streamline research data management.
              Our system helps researchers collect, organize, and analyze their academic publications and citations
              with unprecedented precision and intelligence.
            </p>
            <p className="section-text">
              Founded by a team of academics and technology experts, Litrix addresses the challenges that researchers
              face when managing their scholarly output and measuring their academic impact.
            </p>
          </div>
        </section>

        <section className="features-section" id="features" ref={featuresRef}>
          <div className={`section-content ${activeSection === 'features' ? 'section-active' : ''}`}>
            <h2 className="section-title">Features</h2>
            <div className="underline"></div>
            <div className="features-grid">
              <div className="feature-card card-hover">
                <div className="feature-icon-wrapper">
                  <i className="feature-icon data-icon"></i>
                </div>
                <h3>Automated Data Collection</h3>
                <p>Our platform automatically collects research data from sources like Google Scholar, ensuring your publication records are always up-to-date.</p>
              </div>
              <div className="feature-card card-hover">
                <div className="feature-icon-wrapper">
                  <i className="feature-icon analysis-icon"></i>
                </div>
                <h3>Citation Analysis</h3>
                <p>Advanced analytics provide insights into citation patterns, helping you understand your research impact over time.</p>
              </div>
              <div className="feature-card card-hover">
                <div className="feature-icon-wrapper">
                  <i className="feature-icon duplicate-icon"></i>
                </div>
                <h3>Duplicate Detection</h3>
                <p>AI-powered algorithms identify and merge duplicate entries, maintaining a clean and accurate research profile.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="impact-section" id="impact" ref={impactRef}>
          <div className={`section-content ${activeSection === 'impact' ? 'section-active' : ''}`}>
            <h2 className="section-title">Impact</h2>
            <div className="underline"></div>
            <p className="section-text">
              Litrix has helped thousands of researchers worldwide to increase their productivity and visibility
              in the academic community. By automating tedious data management tasks, our users can focus more
              on their research and less on administrative work.
            </p>
            <div className="stats">
              <div className="stat-item card-hover">
                <span className="stat-number counter">1+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat-item card-hover">
                <span className="stat-number counter">1+</span>
                <span className="stat-label">Publications Managed</span>
              </div>
              <div className="stat-item card-hover">
                <span className="stat-number counter">1+</span>
                <span className="stat-label">Universities</span>
              </div>
            </div>
          </div>
        </section>
      </Content>

      {/* Unified Login Modal */}
      <Modal
        title="Login"
        open={isLoginModalVisible}
        onCancel={() => {
          setIsLoginModalVisible(false);
          clearForm();
          setIsLoggingIn(false);
        }}
        footer={null}
        className="custom-modal"
        maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        centered
        wrapClassName={isDarkMode ? "dark-modal-wrap" : "light-modal-wrap"}
      >
        <Form layout="vertical" className="login-form">
          <Form.Item label="Email" name="email">
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleLoginKeyDown}
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleLoginKeyDown}
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              className="login-button"
              onClick={handleUnifiedLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Spin size="small" /> : <><LoginOutlined /> Login</>}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default HomePage;