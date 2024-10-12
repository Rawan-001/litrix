import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import Fuse from "fuse.js";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Link,
  MenuItem,
  Select,
  InputAdornment
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityIcon from '@mui/icons-material/Visibility';

function SearchTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [researcherData, setResearcherData] = useState([]);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserScholarId, setCurrentUserScholarId] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, `users/${user.uid}`);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUserScholarId(userDoc.data().scholar_id);
        }
      }
    };

    const fetchCollegesAndDepartments = async () => {
      const collegesRef = collection(db, "colleges");
      const collegesSnapshot = await getDocs(collegesRef);
      const collegeList = [];
      for (const collegeDoc of collegesSnapshot.docs) {
        const collegeData = collegeDoc.data();
        const collegeId = collegeDoc.id;

        const departmentsRef = collection(db, `colleges/${collegeId}/departments`);
        const departmentsSnapshot = await getDocs(departmentsRef);
        const departmentList = departmentsSnapshot.docs.map(doc => doc.id);

        collegeList.push({
          id: collegeId,
          name: collegeData.name,
          departments: departmentList
        });
      }
      setColleges(collegeList);
    };

    fetchCurrentUser();
    fetchCollegesAndDepartments();
  }, []);

  const fuseOptions = {
    keys: ['firstName', 'lastName', 'title'],
    threshold: 0.4,
  };

  const handleSearch = async () => {
    if (searchTerm || selectedCollege || selectedDepartment) {
      setLoading(true);
      setError("");
      try {
        const q = query(collection(db, `users`));
        const querySnapshot = await getDocs(q);

        let researchers = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(researcher => researcher.scholar_id !== currentUserScholarId);

        if (selectedCollege) {
          researchers = researchers.filter(researcher => researcher.college === selectedCollege);
        }
        if (selectedDepartment) {
          researchers = researchers.filter(researcher => researcher.department === selectedDepartment);
        }

        const fuse = new Fuse(researchers, fuseOptions);
        const results = fuse.search(searchTerm);

        if (results.length > 0) {
          setResearcherData(results.map(result => result.item));

          const allPublications = [];
          for (const researcher of results.map(result => result.item)) {
            const publicationsRef = collection(
              db,
              `colleges/${researcher.college}/departments/${researcher.department}/faculty_members/${researcher.scholar_id}/publications`
            );
            const publicationsSnapshot = await getDocs(publicationsRef);
            const researcherPublications = publicationsSnapshot.docs.map(doc => ({
              ...doc.data(),
              researcherName: researcher.firstName + ' ' + researcher.lastName
            }));
            allPublications.push(...researcherPublications);
          }
          setPublications(allPublications);
        } else {
          setResearcherData([]);
          setError("No researchers found.");
        }
      } catch (err) {
        setError("Error fetching data: " + err.message);
      }
      setLoading(false);
    } else {
      setError("Please enter a valid search term.");
    }
  };

  const goToProfile = (scholar_id) => {
    navigate(`/profile/${scholar_id}`);
  };

  const handleCollegeChange = (event) => {
    setSelectedCollege(event.target.value);
    setSelectedDepartment(""); 
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
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
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>{publication.title || "No Title"}</TableCell>
          <TableCell>{publication.pub_year || "Unknown Year"}</TableCell>
          <TableCell>{publication.num_citations || 0}</TableCell>
          <TableCell>{publication.researcherName}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Typography variant="h6" gutterBottom component="div">
                  More Details
                </Typography>
                {Object.keys(publication).map(field => {
                  const value = publication[field];
                  if (value && !["title", "pub_year", "num_citations", "authors"].includes(field)) {
                    return (
                      <Typography key={field} variant="body2">
                        <strong>{field.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
                        {field === "pub_url" ? (
                          <Link href={value} target="_blank" rel="noopener" style={{ color: '#0072e5' }}>
                            {value}
                          </Link>
                        ) : (
                          typeof value === 'object' ? JSON.stringify(value) : value
                        )}
                      </Typography>
                    );
                  }
                  return null;
                })}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <Card className="mb-6" sx={{ borderRadius: "16px" }}>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              className="text-center font-bold"
              style={{ marginBottom: "70px" }}
            >
              Search Researchers and Publications
            </Typography>

            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  variant="outlined"
                  fullWidth
                  label="Enter Researcher Name or Publication Title"
                  size="small" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch} color="primary">
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    style: { 
                      borderRadius: '25px', 
                      padding: '6px 10px', 
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <Select
                  fullWidth
                  label="Select College"
                  value={selectedCollege}
                  onChange={handleCollegeChange}
                  variant="outlined"
                  size="small" 
                  sx={{ padding: '6px 10px', minHeight: '40px' }} 
                >
                  <MenuItem value="">All Colleges</MenuItem>
                  {colleges.map((college, index) => (
                    <MenuItem key={index} value={college.id}>
                      {college.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              {selectedCollege && (
                <Grid item xs={12} sm={2}>
                  <Select
                    fullWidth
                    label="Select Department"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    variant="outlined"
                    size="small" 
                    sx={{ padding: '6px 10px', minHeight: '40px' }} 
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {colleges
                      .find(college => college.id === selectedCollege)
                      ?.departments.map((dept, index) => (
                        <MenuItem key={index} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                  </Select>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {researcherData.length > 0 && (
          <Grid container spacing={2}>
            {researcherData.map((researcher, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{ borderRadius: "16px", transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}
                >
                  <CardContent>
                    <Avatar
                      alt={researcher.firstName + " " + researcher.lastName}
                      src={researcher.url_picture || "/default-avatar.png"}
                      sx={{ width: 56, height: 56, marginBottom: '10px' }}
                    />
                    <Typography variant="h6">{researcher.firstName + " " + researcher.lastName}</Typography>
                    <Typography variant="body2">Affiliation: {researcher.affiliation}</Typography>
                    <Typography variant="body2">Scholar ID: {researcher.scholar_id}</Typography>
                    <Typography variant="body2">Email: {researcher.email}</Typography>

                    <Button
                      onClick={() => goToProfile(researcher.scholar_id)}
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<VisibilityIcon />}
                      sx={{ marginTop: 1 }}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {publications.length > 0 && (
          <TableContainer component={Paper} sx={{ marginTop: 5 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Title</TableCell>
                  <TableCell>Publication Year</TableCell>
                  <TableCell>Number of Citations</TableCell>
                  <TableCell>Researcher Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publications.map((pub, index) => (
                  <CollapsibleRow key={index} publication={pub} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}

export default SearchTable;
