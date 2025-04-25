import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, collectionGroup } from 'firebase/firestore';
import { GridLoader } from 'react-spinners';
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
  Avatar, 
  Card, 
  CardContent, 
  Grid, 
  Link,
  Chip,
  Button,
  Stack,
  Divider,
  alpha,
  createTheme,
  ThemeProvider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Skeleton
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { 
  KeyboardArrowDown, 
  KeyboardArrowUp, 
  ArrowUpward, 
  ArrowDownward,
  School,
  Email,
  Business,
  LocationOn,
  BookOutlined, 
  Subject,
  MenuBook,
  Groups,
  Bookmark,
  FileCopy,
  Link as LinkIcon,
  Language,
  LocalOffer,
  Info,
  ArticleOutlined,
  FormatQuote,
  VisibilityOutlined,
  Add,
  ContentCopy,
  SchoolOutlined,
  BusinessOutlined
} from "@mui/icons-material";
// استيراد الهيدر من المسار المطلوب
import Header from '../components/common/Header';

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
  },
});

const PublicationCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  borderRadius: 8,
  transition: 'box-shadow 0.3s',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }
}));

const PublicationChip = styled(Chip)(({ theme, clickable }) => ({
  margin: theme.spacing(0.5),
  fontSize: '0.75rem',
  height: 24,
  cursor: clickable ? 'pointer' : 'default',
  '&:hover': clickable ? {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderColor: theme.palette.primary.main,
  } : {}
}));

const MetricsCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.light, 0.06),
  padding: theme.spacing(1.5),
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxShadow: 'none',
  borderRadius: 8
}));

const CollaboratorBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  transition: 'background-color 0.2s',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
  }
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  overflow: 'hidden',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  paddingBottom: theme.spacing(1),
}));

const LoadMoreButton = styled(Button)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  backgroundColor: alpha(theme.palette.primary.light, 0.1),
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.light, 0.2),
  },
}));

