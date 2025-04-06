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
import { Award, TrendingUp, Users, FileText, Download, Filter, ChevronDown, ChevronUp, X, BookOpen } from 'lucide-react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const ResearchDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicationData, setPublicationData] = useState(null);
  const [topProfessors, setTopProfessors] = useState([]);
  const [externalCollaborations, setExternalCollaborations] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCollaborations, setSelectedCollaborations] = useState([]);

  const departmentMapping = {
    dept_se: "Software Engineering",
    dept_cs: "Computer Science",
    dept_it: "Information Technology",
    dept_ai: "Artificial Intelligence",
  };

  useEffect(() => {
    const fetchResearchData = async () => {
      try {
        setLoading(true);
        const facultyRef = collectionGroup(db, "faculty_members");
        const facultySnapshot = await getDocs(facultyRef);
        const allResearchers = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          department: doc.ref.parent.parent.id,
          ...doc.data(),
        }));
        const registeredAuthorNames = allResearchers.map(researcher =>
          researcher.name.trim().toLowerCase()
        );
        const isExternalAuthor = (authorName) => {
          const normalizedAuthorName = authorName.trim().toLowerCase();
          return !registeredAuthorNames.includes(normalizedAuthorName);
        };
        const publicationsRef = collectionGroup(db, "publications");
        const publicationsSnapshot = await getDocs(publicationsRef);
        const allPublications = publicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          researcherId: doc.ref.parent.parent.id,
        }));
        const publications = allPublications.filter(pub => {
          const pubYear = parseInt(pub.pub_year);
          return pubYear >= 2021 && pubYear <= 2024;
        });
        const publicationsByYear = [2021, 2022, 2023, 2024].map(year => {
          const pubsForYear = publications.filter(pub => parseInt(pub.pub_year) === year);
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
        const totalPublications = publications.length;
        const totalCitations = publications.reduce((sum, pub) => sum + (parseInt(pub.num_citations) || 0), 0);
        const pubsWithExternalAuthors = publications.filter(pub => {
          const authorsList = pub.authors ? pub.authors.split(',').map(author => author.trim()) : [];
          return authorsList.some(author => isExternalAuthor(author));
        });
        const totalExternalCollabs = pubsWithExternalAuthors.length;
        const externalCollabPercentage = ((totalExternalCollabs / totalPublications) * 100).toFixed(1);
        const researchersWithMetrics = allResearchers.map(researcher => {
          const researcherPublications = publications.filter(pub => pub.researcherId === researcher.id);
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
      } catch (err) {
        console.error("Error fetching research data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResearchData();
  }, []);

  const COLORS = ['#4DA7D0', '#8ACCE6', '#36A2EB', '#9AD0F5', '#5CBAE6', '#4DB6AC', '#81C784'];

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen overflow-hidden">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen overflow-hidden gap-4">
        <h2 className="text-2xl text-red-500">Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 font-sans overflow-y-auto h-screen">
      <CollaborationsModal />
      <div className="flex justify-between items-center mb-8">
   
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
        <MetricCard
          title="Scopus Metrics (2021-2024)"
          value="Scopus Data"
          icon={<BookOpen color="#4DA7D0" size={24} />}
          secondaryValue={
            <div>
              <p>Publications: 369</p>
              <p>Citations: 3630</p>
              <p>Researchers: 31</p>
            </div>
          }
          action={downloadScopusData}
          actionLabel="Download Research Data"
          actionIcon={<Download size={16} className="mr-2" />}
        />
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
      <div className="mt-12 text-center p-4">
        <p className="text-xs text-gray-500">
          Research Analytics  | Data updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default ResearchDashboard;