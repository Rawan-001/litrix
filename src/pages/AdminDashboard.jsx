import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import PieChartAdmin from "../components/analyticsAdmin/PieChartAdmin";
import KPI from "../components/KPI/KPI";
import PublicationsOverTimeAdmin from "../components/analyticsAdmin/PublicationsOverTimeAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  IconButton,
  Collapse,
  Box,
} from "@mui/material";
import { GridLoader } from "react-spinners";
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { motion } from "framer-motion";

const departments = [
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const AdminDashboard = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("dept_cs");
  const [statistics, setStatistics] = useState({
    totalPublications: 0,
    totalCitations: 0,
    facultyMembers: 0,
  });
  const [mostCitedPubs, setMostCitedPubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchStatistics = async (department) => {
    setLoading(true);
    try {
      const facultyRef = collection(
        db,
        `colleges/faculty_computing/departments/${department}/faculty_members`
      );
      const facultySnapshot = await getDocs(facultyRef);

      let totalPublications = 0;
      let totalCitations = 0;
      let facultyMembers = facultySnapshot.size;

      for (const facultyDoc of facultySnapshot.docs) {
        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/${department}/faculty_members/${facultyDoc.id}/publications`
        );
        const publicationsSnapshot = await getDocs(publicationsRef);
        totalPublications += publicationsSnapshot.size;

        publicationsSnapshot.forEach((doc) => {
          const publication = doc.data();
          totalCitations += publication.num_citations || 0;
        });
      }

      setStatistics({
        totalPublications,
        totalCitations,
        facultyMembers,
      });
    } catch (error) {
      console.error("Error fetching statistics: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMostCitedPublications = async (department) => {
    setLoading(true);
    try {
      const facultyRef = collection(
        db,
        `colleges/faculty_computing/departments/${department}/faculty_members`
      );
      const facultySnapshot = await getDocs(facultyRef);

      let allPublications = [];

      for (const facultyDoc of facultySnapshot.docs) {
        const facultyId = facultyDoc.id;
        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/${department}/faculty_members/${facultyId}/publications`
        );
        const publicationsQuery = query(publicationsRef, orderBy("num_citations", "desc"));
        const publicationsSnapshot = await getDocs(publicationsQuery);

        publicationsSnapshot.forEach((doc) => {
          const publicationData = doc.data();
          if (publicationData.num_citations) {
            allPublications.push({
              id: doc.id,
              researcherName: facultyDoc.data().name, 
              ...publicationData,
            });
          }
        });
      }

      allPublications.sort((a, b) => b.num_citations - a.num_citations);

      setMostCitedPubs(allPublications.slice(0, 30)); 
    } catch (error) {
      console.error("Error fetching most cited publications: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(selectedDepartment);
    fetchMostCitedPublications(selectedDepartment);
  }, [selectedDepartment]);

  const handleShowMore = () => {
    setVisibleCount((prevCount) => prevCount + 5);
  };

  const CollapsibleRow = ({ pub }) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <TableRow>
          <TableCell>
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>{pub.researcherName || "Unknown Researcher"}</TableCell>
          <TableCell>{pub.title || "No Title"}</TableCell>
          <TableCell>{pub.pub_year || "Unknown Year"}</TableCell>
          <TableCell>{pub.num_citations || 0}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Typography variant="h6" gutterBottom component="div">
                  More Details
                </Typography>
                <Typography variant="body2">
                  <strong>Journal:</strong> {pub.journal || "No Journal"}
                </Typography>
                <Typography variant="body2">
                  <strong>Publisher:</strong> {pub.publisher || "No Publisher"}
                </Typography>
                <Typography variant="body2">
                  <strong>Publisher Link:</strong>{" "}
                  <a href={pub.pub_url} target="_blank" rel="noopener noreferrer">
                    {pub.pub_url || "No URL"}
                  </a>
                </Typography>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="flex-1 relative z-10 overflow-auto">
      <Header title="Admin Dashboard" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="mb-8">
          <label
            htmlFor="department-select"
            className="block text-sm font-medium text-gray-700"
          >
            Select Department:
          </label>
          <select
            id="department-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="mt-1 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            style={{ width: "auto" }}
          >
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <GridLoader size={30} color={"#6366F1"} />
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <StatCard
                name="Total Publications"
                icon={LuFileSpreadsheet}
                value={statistics.totalPublications}
                color="#6366F1"
              />
              <StatCard
                name="Total Citations"
                icon={FaQuoteRight}
                value={statistics.totalCitations}
                color="#10B981"
              />
              <StatCard
                name="Faculty Members"
                icon={MdOutlinePeopleAlt}
                value={statistics.facultyMembers}
                color="#F59E0B"
              />
            </motion.div>
     <KPI statistics={statistics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <PieChartAdmin selectedDepartment={selectedDepartment} />
              <PublicationsOverTimeAdmin selectedDepartment={selectedDepartment} />
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-300">
              <Typography
                variant="h6"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                Most Cited Publications
              </Typography>

              {mostCitedPubs.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell>Researcher Name</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Published Year</TableCell>
                        <TableCell>Number of Citations</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mostCitedPubs.slice(0, visibleCount).map((pub, index) => (
                        <CollapsibleRow key={index} pub={pub} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No cited publications found.</Typography>
              )}

              {mostCitedPubs.length > visibleCount && (
                <div className="mt-4 text-center">
                  <Button onClick={handleShowMore} variant="outlined" color="primary">
                    Show More
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
