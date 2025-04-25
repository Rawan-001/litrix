import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, limit, where, orderBy } from 'firebase/firestore';
import { GridLoader } from 'react-spinners';
import { Typography, Box, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';


import Header from '../components/common/Header';
import ViewSwitcherButton from '../components/common/DashboardViewSwitcher';


import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";

const PublicationsOverTime = lazy(() => import("../components/analyticsReseracher/PublicationsOverTime"));
const CitesPerYearChart = lazy(() => import("../components/analyticsReseracher/CitesPerYearChart"));

const StatCard = ({ name, icon: Icon, value, color, detail }) => {
  const formattedValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
        <Box sx={{ p: 2 }}>
          <div className="flex items-center mb-2">
            <div 
              className="rounded-md p-2 mr-3 text-white flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <Icon size={18} />
            </div>
            <div>
              <Typography variant="subtitle2" className="text-gray-600 font-medium">
                {name}
              </Typography>
            </div>
          </div>
          
          <Typography 
            variant="h5" 
            className="font-bold ml-10"
            style={{ color: color }}
          >
            {formattedValue}
          </Typography>
          
          {detail && (
            <Typography variant="body2" className="text-gray-500 text-xs ml-10">
              {detail}
            </Typography>
          )}
        </Box>
      </div>
    </motion.div>
  );
};

