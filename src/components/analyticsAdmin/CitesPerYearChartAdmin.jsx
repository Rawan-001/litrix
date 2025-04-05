import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import html2canvas from 'html2canvas';

const departments = [
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const ModernCitationsChart = ({ selectedDepartment }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("5years");
  
  const chartRef = React.useRef(null);

 
  const colors = {
    text: "#0f172a",         
    background: "#f8fafc",   
    primary: "#0ea5e9",      
    cardBg: "#ffffff",       
    border: "#e2e8f0",       
    highlight: "#f43f5e",    
  };

  const downloadChart = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `citations-${selectedDepartment}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const fetchCitesPerYear = async (department) => {
    setLoading(true);
    try {
      let citesPerYear = {};
      let publicationsPerYear = {};

      if (department === "all") {
        for (const dept of departments) {
          await fetchDepartmentData(dept.value, citesPerYear, publicationsPerYear);
        }
      } else {
        await fetchDepartmentData(department, citesPerYear, publicationsPerYear);
      }

      const years = Object.keys(citesPerYear).map(year => parseInt(year)).sort();
      
      const formattedData = years.map((year) => ({
        year,
        citations: citesPerYear[year] || 0,
        publications: publicationsPerYear[year] || 0,
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Error fetching citation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentData = async (department, citesPerYear, publicationsPerYear) => {
    const facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
    const facultySnapshot = await getDocs(facultyRef);

    const publicationsPromises = facultySnapshot.docs.map(async (facultyDoc) => {
      const facultyData = facultyDoc.data();
      const facultyCitesPerYear = facultyData.cites_per_year || {};

      for (const year in facultyCitesPerYear) {
        citesPerYear[year] = (citesPerYear[year] || 0) + facultyCitesPerYear[year];
      }

      const publicationsRef = collection(
        db,
        `colleges/faculty_computing/departments/${department}/faculty_members/${facultyDoc.id}/publications`
      );
      const publicationsSnapshot = await getDocs(publicationsRef);

      publicationsSnapshot.docs.forEach(pubDoc => {
        const pubData = pubDoc.data();
        const pubYear = pubData.pub_year;
        
        if (pubYear) {
          publicationsPerYear[pubYear] = (publicationsPerYear[pubYear] || 0) + 1;
        }
      });
    });

    await Promise.all(publicationsPromises);
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetchCitesPerYear(selectedDepartment);
    }
  }, [selectedDepartment]);

  const filteredData = useMemo(() => {
    if (dateRange === "all") return data;
    
    const currentYear = new Date().getFullYear();
    
    switch(dateRange) {
      case "5years":
        return data.filter(item => item.year >= currentYear - 5);
      case "10years":
        return data.filter(item => item.year >= currentYear - 10);
      default:
        return data;
    }
  }, [data, dateRange]);
  
  const totalCitations = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.citations, 0);
  }, [filteredData]);
  
  const totalPublications = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.publications, 0);
  }, [filteredData]);
  
  const averageCitationsPerYear = useMemo(() => {
    return filteredData.length > 0 ? Math.round(totalCitations / filteredData.length) : 0;
  }, [filteredData, totalCitations]);
  
  const maxCitationsYear = useMemo(() => {
    if (filteredData.length === 0) return null;
    return filteredData.reduce((max, item) => item.citations > max.citations ? item : max, filteredData[0]);
  }, [filteredData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: `1px solid ${colors.border}`,
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <p className="label" style={{ 
            margin: 0, 
            fontWeight: 600, 
            fontSize: '14px',
            color: colors.text 
          }}>{`Year: ${label}`}</p>
          <p style={{ 
            margin: '5px 0 0 0', 
            fontSize: '14px',
            color: colors.primary 
          }}>{`Citations: ${payload[0].value}`}</p>
          {payload[0].payload.publications && (
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '14px',
              color: colors.text,
              opacity: 0.8
            }}>{`Publications: ${payload[0].payload.publications}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '500px',
        width: '100%' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{
            border: '3px solid #f3f3f3',
            borderTop: `3px solid ${colors.primary}`,
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '12px', color: colors.text, opacity: 0.7 }}>Loading citation data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ 
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '500px',
        width: '100%' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            fontSize: '16px', 
            fontWeight: 500, 
            color: colors.text, 
            margin: 0 
          }}>
            No citation data available
          </p>
          <p style={{ fontSize: '14px', color: colors.text, opacity: 0.7, marginTop: '8px' }}>
            Please select another department
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      ref={chartRef}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${colors.border}`,
        marginBottom: '24px',
        width: '100%',
        height: '500px', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' 
      }}
    >
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0 
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 600, 
            color: colors.text 
          }}>
            Citations Overview
          </h2>
          <p style={{ 
            margin: '5px 0 0 0', 
            fontSize: '14px', 
            color: colors.text, 
            opacity: 0.7 
          }}>
            {departments.find(d => d.value === selectedDepartment)?.label || 'All Departments'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              fontSize: '14px',
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            <option value="5years">Last 5 Years</option>
            <option value="10years">Last 10 Years</option>
            <option value="all">All Time</option>
          </select>
          
          <button 
            onClick={downloadChart}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '6px'
            }}
            title="Download as image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        padding: '20px 24px',
        flexShrink: 0 
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', margin: 0, color: colors.text, opacity: 0.7 }}>Total Citations</p>
          <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 600, color: colors.primary }}>
            {totalCitations.toLocaleString()}
          </h3>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', margin: 0, color: colors.text, opacity: 0.7 }}>Avg. Per Year</p>
          <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 600, color: colors.primary }}>
            {averageCitationsPerYear.toLocaleString()}
          </h3>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', margin: 0, color: colors.text, opacity: 0.7 }}>Publications</p>
          <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 600, color: colors.primary }}>
            {totalPublications.toLocaleString()}
          </h3>
        </div>
      </div>
      
      <div style={{ 
        padding: '0 16px 24px 0', 
        flex: 1, 
        minHeight: '220px' 
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12, fill: colors.text }}
              tickLine={{ stroke: colors.border }}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: colors.text }}
              tickLine={{ stroke: colors.border }}
              axisLine={{ stroke: colors.border }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="citations"
              stroke={colors.primary}
              strokeWidth={3}
              dot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: colors.primary, strokeWidth: 2, stroke: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {maxCitationsYear && (
        <div style={{ 
          borderTop: `1px solid ${colors.border}`,
          padding: '16px 24px',
          fontSize: '14px',
          color: colors.text,
          flexShrink: 0 
        }}>
          <strong>Peak Year:</strong> {maxCitationsYear.year} with {maxCitationsYear.citations.toLocaleString()} citations
        </div>
      )}
    </motion.div>
  );
};

export default ModernCitationsChart;