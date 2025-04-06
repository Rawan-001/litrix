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
import SettingsPage from './pages/SettingsPage';
import SignUpPage from './pages/SignUpPage';
import ResearcherProfilePage from './pages/ResearcherProfilePage';
import ResearcherDashboard from './pages/ResearcherDashboard';
import LitrixChatPage from './pages/LitrixChatPage';
import SignUpPageAdmin from './pages/SignUpPageAdmin'; 
import Collaboration from './pages/collaboration';
import ControlPanel from './pages/ControlPanel/controlPanel'; 
import Testtt from './pages/Testtt'; 
import ResearchAnalytics from './components/search/ResearchAnalytics';

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [scholarId, setScholarId] = useState('');

  const fetchUserRole = async (uid) => {
    try {
      const adminDocRef = doc(db, `admins/${uid}`);
      const adminDoc = await getDoc(adminDocRef);
      if (adminDoc.exists()) {
        return { ...adminDoc.data(), role: 'admin' };  
      }

      const userDocRef = doc(db, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return { ...userDoc.data(), role: 'researcher' };
      }

      return null;  
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
          setCollege(userData.college || ''); 
          setDepartment(userData.department || ''); 
          setScholarId(userData.scholar_id || user.uid);

          if (location.pathname === '/profile' && userData.scholar_id) {
            navigate(`/profile/${userData.scholar_id}`);
          }
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
  }, [location.pathname, navigate]);

  const ProtectedRoute = ({ element, roleRequired }) => {
    useEffect(() => {
      if (!user) {
        navigate('/');
      } else if (roleRequired && !isRoleAllowed(role, roleRequired)) {
        navigate('/');
      }
    }, [user, role, navigate, roleRequired]);

    if (!user || (roleRequired && !isRoleAllowed(role, roleRequired))) {
      return <div>Loading...</div>;
    }

    return element;
  };

  const isRoleAllowed = (currentRole, requiredRole) => {
    if (requiredRole === "researcher") {
      return currentRole === "researcher" || currentRole === "admin";
    }
    return currentRole === requiredRole;
  };

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {!['/', '/signup', '/admin-signup', '/control-panel'].includes(location.pathname) &&
        (role === 'admin' ? <Sidebar /> : role === 'researcher' ? <ResearcherSidebar /> : null)}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} roleRequired="admin" />} />
        <Route path="/control-panel" element={<ControlPanel />} /> 
        <Route path="/testtt" element={<Testtt />} /> 
        <Route path="/profile/:scholar_id" element={<ProtectedRoute element={<ResearcherProfilePage />} roleRequired="researcher" />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<ResearcherDashboard />} roleRequired="researcher" />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/collab" element={<Collaboration />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<LitrixChatPage college={college} department={department} scholarId={scholarId} />} />
        <Route path="/admin-signup" element={<SignUpPageAdmin />} />
        <Route path="/research-analytics" element={<ResearchAnalytics />} />

        
      </Routes>
    </div>
  );
};

export default App;