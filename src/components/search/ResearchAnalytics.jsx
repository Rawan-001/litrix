import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  BookOpen,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { collectionGroup, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const CombinedResearchDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [publicationData, setPublicationData] = useState(null);
  const [topProfessors, setTopProfessors] = useState([]);
  const [externalCollaborations, setExternalCollaborations] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCollaborations, setSelectedCollaborations] = useState([]);
  
  const [collegeStats, setCollegeStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({});
  const [departments, setDepartments] = useState([]);
  const [researchers, setResearchers] = useState({});
  const [expandedDepts, setExpandedDepts] = useState({});

  const departmentMapping = {
    dept_se: "Software Engineering",
    dept_cs: "Computer Science",
    dept_it: "Information Technology",
    dept_sn: "Systems and Networks",
    dept_ai: "Artificial Intelligence",
  };

  const COLORS = ['#4DA7D0', '#8ACCE6', '#36A2EB', '#9AD0F5', '#5CBAE6', '#4DB6AC', '#81C784'];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        const departmentsRef = collection(db, 'colleges/faculty_computing/departments');
        const departmentsSnapshot = await getDocs(departmentsRef);
        const departmentsData = departmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: departmentMapping[doc.id] || doc.id,
          ...doc.data()
        }));
        
        const filteredDepartments = departmentsData.filter(dept => departmentMapping[dept.id]);
        setDepartments(filteredDepartments);
        
        const yearlyStats = {};
        const years = [2020, 2021, 2022, 2023, 2024];
        years.forEach(year => {
          yearlyStats[year] = {
            publications: 0,
            citations: 0
          };
        });
        
        const deptStats = {};
        const researchersByDept = {};
        
        const facultyRef = collectionGroup(db, "faculty_members");
        const facultySnapshot = await getDocs(facultyRef);
        const allResearchers = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          department: doc.ref.parent.parent.id,
          ...doc.data(),
        }));
        
        const registeredAuthorNames = allResearchers.map(researcher =>
          researcher.name ? researcher.name.trim().toLowerCase() : 
          `${researcher.firstName || ''} ${researcher.lastName || ''}`.trim().toLowerCase()
        );
        
        const isExternalAuthor = (authorName) => {
          const normalizedAuthorName = authorName.trim().toLowerCase();
          return !registeredAuthorNames.includes(normalizedAuthorName);
        };

        filteredDepartments.forEach(dept => {
          deptStats[dept.id] = {};
          researchersByDept[dept.id] = [];
          
          years.forEach(year => {
            deptStats[dept.id][year] = {
              publications: 0,
              citations: 0
            };
          });
          
          const deptResearchers = allResearchers.filter(r => r.department === dept.id);
          
          deptResearchers.forEach(researcher => {
            const researcherName = researcher.name || 
                                   `${researcher.firstName || ''} ${researcher.lastName || ''}`.trim();
            
            if (researcherName) {
              researchersByDept[dept.id].push({
                id: researcher.id,
                name: researcherName,
                picture: researcher.url_picture || null
              });
            }
          });
        });
        
        const publicationsRef = collectionGroup(db, "publications");
        const publicationsSnapshot = await getDocs(publicationsRef);
        const allPublications = publicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          researcherId: doc.ref.parent.parent.id,
          department: doc.ref.parent.parent.parent.parent.id
        }));
        
        const dashboardPublications = allPublications.filter(pub => {
          const pubYear = parseInt(pub.pub_year);
          return pubYear >= 2021 && pubYear <= 2024;
        });
        
        const publicationsByYear = [2021, 2022, 2023, 2024].map(year => {
          const pubsForYear = dashboardPublications.filter(pub => parseInt(pub.pub_year) === year);
          const citationsForYear = pubsForYear.reduce((sum, pub) => sum + (parseInt(pub.num_citations) || 0), 0);
          const collaborationsForYear = pubsForYear.filter(pub => {
            const authorsList = pub.authors ? pub.authors.split(',').map(author => author.trim()) : [];
            return authorsList.some(author => isExternalAuthor(author));
          }).length;
          return {
            year,
            publications: pubsForYear.length,
            citations: citationsForYear,
            collaborations: collaborationsForYear,
          };
        });
        
        const totalPublications = dashboardPublications.length;
        const totalCitations = dashboardPublications.reduce((sum, pub) => sum + (parseInt(pub.num_citations) || 0), 0);
        const pubsWithExternalAuthors = dashboardPublications.filter(pub => {
          const authorsList = pub.authors ? pub.authors.split(',').map(author => author.trim()) : [];
          return authorsList.some(author => isExternalAuthor(author));
        });
        const totalExternalCollabs = pubsWithExternalAuthors.length;
        const externalCollabPercentage = ((totalExternalCollabs / totalPublications) * 100).toFixed(1);
        
        const researchersWithMetrics = allResearchers.map(researcher => {
          const researcherPublications = dashboardPublications.filter(pub => pub.researcherId === researcher.id);
          const citationCounts = researcherPublications
            .map(pub => parseInt(pub.num_citations) || 0)
            .sort((a, b) => b - a);
          
          let hIndex = 0;
          for (let i = 0; i < citationCounts.length; i++) {
            if (citationCounts[i] >= i + 1) {
              hIndex = i + 1;
            } else {
              break;
            }
          }
          
          const totalResearcherCitations = researcherPublications.reduce(
            (sum, pub) => sum + (parseInt(pub.num_citations) || 0),
            0
          );
          
          return {
            ...researcher,
            hIndex,
            publications: researcherPublications.length,
            citations: totalResearcherCitations,
          };
        });
        
        const top10Professors = [...researchersWithMetrics]
          .sort((a, b) => b.hIndex - a.hIndex)
          .slice(0, 10);
        
        allPublications.forEach(publication => {
          const pubYear = parseInt(publication.pub_year);
          const dept = publication.department;
          const citations = parseInt(publication.num_citations) || 0;
          
          if (pubYear >= 2020 && pubYear <= 2024 && deptStats[dept]) {
            deptStats[dept][pubYear].publications += 1;
            deptStats[dept][pubYear].citations += citations;
            
            yearlyStats[pubYear].publications += 1;
            yearlyStats[pubYear].citations += citations;
          }
        });
        
        const collegeStatsArray = years.map(year => ({
          year,
          publications: yearlyStats[year].publications,
          citations: yearlyStats[year].citations
        }));
        
        const totalReportPublications = collegeStatsArray.reduce((sum, stat) => sum + stat.publications, 0);
        const totalReportCitations = collegeStatsArray.reduce((sum, stat) => sum + stat.citations, 0);
        
        collegeStatsArray.push({
          year: 'Total',
          publications: totalReportPublications,
          citations: totalReportCitations
        });
        
        setPublicationData({
          totalPublications,
          totalCitations,
          yearlyPublications: publicationsByYear,
        });
        
        setExternalCollaborations({
          total: totalExternalCollabs,
          percentageOfTotal: externalCollabPercentage,
          publications: pubsWithExternalAuthors,
        });
        
        setTopProfessors(top10Professors);
        setCollegeStats(collegeStatsArray);
        setDepartmentStats(deptStats);
        setResearchers(researchersByDept);
        
        const expandedState = {};
        filteredDepartments.forEach(dept => {
          expandedState[dept.id] = false;
        });
        setExpandedDepts(expandedState);
      } catch (err) {
        console.error("Error fetching research data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  const createCSVDownload = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadScopusData = () => {
    fetch('/src/scopus_pub.csv')
      .then(response => response.text())
      .then(data => createCSVDownload(data, 'scopus_publication_data.csv'))
      .catch(error => {
        console.error('Error fetching CSV file:', error);
        alert('Could not fetch Scopus data. Using sample data instead.');
        const fallbackData = `Author,Title,Year,Journal,Citations\nMohammed Alharbi,Machine Learning Applications in Saudi Universities,2023,Saudi Journal of CS,28\nFatima Khan,Blockchain Technology in Academic Research,2022,International Journal of Technology,45`;
        createCSVDownload(fallbackData, 'scopus_publication_data.csv');
      });
  };

  const showCollaborationsModal = () => {
    setSelectedCollaborations(externalCollaborations?.publications || []);
    setShowModal(true);
  };

  const downloadHIndexTable = () => {
    const headers = "Rank,Researcher,Department,H-Index,Publications,Citations\n";
    const rows = topProfessors.map((professor, index) => {
      const professorName = professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim();
      const department = departmentMapping[professor.department] || "N/A";
      return [
        index + 1,
        `"${professorName}"`,
        department,
        professor.hIndex,
        professor.publications,
        professor.citations,
      ].join(",");
    }).join("\n");
    const csvData = headers + rows;
    createCSVDownload(csvData, "top_researchers_hindex.csv");
  };

  const toggleDepartment = (deptId) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  const exportReportCSV = () => {
    let csvContent = "Level,Year,Publications,Citations\n";
    
    collegeStats.forEach(stat => {
      if (stat.year !== 'Total') { 
        csvContent += `College,${stat.year},${stat.publications},${stat.citations}\n`;
      }
    });
    
    departments.forEach(dept => {
      const deptName = departmentMapping[dept.id] || dept.id;
      Object.keys(departmentStats[dept.id] || {}).forEach(year => {
        const stats = departmentStats[dept.id][year];
        csvContent += `${deptName},${year},${stats.publications},${stats.citations}\n`;
      });
      
      if (departmentStats[dept.id]) {
        const deptTotal = {
          publications: Object.values(departmentStats[dept.id]).reduce((sum, year) => sum + year.publications, 0),
          citations: Object.values(departmentStats[dept.id]).reduce((sum, year) => sum + year.citations, 0)
        };
        csvContent += `${deptName},Total,${deptTotal.publications},${deptTotal.citations}\n`;
      }
    });
    
    const totalRow = collegeStats.find(stat => stat.year === 'Total');
    if (totalRow) {
      csvContent += `College,Total,${totalRow.publications},${totalRow.citations}\n`;
    }
    
    createCSVDownload(csvContent, `research_report_2020_2024_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
  };

  const CollaborationsModal = () => {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center bg-blue-50">
            <div className="flex items-center">
              <BookOpen size={24} className="text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-blue-800">External Research Authors</h2>
            </div>
            <button 
              onClick={() => setShowModal(false)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">Collaboration Summary</h3>
                    <p className="text-sm text-gray-600">Total external collaborations: {externalCollaborations?.total}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {externalCollaborations?.percentageOfTotal}% of all publications involve external authors, 
                  demonstrating our commitment to cross-institutional research partnerships.
                </p>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Publications with External Authors</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                    {selectedCollaborations.length} publications
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {selectedCollaborations.map((pub, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-blue-700 mb-2">{pub.title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Year:</span> <span className="font-medium">{pub.pub_year}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Citations:</span> <span className="font-medium">{pub.num_citations || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Journal:</span> <span className="font-medium">{pub.journal || "N/A"}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-gray-500 text-sm">Authors:</span>
                        <p className="text-sm mt-1">{pub.authors}</p>
                      </div>
                      {pub.abstract && (
                        <div className="mt-3">
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">Show Abstract</summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">{pub.abstract}</p>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <button 
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MetricCard = ({ title, value, icon, secondaryValue, trend, details, action, actionLabel, actionIcon }) => {
    const [showDetails, setShowDetails] = useState(false);
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-600 font-medium text-sm">{title}</h3>
            <div className="p-2 rounded-full bg-blue-50">{icon}</div>
          </div>
          <div className="text-3xl font-bold text-blue-800 mb-2">{value || "N/A"}</div>
          {secondaryValue && <p className="text-sm text-gray-500 mb-2">{secondaryValue}</p>}
          {trend && (
            <div className="mt-4">
              <span
                className={`inline-flex items-center text-xs px-3 py-1 rounded-full ${
                  trend.positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {trend.positive ? <TrendingUp size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1 transform rotate-180" />}
                {trend.label}
              </span>
            </div>
          )}
          {details && (
            <div className="mt-4">
              <button
                className="flex items-center text-blue-500 hover:text-blue-700"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp size={16} className="mr-2" /> : <ChevronDown size={16} className="mr-2" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          )}
          {action && (
            <div className="mt-4 flex justify-center">
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                onClick={action}
              >
                {actionIcon}
                {actionLabel}
              </button>
            </div>
          )}
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              {details}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <h2 className="text-2xl text-red-500">Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <CollaborationsModal />
      
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button 
              className={`py-4 px-2 text-sm font-medium border-b-2 ${activeTab === 'dashboard' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-blue-500'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-2" />
                Research Overview
</div>
            </button>
            <button 
              className={`py-4 px-2 text-sm font-medium border-b-2 ${activeTab === 'report' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-blue-500'}`}
              onClick={() => setActiveTab('report')}
            >
              <div className="flex items-center">
                <FileText size={16} className="mr-2" />
                Research Report
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-blue-800">Research Performance Overveiw</h1>
                <p className="text-gray-600">Analyze research metrics and trends (2021-2024)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Publications"
                value={publicationData?.totalPublications?.toLocaleString() || "N/A"}
                icon={<FileText color="#4DA7D0" size={24} />}
                secondaryValue="Scientific papers, articles, and conference proceedings"
                trend={{
                  label: "+18.3% vs. previous period",
                  positive: true,
                }}
              />
              <MetricCard
                title="Total Citations"
                value={publicationData?.totalCitations?.toLocaleString() || "N/A"}
                icon={<TrendingUp color="#4DA7D0" size={24} />}
                secondaryValue="References to our published research"
                trend={{
                  label: "+23.6% vs. previous period",
                  positive: true,
                }}
              />
              <MetricCard
                title="External Authors"
                value={externalCollaborations?.total?.toLocaleString() || "N/A"}
                icon={<Users color="#4DA7D0" size={24} />}
                secondaryValue={`${externalCollaborations?.percentageOfTotal}% of total publications`}
                trend={{
                  label: "+12.8% vs. previous period",
                  positive: true,
                }}
                action={showCollaborationsModal}
                actionLabel="View Authors"
                actionIcon={<Users size={16} className="mr-2" />}
              />
              <MetricCard
                title="Avg. H-Index (Top 10)"
                value={
                  topProfessors.length > 0
                    ? (topProfessors.reduce((sum, prof) => sum + prof.hIndex, 0) / topProfessors.length).toFixed(1)
                    : "N/A"
                }
                icon={<Award color="#4DA7D0" size={24} />}
                secondaryValue="Average of top 10 faculty members"
                trend={{
                  label: "+2.4 points vs. previous period",
                  positive: true,
                }}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mb-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-blue-800 mb-6">Publication Trends (2021-2024)</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={publicationData?.yearlyPublications || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" orientation="left" stroke="#4DA7D0" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6366F1" />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          return [value, name === 'publications' ? 'Publications' : 
                                         name === 'citations' ? 'Citations' : 
                                         'External Collaborations'];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="publications" name="Publications" fill="#4DA7D0" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="collaborations" name="External Collaborations" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="citations" 
                        name="Citations" 
                        stroke="#6366F1" 
                        strokeWidth={3}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-blue-800 mb-6">Publications by Department</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departments.map(dept => {
                            let totalPubs = 0;
                            if (departmentStats[dept.id]) {
                              totalPubs = Object.values(departmentStats[dept.id]).reduce(
                                (sum, yearData) => sum + yearData.publications, 0
                              );
                            }
                            return {
                              name: departmentMapping[dept.id],
                              value: totalPubs
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {departments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value, name, props) => {
                            return [`${value} publications`, name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-blue-800 mb-6">Citations by Department</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departments.map(dept => {
                            let totalCitations = 0;
                            if (departmentStats[dept.id]) {
                              totalCitations = Object.values(departmentStats[dept.id]).reduce(
                                (sum, yearData) => sum + yearData.citations, 0
                              );
                            }
                            return {
                              name: departmentMapping[dept.id],
                              value: totalCitations
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {departments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value, name, props) => {
                            return [`${value} citations`, name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mb-8">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-blue-800">Top 10 Researchers by H-Index</h2>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    onClick={downloadHIndexTable}
                  >
                    <Download size={16} className="mr-2" />
                    Download H-Index Table
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Rank</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Researcher</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Department</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">H-Index</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">Publications</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">Citations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProfessors.map((professor, index) => (
                        <tr key={professor.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <span className="font-bold text-gray-700">#{index + 1}</span>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="flex items-center">
                              <img
                                src={professor.url_picture || "/api/placeholder/40/40"}
                                alt={professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim()}
                                className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow"
                              />
                              <span className="font-medium text-gray-700">
                                {professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-100">
                              {departmentMapping[professor.department] || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b text-center">
                            <span className="text-lg font-bold text-blue-600">{professor.hIndex}</span>
                          </td>
                          <td className="py-3 px-4 border-b text-center">{professor.publications}</td>
                          <td className="py-3 px-4 border-b text-center">{professor.citations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'report' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-blue-800">Research Publications Report (2020-2024)</h1>
                <p className="text-gray-600">College and department level research statistics</p>
              </div>
              <button
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={exportReportCSV}
              >
                <Download size={16} className="mr-2" />
                Export Report CSV
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md mb-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-blue-800 mb-4">College-Wide Research Statistics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">Year</th>
                          <th className="py-3 px-6 text-center text-sm font-medium text-gray-600">Publications</th>
                          <th className="py-3 px-6 text-center text-sm font-medium text-gray-600">Citations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collegeStats.map((stat) => (
                          <tr 
                            key={stat.year} 
                            className={`hover:bg-gray-50 ${stat.year === 'Total' ? 'bg-blue-50 font-bold' : ''}`}
                          >
                            <td className="py-3 px-6 border-b">{stat.year}</td>
                            <td className="py-3 px-6 border-b text-center">{stat.publications}</td>
                            <td className="py-3 px-6 border-b text-center">{stat.citations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={collegeStats.filter(stat => stat.year !== 'Total')}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" orientation="left" stroke="#4DA7D0" />
                        <YAxis yAxisId="right" orientation="right" stroke="#6366F1" />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="publications" 
                          name="Publications" 
                          stroke="#4DA7D0" 
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="citations" 
                          name="Citations" 
                          stroke="#6366F1" 
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-blue-800 mb-4">Department Research Statistics</h2>
                
                {departments.map((dept) => (
                  <div key={dept.id} className="mb-8">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-t-lg border border-gray-200">
                      <h3 className="font-bold text-gray-700">{departmentMapping[dept.id] || dept.id}</h3>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleDepartment(dept.id)}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Users size={16} className="mr-1" />
                          {researchers[dept.id]?.length || 0} Researchers
                          {expandedDepts[dept.id] ? (
                            <ChevronUp size={16} className="ml-1" />
                          ) : (
                            <ChevronDown size={16} className="ml-1" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {expandedDepts[dept.id] && (
                      <div className="p-4 bg-blue-50 border-x border-b border-gray-200 mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Researchers in this department:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {researchers[dept.id]?.length > 0 ? (
                            researchers[dept.id].map(researcher => (
                              <div key={researcher.id} className="flex items-center bg-white p-2 rounded-lg border border-gray-200">
                                {researcher.picture ? (
                                  <img 
                                    src={researcher.picture} 
                                    alt={researcher.name} 
                                    className="w-8 h-8 rounded-full mr-2 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                    <span className="text-blue-700 font-medium">
                                      {researcher.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm">{researcher.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No researchers found in this department.</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Year</th>
                              <th className="py-2 px-4 text-center text-sm font-medium text-gray-600">Publications</th>
                              <th className="py-2 px-4 text-center text-sm font-medium text-gray-600">Citations</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departmentStats[dept.id] && Object.entries(departmentStats[dept.id]).map(([year, stats]) => (
                              <tr key={year} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{year}</td>
                                <td className="py-2 px-4 border-b text-center">{stats.publications}</td>
                                <td className="py-2 px-4 border-b text-center">{stats.citations}</td>
                              </tr>
                            ))}
                            <tr className="bg-blue-50 font-bold">
                              <td className="py-2 px-4 border-b">Total</td>
                              <td className="py-2 px-4 border-b text-center">
                                {departmentStats[dept.id] && Object.values(departmentStats[dept.id]).reduce((sum, year) => sum + year.publications, 0)}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {departmentStats[dept.id] && Object.values(departmentStats[dept.id]).reduce((sum, year) => sum + year.citations, 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={departmentStats[dept.id] ? Object.entries(departmentStats[dept.id]).map(([year, stats]) => ({
                              year,
                              publications: stats.publications,
                              citations: stats.citations
                            })) : []}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis yAxisId="left" orientation="left" stroke="#4DA7D0" />
                            <YAxis yAxisId="right" orientation="right" stroke="#6366F1" />
                            <RechartsTooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="publications" name="Publications" fill="#4DA7D0" radius={[4, 4, 0, 0]} />
                            <Line 
                              yAxisId="right" 
                              type="monotone" 
                              dataKey="citations" 
                              name="Citations" 
                              stroke="#6366F1" 
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-8 text-center p-4">
        <p className="text-xs text-gray-500">
          Research Analytics Dashboard | Data updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default CombinedResearchDashboard;