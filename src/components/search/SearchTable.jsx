import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore";
import { GridLoader } from "react-spinners";
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
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
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
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

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

    const fetchDepartments = async () => {
      const departmentsRef = collection(db, `colleges/faculty_computing/departments`);
      const departmentsSnapshot = await getDocs(departmentsRef);
      const departmentList = departmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setDepartments(departmentList);
    };

    fetchCurrentUser();
    fetchDepartments();
  }, []);

  const fuseOptions = {
    keys: ['firstName', 'lastName'],
    threshold: 0.4,
  };

  const handleSearch = async () => {
    if (searchTerm || selectedDepartment) {
      setLoading(true);
      setError("");

      try {
        const q = query(collection(db, `users`));
        const querySnapshot = await getDocs(q);

        let researchers = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(researcher => researcher.scholar_id !== currentUserScholarId);

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
              `colleges/faculty_computing/departments/${researcher.department}/faculty_members/${researcher.scholar_id}/publications`
            );
            const publicationsSnapshot = await getDocs(publicationsRef);
            const researcherPublications = publicationsSnapshot.docs.map(doc => ({
              ...doc.data(),
              researcherFirstName: researcher.firstName,
              researcherLastName: researcher.lastName,
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

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const CollapsibleRow = ({ publication }) => {
    const [open, setOpen] = useState(false);

    const fieldsToShow = Object.keys(publication).filter(field => {
      const value = publication[field];
      return value && !["title", "pub_year", "num_citations", "authors", "cites_per_year", "cites_id", "researcherFirstName", "researcherLastName"].includes(field)
        && !(Array.isArray(value) && value.length === 0) && !(typeof value === 'object' && Object.keys(value).length === 0);
    });

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
          <TableCell>{publication.researcherFirstName} {publication.researcherLastName}</TableCell> 
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Typography variant="h6" gutterBottom component="div">
                  More Details
                </Typography>
                {fieldsToShow.length > 0 ? (
                  fieldsToShow.map(field => (
                    <Typography key={field} variant="body2">
                      <strong>{field.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
                      {field === "pub_url" ? (
                        <Link href={publication[field]} target="_blank" rel="noopener" style={{ color: '#0072e5' }}>
                          {publication[field]}
                        </Link>
                      ) : (
                        typeof publication[field] === 'object' ? JSON.stringify(publication[field]) : publication[field]
                      )}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">No additional details available.</Typography>
                )}
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
                  label="Enter Researcher Name"
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

              <Grid item xs={12} sm={4}>
                <Select
                  fullWidth
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  variant="outlined"
                  size="small"
                  displayEmpty
                  sx={{ padding: '6px 10px', minHeight: '40px' }}
                >
                  <MenuItem value=""> All Departments</MenuItem>
                  {departments.map((dept, index) => (
                    <MenuItem key={index} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <GridLoader size={30} color={"#6366F1"} />
          </div>
        )}

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
