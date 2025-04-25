import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [userData, setUserData] = useState({
    college: '',
    department: '',
    scholarId: '',
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const hasValidRole = useCallback((r) => {
    return ['researcher', 'academic_admin', 'department_admin', 'admin'].includes(r);
  }, []);

  const fetchUserRole = useCallback(async (uid) => {
    if (userCache.has(uid)) return userCache.get(uid);

    const [a, aa, da, u] = await Promise.all([
      getDoc(doc(db, "admins", uid)),
      getDoc(doc(db, "academicAdmins", uid)),
      getDoc(doc(db, "departmentAdmins", uid)),
      getDoc(doc(db, "users", uid)),
    ]);

    let data = null, r = null;
    if (a.exists())      { data = a.data();  r = 'admin'; }
    else if (aa.exists()) { data = aa.data(); r = 'academic_admin'; }
    else if (da.exists()) { data = da.data(); r = 'department_admin'; }
    else if (u.exists())  { data = u.data();  r = 'researcher'; }

    if (!data) return null;

    const sid = data.scholarId || data.scholar_id || uid;
    const normalized = {
      ...data,
      role: r,
      scholarId: sid,
      college: data.college || '',
      department: data.department || ''
    };
    userCache.set(uid, normalized);
    return normalized;
  }, []);

  
  useEffect(() => {
    let mounted = true;
    setIsAuthLoading(true);

    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (!mounted) return;
      if (!authUser) {
        setUser(null);
        setRole('');
        setUserData({ college:'', department:'', scholarId:'' });
        setIsAuthLoading(false);
        return;
      }

      setIsRouteLoading(true);
      const info = await fetchUserRole(authUser.uid);
      if (!mounted) return;

      if (!info) {
        navigate('/');
        setIsAuthLoading(false);
        setIsRouteLoading(false);
      } else {
        setUser(authUser);
        setRole(info.role);
        setUserData({
          college: info.college,
          department: info.department,
          scholarId: info.scholarId,
        });
        setIsAuthLoading(false);
        setIsRouteLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [fetchUserRole, navigate]);


  useEffect(() => {
    if (!isAuthLoading && user && role) {
      if (['/', '/admin-signup'].includes(location.pathname)) {
        switch (role) {
          case 'admin':           return navigate('/admin-dashboard');
          case 'academic_admin':  return navigate('/academic-dashboard');
          case 'department_admin':return navigate('/department-dashboard');
          case 'researcher':      return navigate('/dashboard');
          default: break;
        }
      }
    }
  }, [isAuthLoading, user, role, location.pathname, navigate]);


  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );

    let first = true;
    const unsub = onSnapshot(q, (snap) => {
      if (first) { first = false; return; }
      let added = 0;
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          added++;
          const { title, message: msg } = change.doc.data();
          notification.info({ message: title, description: msg });
        }
      });
      if (added) setUnreadCount(c => c + added);
    });

    return () => unsub();
  }, [user]);

  const onBellClick = () => {
    setUnreadCount(0);
  };

  if (isAuthLoading) return <LoadingSpinner />;

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {isRouteLoading && <MinimalLoading />}

      {user && !ROUTES_WITHOUT_SIDEBAR.includes(location.pathname) && (
        <Sidebar />
      )}

      <div className="flex-1 flex flex-col">
        <Header
          title="Your App Title"
          unreadCount={unreadCount}
          onBellClick={onBellClick}
        />

        <div className="flex-1 overflow-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/admin-signup" element={<SignUpPageAdmin />} />
              <Route path="/control-panel" element={<ControlPanel />} />

              <Route
                path="/admin-dashboard"
                element={
                  user && role === 'admin'
                    ? <AdminDashboard />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/academic-dashboard"
                element={
                  user && role === 'academic_admin'
                    ? <AcademicAdminDashboard />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/department-dashboard"
                element={
                  user && role === 'department_admin'
                    ? <DepartmentDashboard />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/dashboard"
                element={
                  user && role === 'researcher'
                    ? <ResearcherDashboard />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/researcher-view"
                element={
                  user && hasValidRole(role)
                    ? <ResearcherDashboard departmentAdminAsResearcher={role==='department_admin'} academicAdminAsResearcher={role==='academic_admin'} departmentAdminData={userData} academicAdminData={userData} />
                    : <Navigate to="/" />
                }
              />
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
              <Route
                path="/chat"
                element={
                  user
                    ? <LitrixChatPage {...userData} />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/research-analytics"
                element={
                  user
                    ? <ResearchAnalytics />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="*"
                element={
                  <div className="flex justify-center items-center h-screen">
                    Page not found
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
