import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import { motion } from 'framer-motion';

const COLORS = ["#4F46E5", "#7C3AED", "#DB2777", "#059669", "#D97706", "#3B82F6", "#FBBF24", "#34D399", "#EF4444"];

const PieChartAdmin = ({ selectedDepartment }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = async (department) => {
    setLoading(true);
    try {
      const facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
      const facultySnapshot = await getDocs(facultyRef);

      let interestCount = {};
      facultySnapshot.forEach((doc) => {
        const facultyData = doc.data();
        const interests = facultyData.interests || [];
        interests.forEach((interest) => {
          if (interestCount[interest]) {
            interestCount[interest] += 1;
          } else {
            interestCount[interest] = 1;
          }
        });
      });

      const chartData = Object.keys(interestCount)
        .map((interest) => ({
          name: interest,
          value: interestCount[interest],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setData(chartData);
    } catch (error) {
      console.error("Error fetching interests: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests(selectedDepartment);
  }, [selectedDepartment]);

  return (
    <motion.div
      className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className='text-lg font-medium mb-4 text-gray-900'>Top 6 Researched Areas</h2>
      <div className='h-80'>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ResponsiveContainer width={"100%"} height={"100%"}>
            <PieChart>
              <Pie
                data={data}
                cx={"50%"}
                cy={"40%"}
                labelLine={false}
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default PieChartAdmin;
