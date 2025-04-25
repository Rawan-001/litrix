import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import AdminDashboard from './AdminDashboard';
import ResearcherDashboard from './ResearcherDashboard';
import ViewSwitcherButton from '../components/common/DashboardViewSwitcher';
import Header from '../components/common/Header';

const { Content } = Layout;

const AcademicAdminDashboard = () => {
  const [activeView, setActiveView] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [academicAdminData, setAcademicAdminData] = useState(null);
  const [researcherData, setResearcherData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchAcademicAdminData = async () => {
      console.log("Initializing AcademicAdminDashboard");
      if (!auth.currentUser) {
        console.log("No authenticated user");
        setInitialLoading(false);
        return;
      }

      try {
        const currentUid = auth.currentUser.uid;
        console.log("Current user UID:", currentUid);

        const academicAdminRef = doc(db, `academicAdmins/${currentUid}`);
        const academicAdminDoc = await getDoc(academicAdminRef);

        if (!academicAdminDoc.exists()) {
          console.error('No academic admin data found');
          setInitialLoading(false);
          return;
        }

        let adminData = academicAdminDoc.data();
        console.log("Raw academic admin data:", adminData);

        if (!adminData.college) {
          adminData.college = "faculty_computing";
          console.log("Adding default college value: faculty_computing");
        }

        if (!adminData.department) {
          adminData.department = "dept_cs";
          console.log("Adding default department value: dept_cs");
        }

        if (currentUid === 'HtPaSB6NgUVD8XWeTqPPevk0RzG3') {
          adminData.scholar_id = "JSQbyBgAAAAJ";
        } else if (currentUid === 'OWA24pjOxNOKUHqcmgoM4i3rC8q2') {
          adminData.scholar_id = "05Jx6QkAAAAJ";
        }

        console.log("Processed academic admin data:", adminData);
        setAcademicAdminData(adminData);

        await fetchResearcherData(adminData);
      } catch (error) {
        console.error("Error fetching academic admin data:", error);
        setInitialLoading(false);
      }
    };

    fetchAcademicAdminData();
  }, []);

  const fetchResearcherData = async (adminData) => {
    try {
      const college = adminData.college || "faculty_computing";
      const department = adminData.department || "dept_cs";
      const scholarId = adminData.scholar_id;

      console.log(`Attempting to fetch researcher data with path components:`, {
        college,
        department,
        scholarId
      });

      if (!scholarId) {
        console.error("No scholar_id available for academic admin");
        setInitialLoading(false);
        return;
      }

      const researcherDocRef = doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}`);
      console.log(`Full path to researcher data: ${researcherDocRef.path}`);

      const researcherDoc = await getDoc(researcherDocRef);

      if (researcherDoc.exists()) {
        const data = researcherDoc.data();
        console.log("Researcher data found:", data);

        const enrichedData = {
          ...data,
          id: scholarId || 'default_id',
          scholar_id: scholarId || 'default_scholar_id',
          college: college || 'default_college',
          department: department || 'default_department'
        };

        console.log("Enriched researcher data:", enrichedData);
        setResearcherData(enrichedData);

        try {
          const publicationsRef = collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`);
          console.log(`Checking publications at path: ${publicationsRef.path}`);

          const publicationsSnapshot = await getDocs(publicationsRef);
          console.log(`Found ${publicationsSnapshot.size} publications`);
        } catch (pubError) {
          console.error("Error checking publications:", pubError);
        }
      } else {
        console.error(`No researcher document found at path: ${researcherDocRef.path}`);
        setResearcherData(null);
      }
    } catch (error) {
      console.error("Error fetching researcher data:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleViewChange = (newView) => {
    if (newView === activeView) return;

    setIsLoading(true);
    setTimeout(() => {
      setActiveView(newView);
      setIsLoading(false);
    }, 400);
  };

  const dashboardTitle = activeView === 'admin' ? 'Admin Dashboard' : 'Researcher Dashboard';

  if (initialLoading) {
    return (
      <Layout className="w-full bg-gray-50 flex-1 flex flex-col overflow-x-hidden">
        <Content className="p-6 flex-1 overflow-auto">
          <div className="flex justify-center items-center h-64 bg-white p-8 rounded-lg shadow-sm my-4">
            <div className="flex flex-col items-center justify-center text-center">
              <SyncOutlined spin style={{ fontSize: 36 }} className="text-blue-500 mb-4" />
              <h4 className="text-xl font-medium text-gray-700 m-0">
                Loading Dashboard
              </h4>
              <p className="text-gray-500 mt-2">Please wait while we prepare your dashboard</p>
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  console.log("Rendering dashboard with view:", activeView);
  console.log("Researcher data available:", !!researcherData);

  return (
    <Layout className="w-full bg-gray-50 flex-1 flex flex-col overflow-x-hidden">
      {/* الهيدر هنا فقط مرة وحدة */}
      <Header 
        title={activeView === 'admin' ? 'Admin Dashboard' : 'Researcher Dashboard'}
        showViewSwitcher={false}
        isAcademicAdmin={true}
      />
  
      <Content className="p-6 flex-1 overflow-auto">
        {/* View Switcher Button */}
        <div className="flex justify-end mb-6">
          <ViewSwitcherButton 
            currentView={activeView} 
            departmentCode={academicAdminData?.department || "dept_cs"}
            onClick={handleViewChange}
          />
        </div>
  
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              className="flex justify-center items-center h-64 bg-white p-8 rounded-lg shadow-sm my-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <SyncOutlined spin style={{ fontSize: 36 }} className="text-blue-500 mb-4" />
                <h4 className="text-xl font-medium text-gray-700 m-0">
                  Loading {activeView === 'admin' ? 'Researcher' : 'Admin'} Dashboard
                </h4>
                <p className="text-gray-500 mt-2">Please wait while we prepare your view</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: activeView === 'admin' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeView === 'admin' ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {activeView === 'admin' ? (
                <AdminDashboard academicAdminData={academicAdminData} hideHeader={true} />
              ) : (
                researcherData ? (
                  <ResearcherDashboard 
                    academicAdminAsResearcher={true} 
                    researcherData={researcherData}
                    academicAdminData={academicAdminData}
                    userData={userData || academicAdminData}
                    hideHeader={true}
                  />
                ) : (
                  <div className="flex justify-center items-center h-64 bg-white p-8 rounded-lg shadow-sm my-4">
                    <div className="flex flex-col items-center justify-center text-center">
                      <h4 className="text-xl font-medium text-gray-700 m-0">
                        No Researcher Data Found
                      </h4>
                      <p className="text-gray-500 mt-2">Please check the researcher's information in the database.</p>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Content>
    </Layout>
  
  );
};

export default AcademicAdminDashboard;