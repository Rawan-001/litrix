import React, { useState } from "react";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore"; 
import { db } from "../../firebaseConfig"; 
import Fuse from "fuse.js"; // لاستيراد Fuse.js للبحث الغامض
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
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

function SearchTable() {
  const [searchTerm, setSearchTerm] = useState(""); // لتخزين قيمة البحث
  const [searchType, setSearchType] = useState("name"); // لتحديد نوع البحث (الاسم أو Scholar ID)
  const [researcherData, setResearcherData] = useState([]); // لتخزين بيانات الباحثين
  const [publicationsData, setPublicationsData] = useState([]); // لتخزين بيانات الأبحاث
  const [loading, setLoading] = useState(false); // لتحديد حالة التحميل
  const [error, setError] = useState(""); // لتخزين الأخطاء

  const fuseOptions = {
    keys: ['name'], // البحث في أسماء الباحثين
    threshold: 0.4, // البحث الغامض
  };

  // البحث باستخدام Scholar ID
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
        setResearcherData([researcherData]); // تخزين بيانات الباحث

        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}/publications`
        );
        const publicationsSnapshot = await getDocs(publicationsRef);
        const publicationsData = publicationsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          researcherName: researcherData.name // إضافة اسم الباحث لكل منشور
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

  // البحث باستخدام اسم الباحث باستخدام Fuse.js
  const fetchResearchersAndSearchByName = async (name) => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, `colleges/faculty_computing/departments/dept_cs/faculty_members`));
      const querySnapshot = await getDocs(q);

      const researchers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // البحث الغامض باستخدام Fuse.js
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
            researcherName: researcher.name // إضافة اسم الباحث لكل منشور
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

  // دالة البحث
  const handleSearch = () => {
    if (searchTerm) {
      if (searchType === "scholar_id") {
        fetchResearcherById(searchTerm); // البحث باستخدام Scholar ID
      } else {
        fetchResearchersAndSearchByName(searchTerm); // البحث باستخدام اسم الباحث
      }
    } else {
      setError("Please enter a valid search term.");
    }
  };

  // الصف القابل للتوسع لكل منشور
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
        <Card
          className="mb-6"
          sx={{ borderRadius: "16px" }} // إضافة انحناء دائري
        >
          <CardContent>
            <Typography variant="h5" gutterBottom className="text-center font-bold">
              Search Publications
            </Typography>

            <div className="flex items-center justify-center mb-6">
              <TextField
                select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                variant="outlined"
                label="Search Type"
                className="mr-4"
                sx={{ borderRadius: "50px" }} // جعل الـ Input دائري
              >
                <MenuItem value="name">Search by Researcher Name</MenuItem>
                <MenuItem value="scholar_id">Search by Scholar ID</MenuItem>
              </TextField>

              <TextField
                variant="outlined"
                label={searchType === "scholar_id" ? "Enter Scholar ID" : "Enter Researcher Name"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md"
                sx={{ borderRadius: "50px" }} // جعل الـ Input دائري
              />

              <Button
                onClick={handleSearch}
                variant="contained"
                color="primary"
                className="ml-4"
                sx={{ borderRadius: "50px", paddingX: 3 }} // جعل الـ Button دائري
              >
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* عرض حالة التحميل أو الأخطاء */}
        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* عرض نتائج الأبحاث */}
        {publicationsData && publicationsData.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: "16px" }} // إضافة انحناء دائري
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
