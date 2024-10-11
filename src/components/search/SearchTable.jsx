import React, { useState } from "react";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Fuse from "fuse.js";
import {
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
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import SearchIcon from '@mui/icons-material/Search';

function SearchTable() {
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchType, setSearchType] = useState("name");
  const [researcherData, setResearcherData] = useState([]);
  const [publicationsData, setPublicationsData] = useState([]);
  const [collegeFilter, setCollegeFilter] = useState(""); // فلتر الكلية
  const [departmentFilter, setDepartmentFilter] = useState(""); // فلتر القسم
  const [publisherFilter, setPublisherFilter] = useState(""); // فلتر الناشر
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fuseOptions = {
    keys: ['name'],
    threshold: 0.4,
  };

  const handleSearch = () => {
    if (searchTerm) {
      if (searchType === "scholar_id") {
        fetchResearcherById(searchTerm);
      } else {
        fetchResearchersAndSearchByName(searchTerm);
      }
    } else {
      setError("Please enter a valid search term.");
    }
  };

  const fetchResearcherById = async (scholarId) => {
    setLoading(true);
    setError("");
    try {
      const researcherDocRef = doc(
        db,
        `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}`
      );
      const researcherDoc = await getDoc(researcherDocRef);

      if (researcherDoc.exists()) {
        const researcherData = researcherDoc.data();
        setResearcherData([researcherData]);

        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}/publications`
        );
        const publicationsSnapshot = await getDocs(publicationsRef);
        const publicationsData = publicationsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          researcherName: researcherData.name
        }));
        setPublicationsData(publicationsData);
      } else {
        setResearcherData([]);
        setPublicationsData([]);
        setError("No researcher found with this Scholar ID.");
      }
    } catch (err) {
      setError("Error fetching data: " + err.message);
    }
    setLoading(false);
  };

  const fetchResearchersAndSearchByName = async (name) => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, `colleges/faculty_computing/departments/dept_cs/faculty_members`));
      const querySnapshot = await getDocs(q);

      const researchers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const fuse = new Fuse(researchers, fuseOptions);
      const results = fuse.search(name);

      if (results.length > 0) {
        const foundResearchers = results.map(result => result.item);
        setResearcherData(foundResearchers);

        const allPublications = [];
        for (const researcher of foundResearchers) {
          const publicationsRef = collection(
            db,
            `colleges/faculty_computing/departments/dept_cs/faculty_members/${researcher.scholar_id}/publications`
          );
          const publicationsSnapshot = await getDocs(publicationsRef);
          const publicationsData = publicationsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            researcherName: researcher.name
          }));
          allPublications.push(...publicationsData);
        }
        setPublicationsData(allPublications);
      } else {
        setResearcherData([]);
        setPublicationsData([]);
        setError("No researchers found with this name.");
      }
    } catch (err) {
      setError("Error fetching data: " + err.message);
    }
    setLoading(false);
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
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell>{publication.title || "No Title"}</TableCell>
          <TableCell>{publication.pub_year || "Unknown Year"}</TableCell>
          <TableCell>{publication.publisher || "Unknown Publisher"}</TableCell>
          <TableCell>{publication.num_citations || 0}</TableCell>
          <TableCell>{publication.researcherName || "Unknown Researcher"}</TableCell>
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
                    !["title", "pub_year", "publisher", "num_citations", "researcherName"].includes(field) && (
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

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* شريط البحث في الأعلى */}
        <Card className="mb-6" sx={{ borderRadius: "16px" }}>
          <CardContent>
            <Typography variant="h5" gutterBottom className="text-center font-bold">
              Search Publications
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  variant="outlined"
                  label="Search Type"
                >
                  <MenuItem value="name">Search by Researcher Name</MenuItem>
                  <MenuItem value="scholar_id">Search by Scholar ID</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  fullWidth
                  label={searchType === "scholar_id" ? "Enter Scholar ID" : "Enter Researcher Name"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button
                  onClick={handleSearch}
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* قسم الفلاتر المتقدمة */}
        <Card className="mb-6" sx={{ borderRadius: "16px" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom className="text-center font-bold">
              Advanced Filters
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  variant="outlined"
                  label="College"
                >
                  <MenuItem value="">All Colleges</MenuItem>
                  <MenuItem value="faculty_computing">Faculty of Computing</MenuItem>
                  {/* أضف المزيد من الكليات هنا */}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  variant="outlined"
                  label="Department"
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="dept_cs">Department of Computer Science</MenuItem>
                  {/* أضف المزيد من الأقسام هنا */}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  value={publisherFilter}
                  onChange={(e) => setPublisherFilter(e.target.value)}
                  variant="outlined"
                  label="Publisher"
                >
                  <MenuItem value="">All Publishers</MenuItem>
                  <MenuItem value="IEEE">IEEE</MenuItem>
                  <MenuItem value="ACM">ACM</MenuItem>
                  {/* أضف المزيد من الناشرين هنا */}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* عرض حالة التحميل أو الأخطاء */}
        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* عرض نتائج الباحثين */}
        {researcherData && researcherData.length > 0 && (
          <div>
            <Typography variant="h6" gutterBottom className="text-center font-bold">
              Researcher Profile
            </Typography>
            <Grid container spacing={2} className="mb-6">
              {researcherData.map((researcher, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ borderRadius: "16px" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{researcher.name}</Typography>
                      <Typography variant="body2">Affiliation: {researcher.affiliation}</Typography>
                      <Typography variant="body2">Scholar ID: {researcher.scholar_id}</Typography>
                      <Typography variant="body2">Email: {researcher.email}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        )}

        {/* عرض نتائج الأبحاث */}
        {publicationsData && publicationsData.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: "16px" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Title</TableCell>
                  <TableCell>Publication Year</TableCell>
                  <TableCell>Publisher</TableCell>
                  <TableCell>Number of Citations</TableCell>
                  <TableCell>Researcher Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publicationsData.map((publication, index) => (
                  <CollapsibleRow key={index} publication={publication} />
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
