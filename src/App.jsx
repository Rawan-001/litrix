// src/App.jsx
import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { notification } from 'antd';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import HomePage from './pages/HomePage/HomePage';

const AdminDashboard         = lazy(() => import('./pages/AdminDashboard'));
const AcademicAdminDashboard = lazy(() => import('./pages/AcademicAdminDashboard'));
const DepartmentDashboard    = lazy(() => import('./pages/DepartmentAdminDashboard'));
const SearchPage             = lazy(() => import('./pages/SearchPage'));
const SettingsPage           = lazy(() => import('./pages/SettingsPage'));
const SignUpPage             = lazy(() => import('./pages/SignUpPage'));
const SignUpPageAdmin        = lazy(() => import('./pages/SignUpPageAdmin'));
const ControlPanel           = lazy(() => import('./pages/ControlPanel/ControlPanel'));
const ResearcherProfilePage  = lazy(() => import('./pages/ResearcherProfilePage'));
const ResearcherDashboard    = lazy(() => import('./pages/ResearcherDashboard'));
const LitrixChatPage         = lazy(() => import('./pages/LitrixChatPage'));
const Collaboration          = lazy(() => import('./pages/collaboration'));
const ResearchAnalytics      = lazy(() => import('./components/search/ResearchAnalytics'));

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
  const [user, setUser]           = useState(null);
  const [role, setRole]           = useState('');
  const [userData, setUserData]   = useState({ college: '', department: '', scholarId: '' });
  const [isAuthLoading, setIsAuthLoading]   = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [authInitialized, setAuthInitialized] = useState(false);

  const hasRedirected = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hasValidRole = r => ['researcher','academic_admin','department_admin','admin'].includes(r);

  const fetchUserRole = useCallback(async (uid, authUser) => {
    if (userCache.has(uid)) return userCache.get(uid);

    const [adminDoc, acadDoc, deptDoc, usrDoc] = await Promise.all([
      getDoc(doc(db, "admins", uid)),
      getDoc(doc(db, "academicAdmins", uid)),
      getDoc(doc(db, "departmentAdmins", uid)),
      getDoc(doc(db, "users", uid)),
    ]);

    let data, r;
    if (adminDoc.exists()) {
      data = adminDoc.data(); r = 'admin';
    } else if (acadDoc.exists()) {
      data = acadDoc.data(); r = 'academic_admin';
    } else if (deptDoc.exists()) {
      data = deptDoc.data(); r = 'department_admin';
    } else if (usrDoc.exists()) {
      data = usrDoc.data(); r = 'researcher';
    } else {
      const newUserData = {
        email: authUser.email,
        firstName: authUser.displayName?.split(' ')[0] || '',
        lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: authUser.photoURL || '',
        createdAt: new Date(),
        isProfileComplete: false
      };
      await setDoc(doc(db, "users", uid), newUserData);
      data = newUserData; r = 'researcher';
      localStorage.setItem('isCompletingRegistration', 'true');
    }

    const sid = data.scholarId || data.scholar_id || uid;
    const norm = {
      ...data,
      role: r,
      scholarId: sid,
      college: data.college || '',
      department: data.department || '',
      isProfileComplete: data.isProfileComplete !== false
    };
    userCache.set(uid, norm);
    return norm;
  }, []);

  useEffect(() => {
    if (!user || !role) return;
    let q;
    if (role === 'researcher') q = query(collection(db, 'notifications'), where('recipientId','==', user.uid));
    else if (role === 'admin') q = query(collection(db, 'notifications'), where('type','in',['system','manual','new_publication']));
    else if (role === 'department_admin') q = query(collection(db, 'notifications'), where('departmentId','==', userData.department));
    else return;

    let first = true;
    const unsub = onSnapshot(q, snap => {
      if (first) { first = false; return; }
      let added = 0;
      snap.docChanges().forEach(c => {
        if (c.type === 'added') {
          added++;
          const d = c.doc.data();
          if (d.type === 'new_publication') {
            notification.info({ message: d.title, description: d.message });
          }
        }
      });
      if (added) setUnreadCount(prev => prev + added);
    });
    return () => unsub();
  }, [user, role, userData.department]);

  useEffect(() => {
    let mounted = true;
    setIsAuthLoading(true);

    const unsub = onAuthStateChanged(auth, async authUser => {
      if (!mounted) return;

      if (!authUser) {
        setUser(null);
        setRole('');
        setUserData({ college:'', department:'', scholarId:'' });
        setIsAuthLoading(false);
        setAuthInitialized(true);
        return;
      }

      setIsRouteLoading(true);
      setUser(authUser);

      try {
        const fetched = await fetchUserRole(authUser.uid, authUser);
        if (!fetched) throw new Error('Role fetch failed');

        setRole(fetched.role);
        setUserData({
          college: fetched.college,
          department: fetched.department,
          scholarId: fetched.scholarId,
          isProfileComplete: fetched.isProfileComplete
        });

        if (fetched.role === 'researcher' && fetched.isProfileComplete === false) {
          localStorage.setItem('isCompletingRegistration', 'true');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAuthLoading(false);
        setIsRouteLoading(false);
        setAuthInitialized(true);
      }
    });

    return () => { mounted = false; unsub(); };
  }, [fetchUserRole]);

  useEffect(() => {
    if (!authInitialized) return;

    // only redirect once when on '/'
    if (location.pathname === '/' && !hasRedirected.current) {
      hasRedirected.current = true;

      if (!isAuthLoading && user && role) {
        // researcher still completing
        if (role === 'researcher' && localStorage.getItem('isCompletingRegistration') === 'true') {
          localStorage.removeItem('isCompletingRegistration');
          navigate('/signup', { replace: true });
          return;
        }
        switch (role) {
          case 'admin':
            navigate('/admin-dashboard', { replace: true });
            break;
          case 'academic_admin':
            navigate('/academic-dashboard', { replace: true });
            break;
          case 'department_admin':
            navigate('/department-dashboard', { replace: true });
            break;
          case 'researcher':
            navigate('/dashboard', { replace: true });
            break;
        }
      }
    }
  }, [user, role, isAuthLoading, authInitialized, location.pathname, navigate]);

  if (isAuthLoading) return <LoadingSpinner />;

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {isRouteLoading && <MinimalLoading />}
      {user && !ROUTES_WITHOUT_SIDEBAR.includes(location.pathname) && <Sidebar unreadCount={unreadCount} />}

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
              user && (role === 'academic_admin' || role === 'department_admin')
                ? <ResearcherDashboard {...(role === 'department_admin'
                    ? { departmentAdminAsResearcher: true, departmentAdminData: userData }
                    : { academicAdminAsResearcher: true, academicAdminData: userData })} />
                : <Navigate to="/" />
            } />

            <Route path="/profile" element={
              user && hasValidRole(role)
                ? <Navigate to={`/profile/${userData.scholarId}`} replace />
                : <Navigate to="/" />
            } />
            <Route path="/profile/:scholar_id" element={
              user && hasValidRole(role)
                ? <ResearcherProfilePage />
                : <Navigate to="/" />
            } />

            <Route path="/search" element={<SearchPage />} />
            <Route path="/collab" element={<Collaboration />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={
              user
                ? <LitrixChatPage {...userData} />
                : <Navigate to="/" />
            } />
            <Route path="/research-analytics" element={
              user
                ? <ResearchAnalytics />
                : <Navigate to="/" />
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
}
