import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/common/Header'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ResearcherDashboard = () => {
  const location = useLocation();
  const [researcherData, setResearcherData] = useState(location.state?.researcherData || {});

  useEffect(() => {
    if (location.state?.researcherData) {
      setResearcherData(location.state.researcherData);
    }
  }, [location.state]);

  const publicationsData = researcherData.publications || [];
  
  const yearlyPublications = publicationsData.reduce((acc, pub) => {
    const year = pub.pub_year || 'Unknown';
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(yearlyPublications).map(([year, count]) => ({
    year,
    count,
  }));

  return (
    <div className="flex-1">
      <Header title="Researcher Dashboard" />

      <motion.div
        className="p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.h2
          className="text-xl font-semibold mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Research Overview
        </motion.h2>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.h3
            className="text-lg font-medium mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            Publications per Year
          </motion.h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResearcherDashboard;
