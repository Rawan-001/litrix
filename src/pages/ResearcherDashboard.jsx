import { useState } from 'react';
import Header from '../components/common/Header';
import StatCard from '../components/common/StatCard';
import DistributionChart from '../components/overview/DistributionChart';
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { motion } from 'framer-motion';
import RevenueChart from '../components/analytics/RevenueChart';

const AdminDashboard = () => {
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const handleCollegeChange = (e) => {
    setSelectedCollege(e.target.value);
    setSelectedDepartment(""); 
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  return (
    <div className="flex-1 relative z-10 overflow-auto">
      <Header title="Dashboard" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div>
              <label htmlFor="college-select" className="block text-sm font-medium text-gray-700">
                Select 
              </label>
              <select
                id="college-select"
                value={selectedCollege}
                onChange={handleCollegeChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value=""></option>
                <option value="faculty_computing">1</option>
                <option value="faculty_engineering">2</option>
              </select>
            </div>

            <div>
              <label htmlFor="department-select" className="block text-sm font-medium text-gray-700">
                Select
              </label>
              <select
                id="department-select"
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                disabled={!selectedCollege} 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value=""> </option>
                {selectedCollege === 'faculty_computing' && (
                  <>
                    <option value="dept_cs">1</option>
                    <option value="dept_it">2</option>
                    <option value="dept_se">3</option>
                    <option value="dept_sn">4</option>
                  </>
                )}
                {selectedCollege === 'faculty_engineering' && (
                  <>
                    <option value="dept_civil">1</option>
                    <option value="dept_electrical">1</option>
                    <option value="dept_mechanical">1</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard name="My Publcation" icon={LuFileSpreadsheet} value="" color="#6366F1" />
          <StatCard name="My Citations" icon={FaQuoteRight} value="" color="#10B981" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DistributionChart />
          <RevenueChart />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
