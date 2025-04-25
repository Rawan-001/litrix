import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import { FiLogOut, FiBell } from 'react-icons/fi';
import { notification } from 'antd';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import {
  signOutUser,
  setupSessionPersistence,
  initializeTabId
} from '../../services/AuthService';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const shouldShowHeader = () =>
    !(location.pathname.includes('academic-dashboard') && title === 'Academic Admin Dashboard');

  useEffect(() => {
    initializeTabId();
    setupSessionPersistence();

    const unsubAuth = auth.onAuthStateChanged(async currentUser => {
      if (!currentUser) {
        setUser(null);
        return;
      }
      const uid = currentUser.uid;
      const sources = [
        ['users', 'researcher'],
        ['admins', 'admin'],
        ['academicAdmins', 'academic_admin'],
        ['departmentAdmins', 'department_admin']
      ];
      for (const [col, role] of sources) {
        const snap = await getDoc(doc(db, col, uid));
        if (snap.exists()) {
          setUser({ uid, role, ...snap.data() });
          return;
        }
      }
      setUser({ uid, role: 'unknown' });
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotificationsList([]);
      setUnreadCount(0);
      return;
    }

    const ref = collection(db, 'notifications');
    let q;

    if (user.role === 'researcher') {
      q = query(ref, where('recipientId', '==', user.uid));
    } else if (user.role === 'admin') {
      q = query(ref, where('type', 'in', ['manual', 'system']));
    } else if (user.role === 'department_admin') {
      q = query(ref, where('departmentId', '==', user.department));
    } else if (user.role === 'academic_admin') {
      q = query(ref, where('type', '==', 'manual'));
    } else {
      return;
    }

    let initialLoad = true;
    const unsub = onSnapshot(q, snap => {
      if (initialLoad) {
        setNotificationsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        initialLoad = false;
        return;
      }

      const addedDocs = snap.docChanges().filter(c => c.type === 'added');
      if (addedDocs.length) {
        const newItems = addedDocs.map(c => ({ id: c.doc.id, ...c.doc.data() }));
        setNotificationsList(prev => [...newItems, ...prev]);
        setUnreadCount(prev => prev + addedDocs.length);

        addedDocs.forEach(c => {
          const { title, message: msg } = c.doc.data();
          notification.info({ message: title, description: msg });
        });
      }
    }, err => console.error('Notifications listener error:', err));

    return () => unsub();
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications(open => {
      if (!open) {
        setUnreadCount(0);
      }
      return !open;
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await signOutUser();
    setIsLoggingOut(false);
    if (result.success) navigate('/');
    else console.error('Logout failed:', result.error);
  };

  if (!shouldShowHeader()) return null;

  return (
    <header className="bg-white shadow-lg border-b border-gray-300">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

        {user && (
          <div className="flex items-center space-x-4 relative">
            <div className="relative">
              <FiBell
                size={24}
                className="text-gray-900 cursor-pointer hover:text-blue-500"
                onClick={toggleNotifications}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  </div>
                  {notificationsList.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {notificationsList.map(n => (
                        <div
                          key={n.id}
                          className="px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                        >
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {n.timestamp?.toDate().toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">
                      No notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            {user.role === 'department_admin' && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {user.department.replace('dept_', '').toUpperCase()}
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center text-gray-900 cursor-pointer hover:text-red-500 disabled:opacity-50"
            >
              <FiLogOut size={24} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
