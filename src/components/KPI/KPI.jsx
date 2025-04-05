import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { MdOutlinePeopleAlt, MdArrowDropDown, MdInfoOutline, MdPersonSearch, MdDateRange } from "react-icons/md";
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaQuoteRight } from "react-icons/fa";
import { 
  Card, 
  Typography, 
  Box, 
  LinearProgress, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Popover,
  Paper,
  Divider
} from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const DEPARTMENT_NAMES = {
  "dept_cs": "Computer Science",
  "dept_it": "Information Technology",
  "dept_se": "Software Engineering",
  "dept_sn": "Network Systems",
  "all": "All Departments"
};

const KPI = ({ statistics, selectedDepartment = "dept_cs" }) => {
  const currentYear = new Date().getFullYear();
  const [researcherDialogOpen, setResearcherDialogOpen] = useState(false);
  const [viewingKpi, setViewingKpi] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [deptForCurrentResearchers, setDeptForCurrentResearchers] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [yearDropdownAnchorEl, setYearDropdownAnchorEl] = useState(null);
  const yearDropdownOpen = Boolean(yearDropdownAnchorEl);
  
  const availableYears = useMemo(() => {
    const years = [];
    for (let year = currentYear; year >= 2015; year--) {
      years.push(year);
    }
    return years;
  }, [currentYear]);
  
  const handleYearClick = (event) => {
    setYearDropdownAnchorEl(event.currentTarget);
  };

  const handleYearDropdownClose = () => {
    setYearDropdownAnchorEl(null);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setYearDropdownAnchorEl(null);
  };
  
  const fetchResearchers = useCallback(async () => {
    if (!selectedDepartment) return;
    
    setLoading(true);
    try {
      const basePath = "colleges/faculty_computing/departments";
      let fetchedResearchers = [];
      
      const fetchDepartmentResearchers = async (deptId) => {
        const facultyRef = collection(db, `${basePath}/${deptId}/faculty_members`);
        const facultySnapshot = await getDocs(facultyRef);
        
        const researchersPromises = facultySnapshot.docs.map(async (facultyDoc) => {
          const faculty = {
            id: facultyDoc.id,
            name: facultyDoc.data().name || "Researcher",
            department: deptId,
            departmentName: DEPARTMENT_NAMES[deptId] || deptId,
            hasPublishedThisYear: false,
            hasPublishedInSelectedYear: false,
            publications: 0,
            publicationsInSelectedYear: 0,
            citations: 0
          };
          
          const publicationsRef = collection(
            db,
            `${basePath}/${deptId}/faculty_members/${facultyDoc.id}/publications`
          );
          
          let publicationsSnapshot;
          if (selectedYear) {
            const publicationsQuery = query(
              publicationsRef, 
              where("pub_year", "==", selectedYear)
            );
            publicationsSnapshot = await getDocs(publicationsQuery);
            faculty.publicationsInSelectedYear = publicationsSnapshot.size;
            faculty.hasPublishedInSelectedYear = publicationsSnapshot.size > 0;
          } else {
            publicationsSnapshot = await getDocs(publicationsRef);
          }
          
          const allPublicationsSnapshot = await getDocs(publicationsRef);
          faculty.publications = allPublicationsSnapshot.size;
          
          let totalCitations = 0;
          allPublicationsSnapshot.forEach(doc => {
            const publication = doc.data();
            totalCitations += publication.num_citations || 0;
            
            if (publication.pub_year === currentYear) {
              faculty.hasPublishedThisYear = true;
            }
          });
          
          faculty.citations = totalCitations;
          return faculty;
        });
        
        return Promise.all(researchersPromises);
      };
      
      if (selectedDepartment === "all") {
        const departmentIds = ["dept_cs", "dept_it", "dept_se", "dept_sn"];
        const departmentPromises = departmentIds.map(deptId => fetchDepartmentResearchers(deptId));
        const results = await Promise.all(departmentPromises);
        fetchedResearchers = results.flat();
      } else {
        fetchedResearchers = await fetchDepartmentResearchers(selectedDepartment);
      }
      
      setResearchers(fetchedResearchers);
      setFilteredResearchers(fetchedResearchers);
      setDeptForCurrentResearchers(selectedDepartment);
    } catch (error) {
      console.error("Error fetching researchers:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedYear, currentYear]);
  
  // Memoized KPI calculations to improve performance
  const kpiCalculations = useMemo(() => {
    // KPI-I-13: % Faculty Published
    const calculateKPI13 = () => {
      if (!researchers || researchers.length === 0) return 0;
      
      const researchersWithPublications = researchers.filter(
        r => r.hasPublishedInSelectedYear
      ).length;
      
      return Math.min((researchersWithPublications / researchers.length) * 100, 100);
    };
    
    // KPI-I-14: Avg Publications/Faculty
    const calculateKPI14 = () => {
      if (!researchers || researchers.length === 0) return 0;
      return researchers.length > 0 ? 
        researchers.reduce((sum, r) => sum + r.publicationsInSelectedYear, 0) / researchers.length : 0;
    };
    
    // KPI-I-15: Avg Citations/Publications
    const calculateKPI15 = () => {
      if (!researchers || researchers.length === 0) return 0;
      
      const totalPublications = researchers.reduce((sum, r) => sum + r.publications, 0);
      const totalCitations = researchers.reduce((sum, r) => sum + r.citations, 0);
      
      return totalPublications > 0 ? totalCitations / totalPublications : 0;
    };
    
    const totalPublications = researchers.reduce((sum, r) => sum + r.publicationsInSelectedYear, 0);
    
    const totalCitations = researchers.reduce((sum, r) => sum + r.citations, 0);
    
    const researchersWithPublicationsCount = researchers.filter(r => r.hasPublishedInSelectedYear).length;
    
    return {
      kpi13: calculateKPI13(),
      kpi14: calculateKPI14(),
      kpi15: calculateKPI15(),
      totalPublications,
      totalCitations,
      researchersWithPublicationsCount,
      researcherCount: researchers.length
    };
  }, [researchers]);
  
  useEffect(() => {
    const filtered = researchers.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredResearchers(filtered);
  }, [researchers, searchQuery]);
  
  useEffect(() => {
    if (researcherDialogOpen) {
      if (deptForCurrentResearchers !== selectedDepartment) {
        setResearchers([]);
        setFilteredResearchers([]);
        fetchResearchers();
      }
    }
  }, [researcherDialogOpen, selectedDepartment, deptForCurrentResearchers, fetchResearchers]);
  
  useEffect(() => {
    if (deptForCurrentResearchers && deptForCurrentResearchers !== selectedDepartment) {
      if (researcherDialogOpen) {
        setResearcherDialogOpen(false);
      }
      setResearchers([]);
      setFilteredResearchers([]);
    }
  }, [selectedDepartment, deptForCurrentResearchers, researcherDialogOpen]);
  
  useEffect(() => {
    fetchResearchers();
  }, [selectedYear, fetchResearchers]);

  const openResearcherDialog = (kpiId) => {
    setViewingKpi(kpiId);
    setResearcherDialogOpen(true);
  };

  const closeResearcherDialog = () => {
    setResearcherDialogOpen(false);
    setSearchQuery('');
  };

  const kpiData = useMemo(() => [
    {
      id: "KPI-I-13",
      name: "% Faculty Published",
      icon: MdOutlinePeopleAlt,
      value: kpiCalculations.kpi13,
      format: (value) => `${value.toFixed(1)}%`,
      color: "#6366F1",
      detail: `${kpiCalculations.researchersWithPublicationsCount} of ${kpiCalculations.researcherCount} faculty`,
      showResearchers: true,
      researcherFilter: "published",
      description: `Percentage of faculty members who published at least one paper in ${selectedYear}`
    },
    {
      id: "KPI-I-14",
      name: "Avg Publications/Faculty",
      icon: LuFileSpreadsheet,
      value: kpiCalculations.kpi14,
      format: (value) => value.toFixed(1),
      color: "rgb(77, 167, 208)",
      detail: `${kpiCalculations.totalPublications} total publications`,
      showResearchers: true,
      researcherFilter: "all",
      description: `Average number of publications per faculty member in ${selectedYear}`
    },
    {
      id: "KPI-I-15",
      name: "Avg Citations/Publications",
      icon: FaQuoteRight,
      value: kpiCalculations.kpi15,
      format: (value) => value.toFixed(1),
      color: "#F59E0B",
      detail: `${kpiCalculations.totalCitations} total citations`,
      showResearchers: false,
      description: `Average number of citations per publication in ${selectedYear}`
    }
  ], [kpiCalculations, selectedYear]);

  const getFilteredResearchersCount = () => {
    if (viewingKpi === "KPI-I-13") {
      return filteredResearchers.filter(r => 
        r.hasPublishedInSelectedYear && 
        (r.department === selectedDepartment || selectedDepartment === 'all')
      ).length;
    } else {
      return filteredResearchers.filter(r => 
        r.department === selectedDepartment || selectedDepartment === 'all'
      ).length;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5" className="text-gray-800 font-bold">
          Research Performance Metrics
        </Typography>
        
        <Chip
          icon={<MdDateRange size={18} />}
          label={`Year: ${selectedYear}`}
          color="secondary"
          onClick={handleYearClick}
          sx={{ 
            padding: '4px 8px',
            height: 'auto',
            cursor: 'pointer',
            backgroundColor: '#6366F1 ',
            '&:hover': { opacity: 0.9 },
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
      </div>
      
      <Divider className="mb-5" />
    
      <Popover
        open={yearDropdownOpen}
        anchorEl={yearDropdownAnchorEl}
        onClose={handleYearDropdownClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            width: '90px',
            maxHeight: '300px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }
        }}
      >
        <Paper>
          {availableYears.map(year => (
            <div 
              key={year}
              className="py-2 px-4 cursor-pointer hover:bg-gray-100"
              style={{ 
                backgroundColor: year === selectedYear ? '#f0f0f0' : 'white',
                borderLeft: year === selectedYear ? '3px solid #6366F1 ' : 'none'
              }}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </div>
          ))}
        </Paper>
      </Popover>

      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-300">
              <Box sx={{ p: 3 }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div 
                      className="rounded-md p-2 mr-3 text-white flex items-center justify-center"
                      style={{ backgroundColor: kpi.color }}
                    >
                      <kpi.icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Typography variant="h6" className="text-gray-800 font-medium">
                          {kpi.name}
                        </Typography>
                        <Tooltip title={kpi.description} arrow>
                          <IconButton size="small">
                            <MdInfoOutline size={16} className="text-gray-400" />
                          </IconButton>
                        </Tooltip>
                      </div>
                      <Typography variant="caption" className="text-gray-500">
                        {kpi.id}
                      </Typography>
                    </div>
                  </div>
                  
                  {kpi.showResearchers && (
                    <Tooltip title="View Researchers" arrow>
                      <IconButton 
                        size="small" 
                        onClick={() => openResearcherDialog(kpi.id)}
                        sx={{ 
                          color: kpi.color,
                          backgroundColor: `${kpi.color}10`,
                          '&:hover': {
                            backgroundColor: `${kpi.color}20`,
                          }
                        }}
                      >
                        <MdPersonSearch size={18} />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
                
                <Typography 
                  variant="h4" 
                  className="font-bold mb-2"
                  style={{ color: kpi.color }}
                >
                  {kpi.format(kpi.value)}
                </Typography>
                
                <LinearProgress 
                  variant="determinate"
                  value={Math.min(kpi.value, 100)}
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    mb: 2,
                    backgroundColor: `${kpi.color}20`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: kpi.color
                    }
                  }}
                />
                
                <div className="flex justify-between items-center">
                  <Typography variant="body2" className="text-gray-600 text-sm">
                    {kpi.detail}
                  </Typography>
                  
                  {kpi.showResearchers && (
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => openResearcherDialog(kpi.id)}
                      endIcon={<MdArrowDropDown />}
                      sx={{ color: kpi.color, textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      View Researchers
                    </Button>
                  )}
                </div>
              </Box>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Dialog 
        open={researcherDialogOpen} 
        onClose={closeResearcherDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <div className="flex flex-col">
            <div className="flex flex-wrap justify-between items-center mb-2">
              <Typography variant="h6" className="mr-2">
                Faculty with Publications
              </Typography>
              
              <div className="flex flex-wrap items-center">
                <Chip 
                  label={`Dept: ${DEPARTMENT_NAMES[selectedDepartment] || selectedDepartment}`}
                  size="small"
                  color="primary"
                  sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                />
                
                <Chip
                  label={`Year: ${selectedYear}`}
                  size="small"
                  color="secondary"
                  onClick={handleYearClick}
                  sx={{ 
                    mr: 1, 
                    mb: { xs: 1, sm: 0 }, 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.9 },
                    bgcolor: '#6366F1 ' 
                  }}
                />
                
                <Chip 
                  label={`${getFilteredResearchersCount()} researchers`}
                  size="small"
                  variant="outlined"
                  sx={{ mb: { xs: 1, sm: 0 } }}
                />
              </div>
            </div>
            
            <TextField
              margin="dense"
              placeholder="Search researchers by name..."
              fullWidth
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPersonSearch />
                  </InputAdornment>
                ),
              }}
            />
          </div>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <CircularProgress size={40} />
              <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
                Loading researchers from {DEPARTMENT_NAMES[selectedDepartment] || selectedDepartment}...
              </Typography>
            </div>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {(viewingKpi === "KPI-I-13" ? 
                filteredResearchers.filter(r => r.hasPublishedInSelectedYear && (r.department === selectedDepartment || selectedDepartment === 'all')) : 
                filteredResearchers.filter(r => r.department === selectedDepartment || selectedDepartment === 'all')
              ).map((researcher) => (
                <ListItem
                  key={researcher.id}
                  alignItems="flex-start"
                  sx={{ 
                    borderBottom: '1px solid #f0f0f0',
                    '&:hover': { backgroundColor: '#f9f9f9' }
                  }}
                  secondaryAction={
                    <div className="flex flex-col items-end">
                      {viewingKpi === "KPI-I-13" ? (
                        <Chip 
                          label={`${researcher.publicationsInSelectedYear || 0} publications in ${selectedYear}`}
                          size="small"
                          color="primary"
                          variant="filled"
                          sx={{ mb: 1, bgcolor: "rgb(77, 167, 208)" }}
                        />
                      ) : (
                        <Chip 
                          label={researcher.hasPublishedInSelectedYear ? "Published This Year" : "No Publications This Year"}
                          size="small"
                          color={researcher.hasPublishedInSelectedYear ? "primary" : "default"}
                          variant={researcher.hasPublishedInSelectedYear ? "filled" : "outlined"}
                          sx={{ mb: 1, bgcolor: researcher.hasPublishedInSelectedYear ? "rgb(77, 167, 208)" : "" }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Total Citations: {researcher.citations}
                      </Typography>
                    </div>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: researcher.hasPublishedInSelectedYear ? 'rgb(77, 167, 208)' : '#9CA3AF' }}>
                      {researcher.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={researcher.name}
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text-primary"
                        >
                          {researcher.departmentName || researcher.department}
                        </Typography>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          Total Publications: {researcher.publications}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
              
              {!loading && (viewingKpi === "KPI-I-13" ? 
                filteredResearchers.filter(r => r.hasPublishedInSelectedYear && (r.department === selectedDepartment || selectedDepartment === 'all')).length === 0 : 
                filteredResearchers.filter(r => r.department === selectedDepartment || selectedDepartment === 'all').length === 0
              ) && (
                <ListItem>
                  <ListItemText 
                    primary={viewingKpi === "KPI-I-13" ? `No faculty members published in ${selectedYear}` : "No researchers found"} 
                    secondary={searchQuery ? "Try adjusting your search criteria" : `No data available for ${DEPARTMENT_NAMES[selectedDepartment] || selectedDepartment}`} 
                  />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResearcherDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KPI;