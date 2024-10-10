import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineManageSearch, MdSettings } from "react-icons/md"; //MdSettings 
import { BsStars } from "react-icons/bs";
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import { FaUserCircle } from "react-icons/fa"; 
import { Menu } from "lucide-react"; 
import { AnimatePresence, motion } from "framer-motion";
import { FiUsers } from "react-icons/fi";
import logo from "../../assets/FYP.png"; 

const researcherSidebarItems = [
  { name: "Dashboard", icon: LuLayoutDashboard, color: "#2a4570", href: "/dashboard" },
  { name: "Profile", icon: FaUserCircle, color: "#2a4570", href: "/profile" },
  { name: "Search", icon: MdOutlineManageSearch, color: "#2a4570", href: "/search" },
  { name: "Collaboration", icon: FiUsers, color: "#2a4570", href: "/collaboration" },
  { name: "Litrix Chat", icon: BsStars, color: "#2a4570", href: "/chat" },
  { name: "Analytics", icon: TbBrandGoogleAnalytics, color: "#2a4570", href: "/analytics" },
  { name: "Settings", icon: MdSettings, color: "#2a4570", href: "/settings" }, //MdSettings
];

const ResearcherSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      </div>
    </motion.div>
  );
};

export default ResearcherSidebar;
