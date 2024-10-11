import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Box, Typography, Avatar, Card, CardContent, Grid, Link } from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import Header from '../components/common/Header';
import { ClipLoader } from 'react-spinners';

const ResearcherProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [facultyMembers, setFacultyMembers] = useState(null);
  const [publications, setPublications] = useState([]);
  const [coauthors, setCoauthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchResearcherData = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);

        const researcherDocRef = doc(db, `colleges/${userData.college}/departments/${userData.department}/faculty_members/${userData.scholar_id}`);
        const researcherDoc = await getDoc(researcherDocRef);

        if (researcherDoc.exists()) {
          const researcherData = researcherDoc.data();
          setFacultyMembers(researcherData);

          if (researcherData.coauthors) {
            setCoauthors(researcherData.coauthors);
          }

          const publicationsRef = collection(
            db,
            `colleges/${userData.college}/departments/${userData.department}/faculty_members/${userData.scholar_id}/publications`
          );
          const publicationsSnapshot = await getDocs(publicationsRef);
          const publicationsData = publicationsSnapshot.docs.map((doc) => doc.data());
          publicationsData.sort((a, b) => b.num_citations - a.num_citations || b.pub_year - a.pub_year);
          setPublications(publicationsData);
        } else {
          console.error('No researcher data found');
        }
      } else {
        console.error('No user data found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching researcher data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchResearcherData(user.uid);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
        <ClipLoader size={100} color={"#4F46E5"} loading={true} />
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
          {/* عرض بيانات الباحث وكارد السايتاشن بجانب بعض */}
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
                  src={facultyMembers?.url_picture || "/default-avatar.png"}
                  sx={{ width: 120, height: 120, marginRight: '20px' }}
                />
                <div>
                  <Typography variant="h5" gutterBottom>
                    {userData?.firstName + ' ' + userData?.lastName || "Researcher"}
                  </Typography>

                  <p><strong>Scholar ID:</strong> {facultyMembers?.scholar_id || userData?.scholar_id || "N/A"}</p>

                  <p><strong>Institution:</strong> {facultyMembers?.institution || userData?.institution || "N/A"}</p>
                  
                  <p><strong>Affiliation:</strong> {facultyMembers?.affiliation || "N/A"}</p>

                  <p><strong>Email:</strong> {userData?.email || "N/A"}</p>
                  <p><strong>Phone Number:</strong> {userData?.phoneNumber || "N/A"}</p>

                  <p><strong>Interests:</strong> {facultyMembers?.interests ? facultyMembers.interests.join(", ") : "N/A"}</p>
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
                    <strong>H-index:</strong> {facultyMembers?.hindex || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>H-index (Last 5 years):</strong> {facultyMembers?.hindex5y || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>i10-index:</strong> {facultyMembers?.i10index || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>i10-index (Last 5 years):</strong> {facultyMembers?.i10index5y || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Cited By:</strong> {facultyMembers?.citedby || "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* عرض الأبحاث أسفل البيانات وكارد السايتاشن */}
          <Grid item xs={coauthors.length > 0 ? 8 : 12}>
            <motion.div
              className="bg-white shadow-lg p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-medium mb-2">Publications</h3>
              {publications.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell>Title</TableCell>
                        <TableCell>Publication Year</TableCell>
                        <TableCell>Number of Citations</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {publications.map((publication, index) => (
                        <CollapsibleRow key={index} publication={publication} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <p>No publications found.</p>
              )}
            </motion.div>
          </Grid>

          {/* عرض الكو اوثرز فقط إذا وجد */}
          {coauthors.length > 0 && (
            <Grid item xs={4}>
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
