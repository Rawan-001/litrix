import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { GridLoader } from 'react-spinners';

const PublicationsOverTime = ({ 
  researcher = null, 
  role = "researcher", // "researcher", "admin", "visitor"
  customColor = "#4F46E5",
  showFilters = true
}) => {
  const [data, setData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("Yearly");
  const [loading, setLoading] = useState(true);
  const [scholarId, setScholarId] = useState(null);
  const [college, setCollege] = useState(null);
  const [department, setDepartment] = useState(null);

  // Definir colores basados en el rol
  const themeColors = useMemo(() => {
    const colors = {
      researcher: {
        primary: customColor || "#4F46E5",
        secondary: "#818CF8",
        gradient: ["rgba(79, 70, 229, 0.8)", "rgba(79, 70, 229, 0)"]
      },
      admin: {
        primary: "#2563EB",
        secondary: "#60A5FA",
        gradient: ["rgba(37, 99, 235, 0.8)", "rgba(37, 99, 235, 0)"]
      },
      visitor: {
        primary: "#10B981",
        secondary: "#34D399",
        gradient: ["rgba(16, 185, 129, 0.8)", "rgba(16, 185, 129, 0)"]
      }
    };
    return colors[role] || colors.researcher;
  }, [role, customColor]);

  const fetchUserData = async (uid) => {
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
      console.error("Error fetching user data: ", error);
    }
    return null;
  };

  const fetchPublicationsByRange = async (scholarId, college, department) => {
    setLoading(true);
    try {
      console.log(`Fetching publications for ${scholarId} in ${college}/${department}`);
      const publicationsRef = collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`);
      const publicationsSnapshot = await getDocs(publicationsRef);

      // Ordenar publicaciones por tiempo
      const publications = publicationsSnapshot.docs.map(doc => doc.data());
      
      // Calcular datos por diferentes rangos temporales
      const publicationsByRange = processPublicationsByTimeRange(publications, selectedTimeRange);

      setData(publicationsByRange);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching publications: ", error);
      setLoading(false);
    }
  };

  const processPublicationsByTimeRange = (publications, timeRange) => {
    const publicationsByRange = {};

    publications.forEach(publication => {
      const pubYear = publication.pub_year;
      
      if (!pubYear) return; // Ignorar publicaciones sin año
      
      if (timeRange === "Yearly") {
        if (!publicationsByRange[pubYear]) {
          publicationsByRange[pubYear] = { count: 1, citations: publication.num_citations || 0 };
        } else {
          publicationsByRange[pubYear].count += 1;
          publicationsByRange[pubYear].citations += (publication.num_citations || 0);
        }
      } else if (timeRange === "Quarterly") {
        // Divide en trimestres (asumiendo que tenemos datos mensuales)
        const quarter = Math.ceil(publication.pub_month / 3);
        const key = `${pubYear}-Q${quarter}`;
        
        if (!publicationsByRange[key]) {
          publicationsByRange[key] = { count: 1, citations: publication.num_citations || 0 };
        } else {
          publicationsByRange[key].count += 1;
          publicationsByRange[key].citations += (publication.num_citations || 0);
        }
      } else if (timeRange === "Monthly") {
        // Datos mensuales (si están disponibles)
        if (publication.pub_month) {
          const month = publication.pub_month.toString().padStart(2, '0');
          const key = `${pubYear}-${month}`;
          
          if (!publicationsByRange[key]) {
            publicationsByRange[key] = { count: 1, citations: publication.num_citations || 0 };
          } else {
            publicationsByRange[key].count += 1;
            publicationsByRange[key].citations += (publication.num_citations || 0);
          }
        }
      }
    });

    // Formatear los datos para el gráfico
    const formattedData = Object.keys(publicationsByRange)
      .sort()
      .map(key => ({
        name: key,
        publications: publicationsByRange[key].count,
        citations: publicationsByRange[key].citations
      }));

    return formattedData;
  };

  useEffect(() => {
    // Si ya tenemos los datos del investigador, usarlos directamente
    if (researcher) {
      setScholarId(researcher.id || researcher.scholar_id);
      setCollege(researcher.college || "faculty_computing");
      setDepartment(researcher.department || "dept_cs");
      
      // Simular carga inicial para mostrar la animación
      setTimeout(() => {
        setLoading(false);
      }, 800);
      
      // Si el investigador ya tiene publicaciones procesadas, usarlas
      if (researcher.publications && researcher.publications.length > 0) {
        const publicationsByRange = processPublicationsByTimeRange(
          researcher.publications, 
          selectedTimeRange
        );
        setData(publicationsByRange);
      } else if (researcher.id || researcher.scholar_id) {
        // Si no, buscar las publicaciones
        fetchPublicationsByRange(
          researcher.id || researcher.scholar_id,
          researcher.college || "faculty_computing",
          researcher.department || "dept_cs"
        );
      }
    } else {
      // Si no hay datos de investigador, intentar obtenerlos del usuario actual
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userData = await fetchUserData(user.uid);
          if (userData && userData.scholar_id) {
            setScholarId(userData.scholar_id);
            setCollege(userData.college);
            setDepartment(userData.department);
            fetchPublicationsByRange(userData.scholar_id, userData.college, userData.department);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, [researcher, selectedTimeRange]);

  const handleTimeRangeChange = (e) => {
    setSelectedTimeRange(e.target.value);
    
    // Si tenemos datos del investigador, procesar directamente
    if (researcher && researcher.publications) {
      const publicationsByRange = processPublicationsByTimeRange(
        researcher.publications, 
        e.target.value
      );
      setData(publicationsByRange);
    } else if (scholarId) {
      // De lo contrario, hacer una nueva búsqueda
      fetchPublicationsByRange(scholarId, college, department);
    }
  };

  // Personalizar el tooltip para mostrar más información
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-800">
            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: themeColors.primary }}></span>
            Publications: <span className="font-medium">{payload[0].value}</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-gray-800">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: themeColors.secondary }}></span>
              Citations: <span className="font-medium">{payload[1].value}</span>
            </p>
          )}
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

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Research Publications Over Time</h2>
        
        {showFilters && (
          <div className="relative">
            <select 
              value={selectedTimeRange} 
              onChange={handleTimeRangeChange} 
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Yearly">Yearly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-gray-500 text-center">No publication data available for this time range.</p>
          <p className="text-gray-400 text-sm mt-1">Try changing the time filter or check back later.</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPublications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColors.gradient[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={themeColors.gradient[1]} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColors.secondary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={themeColors.secondary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="publications" 
                stroke={themeColors.primary} 
                fillOpacity={1}
                fill="url(#colorPublications)" 
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              {role === "admin" && (
                <Area 
                  type="monotone" 
                  dataKey="citations" 
                  stroke={themeColors.secondary} 
                  fillOpacity={0.5}
                  fill="url(#colorCitations)" 
                  strokeWidth={2}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default PublicationsOverTime;