import React from "react";
import StatCard from "../../components/common/StatCard";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { motion } from "framer-motion";

const KPI = ({ statistics }) => {
  const calculateKPI13 = () => {
    if (statistics.facultyMembers === 0) {
      return 0;
    }

    const researchersWithPublications = statistics.facultyWithPublicationsThisYear || 0;
    console.log("Faculty with publications this year:", researchersWithPublications);
    console.log("Total faculty members:", statistics.facultyMembers);
    return (researchersWithPublications / statistics.facultyMembers) * 100;
  };

  const calculateKPI14 = () => {
    if (statistics.facultyMembers === 0) {
      return 0;
    }
    return statistics.totalPublications / statistics.facultyMembers;
  };

  const calculateKPI15 = () => {
    if (statistics.totalPublications === 0) {
      return 0;
    }
    return statistics.totalCitations / statistics.totalPublications;
  };

  return (
    <motion.div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      {/* KPI-I-13: نسبة أعضاء هيئة التدريس الذين نشروا أبحاث */}
      <StatCard
        name="KPI-I-13: % Faculty Published"
        icon={MdOutlinePeopleAlt}
        value={`${calculateKPI13().toFixed(2)}%`}
        color="#6366F1"
      />

      {/* KPI-I-14: معدل الأبحاث لكل عضو هيئة تدريس */}
      <StatCard
        name="KPI-I-14: Avg Publications/Faculty"
        icon={LuFileSpreadsheet}
        value={calculateKPI14().toFixed(2)}
        color="#10B981"
      />

      {/* KPI-I-15: معدل الاقتباسات لكل بحث منشور */}
      <StatCard
        name="KPI-I-15: Avg Citations/Publications"
        icon={FaQuoteRight}
        value={calculateKPI15().toFixed(2)}
        color="#F59E0B"
      />
    </motion.div>
  );
};

export default KPI;
