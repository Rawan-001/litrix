import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db } from '../firebaseConfig'; 
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Box, Typography, Avatar, Card, CardContent, Grid } from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import Header from '../components/common/Header';
import { ClipLoader } from 'react-spinners'; // إضافة مكون ClipLoader

const ResearcherProfilePage = () => {
  const [userData, setUserData] = useState(null); 
  const [facultyMembers, setFacultyMembers] = useState(null); 
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchResearcherData = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData); 

        const researcherDocRef = doc(db, `colleges/faculty_computing/departments/dept_cs/faculty_members/${userData.scholar_id}`);
        const researcherDoc = await getDoc(researcherDocRef);

        if (researcherDoc.exists()) {
          const researcherData = researcherDoc.data();
          setFacultyMembers(researcherData); 

          const publicationsRef = collection(
            db,
            `colleges/faculty_computing/departments/dept_cs/faculty_members/${userData.scholar_id}/publications`
          );
          const publicationsSnapshot = await getDocs(publicationsRef);
          const publicationsData = publicationsSnapshot.docs.map((doc) => doc.data());
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
          <TableCell>{publication.title || "No Title"}</TableCell>
          <TableCell>{publication.pub_year || "Unknown Year"}</TableCell>
          <TableCell>{publication.publisher || "Unknown Publisher"}</TableCell>
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
                    !["title", "pub_year", "publisher", "num_citations"].includes(field) && (
                      <Typography key={field} variant="body2">
                        <strong>{field.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
                        {typeof publication[field] === 'object' && publication[field] !== null
                          ? <pre>{JSON.stringify(publication[field], null, 2)}</pre>
                          : publication[field]}
                      </Typography>
                    )
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  // عرض السبينر عند تحميل البيانات
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
          <Grid item xs={12} md={8}>
            <motion.div
              className="mb-8 bg-white shadow-lg p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
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
                  
                  <p><strong>Email:</strong> {userData?.email || "N/A"}</p>
                  <p><strong>Phone Number:</strong> {userData?.phoneNumber || "N/A"}</p>

                  <p><strong>Interests:</strong> {facultyMembers?.interests ? facultyMembers.interests.join(", ") : "N/A"}</p>
                </div>
              </div>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
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
        </Grid>

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
                    <TableCell>Publisher</TableCell>
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
      </motion.div>
    </div>
  );
};

export default ResearcherProfilePage;
