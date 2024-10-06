import React, { useState } from "react";
import { collection, doc, getDocs, getDoc } from "firebase/firestore"; 
import { db } from "../../firebaseConfig"; 
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
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

function SearchTable() {
  const [scholarId, setScholarId] = useState(""); 
  const [researcherData, setResearcherData] = useState(null);
  const [publicationsData, setPublicationsData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResearcherData = async (scholarId) => {
    setLoading(true);
    setError("");
    try {
      const researcherDocRef = doc(
        db,
        `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}`
      );

      const researcherDoc = await getDoc(researcherDocRef);

      if (researcherDoc.exists()) {
        setResearcherData(researcherDoc.data());

        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}/publications`
        );
        const querySnapshot = await getDocs(publicationsRef);

        if (!querySnapshot.empty) {
          const publications = querySnapshot.docs.map((doc) => doc.data());
          setPublicationsData(publications);
        } else {
          setPublicationsData([]);
          setError("No publications found for this researcher.");
        }
      } else {
        setResearcherData(null);
        setPublicationsData([]);
        setError("No data found for this researcher.");
      }
    } catch (err) {
      setError("Error fetching data: " + err.message);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (scholarId) {
      fetchResearcherData(scholarId);
    } else {
      setError("Please enter a valid Scholar ID.");
    }
  };

  const getFieldName = (field) => {
    const fieldNames = {
      title: "Title",
      pub_year: "Publication Year",
      publisher: "Publisher",
      num_citations: "Number of Citations",
      name: "Researcher Name",
    };
    return fieldNames[field] || field.replace(/_/g, " ").toUpperCase();
  };

  const renderValue = (value) => {
    if (typeof value === "object" && value !== null) {
      return <pre>{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span>{value}</span>;
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
          <TableCell>{publication.name || "Unknown Researcher"}</TableCell>
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
                    !["title", "pub_year", "publisher", "num_citations", "name"].includes(
                      field
                    ) && (
                      <Typography key={field} variant="body2">
                        <strong>{getFieldName(field)}:</strong>{" "}
                        {renderValue(publication[field])}
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Fetch Researcher Data and Publications
        </h1>

        <div className="flex items-center justify-center mb-6">
          <input
            type="text"
            placeholder="Enter Scholar ID"
            value={scholarId}
            onChange={(e) => setScholarId(e.target.value)}
            className="border border-gray-300 rounded-full px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="ml-4 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-center text-gray-500">Loading...</p>}

        {error && <p className="text-center text-red-500">{error}</p>}

        {publicationsData && publicationsData.length > 0 && (
          <TableContainer component={Paper}>
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
