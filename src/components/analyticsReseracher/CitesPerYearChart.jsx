import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { doc, getDoc } from "firebase/firestore"; 
import { db, auth } from "../../firebaseConfig"; 
import { GridLoader } from 'react-spinners'; 

const CitesPerYearChart = ({ 
  researcher = null,
  role = "researcher", 
  customColor = "#4F46E5",
  showFilters = true
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scholarId, setScholarId] = useState(null);
  const [college, setCollege] = useState(null); 
  const [department, setDepartment] = useState(null); 
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("Citations");

  const themeColors = useMemo(() => {
    const colors = {
      researcher: {
        primary: customColor || "#4F46E5",
        secondary: "#818CF8",
        gradient: ["#4F46E5", "#818CF8", "#C7D2FE"],
        highlight: "#312E81"
      },
      admin: {
        primary: "#2563EB",
        secondary: "#60A5FA",
        gradient: ["#1E40AF", "#3B82F6", "#93C5FD"],
        highlight: "#1E3A8A"
      },
      visitor: {
        primary: "#10B981",
        secondary: "#34D399",
        gradient: ["#047857", "#10B981", "#6EE7B7"],
        highlight: "#065F46"
      }
    };
    return colors[role] || colors.researcher;
  }, [role, customColor]);

  const fetchScholarId = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { 
          scholar_id: userData.scholar_id, 
          college: userData.college || "faculty_computing", 
          department: userData.department || "dept_cs" 
        };
      }
    } catch (error) {
      console.error("Error fetching scholar ID: ", error);
    }
    return null;
  };

  const fetchCitesPerYear = async (scholarId, college, department) => {
    setLoading(true);
    try {
      const docRef = doc(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const researcherData = docSnap.data();
        const citesPerYear = researcherData.cites_per_year || {};
        const hIndex = researcherData.h_index || 0;
        const i10Index = researcherData.i10_index || 0;

        const sortedYears = Object.keys(citesPerYear).sort((a, b) => parseInt(a) - parseInt(b));
        
        const formattedData = sortedYears.map((year, index) => {
          let avgCites = citesPerYear[year];
          let count = 1;
          
          if (index > 0 && sortedYears[index-1]) {
            avgCites += citesPerYear[sortedYears[index-1]];
            count++;
          }
          if (index < sortedYears.length - 1 && sortedYears[index+1]) {
            avgCites += citesPerYear[sortedYears[index+1]];
            count++;
          }
          
          return {
            year: parseInt(year),
            citations: citesPerYear[year],
            avg: Math.round(avgCites / count),
            h_index: hIndex,
            i10_index: i10Index
          };
        });

        setData(formattedData);
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching cites_per_year:", error);
    } finally {
      setLoading(false);
    }
  };

  const processResearcherData = (researcherData) => {
    if (!researcherData) return;
    
    const citesPerYear = researcherData.cites_per_year || {};
    const hIndex = researcherData.h_index || 0;
    const i10Index = researcherData.i10_index || 0;

    const sortedYears = Object.keys(citesPerYear).sort((a, b) => parseInt(a) - parseInt(b));
    
    const formattedData = sortedYears.map((year, index) => {
      let avgCites = citesPerYear[year];
      let count = 1;
      
      if (index > 0 && sortedYears[index-1]) {
        avgCites += citesPerYear[sortedYears[index-1]];
        count++;
      }
      if (index < sortedYears.length - 1 && sortedYears[index+1]) {
        avgCites += citesPerYear[sortedYears[index+1]];
        count++;
      }
      
      return {
        year: parseInt(year),
        citations: citesPerYear[year],
        avg: Math.round(avgCites / count),
        h_index: hIndex,
        i10_index: i10Index
      };
    });

    setData(formattedData);
    setLoading(false);
  };

  useEffect(() => {
    if (researcher) {
      setScholarId(researcher.id || researcher.scholar_id);
      setCollege(researcher.college || "faculty_computing");
      setDepartment(researcher.department || "dept_cs");
      
      setTimeout(() => {
        setLoading(false);
      }, 800);
      
      processResearcherData(researcher);
    } else {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userData = await fetchScholarId(user.uid);
          if (userData) {
            const { scholar_id, college, department } = userData; 
            setScholarId(scholar_id);
            setCollege(college);
            setDepartment(department); 
            fetchCitesPerYear(scholar_id, college, department); 
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, [researcher]);

  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };

  const getBarFill = (index) => {
    if (activeIndex !== null && activeIndex !== index) {
      return `${themeColors.primary}80`; 
    }
    
    const gradientIndex = Math.min(
      Math.floor((index / data.length) * themeColors.gradient.length),
      themeColors.gradient.length - 1
    );
    return themeColors.gradient[gradientIndex];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-md shadow-lg border border-gray-200">
          <p className="text-gray-700 font-semibold text-lg border-b pb-2 mb-2">{label}</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: themeColors.primary }}  
              />
              <span className="text-gray-600 mr-2">Citations:</span>
              <span className="font-semibold">{payload[0].value}</span>
            </div>
            
            {selectedMetric === "Both" && (
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: themeColors.secondary }}  
                />
                <span className="text-gray-600 mr-2">3-Year Avg:</span>
                <span className="font-semibold">{payload[1]?.value}</span>
              </div>
            )}
            
            {role === "admin" && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex justify-between mb-1">
                  <span>h-index:</span>
                  <span className="font-medium">{payload[0].payload.h_index}</span>
                </div>
                <div className="flex justify-between">
                  <span>i10-index:</span>
                  <span className="font-medium">{payload[0].payload.i10_index}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <GridLoader size={15} color={themeColors.primary} loading={true} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        className="bg-white shadow-lg rounded-xl p-6 border border-gray-300 mb-8 flex flex-col items-center justify-center h-64"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Citation Data Available</h3>
        <p className="text-gray-500 text-center">Citation data will appear as your research is cited by others.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Citations Impact</h2>
          
          {showFilters && (
            <div className="relative">
              <select 
                value={selectedMetric} 
                onChange={handleMetricChange} 
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Citations">Citations Only</option>
                <option value="Both">Citations & 3-Year Avg</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {role !== "visitor" && (
          <div className="flex mt-2 space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-1">Total Citations:</span>
              <span className="font-medium">
                {data.reduce((sum, item) => sum + item.citations, 0)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">h-index:</span>
              <span className="font-medium">{data[0]?.h_index || "-"}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">i10-index:</span>
              <span className="font-medium">{data[0]?.i10_index || "-"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4" style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setActiveIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#6B7280" 
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              stroke="#6B7280" 
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(224, 231, 255, 0.2)' }}
            />
            <Bar 
              dataKey="citations" 
              radius={[4, 4, 0, 0]}
              barSize={selectedMetric === "Both" ? 25 : 35}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarFill(index)}
                  style={{
                    transition: 'fill 0.3s ease',
                    cursor: 'pointer',
                    filter: activeIndex === index ? 'brightness(1.1) saturate(1.1)' : 'none',
                    stroke: activeIndex === index ? themeColors.highlight : 'none',
                    strokeWidth: 1
                  }}
                />
              ))}
            </Bar>
            
            {selectedMetric === "Both" && (
              <Bar 
                dataKey="avg" 
                fill={themeColors.secondary}
                radius={[4, 4, 0, 0]}
                barSize={25}
                animationDuration={1500}
              />
            )}
            
            <Legend 
              iconType="circle" 
              iconSize={8}
              formatter={(value) => {
                return value === 'citations' ? 'Citations' : '3-Year Average';
              }}
              wrapperStyle={{ paddingTop: '10px' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {role === "admin" && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Citation data is updated monthly from academic databases.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CitesPerYearChart;