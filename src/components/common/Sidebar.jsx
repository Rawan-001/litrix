import {
  DollarSign,
  Menu,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineManageSearch } from "react-icons/md";
import { BsStars } from "react-icons/bs";
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import logo from "../../assets/FYP.png"; 

const SIDEBAR_ITEMS = [
  { name: "Dashboard", icon: LuLayoutDashboard, color: "#2a4570", href: "/admin-dashboard" },
  { name: "Search", icon: MdOutlineManageSearch, color: "#2a4570", href: "/search" },
  { name: "Litrix Chat", icon: BsStars, color: "#2a4570", href: "/chat" },
  { name: "Settings", icon: Settings, color: "#2a4570", href: "/settings" },
];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <motion.div
      className={`relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? "w-64" : "w-20"}`}
      animate={{ width: isSidebarOpen ? 256 : 80 }}
    >
      <div className="h-full bg-gray-200 p-4 flex flex-col border-r border-gray-300">
        <div className="flex items-center justify-center mb-6">
          <motion.img 
            src={logo} 
            alt="Logo" 
            className="w-10 h-10" 
            animate={{ scale: isSidebarOpen ? 1.2 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: isSidebarOpen ? 1 : 0 }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full hover:bg-gray-300 transition-colors max-w-fit"
        >
          <Menu size={24} className="text-gray-900" />
        </motion.button>

        <nav className="mt-8 flex-grow">
          {SIDEBAR_ITEMS.map((item) => (
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

export default Sidebar;
