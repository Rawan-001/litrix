import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion'; 
import Header from '../components/common/Header'; 

const ResearcherProfilePage = () => {
  const location = useLocation();
  const [researcherData, setResearcherData] = useState(location.state?.researcherData || {});

  useEffect(() => {
    if (location.state?.researcherData) {
      setResearcherData(location.state.researcherData);
    }
  }, [location.state]);

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <motion.div
        className="bg-white shadow-lg border-b border-gray-300"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Header title="Researcher Profile" />
      </motion.div>

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
          Welcome, {researcherData.name || "Researcher"}
        </motion.h2>

        <motion.div
          className="mb-8 bg-white shadow-lg p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p><strong>Scholar ID:</strong> {researcherData.scholarId || "N/A"}</p>
          <p><strong>Affiliation:</strong> {researcherData.affiliation || "N/A"}</p>
          <p><strong>Email:</strong> {researcherData.email || "N/A"}</p>
          <p><strong>Cited by:</strong> {researcherData.citedby || "N/A"}</p>
          <p><strong>H-index:</strong> {researcherData.hindex || "N/A"}</p>
          <p><strong>H-index (Last 5 years):</strong> {researcherData.hindex5y || "N/A"}</p>
          <p><strong>Interests:</strong> {researcherData.interests ? researcherData.interests.join(", ") : "N/A"}</p>
        </motion.div>

        <motion.div
          className="bg-white shadow-lg p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-medium mb-2">Publications</h3>
          {researcherData.publications && researcherData.publications.length > 0 ? (
            <div className="publications-list">
              {researcherData.publications.map((pub, index) => (
                <div key={index} className="publication-item mb-4">
                  <p><strong>Title:</strong> {pub.title || "N/A"}</p>
                  <p><strong>Authors:</strong> {pub.authors || "N/A"}</p>
                  <p><strong>Abstract:</strong> {pub.abstract || "No abstract available."}</p>
                  <p><strong>Publication Year:</strong> {pub.pub_year || "N/A"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No publications found.</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResearcherProfilePage;
