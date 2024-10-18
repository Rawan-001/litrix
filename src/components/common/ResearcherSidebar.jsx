import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineManageSearch, MdSettings } from "react-icons/md"; 
import { BsStars } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa"; 
import { Menu } from "lucide-react"; 
import { AnimatePresence, motion } from "framer-motion";
import { auth, db } from "../../firebaseConfig"; 
import { doc, getDoc } from "firebase/firestore"; 
import logo from "../../assets/FYP.png"; 

const researcherSidebarItems = [
  { name: "Dashboard", icon: LuLayoutDashboard, color: "#2a4570", href: "/dashboard" },
  { name: "Profile", icon: FaUserCircle, color: "#2a4570", href: "/profile" },
  { name: "Search", icon: MdOutlineManageSearch, color: "#2a4570", href: "/search" },
  { name: "Litrix Chat", icon: BsStars, color: "#2a4570", href: "/chat" },
  { name: "Settings", icon: MdSettings, color: "#2a4570", href: "/settings" }, 
];

const ResearcherSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [researcherData, setResearcherData] = useState(null); 

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
      className={`relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? "w-64" : "w-20"}`}
      animate={{ width: isSidebarOpen ? 256 : 80 }}
    >
      <div className="h-full bg-gray-200 p-4 flex flex-col border-r border-gray-300">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1.5 }} 
              exit={{ opacity: 0, scale: 0.5 }} 
              transition={{ duration: 0.3 }}
            >
              <img src={logo} alt="Logo" className="w-10 h-10" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full hover:bg-gray-300 transition-colors max-w-fit"
        >
          <Menu size={24} className="text-gray-900" />
        </motion.button>

        <nav className="mt-8 flex-grow">
          {researcherSidebarItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <motion.div className="flex items-center p-4 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors mb-2">
                <item.icon
                  size={20}
                  style={{ color: item.color, minWidth: "20px" }}
                />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      className="ml-4 whitespace-nowrap text-gray-900"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          ))}
        </nav>

        {researcherData && (
          <motion.div
            className="mt-auto p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center">
              {isSidebarOpen ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {researcherData.firstName} {researcherData.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{researcherData.email}</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-900">{researcherData.email}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ResearcherSidebar;
