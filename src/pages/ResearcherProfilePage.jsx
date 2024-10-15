import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Box, Typography, Avatar, Card, CardContent, Grid, Link } from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import Header from '../components/common/Header';
import { GridLoader } from 'react-spinners';

const ResearcherProfilePage = () => {
  const { scholar_id } = useParams(); 
  const [researcherData, setResearcherData] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [publications, setPublications] = useState([]);
  const [coauthors, setCoauthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState({ field: "citations", order: "desc" }); 

  const fetchResearcherData = async () => {
    if (!scholar_id) {
      console.error('Scholar ID غير موجود في الرابط');
      return;
    }

    try {
      let researcherDoc = null;
      let publicationsData = [];
      let researcherDataFetched = null;

      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      for (const collegeDoc of collegesSnapshot.docs) {
        const collegeId = collegeDoc.id;
        const departmentsSnapshot = await getDocs(collection(db, `colleges/${collegeId}/departments`));
        for (const departmentDoc of departmentsSnapshot.docs) {
          const departmentId = departmentDoc.id;

          const researcherRef = doc(db, `colleges/${collegeId}/departments/${departmentId}/faculty_members/${scholar_id}`);
          const docSnap = await getDoc(researcherRef);

          if (docSnap.exists()) {
            researcherDoc = docSnap;
            researcherDataFetched = docSnap.data();

            const publicationsRef = collection(db, `colleges/${collegeId}/departments/${departmentId}/faculty_members/${scholar_id}/publications`);
            const publicationsSnapshot = await getDocs(publicationsRef);
            publicationsData = publicationsSnapshot.docs.map((doc) => doc.data());

            break;
          }
        }
        if (researcherDoc) break;
      }

      if (researcherDoc && researcherDataFetched) {
        setResearcherData(researcherDataFetched);
        setPublications(publicationsData);

        if (researcherDataFetched.coauthors) {
          setCoauthors(researcherDataFetched.coauthors);
        }
      } else {
        console.error('مافي بيانات للباحث' );
      }

      const userQuerySnapshot = await getDocs(collection(db, 'users'));
      const foundUser = userQuerySnapshot.docs
        .map(doc => doc.data())
        .find(user => user.scholar_id === scholar_id);
      
      if (foundUser) {
        setUserData(foundUser);
      } else {
        console.error('مافي بيانات للباحث');
      }
    } catch (error) {
      console.error('Error fetching researcher data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResearcherData();
  }, [scholar_id]);

  const sortPublications = () => {
    return publications.sort((a, b) => {
      if (sortOption.field === "citations") {
        return sortOption.order === "asc"
          ? (a.num_citations || 0) - (b.num_citations || 0)
          : (b.num_citations || 0) - (a.num_citations || 0);
      } else if (sortOption.field === "year") {
        return sortOption.order === "asc"
          ? (a.pub_year || 0) - (b.pub_year || 0)
          : (b.pub_year || 0) - (a.pub_year || 0);
      }
      return 0;
    });
  };

  const handleSort = (field) => {
    if (sortOption.field === field) {
      setSortOption((prev) => ({
        field,
        order: prev.order === "asc" ? "desc" : "asc",
      }));
    } else {
      setSortOption({ field, order: "desc" });
    }
  };

  const CollapsibleRow = ({ publication }) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <TableRow>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
              sx={{ color: open ? 'blue' : 'inherit' }} 
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell>
            <Typography variant="body1" fontWeight="bold">{publication.title || "No Title"}</Typography>
            {publication.authors && (
              <Typography variant="body2" color="textSecondary">
                Authors: {Array.isArray(publication.authors) ? publication.authors.join(', ') : publication.authors}
              </Typography>
            )}
            {publication.publisher && (
              <Typography variant="body2" style={{ color: "#4F46E5" }}>
                Publisher: {publication.publisher}
              </Typography>
            )}
          </TableCell>
          <TableCell>{publication.pub_year || "Unknown Year"}</TableCell>
          <TableCell>{publication.num_citations || 0}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Typography variant="h6" gutterBottom component="div">
                  More Details
                </Typography>
                {Object.keys(publication).map(
                  (field) =>
                    !["title", "pub_year", "publisher", "num_citations", "authors", "pub_url"].includes(field) && (
                      <Typography key={field} variant="body2">
                        <strong>{field.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
                        {typeof publication[field] === 'object' ? JSON.stringify(publication[field]) : publication[field]}
                      </Typography>
                    )
                )}
                {publication.pub_url && (
                  <Typography variant="body2">
                    <strong>Pub URL: </strong>
                    <Link href={publication.pub_url} target="_blank" rel="noopener" style={{ color: '#0072e5' }}>
                      {publication.pub_url}
                    </Link>
                  </Typography>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="absolute inset-0 flex justify-center items-center">
          <GridLoader size={30} color={"#123abc"} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto">
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
        <Grid container spacing={4}>
          <Grid item xs={8}> 
            <motion.div
              className="mb-8 bg-white shadow-lg p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center mb-3">
                <Avatar
                  alt="Researcher Profile Picture"
                  src={researcherData?.url_picture || "/default-avatar.png"}
                  sx={{ width: 120, height: 120, marginRight: '20px' }}
                />
                <div>
                  <Typography variant="h5" gutterBottom>
                    {userData?.firstName + ' ' + userData?.lastName || "Researcher"}
                  </Typography>

                  <p><strong>Scholar ID:</strong> {researcherData?.scholar_id || userData?.scholar_id || "N/A"}</p>
                  <p><strong>Institution:</strong> {researcherData?.institution || "N/A"}</p>
                  <p><strong>Affiliation:</strong> {researcherData?.affiliation || "N/A"}</p>
                  <p><strong>Email:</strong> {userData?.email || "N/A"}</p>
                  <p><strong>Phone Number:</strong> {userData?.phoneNumber || "N/A"}</p>
                  <p><strong>Interests:</strong> {researcherData?.interests ? researcherData.interests.join(", ") : "N/A"}</p>
                </div>
              </div>
            </motion.div>
          </Grid>

          <Grid item xs={4}>
            <motion.div
              className="mb-8 bg-white shadow-lg p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Citation Metrics
                  </Typography>
                  <Typography variant="body1">
                    <strong>H-index:</strong> {researcherData?.hindex || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>H-index (Last 5 years):</strong> {researcherData?.hindex5y || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>i10-index:</strong> {researcherData?.i10index || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>i10-index (Last 5 years):</strong> {researcherData?.i10index5y || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Cited By:</strong> {researcherData?.citedby || "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={coauthors.length > 0 ? 9 : 11}> 
            <motion.div
              className="bg-white shadow-lg p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-medium mb-2">Publications</h3>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "pointer" }} onClick={() => handleSort("year")}>
                          <span style={{ fontSize: "12px", marginRight: "5px" }}>Year</span>
                          <ArrowUpward fontSize="small" style={{ opacity: sortOption.field === "year" && sortOption.order === "asc" ? 1 : 0.2 }} />
                          <ArrowDownward fontSize="small" style={{ opacity: sortOption.field === "year" && sortOption.order === "desc" ? 1 : 0.2 }} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "pointer" }} onClick={() => handleSort("citations")}>
                          <span style={{ fontSize: "12px", marginRight: "5px" }}>Citations</span>
                          <ArrowUpward fontSize="small" style={{ opacity: sortOption.field === "citations" && sortOption.order === "asc" ? 1 : 0.2 }} />
                          <ArrowDownward fontSize="small" style={{ opacity: sortOption.field === "citations" && sortOption.order === "desc" ? 1 : 0.2 }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortPublications().map((publication, index) => (
                      <CollapsibleRow key={index} publication={publication} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </motion.div>
          </Grid>

          {coauthors.length > 0 && (
            <Grid item xs={3}> 
              <motion.div
                className="bg-white shadow-lg p-6 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-medium mb-2">Coauthors</h3>
                <Card style={{ padding: '10px', fontSize: '0.85rem', maxWidth: '100%' }}>
                  <CardContent>
                    {coauthors.map((coauthor, index) => (
                      <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          alt={coauthor.name}
                          src="/default-avatar.png"
                          sx={{ width: 30, height: 30, marginRight: '10px' }}
                        />
                        <div>
                          <Typography variant="body2" style={{ fontSize: '0.85rem' }}>
                            <strong>Name:</strong> {coauthor.name}
                          </Typography>
                          <Typography variant="body2" style={{ fontSize: '0.85rem', color: "#666" }}>
                            <strong>Affiliation:</strong> {coauthor.affiliation}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </motion.div>
    </div>
  );
};

export default ResearcherProfilePage;
