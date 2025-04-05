import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { FiLogOut, FiBell, FiUser } from 'react-icons/fi';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          if (userData.role === 'researcher') {
            setUser({
              uid: currentUser.uid,
              email: userData.email || currentUser.email,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              scholar_id: userData.scholar_id || '',
              institution: userData.institution || '',
              role: 'researcher'
            });
            
            const researcherNotificationsQuery = query(
              collection(db, 'notifications'),
              where('recipientId', '==', currentUser.uid)
            );
            
            const unsubscribeResearcherNotifications = onSnapshot(researcherNotificationsQuery, (snapshot) => {
              const newNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setNotifications(newNotifications);
            });
            
            return () => unsubscribeResearcherNotifications();
          }
        }
        
        const adminRef = doc(db, 'admins', currentUser.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          setUser({
            uid: currentUser.uid,
            email: adminData.email || currentUser.email,
            firstName: adminData.firstName || '',
            lastName: adminData.lastName || '',
            role: 'admin'
          });
          
          const adminNotificationsQuery = query(
            collection(db, 'notifications'),
            where('type', '==', 'system')
          );
          
          const unsubscribeAdminNotifications = onSnapshot(adminNotificationsQuery, (snapshot) => {
            const newNotifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setNotifications(newNotifications);
          });
          
          return () => unsubscribeAdminNotifications();
        }
        
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'unknown'
        });
        
      } else {
        setUser(null);
        setNotifications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className='bg-white shadow-lg border-b border-gray-300'>
      <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center'>
        <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
        
        {user && (
          <div className='flex items-center space-x-6'>
            <div className='relative'>
              <div className='relative'>
                <FiBell
                  size={24}
                  className='text-gray-900 cursor-pointer hover:text-blue-500'
                  onClick={toggleNotifications}
                />
                {notifications.length > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                    {notifications.length}
                  </span>
                )}
              </div>
              
              {showNotifications && (
                <div className='absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200'>
                  <div className='px-4 py-2 border-b border-gray-200'>
                    <h3 className='text-sm font-medium'>Notifications</h3>
                  </div>
                  {notifications.length > 0 ? (
                    <div className='max-h-60 overflow-y-auto'>
                      {notifications.map(notification => (
                        <div key={notification.id} className='px-4 py-2 hover:bg-gray-50 border-b border-gray-100'>
                          <p className='text-sm font-medium'>{notification.title}</p>
                          <p className='text-xs text-gray-500'>{notification.message}</p>
                          <p className='text-xs text-gray-400 mt-1'>
                            {new Date(notification.timestamp?.toDate()).toLocaleString('en-US')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='px-4 py-2 text-sm text-gray-500'>No notifications</div>
                  )}
                </div>
              )}
            </div>
            
            <FiLogOut
              onClick={handleLogout}
              size={24}
              className='text-gray-900 cursor-pointer hover:text-red-500'
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;