const ResearcherDashboard = ({ 
  academicAdminAsResearcher = false,
  academicAdminData = null, 
  researcherData = null,
  userData = null,
  departmentAdminAsResearcher = false,
  departmentAdminData = null 
}) => {
  const navigate = useNavigate();
  const [researcher, setResearcher] = useState(null);
  const [publicationsCount, setPublicationsCount] = useState(0);
  const [citationsCount, setCitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const handleViewSwitch = (newView) => {
    if (academicAdminAsResearcher && newView === 'admin') {
      navigate('/admin-dashboard');
    } else if (departmentAdminAsResearcher && newView === 'admin') {
      navigate('/department-dashboard');
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (researcherData) {
        setResearcher(researcherData);
        if (researcherData.citedby !== undefined) {
          setCitationsCount(researcherData.citedby);
        }
        try {
          const college = researcherData.college || (academicAdminData?.college) || "faculty_computing";
          const department = researcherData.department || (academicAdminData?.department) || "dept_cs";
          const scholar_id = researcherData.id || researcherData.scholar_id;
          
          if (scholar_id) {
            const publicationsSnapshot = await getDocs(
              query(
                collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}/publications`),
                orderBy("num_citations", "desc"),
                limit(50)
              )
            );
            setPublicationsCount(publicationsSnapshot.size);
          }
        } catch (error) {
          console.error("Error fetching publications count:", error);
        }
        
        setLoading(false);
        setDataLoading(false);
        return;
      }
      
      if (departmentAdminAsResearcher && departmentAdminData) {
        try {
          const scholar_id = departmentAdminData.scholarId || departmentAdminData.scholar_id;
          const college = departmentAdminData.college || "faculty_computing";
          const department = departmentAdminData.department || "dept_cs";
          
          if (!scholar_id) {
            setLoading(false);
            setDataLoading(false);
            return;
          }
          
          const [researcherDoc, publicationsSnapshot] = await Promise.all([
            getDoc(doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}`)),
            getDocs(query(
              collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}/publications`),
              orderBy("num_citations", "desc"),
              limit(50)
            ))
          ]);
          
          if (researcherDoc.exists()) {
            const researcherData = researcherDoc.data();
            setResearcher(researcherData);
            setPublicationsCount(publicationsSnapshot.size);
            setCitationsCount(researcherData.citedby || 0);
          }
        } finally {
          setLoading(false);
          setDataLoading(false);
        }
        return;
      }
      
      if (academicAdminAsResearcher && academicAdminData) {
        try {
          const scholar_id = academicAdminData.scholar_id;
          const college = academicAdminData.college || "faculty_computing";
          const department = academicAdminData.department || "dept_cs";
          
          if (!scholar_id) {
            setLoading(false);
            setDataLoading(false);
            return;
          }
          
          const [researcherDoc, publicationsSnapshot] = await Promise.all([
            getDoc(doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}`)),
            getDocs(query(
              collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}/publications`),
              orderBy("num_citations", "desc"),
              limit(50)
            ))
          ]);
          
          if (researcherDoc.exists()) {
            const researcherData = researcherDoc.data();
            setResearcher(researcherData);
            setPublicationsCount(publicationsSnapshot.size);
            setCitationsCount(researcherData.citedby || 0);
          }
        } finally {
          setLoading(false);
          setDataLoading(false);
        }
        return;
      }
      
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, `users/${auth.currentUser.uid}`);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.publications_count) {
            setPublicationsCount(userData.publications_count);
          }
          
          if (userData.citations_count) {
            setCitationsCount(userData.citations_count);
          }
          
          await fetchDetailedData(userData);
        } else {
          const deptAdminDocRef = doc(db, `departmentAdmins/${auth.currentUser.uid}`);
          const deptAdminDoc = await getDoc(deptAdminDocRef);
          
          if (deptAdminDoc.exists()) {
            const deptAdminData = deptAdminDoc.data();
            const scholarId = deptAdminData.scholarId || deptAdminData.scholar_id;
            
            if (scholarId) {
              const college = deptAdminData.college || "faculty_computing";
              const department = deptAdminData.department || "dept_cs";
              
              const [researcherDoc, publicationsSnapshot] = await Promise.all([
                getDoc(doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}`)),
                getDocs(query(
                  collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`),
                  orderBy("num_citations", "desc"),
                  limit(50)
                ))
              ]);
              
              if (researcherDoc.exists()) {
                const researcherData = researcherDoc.data();
                setResearcher(researcherData);
                setPublicationsCount(publicationsSnapshot.size);
                setCitationsCount(researcherData.citedby || 0);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
        setDataLoading(false);
      }
    };
    
    fetchInitialData();
  }, [academicAdminAsResearcher, academicAdminData, departmentAdminAsResearcher, departmentAdminData, researcherData, userData]);
  
  const fetchDetailedData = async (userDataParam) => {
    try {
      const { scholar_id, college: userCollege, department: userDepartment } = userDataParam;
      const college = userCollege || "faculty_computing";
      const department = userDepartment || "dept_cs";
      
      if (!scholar_id) {
        setDataLoading(false);
        return;
      }
      
      const [researcherDoc, publicationsSnapshot] = await Promise.all([
        getDoc(doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}`)),
        getDocs(query(
          collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}/publications`),
          orderBy("num_citations", "desc"),
          limit(50)
        ))
      ]);
      
      if (researcherDoc.exists()) {
        const researcherData = researcherDoc.data();
        setResearcher(researcherData);
        setPublicationsCount(publicationsSnapshot.size);
        setCitationsCount(researcherData.citedby || 0);
      }
    } catch (error) {
      console.error("Error fetching detailed data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const dashboardStats = useMemo(() => {
    return [
      {
        name: "Total Publications",
        icon: LuFileSpreadsheet,
        value: publicationsCount,
        color: "rgb(29 78 216)"
      },
      {
        name: "Total Citations",
        icon: FaQuoteRight,
        value: citationsCount,
        color: "rgb(29 78 216)"
      },
      {
        name: "Citation Rate",
        icon: MdOutlinePeopleAlt,
        value: publicationsCount > 0 ? (citationsCount / publicationsCount).toFixed(1) : 0,
        color: "rgb(29 78 216)",
        detail: "Citations per publication"
      }
    ];
  }, [publicationsCount, citationsCount]);

  if (loading) {
    return (
      <div className="flex-1 relative z-10 overflow-auto">
        <main className="mx-auto py-6 px-4 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <GridLoader size={30} color={"#1d4ed8"} />
          </div>
        </main>
      </div>
    );
  }

  const isDepartmentAdmin = departmentAdminAsResearcher || (auth.currentUser && auth.currentUser.uid && !!departmentAdminData);
  const isAcademicAdmin = academicAdminAsResearcher || (auth.currentUser && auth.currentUser.uid && !!academicAdminData);
  const shouldShowViewSwitcher = isDepartmentAdmin || isAcademicAdmin;
  
  const departmentCode = departmentAdminData?.department || academicAdminData?.department || "dept_cs";

  return (
    <div className="flex flex-col h-screen">
      <Header 
        title="Researcher Dashboard" 
        showViewSwitcher={false}
        isDepartmentAdmin={isDepartmentAdmin}
        isAcademicAdmin={isAcademicAdmin}
      />
      
      <div className="flex-1 relative z-10 overflow-auto">
        <main className="mx-auto py-6 px-4 lg:px-8">
          {shouldShowViewSwitcher && (
            <div className="flex justify-end mb-6">
              <ViewSwitcherButton 
                currentView="researcher" 
                departmentCode={departmentCode}
                onClick={handleViewSwitch}
              />
            </div>
          )}
          
          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {dashboardStats.map((stat, index) => (
              <StatCard
                key={index}
                name={stat.name}
                icon={stat.icon}
                value={stat.value}
                color={stat.color}
                detail={stat.detail}
              />
            ))}
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white shadow-lg rounded-lg p-6 border border-gray-200"
            >
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <GridLoader size={15} color={"#1d4ed8"} />
                </div>
              }>
                {dataLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <GridLoader size={15} color={"#1d4ed8"} />
                  </div>
                ) : (
                  researcher ? (
                    <PublicationsOverTime researcher={researcher} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500">No researcher data available</p>
                    </div>
                  )
                )}
              </Suspense>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white shadow-lg rounded-lg p-6 border border-gray-200"
            >
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <GridLoader size={15} color={"#1d4ed8"} />
                </div>
              }>
                {dataLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <GridLoader size={15} color={"#1d4ed8"} />
                  </div>
                ) : (
                  researcher ? (
                    <CitesPerYearChart researcher={researcher} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500">No researcher data available</p>
                    </div>
                  )
                )}
              </Suspense>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResearcherDashboard;