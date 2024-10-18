import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Fuse from 'fuse.js'; 

const departments = [
  { value: "all", label: "All Departments" },
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const CollaborationDiscovery = () => {
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [currentUserScholarId, setCurrentUserScholarId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDocs(collection(db, "users"));
        const currentUser = userDoc.docs.find((doc) => doc.id === user.uid);
        if (currentUser) {
          setCurrentUserScholarId(currentUser.data().scholar_id);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchRegisteredUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegisteredUsers(users);
    } catch (error) {
      console.error("Error fetching registered users: ", error);
    }
  };

  const fetchFacultyMembers = async (department) => {
    try {
      let facultyRef;
      if (department === "all") {
        facultyRef = collection(db, `colleges/faculty_computing/departments/dept_cs/faculty_members`);
      } else {
        facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
      }

      const facultySnapshot = await getDocs(facultyRef);
      const members = facultySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((member) => member.scholar_id !== currentUserScholarId);

      setFacultyMembers(members);
      setFilteredMembers(members);
    } catch (error) {
      console.error("Error fetching faculty members: ", error);
    }
  };

  useEffect(() => {
    fetchRegisteredUsers();
    fetchFacultyMembers(selectedDepartment);
  }, [selectedDepartment, currentUserScholarId]);

  const fuse = new Fuse(facultyMembers, {
    keys: ["name", "interests"],
    threshold: 0.3,
  });

  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    if (searchValue) {
      const fuzzyResult = fuse.search(searchValue);
      setFilteredMembers(fuzzyResult.map(result => result.item));
    } else {
      setFilteredMembers(facultyMembers);
    }
  };

  const getRegisteredUserEmail = (facultyId) => {
    const user = registeredUsers.find((user) => user.scholar_id === facultyId);
    return user ? user.email : "Not Registered";
  };

  const handleViewProfile = (scholarId) => {
    navigate(`/profile/${scholarId}`);
  };

  const handleShowMore = () => {
    setVisibleCount((prevCount) => prevCount + 5);
  };

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-6xl px-4">
          <h2 style={{ textAlign: "center", marginBottom: "60px", fontSize: "1.5rem" }}>
            Collaboration Discovery
          </h2>

          <Grid container spacing={2} justifyContent="center" alignItems="center" mb={4}>
            <Grid item xs={12} sm={8}>
              <TextField
                variant="outlined"
                fullWidth
                label="Search by name or research interests"
                size="small"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  style: { borderRadius: "25px", padding: "6px 10px" },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  variant="outlined"
                  size="small"
                  label="Department"
                  fullWidth
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ marginTop: 5, boxShadow: 3 }}>
            <Table sx={{ minWidth: 650 }} aria-label="faculty table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Affiliation</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell style={{ paddingRight: "20px" }}>Research Interests</TableCell>
                  <TableCell style={{ paddingLeft: "30px" }}>Profile</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.slice(0, visibleCount).map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.name || "Unknown"}</TableCell>
                    <TableCell>{member.affiliation || "Not provided"}</TableCell>
                    <TableCell>{getRegisteredUserEmail(member.id)}</TableCell>
                    <TableCell>{member.interests ? member.interests.join(", ") : "Not provided"}</TableCell>
                    <TableCell>
                      {registeredUsers.some((user) => user.scholar_id === member.id) && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleViewProfile(member.id)}
                          sx={{
                            backgroundColor: "#007BFF",
                            color: "white",
                            borderRadius: "20px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            "&:hover": {
                              backgroundColor: "#0056b3",
                            },
                          }}
                        >
                          View Profile
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredMembers.length > visibleCount && (
            <div className="mt-4 text-center">
              <Button
                variant="outlined"
                color="primary"
                onClick={handleShowMore}
                sx={{
                  borderRadius: "20px",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  color: "White",
                  backgroundColor: "#007BFF",
                  "&:hover": {
                    backgroundColor: "#0056b3",
                  },
                }}
              >
                Show More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationDiscovery;
