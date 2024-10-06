import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from './firebaseConfig'; 
import Sidebar from './components/common/Sidebar'; 
import ResearcherSidebar from './components/common/ResearcherSidebar'; 
import HomePage from './pages/HomePage/HomePage'; 
import AdminDashboard from './pages/AdminDashboard'; 
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage'; 
import SignUpPage from './pages/SignUpPage'; 
import ResearcherProfilePage from './pages/ResearcherProfilePage';
import ResearcherDashboard from './pages/ResearcherDashboard';
import LitrixChatPage from './pages/LitrixChatPage';

const App = () => {
  const [user, setUser] = useState(null); 
  const [role, setRole] = useState(''); 
  const location = useLocation();  
  const navigate = useNavigate();  

  const fetchUserRole = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await fetchUserRole(user.uid);
        if (userData) {
          setUser(user); 
          setRole(userData.role);
        } else {
          setUser(null);
          setRole('');
        }
      } else {
        setUser(null);
        setRole('');
      }
    });
    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ element, roleRequired }) => {
    useEffect(() => {
      if (!user) {
        navigate('/login'); 
      } else if (roleRequired && role !== roleRequired) {
        navigate('/'); 
      }
    }, [user, role, navigate, roleRequired]);

    if (!user || (roleRequired && role !== roleRequired)) {
      return <div>Loading...</div>;  
    }

    return element;
  };

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {!['/', '/login', '/signup'].includes(location.pathname) && role === 'admin' && <Sidebar />}
      {!['/', '/login', '/signup'].includes(location.pathname) && role === 'researcher' && <ResearcherSidebar />}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} roleRequired="admin" />} />
        <Route path="/profile" element={<ProtectedRoute element={<ResearcherProfilePage />} roleRequired="researcher" />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<ResearcherDashboard />} roleRequired="researcher" />} /> 


        <Route path="/search" element={<SearchPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<LitrixChatPage />} />
      </Routes>
    </div>
  );
};

export default App;
