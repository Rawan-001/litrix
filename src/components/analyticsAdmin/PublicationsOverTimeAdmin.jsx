import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { GridLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom'; 

const PublicationsOverTimeAdmin = ({ selectedDepartment }) => {
  const [data, setData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("Yearly");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); 

  const fetchPublicationsByRange = async (department) => {
    setLoading(true);
    try {
      const facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
      const facultySnapshot = await getDocs(facultyRef);

      let publicationsByRange = {};

      for (const facultyDoc of facultySnapshot.docs) {
        const scholarId = facultyDoc.id;
        const publicationsRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members/${scholarId}/publications`);
        const publicationsSnapshot = await getDocs(publicationsRef);

        publicationsSnapshot.forEach(doc => {
          const publication = doc.data();
          const pubYear = publication.pub_year;

          if (pubYear >= 1991 && pubYear <= 2024) {
            if (!publicationsByRange[pubYear]) {
              publicationsByRange[pubYear] = 1;
            } else {
              publicationsByRange[pubYear] += 1;
            }
          } else {
            console.warn(`Invalid publication year: ${pubYear}`);
          }
        });
      }

      const formattedData = Object.keys(publicationsByRange)
        .sort((a, b) => a - b)
        .map(year => ({
          name: year,
          publications: publicationsByRange[year]
        }));

      setData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching publications: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetchPublicationsByRange(selectedDepartment);
    }
  }, [selectedDepartment, selectedTimeRange]);

  const handleTimeRangeChange = (e) => {
    setSelectedTimeRange(e.target.value);
  };

  const handleBarClick = (data) => {
    const year = data.name; 
    navigate(`/analytics/${year}`); 
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <GridLoader size={15} color={"#4F46E5"} loading={true} />
      </div>
    );
  }

  return (
    <motion.div
      className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>Research Publications Over Time</h2>

      <div className="mb-4">
        <select value={selectedTimeRange} onChange={handleTimeRangeChange} className="border rounded px-3 py-1 text-gray-700">
          <option value="Yearly">Yearly</option>
          <option value="Monthly">Monthly</option>
          <option value="Weekly">Weekly</option>
        </select>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        {data.length > 0 ? (
          <ResponsiveContainer>
            <LineChart data={data} onClick={handleBarClick}> {/* تفعيل النقر على الرسم البياني */}
              <CartesianGrid strokeDasharray='3 3' stroke='#ccc' />
              <XAxis dataKey='name' stroke='#333' />
              <YAxis stroke='#333' />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#ccc",
                  color: "#333",
                }}
                itemStyle={{ color: "#333" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type='monotone' dataKey='publications' stroke='#4F46E5' strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No data available for this department.</p> 
        )}
      </div>
    </motion.div>
  );
};

export default PublicationsOverTimeAdmin;
