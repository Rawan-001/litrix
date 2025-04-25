import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { notification } from 'antd';

import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import HomePage from './pages/HomePage/HomePage';


const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AcademicAdminDashboard = lazy(() => import('./pages/AcademicAdminDashboard'));
const DepartmentDashboard = lazy(() => import('./pages/DepartmentAdminDashboard'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ResearcherProfilePage = lazy(() => import('./pages/ResearcherProfilePage'));
const ResearcherDashboard = lazy(() => import('./pages/ResearcherDashboard'));
const LitrixChatPage = lazy(() => import('./pages/LitrixChatPage'));
const SignUpPageAdmin = lazy(() => import('./pages/SignUpPageAdmin'));
const Collaboration = lazy(() => import('./pages/collaboration'));
const ControlPanel = lazy(() => import('./pages/ControlPanel/ControlPanel'));
const ResearchAnalytics = lazy(() => import('./components/search/ResearchAnalytics'));


const ROUTES_WITHOUT_SIDEBAR = ['/', '/signup', '/admin-signup', '/control-panel'];

const userCache = new Map();

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-2 text-gray-600">Loading...</p>
    </div>
  </div>
);

const MinimalLoading = () => (
  <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50"></div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [userData, setUserData] = useState({
    college: '',
    department: '',
    scholarId: '',
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hasValidRole = (role) => {
    return ['researcher', 'academic_admin', 'department_admin', 'admin'].includes(role);
  };

  const extractScholarIdFromUrl = useCallback((url) => {
    try {
      if (!url) return null;
      if (url.includes('scholar.google.com')) {
        const match = url.match(/[?&]user=([^&#]+)/);
        return match && match[1] ? match[1] : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const fetchUserRole = useCallback(async (uid) => {
    if (userCache.has(uid)) {
      return userCache.get(uid);
    }
    try {
      const [adminDoc, academicAdminDoc, departmentAdminDoc, userDoc] = await Promise.all([
        getDoc(doc(db, "admins", uid)),
        getDoc(doc(db, "academicAdmins", uid)),
        getDoc(doc(db, "departmentAdmins", uid)),
        getDoc(doc(db, "users", uid)),
      ]);
      let userData = null;
      let role = null;
      if (adminDoc.exists()) {
        userData = adminDoc.data();
        role = 'admin';
      } else if (academicAdminDoc.exists()) {
        userData = academicAdminDoc.data();
        role = 'academic_admin';
      } else if (departmentAdminDoc.exists()) {
        userData = departmentAdminDoc.data();
        role = 'department_admin';
      } else if (userDoc.exists()) {
        userData = userDoc.data();
        role = 'researcher';
      }
      if (!userData) {
        return null;
      }
      const scholarId = userData.scholarId || userData.scholar_id || uid;
      const normalizedUserData = {
        ...userData,
        role,
        scholarId,
        college: userData.college || '',
        department: userData.department || '',
      };
      userCache.set(uid, normalizedUserData);
      return normalizedUserData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
  
    // بناء الاستعلام بناءً على دور المستخدم
    let q;
    if (user.role === 'researcher') {
      q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid)
      );
    } else if (user.role === 'admin') {
      q = query(
        collection(db, 'notifications'),
        where('type', 'in', ['system','manual','new_publication'])
      );
    } else if (user.role === 'department_admin') {
      q = query(
        collection(db, 'notifications'),
        where('departmentId', '==', user.department)
      );
    } else {
      return;
    }
  
    let first = true; // نستخدم هذا لتجاهل أول مرة
    const unsub = onSnapshot(q, snap => {
      if (first) { first = false; return; }  // تجاهل التنبيهات القديمة
      let added = 0;
  
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          added++;
          const data = change.doc.data();
          // فقط لِـ new_publication نعرض toast
          if (data.type === 'new_publication') {
            notification.info({
              message: data.title,
              description: data.message
            });
          }
        }
      });
  
      if (added) {
        setUnreadCount(prev => prev + added); // عداد الجرس
      }
    });
  
    return () => unsub();
  }, [user]);
  
  

  useEffect(() => {
    let isMounted = true;
    setIsAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!isMounted) return;
      if (!authUser) {
        setUser(null);
        setRole('');
        setUserData({ college: '', department: '', scholarId: '' });
        setIsAuthLoading(false);
        return;
      }
      try {
        setIsRouteLoading(true);
        const fetchedData = await fetchUserRole(authUser.uid);
        if (!isMounted) return;
        if (!fetchedData) {
          setUser(null);
          setRole('');
          setIsAuthLoading(false);
          setIsRouteLoading(false);
          navigate('/');
          return;
        }
        setUser(authUser);
        setRole(fetchedData.role);
        setUserData({
          college: fetchedData.college || '',
          department: fetchedData.department || '',
          scholarId: fetchedData.scholarId,
        });
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
          setIsRouteLoading(false);
        }
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchUserRole, location.pathname, navigate]);
  useEffect(() => {
    if (!isAuthLoading && user && role) {
      if (location.pathname === '/' || location.pathname === '/admin-signup') {
        switch (role) {
          case 'admin':
            navigate('/admin-dashboard');
            break;
          case 'academic_admin':
            navigate('/academic-dashboard');
            break;
          case 'department_admin':
            navigate('/department-dashboard');
            break;
          case 'researcher':
            navigate('/dashboard');
            break;
          default:
            break;
        }
      }
    }
  }, [user, role, isAuthLoading, location.pathname, navigate]);
  

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {isRouteLoading && <MinimalLoading />}
      
      {/* Use the unified sidebar instead of multiple role-specific sidebars */}
      {user && !ROUTES_WITHOUT_SIDEBAR.includes(location.pathname) && <Sidebar />}
      
      
        
      <div className="flex-1 overflow-auto">

        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/admin-signup" element={<SignUpPageAdmin />} />
            
            <Route path="/control-panel" element={<ControlPanel />} />

            <Route path="/admin-dashboard" element={
              user && role === 'admin'
                ? <AdminDashboard />
                : <Navigate to="/" />
            } />

            <Route path="/academic-dashboard" element={
              user && role === 'academic_admin'
                ? <AcademicAdminDashboard />
                : <Navigate to="/" />
            } />

            <Route path="/department-dashboard" element={
              user && role === 'department_admin'
                ? <DepartmentDashboard />
                : <Navigate to="/" />
            } />

            <Route path="/dashboard" element={
              user && role === 'researcher'
                ? <ResearcherDashboard />
                : <Navigate to="/" />
            } />

            <Route path="/researcher-view" element={
              user && (role === 'department_admin' || role === 'academic_admin')
                ? (
                  role === 'department_admin' ? (
                    <ResearcherDashboard 
                      departmentAdminAsResearcher={true}
                      departmentAdminData={{
                        scholarId: userData.scholarId,
                        college: userData.college,
                        department: userData.department
                      }}
                    />
                  ) : (
                    <ResearcherDashboard 
                      academicAdminAsResearcher={true}
                      academicAdminData={{
                        scholar_id: userData.scholarId,
                        college: userData.college,
                        department: userData.department
                      }}
                    />
                  )
                )
                : <Navigate to="/" />
            } />

            <Route
              path="/profile"
              element={
                user && hasValidRole(role)
                  ? <Navigate to={`/profile/${userData.scholarId}`} replace />
                  : <Navigate to="/" />
              }
            />

            <Route
              path="/profile/:scholar_id"
              element={
                user && hasValidRole(role)
                  ? <ResearcherProfilePage />
                  : <Navigate to="/" />
              }
            />

            <Route path="/search" element={<SearchPage />} />
            <Route path="/collab" element={<Collaboration />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={
              user ? (
                <LitrixChatPage
                  college={userData.college}
                  department={userData.department}
                  scholarId={userData.scholarId}
                />
              ) : <Navigate to="/" />
            } />
            <Route path="/research-analytics" element={
              user ? <ResearchAnalytics /> : <Navigate to="/" />
            } />

            <Route path="*" element={
              <div className="flex justify-center items-center h-screen">
                Page not found
              </div>
            } />
          </Routes>
          
        </Suspense>
      </div>
    </div>
  );
};

export default App;