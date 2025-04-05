import { useEffect, useState, lazy, Suspense, useMemo } from 'react';
import Header from '../components/common/Header';
import StatCard from '../components/common/StatCard';
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { motion } from 'framer-motion';
import { auth, db } from '../firebaseConfig'; 
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { GridLoader } from 'react-spinners';
import { Button, Menu, MenuItem, Skeleton } from '@mui/material';

// Lazy load heavy components
const Data = lazy(() => import('../components/analyticsReseracher/PublicationsOverTime'));
const RevenueChart = lazy(() => import('../components/analyticsReseracher/CitesPerYearChart'));

const ResearcherDashboard = () => {
  const [researcher, setResearcher] = useState(null);
  const [publicationsCount, setPublicationsCount] = useState(0);
  const [citationsCount, setCitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Use parallel data fetching
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        // Get user document
        const userDocRef = doc(db, `users/${auth.currentUser.uid}`);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.error('No user data found');
          setLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        setUserData(userData);
        
        // Quick stats - show as soon as we have them
        if (userData.publications_count) {
          setPublicationsCount(userData.publications_count);
        }
        
        if (userData.citations_count) {
          setCitationsCount(userData.citations_count);
        }
        
        // Show the UI even while we're still loading detailed data
        setLoading(false);
        
        // Continue loading the rest in the background
        fetchDetailedData(userData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Secondary data fetch - runs after the UI is shown
  const fetchDetailedData = async (userData) => {
    try {
      const { scholar_id, college, department } = userData;
      
      // Fetch researcher profile in parallel with publication data
      const [researcherDoc, publicationsSnapshot] = await Promise.all([
        getDoc(doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}`)),
        getDocs(query(collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholar_id}/publications`), limit(100)))
      ]);
      
      if (researcherDoc.exists()) {
        const researcherData = researcherDoc.data();
        setResearcher(researcherData);
        
        // Update counts with more accurate data
        setPublicationsCount(publicationsSnapshot.size);
        setCitationsCount(researcherData.citedby || 0);
      }
    } catch (error) {
      console.error("Error fetching detailed data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const exportData = async (format) => {
    const data = {
      publications: publicationsCount,
      citations: citationsCount,
      researcherName: `${researcher?.firstName || ''} ${researcher?.lastName || ''}`,
    };

    try {
      switch (format) {
        case 'csv':
          const Papa = await import('papaparse');
          const { saveAs } = await import('file-saver');
          
          const csv = Papa.default.unparse([data]);
          const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          saveAs(csvBlob, 'dashboard_data.csv');
          break;
          
        case 'pdf':
          const { jsPDF } = await import('jspdf');
          const html2canvas = await import('html2canvas');
          
          const input = document.getElementById('dashboard-content');
          const canvas = await html2canvas.default(input);
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF();
          pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
          pdf.save('dashboard_data.pdf');
          break;
          
        case 'excel':
          const XLSX = await import('xlsx');
          const { saveAs: saveAsExcel } = await import('file-saver');
          
          const worksheet = XLSX.utils.json_to_sheet([data]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard Data');
          XLSX.writeFile(workbook, 'dashboard_data.xlsx');
          break;
          
        case 'json':
          const { saveAs: saveAsJSON } = await import('file-saver');
          
          const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          saveAsJSON(jsonBlob, 'dashboard_data.json');
          break;
          
        case 'xml':
          const { saveAs: saveAsXML } = await import('file-saver');
          
          let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
          xml += '<dashboard>\n';
          for (let key in data) {
            xml += `  <${key}>${data[key]}</${key}>\n`;
          }
          xml += '</dashboard>';
          const xmlBlob = new Blob([xml], { type: 'application/xml' });
          saveAsXML(xmlBlob, 'dashboard_data.xml');
          break;
          
        default:
          console.error('Unsupported format');
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }

    handleExportClose();
  };

  // Calculate dashboard statistics with useMemo to prevent unnecessary recalculations
  const dashboardStats = useMemo(() => {
    return [
      {
        name: "Total Publications",
        icon: LuFileSpreadsheet,
        value: publicationsCount,
        color: "#6366F1"
      },
      {
        name: "Total Citations",
        icon: FaQuoteRight,
        value: citationsCount,
        color: "#4da7d0"
      }
    ];
  }, [publicationsCount, citationsCount]);

  if (loading) {
    return (
      <div className="flex-1 relative z-10">
        <Header title="Dashboard" />
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2].map((item) => (
              <Skeleton key={item} variant="rectangular" height={100} animation="wave" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Skeleton variant="rectangular" height={300} animation="wave" />
            <Skeleton variant="rectangular" height={300} animation="wave" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 relative z-10 overflow-auto">
      <Header title="Dashboard" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }} // Reduced animation time
          >
            {dashboardStats.map((stat, index) => (
              <StatCard 
                key={index}
                name={stat.name} 
                icon={stat.icon} 
                value={stat.value} 
                color={stat.color} 
              />
            ))}
          </motion.div>

          <Button
            variant="contained"
            color="primary"
            onClick={handleExportClick}
            className="mr-2"
          >
            Export Data
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => exportData('csv')}>Export as CSV</MenuItem>
            <MenuItem onClick={() => exportData('pdf')}>Export as PDF</MenuItem>
            <MenuItem onClick={() => exportData('excel')}>Export as Excel</MenuItem>
            <MenuItem onClick={() => exportData('json')}>Export as JSON</MenuItem>
            <MenuItem onClick={() => exportData('xml')}>Export as XML</MenuItem>
          </Menu>
        </div>

        <div id="dashboard-content" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Suspense fallback={<Skeleton variant="rectangular" height={300} animation="wave" />}>
            {dataLoading ? (
              <div className="bg-white p-4 rounded-lg shadow-md h-[300px] flex items-center justify-center">
                <GridLoader size={15} color={"#4da7d0"} />
              </div>
            ) : (
              <Data researcher={researcher} />
            )}
          </Suspense>
          
          <Suspense fallback={<Skeleton variant="rectangular" height={300} animation="wave" />}>
            {dataLoading ? (
              <div className="bg-white p-4 rounded-lg shadow-md h-[300px] flex items-center justify-center">
                <GridLoader size={15} color={"#4da7d0"} />
              </div>
            ) : (
              <RevenueChart researcher={researcher} />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default ResearcherDashboard;