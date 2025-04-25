import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Header from "../components/common/Header";
import KPI from "../components/KPI/KPI";
import PublicationsOverTimeAdmin from "../components/analyticsAdmin/PublicationsOverTimeAdmin";
import CitesPerYearChartAdmin from "../components/analyticsAdmin/CitesPerYearChartAdmin";
import { GridLoader } from "react-spinners";
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight, FaGlobe, FaFileDownload, FaBookmark } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { motion } from "framer-motion";
import { Typography, Box } from "@mui/material";

const departments = [
  { value: "all", label: "All Departments" },
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const StatCard = ({ name, icon: Icon, value, color, detail }) => {
  const formattedValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
        <Box sx={{ p: 2 }}>
          <div className="flex items-center mb-2">
            <div className="rounded-md p-2 mr-3 text-white flex items-center justify-center" style={{ backgroundColor: color }}>
              <Icon size={18} />
            </div>
            <Typography variant="subtitle2" className="text-gray-600 font-medium">{name}</Typography>
          </div>
          <Typography variant="h5" className="font-bold ml-10" style={{ color }}>{formattedValue}</Typography>
          {detail && <Typography variant="body2" className="text-gray-500 text-xs ml-10">{detail}</Typography>}
        </Box>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ hideHeader = false }) => {
  const [selectedDepartment, setSelectedDepartment] = useState("dept_cs");
  const [statistics, setStatistics] = useState({
    totalPublications: 0,
    totalCitations: 0,
    facultyMembers: 0,
    facultyWithPublicationsThisYear: 0,
  });
  const [topPublications, setTopPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPublications = useMemo(() => {
    if (!searchQuery) return topPublications;
    const query = searchQuery.toLowerCase();
    return topPublications.filter(pub =>
      (pub.title && pub.title.toLowerCase().includes(query)) ||
      (pub.authors && Array.isArray(pub.authors) && pub.authors.some(author => author.toLowerCase().includes(query)))
    );
  }, [topPublications, searchQuery]);

  const fetchStatistics = async (department) => {
    setLoading(true);
    try {
      let totalPublications = 0;
      let totalCitations = 0;
      let facultyMembers = 0;
      let researchersWithPublicationsThisYear = 0;

      const fetchDepartmentData = async (dept) => {
        const facultyRef = collection(db, `colleges/faculty_computing/departments/${dept}/faculty_members`);
        const facultySnapshot = await getDocs(facultyRef);
        facultyMembers += facultySnapshot.size;

        const publicationsPromises = facultySnapshot.docs.map(async (facultyDoc) => {
          const publicationsRef = collection(db, `colleges/faculty_computing/departments/${dept}/faculty_members/${facultyDoc.id}/publications`);
          const publicationsSnapshot = await getDocs(publicationsRef);
          totalPublications += publicationsSnapshot.size;

          publicationsSnapshot.forEach((doc) => {
            const publication = doc.data();
            totalCitations += publication.num_citations || 0;
            if (publication.pub_year === new Date().getFullYear()) {
              researchersWithPublicationsThisYear += 1;
            }
          });
        });

        await Promise.all(publicationsPromises);
      };

      if (department === "all") {
        await Promise.all(departments.slice(1).map((dept) => fetchDepartmentData(dept.value)));
      } else {
        await fetchDepartmentData(department);
      }

      setStatistics({
        totalPublications,
        totalCitations,
        facultyMembers,
        facultyWithPublicationsThisYear: researchersWithPublicationsThisYear,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopCitedPublications = async (department) => {
    try {
      const fetchDepartmentPublications = async (dept) => {
        const facultyRef = collection(db, `colleges/faculty_computing/departments/${dept}/faculty_members`);
        const facultySnapshot = await getDocs(facultyRef);

        const publicationsPromises = facultySnapshot.docs.map(async (facultyDoc) => {
          const publicationsRef = collection(db, `colleges/faculty_computing/departments/${dept}/faculty_members/${facultyDoc.id}/publications`);
          const publicationsQuery = query(publicationsRef, orderBy("num_citations", "desc"), limit(50));
          const publicationsSnapshot = await getDocs(publicationsQuery);

          return publicationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            researcherName: facultyDoc.data().name,
            department: departments.find(d => d.value === dept)?.label || dept,
            ...doc.data(),
          }));
        });

        const publications = await Promise.all(publicationsPromises);
        return publications.flat();
      };

      let allPublications = [];
      if (department === "all") {
        const publicationsPromises = departments.slice(1).map((dept) => fetchDepartmentPublications(dept.value));
        const results = await Promise.all(publicationsPromises);
        allPublications = results.flat();
      } else {
        allPublications = await fetchDepartmentPublications(department);
      }

      allPublications.sort((a, b) => (b.num_citations || 0) - (a.num_citations || 0));
      setTopPublications(allPublications.slice(0, 50));
    } catch (error) {
      console.error("Error fetching top cited publications:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await fetchStatistics(selectedDepartment);
      await fetchTopCitedPublications(selectedDepartment);
    };
    fetchAllData();
  }, [selectedDepartment]);

  return (
    <div className="flex-1 flex flex-col">
      {!hideHeader && (
        <Header title="Admin Dashboard" isAdmin={true} />
      )}

      <main className="mx-auto py-6 px-4 lg:px-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Department:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <GridLoader size={30} color="#6366F1" />
          </div>
        ) : (
          <>
            <motion.div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <StatCard name="Total Publications" icon={LuFileSpreadsheet} value={statistics.totalPublications} color="rgb(29 78 216)" />
              <StatCard name="Total Citations" icon={FaQuoteRight} value={statistics.totalCitations} color="rgb(29 78 216)" />
              <StatCard name="Faculty Members" icon={MdOutlinePeopleAlt} value={statistics.facultyMembers} color="rgb(29 78 216)" />
            </motion.div>

            <KPI statistics={statistics} selectedDepartment={selectedDepartment} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <PublicationsOverTimeAdmin selectedDepartment={selectedDepartment} />
              <CitesPerYearChartAdmin selectedDepartment={selectedDepartment} />
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center text-blue-700 font-semibold text-lg">
                  <LuFileSpreadsheet className="mr-2" />
                  Top Publications ({filteredPublications.length})
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search publications..."
                  className="w-64 py-2 px-3 border border-gray-300 bg-white rounded-md text-sm"
                />
              </div>

              {filteredPublications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citations</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Journal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPublications.map(pub => (
                        <tr key={pub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-blue-600">{pub.title}</td>
                          <td className="px-6 py-4">{pub.pub_year || '-'}</td>
                          <td className="px-6 py-4">{pub.num_citations || 0}</td>
                          <td className="px-6 py-4">{pub.journal || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No publications found</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
