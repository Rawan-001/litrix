import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Header from "../components/common/Header";
import DepartmentLvlKPI from "../components/KPI/DepartmentLvlKPI";
import ViewSwitcherButton from "../components/common/DashboardViewSwitcher";

import { GridLoader } from "react-spinners";
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight, FaGlobe, FaFileDownload, FaBookmark, FaPrint, FaShare, FaEye } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { motion } from "framer-motion";
import { Typography } from "@mui/material";

const departments = [
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const StatCard = ({ name, icon: Icon, value, color, detail }) => {
  const formattedValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full p-4">
        <div className="flex items-center mb-2">
          <div 
            className="rounded-md p-2 mr-3 text-white flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Icon size={18} />
          </div>
          <div>
            <Typography variant="subtitle2" className="text-gray-600 font-medium">
              {name}
            </Typography>
          </div>
        </div>
        
        <div className="ml-10">
          <Typography 
            variant="h5" 
            className="font-bold"
            style={{ color: color }}
          >
            {formattedValue}
          </Typography>
          
          {detail && (
            <Typography variant="body2" className="text-gray-500 text-xs">
              {detail}
            </Typography>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PublicationDetailModal = ({ publication, onClose }) => {
  if (!publication) return null;
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  React.useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto cursor-default" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Publication Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">{publication.title}</h2>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {publication.authors && Array.isArray(publication.authors) && publication.authors.map((author, index) => (
              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{author}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <h3 className="font-medium text-gray-500 mb-2">DETAILS</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">
                    <FaQuoteRight />
                  </span>
                  <div>
                    <div className="text-sm text-gray-500">Citations</div>
                    <div>{publication.num_citations || 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-500 mb-2">ABSTRACT</h3>
              <p className="text-sm text-gray-700">
                {publication.abstract || "No abstract available"}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-500 mb-2">Keywords</h3>
              <div>
                {publication.keywords ? (
                  <div className="flex flex-wrap gap-1">
                    {publication.keywords.map((keyword, index) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No keywords available</p>
                )}
              </div>
              
              <h3 className="font-medium text-gray-500 mt-6 mb-2">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-1 text-blue-500 border border-blue-200 rounded-full px-3 py-1 text-sm hover:bg-blue-50">
                  <FaGlobe className="text-xs" /> View Online
                </button>
                <button className="flex items-center gap-1 text-blue-500 border border-blue-200 rounded-full px-3 py-1 text-sm hover:bg-blue-50">
                  <FaFileDownload className="text-xs" /> Download PDF
                </button>
                <button className="flex items-center gap-1 text-blue-500 border border-blue-200 rounded-full px-3 py-1 text-sm hover:bg-blue-50">
                  <FaShare className="text-xs" /> Share
                </button>
                <button className="flex items-center gap-1 text-blue-500 border border-blue-200 rounded-full px-3 py-1 text-sm hover:bg-blue-50">
                  <FaPrint className="text-xs" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PublicationListItem = ({ publication, onClick }) => {
  const formatAuthors = () => {
    if (!publication.authors) return "-";
    
    if (Array.isArray(publication.authors)) {
      if (publication.authors.length === 0) return "-";
      
      if (publication.authors.length <= 3) {
        return publication.authors.join(", ");
      } else {
        return publication.authors.slice(0, 3).join(", ") + " et al.";
      }
    }
    
    return publication.authors;
  };
  
  return (
    <div className="border-b py-4 px-3">
      <div 
        className="text-blue-600 font-medium mb-2 cursor-pointer hover:underline"
        onClick={() => onClick(publication)}
      >
        {publication.title || "Untitled"}
      </div>
      
      <div className="text-gray-500 text-sm">
        {formatAuthors()}
      </div>
      
      <div className="flex justify-between mt-2 text-sm">
        <div className="text-gray-600">
          <span className="mr-3">{publication.pub_year || "Unknown"}</span>
          <span className="flex items-center inline-flex">
            <FaQuoteRight className="mr-1 text-xs" />
            {publication.num_citations || 0}
          </span>
        </div>
        <div className="flex space-x-2">
          {publication.pub_url && (
            <a 
              href={publication.pub_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              <FaGlobe />
            </a>
          )}
          <button 
            className="text-blue-500 hover:text-blue-700"
            onClick={() => onClick(publication)}
          >
            <FaEye />
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthorList = ({ authors }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return <span className="text-gray-500">-</span>;
  }
  
  if (authors.length <= 3 || expanded) {
    return (
      <div>
        <span>{authors.join(", ")}</span>
        {authors.length > 3 && (
          <button
            onClick={() => setExpanded(false)}
            className="ml-2 text-blue-500 text-xs hover:underline focus:outline-none"
          >
            Show less
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <span>{authors.slice(0, 3).join(", ")}</span>
      <span> et al.</span>
      <button
        onClick={() => setExpanded(true)}
        className="ml-2 text-blue-500 text-xs hover:underline focus:outline-none"
      >
        more
      </button>
    </div>
  );
};

const DepartmentAdminDashboard = () => {
  const [departmentCode, setDepartmentCode] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [statistics, setStatistics] = useState({
    totalPublications: 0,
    totalCitations: 0,
    facultyMembers: 0,
    facultyWithPublicationsThisYear: 0,
  });
  const [topPublications, setTopPublications] = useState([]);
  const [displayedPublications, setDisplayedPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [publicationsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [accessDenied, setAccessDenied] = useState(false); // Added state to track access

  const filteredPublications = useMemo(() => {
    if (!searchQuery) return topPublications;
    
    const query = searchQuery.toLowerCase();
    return topPublications.filter(pub => 
      (pub.title && pub.title.toLowerCase().includes(query)) ||
      (pub.authors && Array.isArray(pub.authors) && pub.authors.some(author => 
        author.toLowerCase().includes(query)
      ))
    );
  }, [topPublications, searchQuery]);

  useEffect(() => {
    if (filteredPublications.length > 0) {
      setDisplayedPublications(filteredPublications.slice(0, publicationsPerPage));
      setCurrentPage(1);
    } else {
      setDisplayedPublications([]);
    }
  }, [filteredPublications, publicationsPerPage]);

  useEffect(() => {
    const fetchUserRoleAndDepartment = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        
        const deptAdminRef = doc(db, "departmentAdmins", currentUser.uid);
        const deptAdminDoc = await getDoc(deptAdminRef);
        
        if (deptAdminDoc.exists()) {
          const deptAdminData = deptAdminDoc.data();
          
          if (deptAdminData.department) {
            const deptCode = deptAdminData.department;
            setDepartmentCode(deptCode);
            
            const dept = departments.find(d => d.value === deptCode);
            if (dept) {
              setDepartmentName(dept.label);
            }
            
            await fetchStatistics(deptCode);
            await fetchTopCitedPublications(deptCode);
            setLoading(false);
            return;
          }
        }
        
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.roles) {
            const deptAdminRole = Object.keys(userData.roles).find(role => 
              role.startsWith('dept_admin_') && userData.roles[role] === true
            );
            
            if (deptAdminRole) {
              setUserRole(deptAdminRole);
              
              const deptCode = 'dept_' + deptAdminRole.split('dept_admin_')[1];
              setDepartmentCode(deptCode);
              
              const dept = departments.find(d => d.value === deptCode);
              if (dept) {
                setDepartmentName(dept.label);
              }
              
              await fetchStatistics(deptCode);
              await fetchTopCitedPublications(deptCode);
            } else {
              setAccessDenied(true);
            }
          } else {
            setAccessDenied(true);
          }
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRoleAndDepartment();
  }, []);

  const loadMorePublications = () => {
    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const newPublications = filteredPublications.slice(0, nextPage * publicationsPerPage);
      setDisplayedPublications(newPublications);
      setCurrentPage(nextPage);
      setLoadingMore(false);
    }, 500); 
  };

  const hasMorePublications = displayedPublications.length < filteredPublications.length;

  const fetchStatistics = async (department) => {
    setLoading(true);
    try {
      let totalPublications = 0;
      let totalCitations = 0;
      let facultyMembers = 0;
      let researchersWithPublicationsThisYear = 0;
      const currentYear = new Date().getFullYear();

      const facultyRef = collection(
        db,
        `colleges/faculty_computing/departments/${department}/faculty_members`
      );
      const facultySnapshot = await getDocs(facultyRef);
      facultyMembers = facultySnapshot.size;

      const publicationsPromises = facultySnapshot.docs.map(async (facultyDoc) => {
        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/${department}/faculty_members/${facultyDoc.id}/publications`
        );
        const publicationsSnapshot = await getDocs(publicationsRef);
        
        let hasPublicationThisYear = false;
        
        publicationsSnapshot.forEach((doc) => {
          totalPublications++;
          const publication = doc.data();
          totalCitations += publication.num_citations || 0;

          if (publication.pub_year === currentYear && !hasPublicationThisYear) {
            hasPublicationThisYear = true;
            researchersWithPublicationsThisYear++;
          }
        });
      });

      await Promise.all(publicationsPromises);

      setStatistics({
        totalPublications,
        totalCitations,
        facultyMembers,
        facultyWithPublicationsThisYear: researchersWithPublicationsThisYear,
      });
    } catch (error) {
      console.error("Error fetching statistics: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopCitedPublications = async (department) => {
    try {
      const facultyRef = collection(
        db,
        `colleges/faculty_computing/departments/${department}/faculty_members`
      );
      const facultySnapshot = await getDocs(facultyRef);

      const publicationsPromises = facultySnapshot.docs.map(async (facultyDoc) => {
        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/${department}/faculty_members/${facultyDoc.id}/publications`
        );
        const publicationsQuery = query(publicationsRef, orderBy("num_citations", "desc"), limit(50));
        const publicationsSnapshot = await getDocs(publicationsQuery);

        return publicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          researcherName: facultyDoc.data().name,
          department: departments.find(d => d.value === department)?.label || department,
          ...doc.data(),
        }));
      });

      const publications = await Promise.all(publicationsPromises);
      const allPublications = publications.flat();

      allPublications.sort((a, b) => (b.num_citations || 0) - (a.num_citations || 0));
      
      const sortedPublications = allPublications.slice(0, 50);
      setTopPublications(sortedPublications);
      setDisplayedPublications(sortedPublications.slice(0, publicationsPerPage));
    } catch (error) {
      console.error("Error fetching top cited publications: ", error);
    }
  };

  const handlePublicationClick = (publication) => {
    setSelectedPublication(publication);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header 
          title="Loading..."
          showViewSwitcher={false}
          isDepartmentAdmin={true}
        />
        <div className="flex justify-center items-center h-64">
          <GridLoader size={30} color={"#6366F1"} />
        </div>
      </div>
    );
  }
  
  if (accessDenied || !departmentCode) {
    return (
      <div className="flex-1 flex flex-col">
        <Header 
          showViewSwitcher={false}
          title="Access Denied"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-gray-50 rounded-lg shadow-md">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have department admin privileges. Please contact system administrator for assistance.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title={departmentName + " Department Dashboard"}
        showViewSwitcher={false}
        isDepartmentAdmin={true}
      />
      
      <div className="flex-1 relative z-10 overflow-auto">
        <main className="mx-auto py-6 px-4 lg:px-8">
          <div className="flex justify-end mb-6">
            <ViewSwitcherButton 
              currentView="admin" 
              departmentCode={departmentCode}
            />
          </div>
          
          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatCard
              name="Department Publications"
              icon={LuFileSpreadsheet}
              value={statistics.totalPublications}
              color="rgb(29 78 216)"
            />
            <StatCard
              name="Total Citations"
              icon={FaQuoteRight}
              value={statistics.totalCitations}
              color="rgb(29 78 216)"
            />
            <StatCard
              name="Faculty Members"
              icon={MdOutlinePeopleAlt}
              value={statistics.facultyMembers}
              color="rgb(29 78 216)"
              detail={`${statistics.facultyWithPublicationsThisYear} with publications this year`}
            />
          </motion.div>
          
          <DepartmentLvlKPI statistics={statistics} selectedDepartment={departmentCode} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Publications Over Time</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50">
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Citations Per Year</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50">
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="rounded-md p-2 mr-3 text-white flex items-center justify-center bg-blue-500">
                  <LuFileSpreadsheet size={20} />
                </div>
                <div>
                  Top Publications ({filteredPublications.length})
                </div>
              </div>
              <div className="w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search publications..."
                  className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {displayedPublications.length > 0 ? (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Authors
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Year
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Citations
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Journal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedPublications.map((publication) => (
                        <tr key={publication.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-blue-600 cursor-pointer max-w-xl overflow-hidden" onClick={() => handlePublicationClick(publication)}>
                            <div className="text-ellipsis overflow-hidden">
                              {publication.title || "Untitled"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 max-w-[200px]">
                            <AuthorList authors={publication.authors} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {publication.pub_year || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {publication.num_citations || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate">
                            {publication.journal || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {publication.pub_url && (
                                <a 
                                  href={publication.pub_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <FaGlobe />
                                </a>
                              )}
                              <button className="text-blue-500 hover:text-blue-700">
                                <FaFileDownload />
                              </button>
                              <button className="text-blue-500 hover:text-blue-700">
                                <FaBookmark />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="md:hidden">
                  <div className="bg-gray-50 py-2 px-4 flex justify-between text-xs font-medium text-gray-500 uppercase">
                    <div>Title / Authors</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {displayedPublications.map((publication) => (
                      <PublicationListItem
                        key={publication.id}
                        publication={publication}
                        onClick={handlePublicationClick}
                      />
                    ))}
                  </div>
                </div>
                
                {hasMorePublications && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={loadMorePublications}
                      disabled={loadingMore}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        <span>Load More</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-lg">
                <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
                  <LuFileSpreadsheet className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No publications found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search to find publications
                </p>
              </div>
            )}
          </div>
          
          {selectedPublication && (
            <PublicationDetailModal 
              publication={selectedPublication} 
              onClose={() => setSelectedPublication(null)} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default DepartmentAdminDashboard;