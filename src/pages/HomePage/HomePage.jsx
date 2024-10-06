import React, { useEffect, useState } from 'react';
import { Layout, Button, Row, Col, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FYP2 from '../../assets/FYP2.png'; 
import './HomePage.css';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function HomePage() {
  const [navbarBackground, setNavbarBackground] = useState('#506d94');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const opacity = Math.min(1, window.scrollY / 300);
      setNavbarBackground(`rgba(80, 109, 148, ${Math.max(0.3, opacity)})`);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout className="layout">
      <Header style={{ backgroundColor: navbarBackground }} className="navbar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="flex items-center">
              <img src={FYP2} alt="Litrix Logo" className="logo" />
              <Button type="link" onClick={() => scrollToSection('about')} style={{ color: 'white', marginLeft: '30px' }}>
                About Us
              </Button>
              <Button type="link" onClick={() => scrollToSection('contact')} style={{ color: 'white', marginLeft: '20px' }}>
                Contact Us
              </Button>
            </div>
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button type="link" onClick={() => navigate('/login')} className="login-btn">
              Login
            </Button>
            <Button type="primary" onClick={() => navigate('/signup')} className="signup-btn">
              Sign Up
            </Button>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '0 50px', marginTop: '64px', overflow: 'auto' }}>
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Title level={1} className="hero-title">
            Automating Research Data with Precision and Intelligence
          </Title>
          <Paragraph className="hero-subtitle">
            We provide innovative solutions for research data management, supported by AI technologies to streamline research processes and reduce errors.
          </Paragraph>
          <Button type="primary" size="large" onClick={() => scrollToSection('about')}>
            Explore More
          </Button>
        </motion.div>

        <motion.section
          id="about"
          className="about-section"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Title level={2}>About the Project</Title>
          <Paragraph>
            Our system facilitates the collection of research data from primary sources like Google Scholar and provides smart analysis tools to simplify research management.
          </Paragraph>
        </motion.section>

      </Content>
    </Layout>
  );
}

export default HomePage;
