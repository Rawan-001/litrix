import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import StatCard from '../components/common/StatCard';
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { motion } from 'framer-motion';
import Data from '../components/analyticsReseracher/PublicationsOverTime';
import RevenueChart from '../components/analyticsReseracher/CitesPerYearChart'; 
import { auth, db } from '../firebaseConfig'; 
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { GridLoader } from 'react-spinners';
import { Button, Menu, MenuItem } from '@mui/material';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const ResearcherDashboard = () => {
  const [researcher, setResearcher] = useState(null);
  const [publicationsCount, setPublicationsCount] = useState(0);
  const [citationsCount, setCitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;

        if (user) {
          const userDocRef = doc(db, `users/${user.uid}`);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const scholarId = userData.scholar_id;
            const college = userData.college;
            const department = userData.department;

            const researcherDocRef = doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}`);
            const researcherDoc = await getDoc(researcherDocRef);

            if (researcherDoc.exists()) {
              const researcherData = researcherDoc.data();
              setResearcher(researcherData);

              const publicationsRef = collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`);
              const publicationsSnapshot = await getDocs(publicationsRef);
              setPublicationsCount(publicationsSnapshot.size);

              setCitationsCount(researcherData.citedby || 0);
            } else {
              console.error('No researcher data found');
            }
          } else {
            console.error('No user data found');
          }
        } else {
          console.error('User not logged in');
        }
      } catch (error) {
        console.error("Error fetching researcher data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const exportData = (format) => {
    const data = {
      publications: publicationsCount,
      citations: citationsCount,
      researcherName: `${researcher?.firstName || ''} ${researcher?.lastName || ''}`,
    };

    switch (format) {
      case 'csv':
        exportToCSV(data);
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel(data);
        break;
      case 'json':
        exportToJSON(data);
        break;
      case 'xml':
        exportToXML(data);
        break;
      default:
        console.error('Unsupported format');
    }

    handleExportClose();
  };

  const exportToCSV = (data) => {
    const csv = Papa.unparse([data]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'dashboard_data.csv');
  };

  const exportToPDF = () => {
    const input = document.getElementById('dashboard-content');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      pdf.save('dashboard_data.pdf');
    });
  };

  const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet([data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard Data');
    XLSX.writeFile(workbook, 'dashboard_data.xlsx');
  };

  const exportToJSON = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'dashboard_data.json');
  };

  const exportToXML = (data) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<dashboard>\n';
    for (let key in data) {
      xml += `  <${key}>${data[key]}</${key}>\n`;
    }
    xml += '</dashboard>';
    const blob = new Blob([xml], { type: 'application/xml' });
    saveAs(blob, 'dashboard_data.xml');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="absolute inset-0 flex justify-center items-center">
          <GridLoader size={30} color={"#123abc"} />
        </div>
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
            transition={{ duration: 1 }}
          >
            <StatCard name="Total Publications" icon={LuFileSpreadsheet} value={publicationsCount} color="#6366F1" />
            <StatCard name="Total Citations" icon={FaQuoteRight} value={citationsCount} color="#4da7d0" />
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
  <Data researcher={researcher} />
  <RevenueChart researcher={researcher} />

  <div className="lg:col-span-2"> 
  </div>
</div>

      </main>
    </div>
  );
};

export default ResearcherDashboard;
