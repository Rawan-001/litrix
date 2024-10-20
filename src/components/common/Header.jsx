import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth'; 
import { auth } from '../../firebaseConfig';
import { FiLogOut, FiBell } from 'react-icons/fi';  


const Header = ({ title }) => {
  const navigate = useNavigate();
        
  const handleLogout = async () => {
    try {
      await signOut(auth); 
      navigate('/'); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className='bg-white shadow-lg border-b border-gray-300'>
      <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center'>
        <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
        
        <div className='flex items-center space-x-6'>
          <FiBell 
            size={24} 
            className='text-gray-900 cursor-pointer hover:text-blue-500' 
            onClick={() => console.log('Notification clicked!')} 
          />
          
          <FiLogOut
            onClick={handleLogout}
            size={24} 
            className='text-gray-900 cursor-pointer hover:text-red-500' 
          />
        </div>
        
      </div>
    </header>
  );
};

export default Header;