const ResearcherProfilePage = () => {
  const { scholar_id } = useParams(); 
  const navigate = useNavigate();
  const [researcherData, setResearcherData] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [publications, setPublications] = useState([]);
  const [coauthors, setCoauthors] = useState([]);
  const [allResearchers, setAllResearchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [sortOption, setSortOption] = useState({ field: "citations", order: "desc" }); 
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [displayedCoauthorsCount, setDisplayedCoauthorsCount] = useState(5);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    setDataFetched(false);
    const fetchResearcherData = async () => {
      if (!scholar_id) {
        console.error('Scholar ID not found in URL');
        setLoading(false);
        return;
      }
      try {
        console.log('Fetching data for scholar_id:', scholar_id);
        let userData = null;
        let collegeId = "faculty_computing";  // قيمة افتراضية
        let departmentId = "dept_cs";         // قيمة افتراضية
        const academicAdminQuerySnapshot = await getDocs(collection(db, 'academicAdmins'));
        for (const adminDoc of academicAdminQuerySnapshot.docs) {
          const admin = adminDoc.data();
          if ((admin.scholar_id === scholar_id) || (admin.scholarId === scholar_id)) {
            console.log('Found academic admin with matching scholar_id:', admin);
            userData = { 
              ...admin, 
              id: adminDoc.id,
              scholar_id: admin.scholar_id || admin.scholarId || scholar_id,
              college: admin.college || collegeId,
              department: admin.department || departmentId
            };
            collegeId = userData.college;
            departmentId = userData.department;
            break;
          }
        }
        if (!userData) {
          const userQuerySnapshot = await getDocs(collection(db, 'users'));
          for (const userDoc of userQuerySnapshot.docs) {
            const user = userDoc.data();
            if (user.scholar_id === scholar_id) {
              console.log('Found user with matching scholar_id:', user);
              userData = { ...user, id: userDoc.id };
              if (user.college) collegeId = user.college;
              if (user.department) departmentId = user.department;
              break;
            }
          }
        }
        if (userData) {
          setUserData(userData);
        }
        console.log(`Looking for researcher data at: colleges/${collegeId}/departments/${departmentId}/faculty_members/${scholar_id}`);
        const researcherRef = doc(db, `colleges/${collegeId}/departments/${departmentId}/faculty_members/${scholar_id}`);
        const researcherDoc = await getDoc(researcherRef);
        if (researcherDoc.exists()) {
          console.log('Found researcher document data');
          const researcherData = researcherDoc.data();
          setResearcherData(researcherData);
          const publicationsRef = collection(db, `colleges/${collegeId}/departments/${departmentId}/faculty_members/${scholar_id}/publications`);
          console.log(`Fetching publications from: ${publicationsRef.path}`);
          const publicationsSnapshot = await getDocs(publicationsRef);
          const publicationsData = publicationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            authors: doc.data().authors || researcherData.name || ''
          }));
          console.log(`Found ${publicationsData.length} publications`);
          setPublications(publicationsData);
          if (researcherData.coauthors) {
            setCoauthors(researcherData.coauthors);
          }
        } else {
          console.log('Researcher document not found. Searching in all colleges/departments...');
          let researcherDoc = null;
          let publicationsData = [];
          let researcherDataFetched = null;
          const collegesSnapshot = await getDocs(collection(db, 'colleges'));
          for (const collegeDoc of collegesSnapshot.docs) {
            if (!isMounted.current) return;
            const currCollegeId = collegeDoc.id;
            const departmentsSnapshot = await getDocs(collection(db, `colleges/${currCollegeId}/departments`));
            for (const departmentDoc of departmentsSnapshot.docs) {
              if (!isMounted.current) return;
              const currDepartmentId = departmentDoc.id;
              const alternateResearcherRef = doc(db, `colleges/${currCollegeId}/departments/${currDepartmentId}/faculty_members/${scholar_id}`);
              console.log(`Checking alternate path: ${alternateResearcherRef.path}`);
              const docSnap = await getDoc(alternateResearcherRef);
              if (docSnap.exists()) {
                console.log(`Found researcher data at alternate path: ${alternateResearcherRef.path}`);
                researcherDoc = docSnap;
                researcherDataFetched = docSnap.data();
                const publicationsRef = collection(db, `colleges/${currCollegeId}/departments/${currDepartmentId}/faculty_members/${scholar_id}/publications`);
                const publicationsSnapshot = await getDocs(publicationsRef);
                publicationsData = publicationsSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  authors: doc.data().authors || researcherDataFetched.name || ''
                }));
                break;
              }
            }
            if (researcherDoc) break;
          }
          if (!isMounted.current) return;
          if (researcherDoc && researcherDataFetched) {
            setResearcherData(researcherDataFetched);
            setPublications(publicationsData);
            if (researcherDataFetched.coauthors) {
              setCoauthors(researcherDataFetched.coauthors);
            }
          } else {
            console.error('Researcher data not found in any college/department');
          }
        }
        const facultyRef = collectionGroup(db, "faculty_members");
        const facultySnapshot = await getDocs(facultyRef);
        const allResearchersData = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          department: doc.ref.parent.parent.id,
          ...doc.data(),
        }));
        if (!isMounted.current) return;
        setAllResearchers(allResearchersData);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching researcher data:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    fetchResearcherData();
    return () => {
      isMounted.current = false;
    };
  }, [scholar_id]);

  const sortPublications = () => {
    return publications.sort((a, b) => {
      if (sortOption.field === "citations") {
        return sortOption.order === "asc"
          ? (a.num_citations || 0) - (b.num_citations || 0)
          : (b.num_citations || 0) - (a.num_citations || 0);
      } else if (sortOption.field === "year") {
        return sortOption.order === "asc"
          ? (a.pub_year || 0) - (b.pub_year || 0)
          : (b.pub_year || 0) - (a.pub_year || 0);
      }
      return 0;
    });
  };

  const handleSort = (field) => {
    if (sortOption.field === field) {
      setSortOption((prev) => ({
        field,
        order: prev.order === "asc" ? "desc" : "asc",
      }));
    } else {
      setSortOption({ field, order: "desc" });
    }
  };

  const toggleAbstract = (pubId) => {
    setExpandedAbstracts(prev => ({
      ...prev,
      [pubId]: !prev[pubId]
    }));
  };

  const toggleExpandRow = (pubId) => {
    setExpandedRows(prev => ({
      ...prev,
      [pubId]: !prev[pubId]
    }));
  };

  const findScholarIdByName = async (name) => {
    if (!name) return null;
    const cleanName = name.trim().replace(/[.*()[\]{}]/g, '').toLowerCase();
    if (coauthors.length > 0) {
      const coauthorMatch = coauthors.find(co => 
        co.name && co.name.toLowerCase().includes(cleanName) || cleanName.includes(co.name.toLowerCase())
      );
      if (coauthorMatch?.scholar_id) return coauthorMatch.scholar_id;
    }
    if (allResearchers.length > 0) {
      const researcherMatch = allResearchers.find(r => 
        r.name && r.name.toLowerCase().includes(cleanName) || cleanName.includes(r.name.toLowerCase())
      );
      if (researcherMatch?.scholar_id) return researcherMatch.scholar_id;
    }
    try {
      const userQuerySnapshot = await getDocs(collection(db, 'users'));
      const foundUser = userQuerySnapshot.docs
        .map(doc => doc.data())
        .find(user => {
          const fullName = (user.firstName + ' ' + user.lastName).toLowerCase();
          return fullName.includes(cleanName) || cleanName.includes(fullName);
        });
      if (foundUser?.scholar_id) return foundUser.scholar_id;
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      for (const collegeDoc of collegesSnapshot.docs) {
        const collegeId = collegeDoc.id;
        const departmentsSnapshot = await getDocs(collection(db, `colleges/${collegeId}/departments`));
        for (const departmentDoc of departmentsSnapshot.docs) {
          const departmentId = departmentDoc.id;
          const facultySnapshot = await getDocs(
            collection(db, `colleges/${collegeId}/departments/${departmentId}/faculty_members`)
          );
          const foundFaculty = facultySnapshot.docs.find(doc => {
            const faculty = doc.data();
            return faculty.name && (
              faculty.name.toLowerCase().includes(cleanName) || 
              cleanName.includes(faculty.name.toLowerCase())
            );
          });
          if (foundFaculty) return foundFaculty.id;
        }
      }
      return null;
    } catch (error) {
      console.error("Error searching for scholar:", error);
      return null;
    }
  };

  const handleAuthorClick = async (authorName) => {
    if (!authorName) return;
    if (researcherData?.name && 
        (researcherData.name.toLowerCase().includes(authorName.toLowerCase()) || 
         authorName.toLowerCase().includes(researcherData.name.toLowerCase()))) {
      navigate(`/profile/${scholar_id}`);
      return;
    }
    setLoading(true);
    const foundScholarId = await findScholarIdByName(authorName);
    if (foundScholarId) {
      console.log(`Found scholar ID for ${authorName}: ${foundScholarId}`);
      navigate(`/profile/${foundScholarId}`);
    } else {
      console.log(`No scholar ID found for ${authorName}`);
    }
    setLoading(false);
  };

  const handleCoauthorClick = (coauthor) => {
    if (coauthor && coauthor.scholar_id) {
      navigate(`/profile/${coauthor.scholar_id}`);
    } else {
      console.log(`No scholar_id found for coauthor`);
    }
  };

  const handleLoadMoreCoauthors = () => {
    setDisplayedCoauthorsCount(prevCount => 
      Math.min(prevCount + 5, coauthors.length)
    );
  };

  const openPublicationDetails = (publication) => {
    setSelectedPublication(publication);
    setDetailDialogOpen(true);
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Skeleton variant="circular" width={120} height={120} />
            <Box sx={{ width: '100%' }}>
              <Skeleton variant="text" width="60%" height={40} />
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="80%" height={25} />
                <Skeleton variant="text" width="70%" height={25} />
                <Skeleton variant="text" width="60%" height={25} />
                <Skeleton variant="text" width="65%" height={25} />
              </Box>
            </Box>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="40%" height={30} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={100} height={24} />
              <Skeleton variant="rounded" width={90} height={24} />
            </Box>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="50%" height={30} />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="rounded" width="30%" height={80} />
              <Skeleton variant="rounded" width="30%" height={80} />
              <Skeleton variant="rounded" width="30%" height={80} />
            </Box>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
              <Skeleton variant="text" width="40%" height={30} />
              <Skeleton variant="rounded" width={120} height={36} />
            </Box>
            {[1, 2, 3].map((item) => (
              <Box key={item} sx={{ mb: 3 }}>
                <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
              </Box>
            ))}
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="60%" height={30} />
            {[1, 2, 3].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box>
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="text" width={180} height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </Grid>
    </Grid>
  );

  const PublicationDetailDialog = ({ open, onClose, publication }) => {
    const [activeTab, setActiveTab] = useState(0);
    if (!publication) return null;
    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
    };
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            {publication.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {typeof publication.authors === 'string' 
              ? publication.authors 
              : Array.isArray(publication.authors) 
                ? publication.authors.join(', ')
                : "Unknown Authors"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ mb: 3, mt: 1 }}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Details" icon={<Info />} iconPosition="start" />
            <Tab label="Abstract" icon={<Subject />} iconPosition="start" />
            {publication.keywords && <Tab label="Keywords" icon={<LocalOffer />} iconPosition="start" />}
          </Tabs>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Publication Information
                </Typography>
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {publication.pub_year && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <BookOutlined color="primary" sx={{ fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        Year: {publication.pub_year}
                      </Typography>
                    </Box>
                  )}
                  {publication.journal_name && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MenuBook color="primary" sx={{ fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        Journal: {publication.journal_name}
                      </Typography>
                    </Box>
                  )}
                  {publication.num_citations !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FormatQuote color="primary" sx={{ fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        Citations: {publication.num_citations}
                      </Typography>
                    </Box>
                  )}
                  {publication.doi && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LinkIcon color="primary" sx={{ fontSize: '1.1rem' }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textDecoration: 'underline', 
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' } 
                        }}
                        onClick={() => window.open(`https://doi.org/${publication.doi}`, '_blank')}
                      >
                        DOI: {publication.doi}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Additional Information
                </Typography>
                <Stack spacing={2}>
                  {publication.publisher && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Bookmark color="primary" sx={{ fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        Publisher: {publication.publisher}
                      </Typography>
                    </Box>
                  )}
                  {publication.pub_type && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FileCopy color="primary" sx={{ fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        Type: {publication.pub_type}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                {publication.pub_url && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Language />}
                    href={publication.pub_url}
                    target="_blank"
                    rel="noopener"
                    sx={{ 
                      mt: 2,
                      borderRadius: 8,
                      textTransform: 'none'
                    }}
                  >
                    View Full Publication
                  </Button>
                )}
              </Grid>
            </Grid>
          )}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Abstract
              </Typography>
              {publication.abstract ? (
                <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
                  {publication.abstract}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No abstract available for this publication.
                </Typography>
              )}
            </Box>
          )}
          {activeTab === 2 && publication.keywords && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Keywords
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {typeof publication.keywords === 'string' ? (
                  publication.keywords.split(/[,;]/).map((keyword, idx) => (
                    <Chip
                      key={idx}
                      label={keyword.trim()}
                      size="small"
                      sx={{ 
                        fontSize: '0.75rem',
                        borderRadius: 8,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main
                      }}
                    />
                  ))
                ) : Array.isArray(publication.keywords) ? (
                  publication.keywords.map((keyword, idx) => (
                    <Chip
                      key={idx}
                      label={keyword}
                      size="small"
                      sx={{ 
                        fontSize: '0.75rem',
                        borderRadius: 8,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No keywords available.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 8 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const PublicationItem = ({ publication }) => {
    const isAbstractExpanded = expandedAbstracts[publication.id] || false;
    const isRowExpanded = expandedRows[publication.id] || false;
    const hasLongAbstract = publication.abstract && publication.abstract.length > 200;
    const fieldsToShow = Object.keys(publication).filter((field) => {
      const value = publication[field];
      return (
        value &&
        typeof value !== "function" &&
        ![
          "title",
          "pub_year",
          "num_citations",
          "authors",
          "cites_per_year",
          "cites_id",
          "id",
        ].includes(field)
      );
    });
    return (
      <PublicationCard>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ width: '100%' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 500, 
                  color: theme.palette.primary.main,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                onClick={() => openPublicationDetails(publication)}
              >
                {publication.title || "Untitled Publication"}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                {publication.authors && (
                  typeof publication.authors === 'string' ? 
                    publication.authors.split(/[,;]\s*|(?:\s+and\s+)/).filter(author => author.trim()).map((author, idx) => (
                      <PublicationChip
                        key={idx}
                        label={author.trim()}
                        size="small"
                        variant="outlined"
                        clickable={true}
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleAuthorClick(author.trim());
                        }}
                        sx={{
                          borderColor: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.dark
                          }
                        }}
                      />
                    )) :
                    Array.isArray(publication.authors) ? 
                      publication.authors.filter(author => author).map((author, idx) => (
                        <PublicationChip
                          key={idx}
                          label={author}
                          size="small"
                          variant="outlined"
                          clickable={true}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleAuthorClick(author);
                          }}
                          sx={{
                            borderColor: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.dark
                            }
                          }}
                        />
                      )) :
                      <PublicationChip
                        label={publication.authors}
                        size="small"
                        variant="outlined"
                        clickable={true}
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleAuthorClick(publication.authors);
                        }}
                        sx={{
                          borderColor: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.dark
                          }
                        }}
                      />
                )}
              </Stack>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                {publication.pub_year && (
                  <Chip
                    icon={<BookOutlined fontSize="small" />}
                    label={publication.pub_year}
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'text.primary',
                      fontSize: '0.75rem'
                    }}
                  />
                )}
                {publication.publisher && (
                  <Chip
                    icon={<Bookmark fontSize="small" />}
                    label={publication.publisher}
                    size="small"
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}
                    variant="outlined"
                  />
                )}
                {publication.journal_name && (
                  <Chip
                    icon={<MenuBook fontSize="small" />}
                    label={publication.journal_name}
                    size="small"
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}
                    variant="outlined"
                  />
                )}
                {publication.num_citations !== undefined && (
                  <Chip
                    icon={<FormatQuote fontSize="small" />}
                    label={`${publication.num_citations} Citations`}
                    size="small"
                    sx={{ 
                      color: theme.palette.primary.main,
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                    variant="outlined"
                  />
                )}
              </Box>
              {publication.abstract && (
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="primary"
                    sx={{ 
                      mb: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <Subject fontSize="small" />
                    Abstract
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    ...(hasLongAbstract && !isAbstractExpanded ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    } : {})
                  }}>
                    {publication.abstract}
                  </Typography>
                  {hasLongAbstract && (
                    <Button 
                      size="small" 
                      onClick={() => toggleAbstract(publication.id)}
                      sx={{ mt: 1, fontSize: '0.75rem' }}
                    >
                      {isAbstractExpanded ? "Show Less" : "Show More"}
                    </Button>
                  )}
                </Box>
              )}
            </Box>
            <IconButton
              aria-label="expand publication"
              size="small"
              onClick={() => toggleExpandRow(publication.id)}
              sx={{ ml: 1 }}
            >
              {isRowExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>
          <Collapse in={isRowExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {fieldsToShow.map((field) => (
                  field !== 'abstract' && (
                    <Grid item xs={12} sm={6} key={field}>
                      <Typography 
                        variant="subtitle2" 
                        color="primary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {field === 'keywords' && <LocalOffer fontSize="small" />}
                        {field === 'doi' && <LinkIcon fontSize="small" />}
                        {field === 'pub_url' && <Language fontSize="small" />}
                        {!['keywords', 'doi', 'pub_url'].includes(field) && <Info fontSize="small" />}
                        {field.replace(/_/g, " ").toUpperCase()}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {field === 'keywords' ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {typeof publication[field] === 'string' ? (
                              publication[field].split(/[,;]/).map((keyword, idx) => (
                                <Chip
                                  key={idx}
                                  label={keyword.trim()}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.primary.main
                                  }}
                                />
                              ))
                            ) : Array.isArray(publication[field]) ? (
                              publication[field].map((keyword, idx) => (
                                <Chip
                                  key={idx}
                                  label={keyword}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.primary.main
                                  }}
                                />
                              ))
                            ) : (
                              <Typography variant="body2">{publication[field]}</Typography>
                            )}
                          </Box>
                        ) : field === 'pub_url' || field === 'doi' ? (
                          <Link 
                            href={field === 'doi' ? `https://doi.org/${publication[field]}` : publication[field]} 
                            target="_blank" 
                            rel="noopener"
                            variant="body2"
                            sx={{ 
                              color: theme.palette.primary.main,
                              wordBreak: 'break-all'
                            }}
                          >
                            {publication[field]}
                          </Link>
                        ) : (
                          <Typography variant="body2">
                            {typeof publication[field] === 'object' ? 
                              JSON.stringify(publication[field]) : 
                              publication[field]}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )
                ))}
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                {publication.pub_url && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Language />}
                    href={publication.pub_url}
                    target="_blank"
                    rel="noopener"
                    sx={{ 
                      borderRadius: 8,
                      textTransform: 'none'
                    }}
                  >
                    View Publication
                  </Button>
                )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </PublicationCard>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col h-screen w-full bg-white">
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 w-full bg-white shadow-md" style={{ position: 'sticky', top: 0 }}>
          <Header title="Researcher Profile" />
        </div>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 lg:p-8">
              <div className="flex justify-center items-center mb-6">
                <GridLoader size={20} color={"#4da7d0"} />
              </div>
              <LoadingSkeleton />
            </div>
          ) : (
            <motion.div
              className="p-4 lg:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Grid container spacing={4}>
                <Grid item xs={12}> 
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <ProfileSection>
                      <Card elevation={1}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          p: { xs: 2, sm: 3 },
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'center', sm: 'flex-start' },
                          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
                        }}>
                          <Avatar
                            alt="Researcher Profile Picture"
                            src={researcherData?.url_picture || "/default-avatar.png"}
                            sx={{ 
                              width: { xs: 100, sm: 120 },
                              height: { xs: 100, sm: 120 },
                              border: '3px solid white',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                              mb: { xs: 2, sm: 0 },
                              mr: { sm: 3 }
                            }}
                          />
                          <Box>
                            <Typography 
                              variant="h5" 
                              gutterBottom
                              sx={{ 
                                color: theme.palette.primary.main,
                                fontSize: { xs: '1.3rem', sm: '1.5rem' }
                              }}
                            >
                              {userData?.firstName && userData?.lastName 
                                ? `${userData.firstName} ${userData.lastName}` 
                                : researcherData?.name || "Researcher"}
                              {/* إضافة شارة للمشرف الأكاديمي */}
                              {userData?.isAcademicAdmin && (
                                <Chip 
                                  label="Academic Admin" 
                                  size="small" 
                                  color="primary"
                                  sx={{ 
                                    ml: 1,
                                    fontSize: '0.65rem',
                                    height: 20,
                                    verticalAlign: 'middle'
                                  }}
                                />
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  <strong>Affiliation:</strong> {researcherData?.affiliation || userData?.college || "Not provided"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  <strong>Institution:</strong> {researcherData?.institution || userData?.department || "Not provided"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  <strong>Email:</strong> {userData?.email || "Not provided"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <School fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  <strong>Scholar ID:</strong> {researcherData?.scholar_id || userData?.scholar_id || "Not provided"}
                                </Typography>
                              </Box>
                              {/* إضافة معلومات خاصة بالمشرف الأكاديمي */}
                              {userData?.isAcademicAdmin && userData?.college && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <SchoolOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    <strong>College:</strong> {userData.college}
                                  </Typography>
                                </Box>
                              )}
                              {userData?.isAcademicAdmin && userData?.department && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <BusinessOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    <strong>Department:</strong> {userData.department}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ p: { xs: 2, sm: 3 } }}>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Research Interests
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 32 }}>
                            {researcherData?.interests && researcherData.interests.length > 0 ? (
                              researcherData.interests.map((interest, index) => (
                                <Chip 
                                  key={index}
                                  label={interest}
                                  size="small"
                                  sx={{ 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    borderRadius: '8px',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1, width: '100%', textAlign: 'center' }}>
                                No research interests provided
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    </ProfileSection>
                  </motion.div>
                </Grid>
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <ProfileSection>
                      <Card elevation={1}>
                        <CardContent>
                          <SectionTitle variant="subtitle1" gutterBottom fontWeight="medium">
                            <BookOutlined fontSize="small" />
                            Citation Metrics
                          </SectionTitle>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <MetricsCard>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  H-index
                                </Typography>
                                <Typography variant="h6" color={theme.palette.primary.main} fontWeight="bold">
                                  {researcherData?.hindex || "N/A"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  5 year: {researcherData?.hindex5y || "N/A"}
                                </Typography>
                              </MetricsCard>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <MetricsCard>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  i10-index
                                </Typography>
                                <Typography variant="h6" color={theme.palette.primary.main} fontWeight="bold">
                                  {researcherData?.i10index || "N/A"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  5 year: {researcherData?.i10index5y || "N/A"}
                                </Typography>
                              </MetricsCard>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <MetricsCard>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Total Citations
                                </Typography>
                                <Typography variant="h6" color={theme.palette.primary.main} fontWeight="bold">
                                  {researcherData?.citedby || "N/A"}
                                </Typography>
                              </MetricsCard>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </ProfileSection>
                  </motion.div>
                </Grid>
                {/* إضافة قسم معلومات المشرف الأكاديمي */}
                {userData?.isAcademicAdmin && (
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <ProfileSection>
                        <Card elevation={1}>
                          <CardContent>
                            <SectionTitle variant="subtitle1" gutterBottom fontWeight="medium">
                              <BusinessOutlined fontSize="small" />
                              Academic Admin Information
                            </SectionTitle>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.light, 0.06), borderRadius: 2 }}>
                                  <Typography variant="subtitle2" color="primary.main" gutterBottom>
                                    Administrative Role
                                  </Typography>
                                  <Typography variant="body2">
                                    {userData?.department 
                                      ? `Department Admin (${userData.department})`
                                      : userData?.college
                                        ? `College Admin (${userData.college})`
                                        : "Academic Administrator"}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.light, 0.06), borderRadius: 2 }}>
                                  <Typography variant="subtitle2" color="primary.main" gutterBottom>
                                    Affiliated Institution
                                  </Typography>
                                  <Typography variant="body2">
                                    {userData?.college || "Not specified"}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </ProfileSection>
                    </motion.div>
                  </Grid>
                )}
                <Grid container item xs={12} spacing={4}>
                  <Grid item xs={12} md={8}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <ProfileSection>
                        <Card elevation={1}>
                          <CardContent>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: 2
                            }}>
                              <SectionTitle variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mb: 0 }}>
                                <ArticleOutlined fontSize="small" />
                                Publications ({publications.length})
                              </SectionTitle>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>Sort by:</Typography>
                                <Box sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  overflow: 'hidden'
                                }}>
                                  <Button 
                                    size="small"
                                    onClick={() => handleSort("year")}
                                    sx={{ 
                                      px:.5,
                                      color: sortOption.field === "year" ? 'primary.main' : 'text.secondary',
                                      borderRadius: 0,
                                      fontWeight: sortOption.field === "year" ? 'bold' : 'normal',
                                      textTransform: 'none',
                                      fontSize: '0.75rem'
                                    }}
                                    endIcon={
                                      sortOption.field === "year" ? 
                                        (sortOption.order === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />) : 
                                        null
                                    }
                                  >
                                    Year
                                  </Button>
                                  <Divider orientation="vertical" flexItem />
                                  <Button 
                                    size="small"
                                    onClick={() => handleSort("citations")}
                                    sx={{ 
                                      px: 1.5,
                                      color: sortOption.field === "citations" ? 'primary.main' : 'text.secondary',
                                      borderRadius: 0,
                                      fontWeight: sortOption.field === "citations" ? 'bold' : 'normal',
                                      textTransform: 'none',
                                      fontSize: '0.75rem'
                                    }}
                                    endIcon={
                                      sortOption.field === "citations" ? 
                                        (sortOption.order === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />) : 
                                        null
                                    }
                                  >
                                    Citations
                                  </Button>
                                </Box>
                              </Box>
                            </Box>
                            {publications.length > 0 ? (
                              <Box>
                                {sortPublications().map((publication, index) => (
                                  <PublicationItem key={index} publication={publication} />
                                ))}
                              </Box>
                            ) : (
                              <Box sx={{ 
                                py: 4, 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center',
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                borderRadius: 2
                              }}>
                                <Typography variant="body1" color="text.secondary">
                                  No publications found for this researcher
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </ProfileSection>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {coauthors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <ProfileSection>
                          <Card elevation={1}>
                            <CardContent>
                              <SectionTitle variant="subtitle1" gutterBottom fontWeight="medium">
                                <Groups fontSize="small" />
                                Co-authors
                              </SectionTitle>
                              <Box>
                                {coauthors.slice(0, displayedCoauthorsCount).map((coauthor, index) => (
                                  <CollaboratorBox 
                                    key={index}
                                    onClick={() => handleCoauthorClick(coauthor)}
                                  >
                                    <Avatar
                                      alt={coauthor.name}
                                      src="/default-avatar.png"
                                      sx={{ width: 36, height: 36, mr: 1.5 }}
                                    />
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {coauthor.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {coauthor.affiliation}
                                      </Typography>
                                    </Box>
                                  </CollaboratorBox>
                                ))}
                                {displayedCoauthorsCount < coauthors.length && (
                                  <LoadMoreButton 
                                    startIcon={<Add fontSize="small" />}
                                    onClick={handleLoadMoreCoauthors}
                                  >
                                    Load More ({coauthors.length - displayedCoauthorsCount} more)
                                  </LoadMoreButton>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </ProfileSection>
                      </motion.div>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </div>
        <PublicationDetailDialog 
          open={detailDialogOpen} 
          onClose={() => setDetailDialogOpen(false)}
          publication={selectedPublication}
        />
      </div>
    </ThemeProvider>
  );
};

export default ResearcherProfilePage;