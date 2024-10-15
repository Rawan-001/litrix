import { useState } from 'react';
import Header from '../components/common/Header';
import StatCard from '../components/common/StatCard';
import PieChartAdmin from '../components/analyticsAdmin/PieChartAdmin';
import ChannelDataAdmin from '../components/analyticsAdmin/ChannelDataAdmin';

import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { motion } from 'framer-motion';

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
      <Header title="Admin Dashboard" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div>
              <label htmlFor="college-select" className="block text-sm font-medium text-gray-700">
                Select College
              </label>
              <select
                id="college-select"
                value={selectedCollege}
                onChange={handleCollegeChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select College</option>
                <option value="faculty_computing">College of Computing</option>
                <option value="faculty_engineering">College of Engineering</option>
              </select>
            </div>

            <div>
              <label htmlFor="department-select" className="block text-sm font-medium text-gray-700">
                Select Department
              </label>
              <select
                id="department-select"
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                disabled={!selectedCollege} 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select Department</option>
                {selectedCollege === 'faculty_computing' && (
                  <>
                    <option value="dept_cs">Computer Science</option>
                    <option value="dept_it">Information Technology</option>
                    <option value="dept_se">Software Engineering</option>
                    <option value="dept_sn">Network Systems</option>
                  </>
                )}
                {selectedCollege === 'faculty_engineering' && (
                  <>
                    <option value="dept_civil">Civil Engineering</option>
                    <option value="dept_electrical">Electrical Engineering</option>
                    <option value="dept_mechanical">Mechanical Engineering</option>
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
          <StatCard name="Total Publcation" icon={LuFileSpreadsheet} value="" color="#6366F1" />
          <StatCard name="Total Citations" icon={FaQuoteRight} value="" color="#10B981" />
          <StatCard name="Faculty Members" icon={MdOutlinePeopleAlt} value="" color="#F59E0B" />
          <StatCard name="Faculty Members" icon={MdOutlinePeopleAlt} value="" color="#F59E0B" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChannelDataAdmin />
          <PieChartAdmin />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
