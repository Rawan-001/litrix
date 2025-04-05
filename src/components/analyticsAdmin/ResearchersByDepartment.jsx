import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { GridLoader } from 'react-spinners';

const departments = [
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const ResearchersByDepartment = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [researchersList, setResearchersList] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

  const fetchResearchersByDepartment = async (year) => {
    setLoading(true);
    try {
      const departmentStats = {};

      for (const dept of departments) {
        const facultyRef = collection(db, `colleges/faculty_computing/departments/${dept.value}/faculty_members`);
        const facultySnapshot = await getDocs(facultyRef);

        const uniqueResearchers = new Set();
        const researchersNames = [];

        for (const facultyDoc of facultySnapshot.docs) {
          const scholarId = facultyDoc.id;
          const facultyData = facultyDoc.data();
          const scholarName = facultyData.name;

          const publicationsRef = collection(db, `colleges/faculty_computing/departments/${dept.value}/faculty_members/${scholarId}/publications`);
          const publicationsSnapshot = await getDocs(publicationsRef);

          let hasPublishedInYear = false;

          publicationsSnapshot.forEach(doc => {
            const publication = doc.data();
            const pubYear = publication.pub_year;

            if (pubYear === year) {
              hasPublishedInYear = true;
            }
          });

          if (hasPublishedInYear) {
            uniqueResearchers.add(scholarId);
            researchersNames.push(scholarName);
          }
        }

        departmentStats[dept.label] = {
          researchers: uniqueResearchers.size,
          names: researchersNames,
        };
      }

      const formattedData = Object.keys(departmentStats).map(dept => ({
        department: dept,
        researchers: departmentStats[dept].researchers,
        names: departmentStats[dept].names,
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Error fetching researchers: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchersByDepartment(selectedYear);
  }, [selectedYear]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setIsDropdownOpen(false); 
  };

  const handleShowResearchers = (names, index) => {
    setResearchersList(names);
    setSelectedRow(index);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <GridLoader size={15} color={"#4F46E5"} loading={true} />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <motion.div
        className='bg-white shadow-lg rounded-xl p-6 border border-gray-300 w-full'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Researchers Who Published at Least One Paper</h2>

        <div className="mb-4 relative">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Select Year:
          </label>
          <div
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedYear}
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          {isDropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleYearChange(2024)}
              >
                2024
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleYearChange(2025)}
              >
                2025
              </li>
            </ul>
          )}
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-6 border-b text-left">Department</th>
                <th className="py-2 px-6 border-b text-left">Number of Researchers</th>
                <th className="py-2 px-6 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${selectedRow === index ? 'bg-gray-100' : ''}`}
                >
                  <td className="py-2 px-6 border-b text-left">{item.department}</td>
                  <td className="py-2 px-6 border-b text-left">{item.researchers}</td>
                  <td className="py-2 px-6 border-b text-left">
                    <button
                      onClick={() => handleShowResearchers(item.names, index)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Researchers
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {researchersList.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Researchers:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {researchersList.map((name, index) => (
                <div key={index} className="text-gray-700 bg-gray-50 p-2 rounded-lg">
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResearchersByDepartment;