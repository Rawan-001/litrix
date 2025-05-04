import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Fuse from 'fuse.js';
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";

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
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Avatar,
  Box,
  Skeleton,
  InputAdornment,
  alpha,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  Search,
  School,
  Business,
  Email,
  PersonAdd,
  Visibility,
  FilterList,
  GridView,
  ViewList,
  BookOutlined,
  TrendingUp,
  Groups
} from "@mui/icons-material";

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(29, 78, 216)',
      light: 'rgb(96, 128, 228)',
      dark: 'rgb(20, 54, 151)',
    },
    secondary: {
      main: 'rgb(29, 78, 216)',
      light: 'rgb(96, 128, 228)',
      dark: 'rgb(20, 54, 151)',
    },
    background: {
      paper: '#fff',
    },
    text: {
      primary: '#000',
      secondary: '#555',
    },
  },
});

const ModernSearchBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 8px 32px rgba(77, 167, 208, 0.1)',
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 8px 32px rgba(77, 167, 208, 0.15)',
  },
}));

const ModernFilterPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(77, 167, 208, 0.1)",
  backgroundColor: theme.palette.background.paper,
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 8px 32px rgba(77, 167, 208, 0.15)',
  },
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 30,
    transition: 'box-shadow 0.3s',
    '&:hover': {
      boxShadow: `0 4px 12px rgba(${theme.palette.primary.main}, 0.15)`,
    },
    '&.Mui-focused': {
      boxShadow: `0 4px 12px rgba(${theme.palette.primary.main}, 0.2)`,
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: `rgba(${theme.palette.primary.main}, 0.2)`,
  },
}));

const ModernSelect = styled(Select)(({ theme }) => ({
  borderRadius: 30,
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: `0 4px 12px rgba(${theme.palette.primary.main}, 0.15)`,
  },
  '&.Mui-focused': {
    boxShadow: `0 4px 12px rgba(${theme.palette.primary.main}, 0.2)`,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: `rgba(${theme.palette.primary.main}, 0.2)`,
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 30,
  padding: '8px 16px',
  boxShadow: variant => variant === 'contained' ? `0 4px 14px rgba(${theme.palette.primary.main}, 0.3)` : 'none',
  transition: 'transform 0.3s, box-shadow 0.3s',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: variant => variant === 'contained' ? `0 6px 16px rgba(${theme.palette.primary.main}, 0.4)` : 'none',
  },
}));

const ModernChip = styled(Chip)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 12px rgba(77, 167, 208, 0.1)',
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 15px rgba(77, 167, 208, 0.2)',
  }
}));

const ModernResearcherCard = styled(Card)(({ theme }) => ({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  transition: "transform 0.3s, box-shadow 0.3s",
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: "0 12px 30px rgba(77, 167, 208, 0.15)",
  }
}));

const ModernAvatar = styled(Avatar)(({ theme }) => ({
  border: '3px solid white',
  boxShadow: '0 8px 20px rgba(77, 167, 208, 0.2)',
}));

const ModernTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  overflow: 'auto',
  maxWidth: '100%',
  '& .MuiTableHead-root': {
    background: `linear-gradient(135deg, rgba(${theme.palette.primary.main}, 0.08) 0%, rgba(${theme.palette.primary.main}, 0.03) 100%)`,
  },
  '& .MuiTableRow-root:nth-of-type(even)': {
    backgroundColor: alpha(theme.palette.primary.light, 0.03),
  },
}));

const departments = [
  { value: "all", label: "All Departments" },
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const commonInterests = [
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "IoT",
  "Blockchain",
  "Software Engineering",
  "Human-Computer Interaction"
];

const CollaborationDiscovery = () => {
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cachedMembers, setCachedMembers] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        setCurrentUserId(user.uid);
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
    setLoading(true);
    
    try {
      if (cachedMembers[department]) {
        setFacultyMembers(cachedMembers[department]);
        setFilteredMembers(cachedMembers[department]);
        setLoading(false);
        return;
      }
      
      let members = [];
      
      if (department === "all") {
        const allDepartments = departments.filter(d => d.value !== "all");
        const queries = allDepartments.map(dept => 
          getDocs(collection(db, `colleges/faculty_computing/departments/${dept.value}/faculty_members`))
        );
        
        const results = await Promise.all(queries);
        
        results.forEach((snapshot, index) => {
          const deptMembers = snapshot.docs.map(doc => ({
            id: doc.id,
            department: allDepartments[index].value,
            departmentName: allDepartments[index].label,
            ...doc.data(),
          }));
          members = [...members, ...deptMembers];
        });
      } else {
        const facultyRef = collection(db, `colleges/faculty_computing/departments/${department}/faculty_members`);
        const facultySnapshot = await getDocs(facultyRef);
        
        members = facultySnapshot.docs.map(doc => ({
          id: doc.id,
          department: department,
          departmentName: departments.find(d => d.value === department)?.label || department,
          ...doc.data(),
        }));
      }
      
      members = members.filter(member => member.id !== currentUserId);
      
      setCachedMembers(prev => ({
        ...prev,
        [department]: members
      }));
      
      setFacultyMembers(members);
      setFilteredMembers(members);
      setHasMore(members.length > rowsPerPage);
    } catch (error) {
      console.error("Error fetching faculty members: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredUsers();
    if (currentUserId) {
      fetchFacultyMembers(selectedDepartment);
    }
  }, [selectedDepartment, currentUserId]);

  const fuse = useMemo(() => new Fuse(facultyMembers, {
    keys: ["name", "interests", "affiliation"],
    threshold: 0.3,
    ignoreLocation: true,
    findAllMatches: true,
  }), [facultyMembers]);

  const handleSearch = (event) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);
    applyFilters(searchValue, selectedInterests);
  };
  
  const applyFilters = (search = searchTerm, interests = selectedInterests) => {
    let results = [...facultyMembers];
    
    if (search) {
      const fuzzyResults = fuse.search(search);
      results = fuzzyResults.map(result => result.item);
    }
    
    if (interests.length > 0) {
      results = results.filter(member => {
        if (!member.interests) return false;
        return interests.some(interest => 
          member.interests.some(memberInterest => 
            memberInterest.toLowerCase().includes(interest.toLowerCase())
          )
        );
      });
    }
    
    setFilteredMembers(results);
    setPage(0);
    setHasMore(results.length > rowsPerPage);
  };

  const handleInterestToggle = (interest) => {
    const currentIndex = selectedInterests.indexOf(interest);
    const newInterests = [...selectedInterests];
    
    if (currentIndex === -1) {
      newInterests.push(interest);
    } else {
      newInterests.splice(currentIndex, 1);
    }
    
    setSelectedInterests(newInterests);
    applyFilters(searchTerm, newInterests);
  };

  const getRegisteredUserEmail = (facultyId) => {
    const user = registeredUsers.find((user) => user.scholar_id === facultyId);
    return user ? user.email : "Not Registered";
  };

  const handleViewProfile = (scholarId) => {
    navigate(`/profile/${scholarId}`);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const isResearcherRegistered = (scholarId) => {
    return registeredUsers.some((user) => user.scholar_id === scholarId);
  };

  const visibleMembers = useMemo(() => {
    const startIndex = 0;
    const endIndex = (page + 1) * rowsPerPage;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, page, rowsPerPage]);

  const renderResearcherCard = (member) => {
    const isRegistered = isResearcherRegistered(member.id);
    
    return (
      <ModernResearcherCard>
        <Box sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          backgroundImage: `linear-gradient(135deg, rgba(${theme.palette.primary.main}, 0.08) 0%, rgba(${theme.palette.primary.main}, 0.02) 100%)`,
          borderBottom: '1px solid rgba(77, 167, 208, 0.1)'
        }}>
          <ModernAvatar
            src={member.url_picture}
            alt={member.name || "Researcher"}
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
              textAlign: 'center',
              fontWeight: 'bold',
              color: theme.palette.primary.light,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {member.name || "Unknown"}
          </Typography>
          
          <Chip 
            icon={<School fontSize="small" />} 
            label={member.departmentName || "Department"} 
            size="small"
            sx={{ mt: 1.5 }}
          />
        </Box>
        
        <CardContent sx={{ 
          flexGrow: 1, 
          pt: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          height: { xs: '180px', sm: '200px' },
          overflow: 'hidden'
        }}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <Business fontSize="small" sx={{ mr: 1.5, color: theme.palette.primary.main, flexShrink: 0 }} />
              {member.affiliation || "Not provided"}
            </Typography>
            
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <Email fontSize="small" sx={{ mr: 1.5, color: theme.palette.primary.main, flexShrink: 0 }} />
              {getRegisteredUserEmail(member.id)}
            </Typography>
          </Box>
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
              color: theme.palette.primary.light
            }}
          >
            Research Interests:
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.8, 
            mb: 2,
            maxHeight: { xs: '60px', sm: '70px' },
            overflow: 'hidden'
          }}>
            {member.interests ? (
              member.interests.slice(0, 4).map((interest, index) => (
                <Chip 
                  key={index}
                  label={interest}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 },
                    borderRadius: 20,
                    boxShadow: '0 2px 8px rgba(77, 167, 208, 0.05)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(77, 167, 208, 0.12)',
                    }
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No interests provided
              </Typography>
            )}
            
            {member.interests && member.interests.length > 4 && (
              <Chip 
                label={`+${member.interests.length - 4} more`}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  borderRadius: 20,
                  bgcolor: 'rgba(77, 167, 208, 0.1)',
                  boxShadow: '0 2px 8px rgba(77, 167, 208, 0.05)',
                }}
              />
            )}
          </Box>
          
          <Box sx={{ 
            mt: 'auto',
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 1.5 }
          }}>
            {member.publications_count !== undefined && (
              <>
                <Chip 
                  icon={<BookOutlined fontSize="small" />}
                  label={`${member.publications_count || 0} Publications`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 26, sm: 30 },
                    borderRadius: 20,
                    boxShadow: '0 2px 8px rgba(77, 167, 208, 0.05)',
                  }}
                />
                
                {member.citedby !== undefined && (
                  <Chip 
                    icon={<TrendingUp fontSize="small" />}
                    label={`${member.citedby || 0} Citations`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 26, sm: 30 },
                      borderRadius: 20,
                      boxShadow: '0 2px 8px rgba(77, 167, 208, 0.05)',
                    }}
                  />
                )}
              </>
            )}
          </Box>
        </CardContent>
        
        <CardActions sx={{ 
          padding: { xs: 2, sm: 2.5 }, 
          pt: 0,
          height: { xs: '60px', sm: '70px' }
        }}>
          {isRegistered ? (
            <ModernButton
              variant="contained"
              fullWidth
              startIcon={<Visibility sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
              onClick={() => handleViewProfile(member.id)}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: "white",
                py: 1,
                boxShadow: `0 6px 16px rgba(${theme.palette.primary.main}, 0.25)`,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: `0 8px 20px rgba(${theme.palette.primary.main}, 0.35)`,
                },
              }}
            >
              View Profile
            </ModernButton>
          ) : (
            <ModernButton
              variant="outlined"
              fullWidth
              disabled
              startIcon={<PersonAdd sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' }
              }}
            >
              Not Registered
            </ModernButton>
          )}
        </CardActions>
      </ModernResearcherCard>
    );
  };

  const renderResearcherRow = (member) => {
    const isRegistered = isResearcherRegistered(member.id);
    
    return (
      <TableRow key={member.id} hover sx={{ transition: 'background-color 0.2s' }}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={member.url_picture} 
              alt={member.name}
              sx={{ 
                mr: 1.5, 
                width: { xs: 36, sm: 44 }, 
                height: { xs: 36, sm: 44 },
                boxShadow: '0 3px 10px rgba(77, 167, 208, 0.15)',
                border: '2px solid white',
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 'medium',
                color: theme.palette.primary.light,
              }}
            >
              {member.name || "Unknown"}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            label={member.departmentName || "Not provided"}
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              borderRadius: 16,
              backgroundColor: 'rgba(77, 167, 208, 0.08)',
              boxShadow: '0 2px 8px rgba(77, 167, 208, 0.05)',
            }}
          />
        </TableCell>
        <TableCell>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              maxWidth: { sm: '150px', md: '200px' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {member.affiliation || "Not provided"}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              maxWidth: { xs: '120px', sm: '150px' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {getRegisteredUserEmail(member.id)}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {member.interests ? 
              member.interests.slice(0, 2).map((interest, index) => (
                <Chip 
                  key={index} 
                  label={interest} 
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    height: { xs: 20, sm: 24 },
                    borderRadius: 16,
                    boxShadow: '0 2px 8px rgba(77, 167, 208, 0.05)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                />
              ))
              : (
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Not provided
                </Typography>
              )}
            {member.interests && member.interests.length > 2 && (
              <Chip 
                label={`+${member.interests.length - 2}`} 
                size="small"
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  height: { xs: 20, sm: 24 },
                  borderRadius: 16,
                  backgroundColor: 'rgba(77, 167, 208, 0.08)',
                }}
              />
            )}
          </Box>
        </TableCell>
        <TableCell>
          {isRegistered ? (
            <ModernButton
              variant="contained"
              size="small"
              startIcon={<Visibility sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
              onClick={() => handleViewProfile(member.id)}
              sx={{
                bgcolor: theme.palette.primary.main, 
                color: "white",
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                py: { xs: 0.5, sm: 0.75 },
                whiteSpace: 'nowrap',
                minWidth: '100px',
                boxShadow: `0 4px 12px rgba(${theme.palette.primary.main}, 0.2)`,
              }}
            >
              View Profile
            </ModernButton>
          ) : (
            <ModernButton
              variant="outlined"
              size="small"
              disabled
              startIcon={<PersonAdd sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                py: { xs: 0.5, sm: 0.75 },
                whiteSpace: 'nowrap',
                minWidth: '100px'
              }}
            >
              Not Registered
            </ModernButton>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="h-screen flex flex-col" style={{ minHeight: '600px' }}>
        <Header title="Collaboration" />
        <div className="flex-1 overflow-y-auto" style={{ 
          minHeight: '100%',
          backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%)'
        }}>
          <Box
            sx={{ 
              width: '100%',
              minHeight: '100%', 
              height: '100%',
              overflowX: 'hidden',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 }
            }}
          >
            <ModernSearchBar sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ModernTextField
                    variant="outlined"
                    fullWidth
                    placeholder="Search by name, interests, or affiliation..."
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: theme.palette.primary.main }} />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel sx={{ color: theme.palette.primary.main }}>Department</InputLabel>
                    <ModernSelect
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      label="Department"
                      sx={{ bgcolor: theme.palette.background.paper }}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </MenuItem>
                      ))}
                    </ModernSelect>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3} md={1.5} sx={{ display: 'flex', alignItems: 'center' }}>
                  <ModernButton
                    variant={showFilters ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{ 
                      bgcolor: showFilters ? theme.palette.primary.main : "white",
                      color: showFilters ? "white" : theme.palette.primary.main,
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    }}
                  >
                    Filters
                  </ModernButton>
                </Grid>

                <Grid item xs={6} sm={3} md={1.5} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', width: '100%', borderRadius: 30, overflow: 'hidden', boxShadow: '0 4px 12px rgba(77, 167, 208, 0.15)' }}>
                    <ModernButton
                      variant={viewMode === "grid" ? "contained" : "outlined"}
                      sx={{ 
                        borderRadius: 0,
                        borderTopLeftRadius: 30, 
                        borderBottomLeftRadius: 30,
                        width: '50%',
                        bgcolor: viewMode === "grid" ? theme.palette.primary.main : "white",
                        color: viewMode === "grid" ? "white" : theme.palette.primary.main,
                        '&:hover': {
                          transform: 'none',
                        },
                      }}
                      onClick={() => setViewMode("grid")}
                      size="small"
                    >
                      <GridView fontSize="small" />
                    </ModernButton>
                    <ModernButton
                      variant={viewMode === "list" ? "contained" : "outlined"}
                      sx={{ 
                        borderRadius: 0,
                        borderTopRightRadius: 30,
                        borderBottomRightRadius: 30,
                        width: '50%',
                        bgcolor: viewMode === "list" ? theme.palette.primary.main : "white",
                        color: viewMode === "list" ? "white" : theme.palette.primary.main,
                        '&:hover': {
                          transform: 'none',
                        },
                      }}
                      onClick={() => setViewMode("list")}
                      size="small"
                    >
                      <ViewList fontSize="small" />
                    </ModernButton>
                  </Box>
                </Grid>
              </Grid>
            </ModernSearchBar>

            {showFilters && (
              <ModernFilterPanel>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                  <Groups sx={{ mr: 1.5, color: theme.palette.primary.main, fontSize: { xs: '1.2rem', sm: '1.3rem' } }} />
                  <Typography variant="h6" sx={{ fontWeight: '600', fontSize: { xs: '1rem', sm: '1.1rem' }, color: theme.palette.primary.light }}>
                    Filter by Research Interests
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 } }}>
                  {commonInterests.map((interest) => (
                    <ModernChip
                      key={interest}
                      label={interest}
                      onClick={() => handleInterestToggle(interest)}
                      color={selectedInterests.includes(interest) ? "primary" : "default"}
                      variant={selectedInterests.includes(interest) ? "filled" : "outlined"}
                      selected={selectedInterests.includes(interest)}
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        height: { xs: 32, sm: 36 },
                      }}
                    />
                  ))}
                </Box>
              </ModernFilterPanel>
            )}

            <Box sx={{ 
              minHeight: loading || filteredMembers.length === 0 ? '300px' : 'auto'
            }}>
              {loading ? (
                viewMode === "grid" ? (
                  <Grid container spacing={3}>
                    {[...Array(6)].map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Skeleton variant="rounded" height={350} animation="wave" sx={{ borderRadius: 3 }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Skeleton variant="rounded" height={70} animation="wave" sx={{ mb: 1.5, borderRadius: 2 }} />
                    <Skeleton variant="rounded" height={70} animation="wave" sx={{ mb: 1.5, borderRadius: 2 }} />
                    <Skeleton variant="rounded" height={70} animation="wave" sx={{ mb: 1.5, borderRadius: 2 }} />
                    <Skeleton variant="rounded" height={70} animation="wave" sx={{ mb: 1.5, borderRadius: 2 }} />
                    <Skeleton variant="rounded" height={70} animation="wave" sx={{ borderRadius: 2 }} />
                  </Box>
                )
              ) : filteredMembers.length === 0 ? (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: { xs: 6, sm: 8 }, 
                    px: { xs: 2, sm: 3 },
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Groups sx={{ fontSize: { xs: 70, sm: 100 }, color: theme.palette.primary.main, opacity: 0.5 }} />
                  </Box>
                  <Typography variant="h5" color={theme.palette.primary.light} gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, fontWeight: 600 }}>
                    No researchers found
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 3 }}>
                    Try changing your search criteria or removing filters
                  </Typography>
                  {selectedInterests.length > 0 && (
                    <ModernButton
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setSelectedInterests([]);
                        applyFilters(searchTerm, []);
                      }}
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                    >
                      Clear Interest Filters
                    </ModernButton>
                  )}
                </Box>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <Box>
                      <Grid 
                        container 
                        spacing={3}
                        alignItems="stretch"
                      >
                        {visibleMembers.map((member) => (
                          <Grid 
                            item 
                            xs={12} 
                            sm={6} 
                            md={4} 
                            key={member.id}
                            sx={{ 
                              display: 'flex',
                              height: '100%'
                            }}
                          >
                            {renderResearcherCard(member)}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ) : (
                    <ModernTableContainer component={Paper}>
                      <Table aria-label="faculty table" size="small" sx={{ tableLayout: 'fixed', minWidth: '800px' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem', 
                              width: '18%',
                              color: theme.palette.primary.light,
                              borderBottom: '2px solid rgba(77, 167, 208, 0.2)',
                            }}>
                              Researcher
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem', 
                              width: '14%',
                              color: theme.palette.primary.light,
                              borderBottom: '2px solid rgba(77, 167, 208, 0.2)',
                            }}>
                              Department
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem', 
                              width: '18%',
                              color: theme.palette.primary.light,
                              borderBottom: '2px solid rgba(77, 167, 208, 0.2)',
                            }}>
                              Affiliation
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem', 
                              width: '20%',
                              color: theme.palette.primary.light,
                              borderBottom: '2px solid rgba(77, 167, 208, 0.2)',
                            }}>
                              Email
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem', 
                              width: '18%',
                              color: theme.palette.primary.light,
                              borderBottom: '2px solid rgba(77, 167, 208, 0.2)',
                            }}>
                              Research Interests
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem', 
                              width: '12%',
                              color: theme.palette.primary.light,
                              borderBottom: '2px solid rgba(77, 167, 208, 0.2)',
                            }}>
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {visibleMembers.map((member) => renderResearcherRow(member))}
                        </TableBody>
                      </Table>
                    </ModernTableContainer>
                  )}

                  {hasMore && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: { xs: 4, sm: 5 }
                    }}>
                      <ModernButton
                        variant="contained"
                        color="primary"
                        onClick={handleLoadMore}
                        startIcon={<Groups />}
                        sx={{
                          px: { xs: 4, sm: 5 },
                          py: { xs: 1, sm: 1.25 },
                          boxShadow: `0 6px 20px rgba(${theme.palette.primary.main}, 0.2)`,
                          backgroundColor: theme.palette.primary.main,
                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        }}
                      >
                        Load More Researchers
                      </ModernButton>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default CollaborationDiscovery;