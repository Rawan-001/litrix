const AuthorsList = ({ authors, shouldTruncate, colors }) => {
  const [expanded, setExpanded] = React.useState(false);
  const displayAuthors = expanded || !shouldTruncate ? 
    authors.join(', ') : 
    authors.slice(0, 5).join(', ') + '...';
  
  return (
    <div style={{ 
      margin: '0 0 14px 0', 
      fontSize: '15px', 
      color: colors.text,
      lineHeight: 1.6
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <strong>Authors:</strong> {displayAuthors}
        </div>
        
        {shouldTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              backgroundColor: colors.primary,
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '13px',
              color: 'white',
              cursor: 'pointer',
              marginLeft: '12px',
              whiteSpace: 'nowrap',
              marginTop: '2px',
              fontWeight: 500
            }}
          >
            {expanded ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, limit, getFirestore } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import html2canvas from 'html2canvas';

const departments = [
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const colors = {
  primary: "#6366f1",
  text: "#334155",
  lightText: "#64748b",
  background: "#ffffff",
  border: "#e2e8f0",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: colors.text }}>{`Year: ${label}`}</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: colors.primary }}>{`Publications: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const PublicationsOverTimeAdmin = ({ selectedDepartment }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("5years");
  const [cachedData, setCachedData] = useState({});
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearPublications, setYearPublications] = useState([]);
  const [yearLoading, setYearLoading] = useState(false);
  
  const chartRef = React.useRef(null);
  const publicationsCache = React.useRef({});

  const downloadChart = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `publications-${selectedDepartment}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };
  
  const exportToCSV = (data, filename) => {
    const headers = ['Title', 'Authors', 'Journal', 'Year', 'Citations', 'Publisher', 'Faculty', 'Department', 'URL'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    data.forEach(pub => {
      const authors = Array.isArray(pub.authors) ? pub.authors.join('; ') : (pub.authors || '');
      const row = [
        `"${(pub.title || '').replace(/"/g, '""')}"`,
        `"${authors.replace(/"/g, '""')}"`,
        `"${(pub.journal || '').replace(/"/g, '""')}"`,
        pub.year || '',
        pub.citations || 0,
        `"${(pub.publisher || '').replace(/"/g, '""')}"`,
        `"${(pub.faculty || '').replace(/"/g, '""')}"`,
        `"${(pub.department || '').replace(/"/g, '""')}"`,
        pub.url || ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchDepartmentPublications = async (department, publicationsByYear) => {
    try {
      if (cachedData[`${department}-counts`]) {
        Object.entries(cachedData[`${department}-counts`]).forEach(([year, count]) => {
          publicationsByYear[year] = (publicationsByYear[year] || 0) + count;
        });
        return;
      }

      const facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
      const facultySnapshot = await getDocs(facultyRef);
      
      const deptCounts = {};

      await Promise.all(facultySnapshot.docs.map(async (facultyDoc) => {
        const scholarId = facultyDoc.id;
        const publicationsRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members/${scholarId}/publications`);
        const publicationsSnapshot = await getDocs(publicationsRef);

        publicationsSnapshot.forEach(doc => {
          const pubYear = doc.data().pub_year;
          if (pubYear >= 1991 && pubYear <= 2025) {
            publicationsByYear[pubYear] = (publicationsByYear[pubYear] || 0) + 1;
            deptCounts[pubYear] = (deptCounts[pubYear] || 0) + 1;
          }
        });
      }));

      setCachedData(prev => ({
        ...prev,
        [`${department}-counts`]: deptCounts
      }));
    } catch (error) {
      console.error(`Error fetching publications for ${department}:`, error);
    }
  };

  const fetchPublicationsByRange = async (department) => {
    if (cachedData[department]) {
      setData(cachedData[department]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let publicationsByYear = {};

      if (department === "all") {
        await Promise.all(departments.map(dept => 
          fetchDepartmentPublications(dept.value, publicationsByYear)
        ));
      } else {
        await fetchDepartmentPublications(department, publicationsByYear);
      }

      const formattedData = Object.entries(publicationsByYear)
        .map(([year, count]) => ({
          year: parseInt(year),
          publications: count
        }))
        .sort((a, b) => a.year - b.year);

      setCachedData(prevCache => ({
        ...prevCache,
        [department]: formattedData
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error("Error fetching publications: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentYearPublications = async (department, year) => {
    const cacheKey = `${department}-${year}`;
    if (publicationsCache.current[cacheKey]) {
      return publicationsCache.current[cacheKey];
    }
    
    const publications = [];
    
    try {
      const facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
      const facultySnapshot = await getDocs(facultyRef);
      
      await Promise.all(facultySnapshot.docs.map(async (facultyDoc) => {
        const facultyData = facultyDoc.data();
        const facultyName = facultyData?.name || 'Unknown Faculty';
        const scholarId = facultyDoc.id;
        
        const publicationsRef = collection(
          db, 
          `colleges/faculty_computing/departments/${department}/faculty_members/${scholarId}/publications`
        );
        
        const yearQuery = query(
          publicationsRef,
          where('pub_year', '==', parseInt(year))
        );
        
        const publicationsSnapshot = await getDocs(yearQuery);
        
        publicationsSnapshot.forEach(doc => {
          const pubData = doc.data();
          const authors = Array.isArray(pubData.authors) ? pubData.authors : 
                         (pubData.authors ? [pubData.authors] : []);
          
          publications.push({
            id: doc.id,
            title: pubData.title || 'Untitled Publication',
            authors: authors,
            venue: pubData.pub_venue || 'Unknown Venue',
            year: pubData.pub_year,
            url: pubData.url || '',
            faculty: facultyName,
            department: departments.find(d => d.value === department)?.label || department,
            citations: pubData.num_citations || pubData.citation_count || 0,
            journal: pubData.journal || pubData.pub_venue || '',
            publisher: pubData.publisher || ''
          });
        });
      }));
      
      publications.sort((a, b) => (b.citations || 0) - (a.citations || 0));
      
    } catch (error) {
      console.error(`Error fetching ${department} publications for ${year}:`, error);
    }
    
    publicationsCache.current[cacheKey] = publications;
    return publications;
  };

  const fetchPublicationsForYear = async (year) => {
    if (!selectedDepartment) return;
    
    const cacheKey = `${selectedDepartment}-${year}-full`;
    if (publicationsCache.current[cacheKey]) {
      setYearPublications(publicationsCache.current[cacheKey]);
      return;
    }
    
    setYearLoading(true);
    try {
      let yearPublications = [];
      
      if (selectedDepartment === "all") {
        await Promise.all(departments.map(async (dept) => {
          const deptPublications = await fetchDepartmentYearPublications(dept.value, year);
          yearPublications = [...yearPublications, ...deptPublications];
        }));
      } else {
        yearPublications = await fetchDepartmentYearPublications(selectedDepartment, year);
      }
      
      publicationsCache.current[cacheKey] = yearPublications;
      setYearPublications(yearPublications);
    } catch (error) {
      console.error(`Error fetching publications for year ${year}:`, error);
    } finally {
      setYearLoading(false);
    }
  };

  const handlePointClick = (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const year = data.activePayload[0].payload.year;
      setSelectedYear(year);
      fetchPublicationsForYear(year);
    }
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetchPublicationsByRange(selectedDepartment);
    }
  }, [selectedDepartment]);

  const filteredData = useMemo(() => {
    if (dateRange === "all" || data.length === 0) return data;
    
    const currentYear = new Date().getFullYear();
    const minYear = dateRange === "5years" ? currentYear - 5 : currentYear - 10;
    
    return data.filter(item => item.year >= minYear);
  }, [data, dateRange]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalPublications: 0, averagePerYear: 0, mostProductiveYear: null };
    }
    
    const total = filteredData.reduce((sum, item) => sum + item.publications, 0);
    const avg = Math.round(total / filteredData.length);
    const mostProductive = filteredData.reduce(
      (max, item) => item.publications > max.publications ? item : max, 
      filteredData[0]
    );
    
    return { totalPublications: total, averagePerYear: avg, mostProductiveYear: mostProductive };
  }, [filteredData]);

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.background, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '30px', height: '30px', border: '2px solid #f3f3f3', borderTop: `2px solid ${colors.primary}`, borderRadius: '50%', margin: '0 auto' }}></div>
          <p style={{ marginTop: '12px', color: colors.lightText }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ backgroundColor: colors.background, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '24px', marginBottom: '24px', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: colors.lightText }}>No publication data available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      ref={chartRef}
      style={{ 
        backgroundColor: colors.background, 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        overflow: 'hidden', 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: selectedYear ? '900px' : 'auto'
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.text }}>
            Publications Overview
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: colors.lightText }}>
            {departments.find(d => d.value === selectedDepartment)?.label || 'All Departments'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, fontSize: '14px', color: colors.text, cursor: 'pointer' }}
          >
            <option value="5years">Last 5 Years</option>
            <option value="10years">Last 10 Years</option>
            <option value="all">All Time</option>
          </select>
          
          <div style={{ display: 'flex', gap: '8px' }}>
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
            
            {selectedYear && yearPublications.length > 0 && (
              <button 
                onClick={() => exportToCSV(yearPublications, `publications-${selectedYear}`)}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '8px', 
                  borderRadius: '6px',
                  color: colors.primary
                }}
                title="Export as CSV"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px 20px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', margin: 0, color: colors.lightText }}>Total Publications</p>
          <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 600, color: colors.primary }}>
            {stats.totalPublications.toLocaleString()}
          </h3>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', margin: 0, color: colors.lightText }}>Avg. Per Year</p>
          <h3 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 600, color: colors.primary }}>
            {stats.averagePerYear.toLocaleString()}
          </h3>
        </div>
      </div>
      
      <div style={{ padding: '0 16px 20px 0', height: '260px', flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            onClick={handlePointClick}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`${colors.border}`} />
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="publications"
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ r: 3, fill: colors.primary, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: colors.primary, strokeWidth: 2, stroke: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {stats.mostProductiveYear && !selectedYear && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '12px 20px', fontSize: '14px', color: colors.text, flexShrink: 0 }}>
          <strong>Peak Year:</strong> {stats.mostProductiveYear.year} with {stats.mostProductiveYear.publications} publications
        </div>
      )}
      
      {selectedYear && (
        <div id="year-publications-list" style={{ 
          borderTop: `1px solid ${colors.border}`, 
          padding: '16px 20px',
          flex: '1',
          minHeight: '0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexShrink: 0
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.text }}>
              Publications in {selectedYear}
              {!yearLoading && <span style={{ marginLeft: '8px', fontSize: '14px', color: colors.lightText, fontWeight: 'normal' }}>({yearPublications.length})</span>}
            </h3>
            
            <button
              onClick={() => setSelectedYear(null)}
              style={{ padding: '4px 8px', fontSize: '12px', color: colors.lightText, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          
          {yearLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', flexShrink: 0 }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid #f3f3f3', borderTop: `2px solid ${colors.primary}`, borderRadius: '50%', margin: '0 auto' }}></div>
            </div>
          ) : yearPublications.length === 0 ? (
            <p style={{ color: colors.lightText, textAlign: 'center', padding: '20px 0', flexShrink: 0 }}>
              No publications found for {selectedYear}
            </p>
          ) : (
            <div style={{ 
              overflowY: 'auto', 
              flex: '1',
              minHeight: '0',
              paddingRight: '8px'
            }}>
              {yearPublications.map((pub, index) => {
                const authorsList = Array.isArray(pub.authors) ? pub.authors : (pub.authors ? [pub.authors] : []);
                const shouldTruncate = authorsList.length > 5;
                
                return (
                  <div key={pub.id || index} style={{ 
                    padding: '18px', 
                    borderBottom: index < yearPublications.length - 1 ? `1px solid ${colors.border}` : 'none',
                    backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                    width: '100%',
                    maxWidth: '900px',
                    margin: '0 auto'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '17px', 
                      fontWeight: 600, 
                      color: colors.text,
                      lineHeight: 1.5
                    }}>
                      {pub.url ? (
                        <a href={pub.url} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none' }}>
                          {pub.title}
                        </a>
                      ) : pub.title}
                    </h4>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '12px', 
                      margin: '0 0 14px 0', 
                      fontSize: '14px',
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        backgroundColor: '#f1f5f9', 
                        color: colors.text, 
                        padding: '4px 12px', 
                        borderRadius: '6px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #e2e8f0',
                        minWidth: '90px',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontWeight: 600 }}>{pub.citations || 0}</span>
                        <span>citations</span>
                      </div>
                      
                      <div style={{ 
                        color: colors.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginRight: '8px'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{pub.year}</span>
                      </div>
                      
                      {pub.journal && (
                        <div style={{ 
                          color: colors.text,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: '1'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                          <span style={{ fontStyle: 'italic', fontSize: '14px' }}>{pub.journal}</span>
                        </div>
                      )}
                    </div>
                    
                    <AuthorsList 
                      authors={authorsList} 
                      shouldTruncate={shouldTruncate} 
                      colors={colors}
                    />
                    
                    <div style={{ 
                      display: 'flex', 
                      fontSize: '14px', 
                      color: colors.lightText, 
                      gap: '20px', 
                      flexWrap: 'wrap',
                      borderTop: `1px dashed ${colors.border}`,
                      paddingTop: '10px'
                    }}>
                      {pub.publisher && <span><strong>Publisher:</strong> {pub.publisher}</span>}
                      <span><strong>Department:</strong> {pub.department}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PublicationsOverTimeAdmin;