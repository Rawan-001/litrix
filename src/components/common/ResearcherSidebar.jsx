import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineManageSearch, MdSettings } from "react-icons/md"; 
import { BsStars } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa"; 
import { ChevronLeft, ChevronRight } from "lucide-react"; 
import { AnimatePresence, motion } from "framer-motion";
import { auth, db } from "../../firebaseConfig"; 
import { doc, getDoc } from "firebase/firestore"; 
import logo from "../../assets/FYP.png"; 
import { AiOutlineTeam } from 'react-icons/ai'; 

const researcherSidebarItems = [
  { name: "Dashboard", icon: LuLayoutDashboard, href: "/dashboard" },
  { name: "Profile", icon: FaUserCircle, href: "/profile" },
  { name: "Collaboration", icon: AiOutlineTeam, href: "/collab" }, 
  { name: "Search", icon: MdOutlineManageSearch, href: "/search" },
  { name: "Litrix Chat", icon: BsStars, href: "/chat" },
  { name: "Settings", icon: MdSettings, href: "/settings" }, 
];

const ResearcherSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [researcherData, setResearcherData] = useState(null); 
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchResearcherData = async () => {
      const user = auth.currentUser; 
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid)); 
        if (userDoc.exists()) {
          setResearcherData(userDoc.data()); 
        }
      }
    };

    fetchResearcherData(); 
  }, []);

  return (
    <motion.div
      className="relative z-10 flex-shrink-0 h-screen"
      animate={{ 
        width: isSidebarOpen ? 256 : 80,
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
    >
      <div className="h-full bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col border-r border-gray-200 shadow-lg relative overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.img 
              src={logo} 
              alt="Litrix Logo" 
              className="w-10 h-10 rounded-lg shadow-md"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            />
            {isSidebarOpen && (
              <motion.h1 
                className="font-bold text-xl bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Litrix
              </motion.h1>
            )}
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#f3f4f6" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="text-gray-700" size={20} />
            ) : (
              <ChevronRight className="text-gray-700" size={20} />
            )}
          </motion.button>
        </div>
        
        <div className="px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        <nav className="mt-6 flex-grow px-3">
          <div className="space-y-1.5">
            {researcherSidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link key={item.href} to={item.href}>
                  <motion.div 
                    className={`flex items-center p-3 rounded-xl transition-all ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100" 
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className={`flex items-center justify-center rounded-lg ${isActive ? "text-blue-700" : "text-gray-600"}`}
                      whileHover={{ rotate: isActive ? 5 : 0 }}
                    >
                      <item.icon size={22} />
                    </motion.div>
                    
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span
                          className={`ml-3 font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}
                          initial={{ opacity: 0, width: 0, x: -10 }}
                          animate={{ opacity: 1, width: "auto", x: 0 }}
                          exit={{ opacity: 0, width: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {isActive && isSidebarOpen && (
                      <motion.div 
                        className="ml-auto h-2 w-2 rounded-full bg-blue-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {researcherData && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              {isSidebarOpen ? (
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative">
                    {researcherData.url_picture ? (
                      <img 
                        src={researcherData.url_picture} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {researcherData.firstName?.charAt(0) || ''}
                        {researcherData.lastName?.charAt(0) || ''}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                      {researcherData.firstName} {researcherData.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[160px]">{researcherData.email}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div className="mx-auto relative">
                  {researcherData.url_picture ? (
                    <motion.img 
                      src={researcherData.url_picture} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                      whileHover={{ scale: 1.1 }}
                    />
                  ) : (
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm"
                      whileHover={{ scale: 1.1 }}
                    >
                      {researcherData.firstName?.charAt(0) || ''}
                      {researcherData.lastName?.charAt(0) || ''}
                    </motion.div>
                  )}
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResearcherSidebar;