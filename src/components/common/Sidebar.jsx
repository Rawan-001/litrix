import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import logo from "../../assets/FYP.png";

import { ChevronLeft, ChevronRight, Menu, Settings } from "lucide-react";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineManageSearch, MdSettings } from "react-icons/md";
import { BsStars } from "react-icons/bs";
import { FaUserCircle, FaChartLine } from "react-icons/fa";
import { AiOutlineTeam } from "react-icons/ai";

const MENU_ITEMS = {
  admin: [
    { name: "Dashboard", icon: LuLayoutDashboard, href: "/admin-dashboard" },
    { name: "Control Panel", icon: Menu, href: "/control-panel" },
    { name: "Search", icon: MdOutlineManageSearch, href: "/search" },
    { name: "Litrix Chat", icon: BsStars, href: "/chat" },
    { name: "Research Analytics", icon: FaChartLine, href: "/research-analytics" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ],
  academic_admin: [
    { name: "Dashboard", icon: LuLayoutDashboard, href: "/academic-dashboard" },
    { name: "Profile", icon: FaUserCircle, href: "/profile" },
    { name: "Collaboration", icon: AiOutlineTeam, href: "/collab" },
    { name: "Search", icon: MdOutlineManageSearch, href: "/search" },
    { name: "Litrix Chat", icon: BsStars, href: "/chat" },
    { name: "Research Analytics", icon: FaChartLine, href: "/research-analytics" },
    { name: "Settings", icon: MdSettings, href: "/settings" },
  ],
  department_admin: [
    { name: "Dashboard", icon: LuLayoutDashboard, href: "/department-dashboard" },
    { name: "Profile", icon: FaUserCircle, href: "/profile" },
    { name: "Collaboration", icon: AiOutlineTeam, href: "/collab" },
    { name: "Search", icon: MdOutlineManageSearch, href: "/search" },
    { name: "Litrix Chat", icon: BsStars, href: "/chat" },
    { name: "Research Analytics", icon: FaChartLine, href: "/research-analytics" },
    { name: "Settings", icon: MdSettings, href: "/settings" },
  ],
  researcher: [
    { name: "Dashboard", icon: LuLayoutDashboard, href: "/dashboard" },
    { name: "Profile", icon: FaUserCircle, href: "/profile" },
    { name: "Collaboration", icon: AiOutlineTeam, href: "/collab" },
    { name: "Search", icon: MdOutlineManageSearch, href: "/search" },
    { name: "Litrix Chat", icon: BsStars, href: "/chat" },
    { name: "Settings", icon: MdSettings, href: "/settings" },
  ]
};

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState("");
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const [adminDoc, acadDoc, deptDoc, userDoc] = await Promise.all([
        getDoc(doc(db, "admins", user.uid)),
        getDoc(doc(db, "academicAdmins", user.uid)),
        getDoc(doc(db, "departmentAdmins", user.uid)),
        getDoc(doc(db, "users", user.uid))
      ]);

      if (adminDoc.exists()) {
        setUserRole("admin");
        setUserData(adminDoc.data());
      } else if (acadDoc.exists()) {
        setUserRole("academic_admin");
        setUserData(acadDoc.data());
      } else if (deptDoc.exists()) {
        setUserRole("department_admin");
        const data = deptDoc.data();
        setUserData(data);
        if (data.departmentId) {
          const depSnap = await getDoc(doc(db, "departments", data.departmentId));
          if (depSnap.exists()) setDepartmentName(depSnap.data().name || "");
        }
      } else if (userDoc.exists()) {
        setUserRole("researcher");
        setUserData(userDoc.data());
      } else {
        setUserRole("researcher");
        setUserData({ firstName: user.displayName || "User", lastName: "", email: user.email });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const getInitials = (first, last) => {
    return `${first?.[0] || "U"}${last?.[0] || ""}`.toUpperCase();
  };

  const sidebarItems = userRole && MENU_ITEMS[userRole]
    ? MENU_ITEMS[userRole].map(item => {
        if (item.href === '/profile' && userData?.scholar_id) {
          return { ...item, href: `/profile/${userData.scholar_id}` };
        }
        return item;
      })
    : [];

  return (
    <motion.div
      className="relative flex-shrink-0 h-screen"
      animate={{ width: isSidebarOpen ? 256 : 80, transition: { duration: 0.3 } }}
    >
      <div className="h-full bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col border-r shadow">
        <div className="p-5 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
          >
            <motion.img src={logo} alt="Litrix" className="w-10 h-10 rounded" />
            {isSidebarOpen && (
              <motion.h1 initial={{ x: -20 }} animate={{ x: 0 }} className="font-bold text-xl text-blue-700">
                Litrix
              </motion.h1>
            )}
          </motion.div>
          <button
            onClick={() => setIsSidebarOpen(open => !open)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            {isSidebarOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}
          </button>
        </div>

        <nav className="mt-6 flex-grow px-3">
          {sidebarItems.map(item => {
            const isActive =
              location.pathname === item.href ||
              (item.href.startsWith('/profile') && location.pathname.startsWith('/profile'));

            return (
              <Link key={item.name} to={item.href}>
                <motion.div
                  className={`flex items-center p-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  whileHover={{ x: 5 }}
                >
                  <item.icon size={22} className={isActive ? "text-blue-700" : "text-gray-600"} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        className={`ml-3 font-medium ${isActive ? "text-blue-700" : ""}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {userData && (
          <div className="p-4 border-t">
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex items-center">
                {userData.url_picture ? (
                  <img
                    src={userData.url_picture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {getInitials(userData.firstName, userData.lastName)}
                  </div>
                )}
                {isSidebarOpen && (
                  <div className="ml-3">
                    <p className="text-sm font-medium truncate">
                      {userData.firstName} {userData.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userRole === "department_admin"
                        ? departmentName
                        : userData.email}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
