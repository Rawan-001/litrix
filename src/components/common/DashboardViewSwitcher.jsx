import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaUserTie, FaExchangeAlt } from 'react-icons/fa';

const ViewSwitcherButton = ({ currentView }) => {
  const navigate = useNavigate();

  const isAdminView = currentView === 'admin';
  const targetPath = isAdminView ? '/researcher-view' : '/department-dashboard';
  const buttonText = isAdminView ? 'Researcher Dashboard' : 'Admin Dashboard';
  const Icon = isAdminView ? FaUserGraduate : FaUserTie;

  const handleClick = () => {
    navigate(targetPath);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center gap-2
        bg-white text-gray-800
        border border-gray-300
        px-4 py-2 rounded-md text-sm font-medium
        shadow-sm hover:shadow-md
        transition-all duration-200 ease-in-out
      `}
    >
      <FaExchangeAlt className="text-blue-500" size={16} />
      <Icon className="text-indigo-500" size={16} />
      <span>{buttonText}</span>
    </motion.button>
  );
};

export default ViewSwitcherButton;
