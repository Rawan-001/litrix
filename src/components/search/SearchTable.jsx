import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, collectionGroup } from "firebase/firestore";
import { GridLoader } from "react-spinners";
import { db, auth } from "../../firebaseConfig";
import Fuse from "fuse.js";

import {
  Card,
  CardContent,
  CardActions,
  Autocomplete,
  TextField,
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
  MenuItem,
  Select,
  InputAdornment,
  Button,
  Chip,
  Stack,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  alpha,
  createTheme,
  ThemeProvider,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Badge,
  Pagination,
  CircularProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArticleIcon from "@mui/icons-material/Article";
import SchoolIcon from "@mui/icons-material/School";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import LanguageIcon from "@mui/icons-material/Language";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewTimelineIcon from "@mui/icons-material/ViewTimeline";
import TableChartIcon from "@mui/icons-material/TableChart";
import SortIcon from "@mui/icons-material/Sort";
import DateRangeIcon from "@mui/icons-material/DateRange";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import LinkIcon from "@mui/icons-material/Link";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GetAppIcon from "@mui/icons-material/GetApp";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PrintIcon from "@mui/icons-material/Print";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(29, 78, 216)',
      light: 'rgb(59, 130, 246)',
      dark: 'rgb(30, 64, 175)',
    },
    secondary: {
      main: 'rgb(29, 78, 216)',
      light: 'rgb(59, 130, 246)',
      dark: 'rgb(30, 64, 175)',
    },
  },
});

const StyledResearcherCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  transition: "transform 0.3s, box-shadow 0.3s",
  overflow: "hidden",
  height: "450px", 
  width: "100%",   
  display: "flex",
  flexDirection: "column",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 30px rgba(29, 78, 216, 0.15)",
  },
}));

const ResearcherAvatar = styled(Avatar)(({ theme }) => ({
  width: { xs: 80, sm: 80, md: 80 }, 
  height: { xs: 80, sm: 80, md: 80 }, 
  marginBottom: 1,
  border: '3px solid white',
  boxShadow: '0 8px 16px rgba(29, 78, 216, 0.2)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  marginTop: theme.spacing(3),
  "& .MuiTableHead-root": {
    background: alpha(theme.palette.primary.main, 0.1),
  },
  "& .MuiTableRow-root:nth-of-type(even)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
}));

const ModernSearchBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  backgroundColor: 'white',
  boxShadow: '0 8px 32px rgba(29, 78, 216, 0.1)',
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 8px 32px rgba(29, 78, 216, 0.15)',
  },
}));

const ModernFilterPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(29, 78, 216, 0.1)",
  backgroundColor: 'white',
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 8px 32px rgba(29, 78, 216, 0.15)',
  },
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: "30px",
  fontSize: { xs: '0.7rem', sm: '0.75rem' },
  height: { xs: 30, sm: 36 },
  transition: 'all 0.2s',
  backgroundColor: props => props.selected ? "rgb(29, 78, 216)" : "white",
  boxShadow: props => props.selected ? '0 4px 12px rgba(29, 78, 216, 0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: props => props.selected ? '0 6px 14px rgba(29, 78, 216, 0.4)' : '0 6px 14px rgba(0,0,0,0.1)',
  },
  '& .MuiChip-label': {
    padding: { xs: '0 12px', sm: '0 16px' },
  },
}));

const ActiveFiltersBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  borderRadius: 12,
  border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  boxShadow: '0 4px 16px rgba(29, 78, 216, 0.05)',
}));

const PublicationGridCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  transition: "transform 0.3s, box-shadow 0.3s",
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: "0 12px 30px rgba(29, 78, 216, 0.15)",
  }
}));

const PublicationCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.light, 0.1),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const PublicationTimelineItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingLeft: theme.spacing(4),
  paddingBottom: theme.spacing(3),
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.palette.primary.light,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 4,
    top: 8,
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
  }
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 30,
    transition: 'box-shadow 0.3s',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(29, 78, 216, 0.15)',
    },
    '&.Mui-focused': {
      boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(29, 78, 216, 0.2)',
  },
}));

const ModernSelect = styled(Select)(({ theme }) => ({
  borderRadius: 30,
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.15)',
  },
  '&.Mui-focused': {
    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(29, 78, 216, 0.2)',
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 30,
  padding: '8px 16px',
  boxShadow: variant => variant === 'contained' ? '0 4px 14px rgba(29, 78, 216, 0.3)' : 'none',
  transition: 'transform 0.3s, box-shadow 0.3s',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: variant => variant === 'contained' ? '0 6px 16px rgba(29, 78, 216, 0.4)' : 'none',
  },
}));

const ModernToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0,
    border: '1px solid rgba(29, 78, 216, 0.2)',
    '&.Mui-selected': {
      backgroundColor: 'rgb(29, 78, 216)',
      color: 'white',
      boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)',
      '&:hover': {
        backgroundColor: 'rgb(30, 64, 175)',
      },
    },
    '&:not(:first-of-type)': {
      borderLeft: '1px solid rgba(29, 78, 216, 0.15)',
    },
  },
}));

const ModernToggleButton = styled(ToggleButton)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
  '&.Mui-selected:hover': {
    boxShadow: '0 6px 16px rgba(29, 78, 216, 0.4)',
  },
}));

const ModernDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  '&::before, &::after': {
    borderColor: 'rgba(29, 78, 216, 0.2)',
  },
}));

const ModernSlider = styled(Slider)(({ theme }) => ({
  color: 'rgb(29, 78, 216)',
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
    boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)',
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid rgb(29, 78, 216)',
    boxShadow: '0 3px 8px rgba(29, 78, 216, 0.3)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: '0 3px 12px rgba(29, 78, 216, 0.4)',
    },
    '&:before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: 'rgb(29, 78, 216)',
    boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
}));

const PublicationDetailDialog = ({ open, onClose, publication }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  
  if (!publication) return null;
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleCitationCopy = (format) => {
    let citation = '';
    
    switch(format) {
      case 'apa':
        citation = `${publication.authors || 'Unknown'}. (${publication.pub_year || 'n.d.'}). ${publication.title || 'Untitled'}. ${publication.journal_name || ''}.${publication.doi ? ` https://doi.org/${publication.doi}` : ''}`;
        break;
      case 'mla':
        citation = `${publication.authors || 'Unknown'}. "${publication.title || 'Untitled'}." ${publication.journal_name || ''}, ${publication.pub_year || 'n.d.'}.${publication.doi ? ` DOI: ${publication.doi}` : ''}`;
        break;
      case 'bibtex':
        citation = `@article{${publication.id || 'ref'},
  title={${publication.title || 'Untitled'}},
  author={${publication.authors || 'Unknown'}},
  journal={${publication.journal_name || ''}},
  year={${publication.pub_year || ''}},
  doi={${publication.doi || ''}}
}`;
        break;
      default:
        citation = `${publication.title || 'Untitled'} - ${publication.authors || 'Unknown'} (${publication.pub_year || 'n.d.'})`;
    }
    
    navigator.clipboard.writeText(citation)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy citation: ', err));
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
        bgcolor: alpha(theme.palette.primary.light, 0.05)
      }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
          {publication.title}
        </Typography>
        
        <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', gap: 1 }}>
          {publication.allResearchers?.map((researcher, idx) => (
            <Chip
              key={idx}
              size="small"
              label={researcher?.name || `${researcher?.firstName || ''} ${researcher?.lastName || ''}`.trim() || "Unknown"}
              sx={{ borderRadius: 20 }}
            />
          ))}
        </Box>
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
          <Tab label="Details" icon={<InfoOutlinedIcon />} iconPosition="start" />
          <Tab label="Abstract" icon={<ArticleIcon />} iconPosition="start" />
          <Tab label="Citation" icon={<ContentCopyIcon />} iconPosition="start" />
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
                    <CalendarTodayIcon color="primary" sx={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2">
                      Year: {publication.pub_year}
                    </Typography>
                  </Box>
                )}
                
                {publication.journal_name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LibraryBooksIcon color="primary" sx={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2">
                      Journal: {publication.journal_name}
                    </Typography>
                  </Box>
                )}
                
                {publication.num_citations !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FormatQuoteIcon color="primary" sx={{ fontSize: '1.1rem' }} />
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
                Keywords
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {publication.keywords ? (
                  (typeof publication.keywords === 'string' ? 
                    publication.keywords.split(/[,;]/).map(kw => kw.trim()) : 
                    publication.keywords
                  ).filter(Boolean).map((keyword, idx) => (
                    <Chip
                      key={idx}
                      label={keyword}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 20 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No keywords available
                  </Typography>
                )}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mt: 2 }}>
                Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {publication.pub_url && (
                  <ModernButton
                    variant="outlined"
                    size="small"
                    startIcon={<LanguageIcon />}
                    href={publication.pub_url}
                    target="_blank"
                    rel="noopener"
                  >
                    View Online
                  </ModernButton>
                )}
                
                <ModernButton
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => downloadPublication(publication)}
                >
                  Download PDF
                </ModernButton>
                
                <ModernButton
                  variant="outlined"
                  size="small"
                  startIcon={<ShareIcon />}
                  onClick={() => sharePublication(publication)}
                >
                  Share
                </ModernButton>
                
                <ModernButton
                  variant="outlined"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                >
                  Print
                </ModernButton>
              </Box>
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
        
        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Citation Formats
            </Typography>
            
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">APA</Typography>
                  <IconButton size="small" onClick={() => handleCitationCopy('apa')}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {`${publication.authors || 'Unknown'}. (${publication.pub_year || 'n.d.'}). ${publication.title || 'Untitled'}. ${publication.journal_name || ''}.${publication.doi ? ` https://doi.org/${publication.doi}` : ''}`}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">MLA</Typography>
                  <IconButton size="small" onClick={() => handleCitationCopy('mla')}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {`${publication.authors || 'Unknown'}. "${publication.title || 'Untitled'}." ${publication.journal_name || ''}, ${publication.pub_year || 'n.d.'}.${publication.doi ? ` DOI: ${publication.doi}` : ''}`}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">BibTeX</Typography>
                  <IconButton size="small" onClick={() => handleCitationCopy('bibtex')}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
{`@article{${publication.id || 'ref'},
  title={${publication.title || 'Untitled'}},
  author={${publication.authors || 'Unknown'}},
  journal={${publication.journal_name || ''}},
  year={${publication.pub_year || ''}},
  doi={${publication.doi || ''}}
}`}
                </Typography>
              </Paper>
            </Stack>
            
            <Snackbar
              open={copied}
              autoHideDuration={2000}
              onClose={() => setCopied(false)}
              message="Citation copied to clipboard"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ModernButton onClick={onClose}>Close</ModernButton>
      </DialogActions>
    </Dialog>
  );
};

function SearchTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [researcherData, setResearcherData] = useState([]);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [currentUserScholarId, setCurrentUserScholarId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [cachedResearchers, setCachedResearchers] = useState([]);
  const [cachedPublications, setCachedPublications] = useState([]);
  const [publicationCount, setPublicationCount] = useState(0);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [publicationViewMode, setPublicationViewMode] = useState("list");
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [savedPublications, setSavedPublications] = useState({});
  const [yearRange, setYearRange] = useState([1950, new Date().getFullYear()]);
  const [citationRange, setCitationRange] = useState([0, 10000]);
  const [selectedJournals, setSelectedJournals] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [activeFilters, setActiveFilters] = useState([]);
  const [openAccess, setOpenAccess] = useState(false);
  const [publicationType, setPublicationType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [likedPublications, setLikedPublications] = useState({});
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();
  
  const commonInterests = [
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Cybersecurity",
    "Cloud Computing",
    "IoT",
    "Blockchain",
    "Software Engineering",
    "Human-Computer Interaction",
    "Natural Language Processing",
    "Computer Vision",
    "Deep Learning",
    "Robotics",
    "Big Data",
    "Virtual Reality"
  ];
  
  const availableJournals = useMemo(() => {
    if (!cachedPublications.length) return [];
    
    const journals = Array.from(new Set(
      cachedPublications
        .map(pub => pub.journal_name)
        .filter(Boolean)
    )).sort();
    
    return journals;
  }, [cachedPublications]);
  
  const availableKeywords = useMemo(() => {
    if (!cachedPublications.length) return [];
    
    const keywordSet = new Set();
    
    cachedPublications.forEach(pub => {
      if (pub.keywords) {
        if (typeof pub.keywords === 'string') {
          pub.keywords.split(/[,;]/).forEach(kw => {
            const keyword = kw.trim();
            if (keyword) keywordSet.add(keyword);
          });
        } else if (Array.isArray(pub.keywords)) {
          pub.keywords.forEach(kw => {
            if (kw) keywordSet.add(kw.trim());
          });
        }
      }
    });
    
    return Array.from(keywordSet).sort();
  }, [cachedPublications]);
  
  const publicationYearRange = useMemo(() => {
    if (!cachedPublications.length) return [1950, new Date().getFullYear()];
    
    const years = cachedPublications
      .map(pub => parseInt(pub.pub_year))
      .filter(year => !isNaN(year));
    
    if (!years.length) return [1950, new Date().getFullYear()];
    
    return [
      Math.min(...years),
      Math.max(...years)
    ];
  }, [cachedPublications]);
  
  const citationCountRange = useMemo(() => {
    if (!cachedPublications.length) return [0, 1000];
    
    const citations = cachedPublications
      .map(pub => parseInt(pub.num_citations))
      .filter(count => !isNaN(count));
    
    if (!citations.length) return [0, 1000];
    
    return [
      0,
      Math.max(...citations)
    ];
  }, [cachedPublications]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          console.log("Current authenticated user:", user.uid);
          setCurrentUser(user);
          
          const userDocRef = doc(db, `users/${user.uid}`);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("Current user data:", userData);
            setCurrentUserData(userData);
            
            if (userData.scholar_id) {
              console.log("Current user scholar_id:", userData.scholar_id);
              setCurrentUserScholarId(userData.scholar_id);
            }
            
            if (userData.email) {
              console.log("Current user email:", userData.email);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const departmentsRef = collection(db, "colleges/faculty_computing/departments");
        const departmentsSnapshot = await getDocs(departmentsRef);
        const departmentList = departmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setDepartments(departmentList);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const researchers = await fetchAllResearchers();
        const publications = await fetchAllPublications();
        
        const publicationsWithResearchers = publications.map(pub => {
          const researcher = researchers.find(r => r.id === pub.researcherId);
          return {
            ...pub,
            researcher: researcher || null
          };
        });
        
        setCachedResearchers(researchers);
        setCachedPublications(publicationsWithResearchers);
        
        if (publicationsWithResearchers.length > 0) {
          const years = publicationsWithResearchers
            .map(pub => parseInt(pub.pub_year))
            .filter(year => !isNaN(year));
          
          if (years.length > 0) {
            setYearRange([Math.min(...years), Math.max(...years)]);
          }
          
          const citations = publicationsWithResearchers
            .map(pub => parseInt(pub.num_citations))
            .filter(count => !isNaN(count));
          
          if (citations.length > 0) {
            setCitationRange([0, Math.max(...citations)]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
    fetchDepartments();
    fetchAllData();
  }, []);

  const fetchAllResearchers = async () => {
    const facultyRef = collectionGroup(db, "faculty_members");
    const facultySnapshot = await getDocs(facultyRef);
    const allResearchers = facultySnapshot.docs.map((doc) => ({
      id: doc.id,
      department: doc.ref.parent.parent.id,
      ...doc.data(),
    }));
    return allResearchers;
  };

  const fetchAllPublications = async () => {
    const publicationsRef = collectionGroup(db, "publications");
    const publicationsSnapshot = await getDocs(publicationsRef);
    const allPublications = publicationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      researcherId: doc.ref.parent.parent.id,
    }));
    return allPublications;
  };

  const fuseOptionsResearchers = useMemo(
    () => ({
      keys: ["name", "firstName", "lastName"],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    }),
    []
  );

  const fuseOptionsPublications = useMemo(
    () => ({
      keys: ["title", "abstract", "keywords"],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    }),
    []
  );

  const clearFilters = () => {
    setYearRange(publicationYearRange);
    setCitationRange(citationCountRange);
    setSelectedJournals([]);
    setSelectedKeywords([]);
    setSortBy("relevance");
    setOpenAccess(false);
    setPublicationType("all");
    setActiveFilters([]);
  };

  const updateActiveFilters = () => {
    const newActiveFilters = [];
    
    if (yearRange[0] !== publicationYearRange[0] || yearRange[1] !== publicationYearRange[1]) {
      newActiveFilters.push({
        type: 'year',
        label: `Year: ${yearRange[0]}-${yearRange[1]}`,
        value: yearRange
      });
    }
    
    if (citationRange[0] !== 0 || citationRange[1] !== citationCountRange[1]) {
      newActiveFilters.push({
        type: 'citations',
        label: `Citations: ${citationRange[0]}-${citationRange[1]}`,
        value: citationRange
      });
    }
    
    selectedJournals.forEach(journal => {
      newActiveFilters.push({
        type: 'journal',
        label: `Journal: ${journal}`,
        value: journal
      });
    });
    
    selectedKeywords.forEach(keyword => {
      newActiveFilters.push({
        type: 'keyword',
        label: `Keyword: ${keyword}`,
        value: keyword
      });
    });
    
    if (openAccess) {
      newActiveFilters.push({
        type: 'openAccess',
        label: 'Open Access Only',
        value: true
      });
    }
    
    if (publicationType !== 'all') {
      newActiveFilters.push({
        type: 'pubType',
        label: `Type: ${publicationType.charAt(0).toUpperCase() + publicationType.slice(1)}`,
        value: publicationType
      });
    }
    
    setActiveFilters(newActiveFilters);
  };

  const removeFilter = (filterToRemove) => {
    switch (filterToRemove.type) {
      case 'year':
        setYearRange(publicationYearRange);
        break;
      case 'citations':
        setCitationRange(citationCountRange);
        break;
      case 'journal':
        setSelectedJournals(prev => prev.filter(j => j !== filterToRemove.value));
        break;
      case 'keyword':
        setSelectedKeywords(prev => prev.filter(k => k !== filterToRemove.value));
        break;
      case 'openAccess':
        setOpenAccess(false);
        break;
      case 'pubType':
        setPublicationType('all');
        break;
      default:
        break;
    }
    
    setActiveFilters(prev => prev.filter(filter => 
      !(filter.type === filterToRemove.type && filter.value === filterToRemove.value)
    ));
  };

  const applyFilters = () => {
    updateActiveFilters();
    handleSearch(searchTerm);
  };

  const handleSearch = async (searchTermInput) => {
    const searchQuery = searchTermInput || searchTerm;
    setLastSearchQuery(searchQuery);

    if (searchQuery || selectedDepartment || activeFilters.length > 0) {
      setLoading(true);
      setError("");

      try {
        const currentUserIds = {
          uid: auth.currentUser?.uid,
          email: currentUserData?.email,
          scholarId: currentUserScholarId,
          firstName: currentUserData?.firstName,
          lastName: currentUserData?.lastName,
          fullName: currentUserData ? 
                  `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() : '',
        };
        
        console.log("Filtering out current user with IDs:", currentUserIds);
        
        let filteredResearchers = cachedResearchers.filter(researcher => {
        
          if (researcher.uid === currentUserIds.uid) return false;
          
          if (researcher.scholar_id === currentUserIds.scholarId && currentUserIds.scholarId) return false;
          
          
          if (researcher.email === currentUserIds.email && currentUserIds.email) return false;
          
          
          const researcherName = researcher.name || 
            `${researcher.firstName || ''} ${researcher.lastName || ''}`.trim();
          
          if (researcherName && currentUserIds.fullName && 
              researcherName.toLowerCase() === currentUserIds.fullName.toLowerCase()) return false;
          
          return true;
        });

        if (selectedDepartment) {
          filteredResearchers = filteredResearchers.filter(
            (researcher) => researcher.department === selectedDepartment
          );
        }

        let filteredPublications = cachedPublications.filter((pub) =>
          filteredResearchers.some(
            (researcher) => researcher.id === pub.researcherId
          )
        );

        if (activeFilters.length > 0) {
          const yearFilter = activeFilters.find(f => f.type === 'year');
          if (yearFilter) {
            filteredPublications = filteredPublications.filter(pub => {
              const pubYear = parseInt(pub.pub_year);
              return !isNaN(pubYear) && 
                     pubYear >= yearFilter.value[0] && 
                     pubYear <= yearFilter.value[1];
            });
          }
          
          const citationFilter = activeFilters.find(f => f.type === 'citations');
          if (citationFilter) {
            filteredPublications = filteredPublications.filter(pub => {
              const citations = parseInt(pub.num_citations) || 0;
              return citations >= citationFilter.value[0] && 
                     citations <= citationFilter.value[1];
            });
          }
          
          const journalFilters = activeFilters.filter(f => f.type === 'journal');
          if (journalFilters.length > 0) {
            const journalValues = journalFilters.map(f => f.value);
            filteredPublications = filteredPublications.filter(pub =>
              pub.journal_name && journalValues.includes(pub.journal_name)
            );
          }
          
          const keywordFilters = activeFilters.filter(f => f.type === 'keyword');
          if (keywordFilters.length > 0) {
            const keywordValues = keywordFilters.map(f => f.value);
            filteredPublications = filteredPublications.filter(pub => {
              if (!pub.keywords) return false;
              
              if (typeof pub.keywords === 'string') {
                const pubKeywords = pub.keywords.split(/[,;]/).map(k => k.trim());
                return keywordValues.some(kw => pubKeywords.includes(kw));
              } else if (Array.isArray(pub.keywords)) {
                return keywordValues.some(kw => pub.keywords.includes(kw));
              }
              
              return false;
            });
          }
          
          const openAccessFilter = activeFilters.find(f => f.type === 'openAccess');
          if (openAccessFilter) {
            filteredPublications = filteredPublications.filter(pub => 
              pub.open_access === true
            );
          }
          
          const typeFilter = activeFilters.find(f => f.type === 'pubType');
          if (typeFilter && typeFilter.value !== 'all') {
            filteredPublications = filteredPublications.filter(pub => 
              pub.type && pub.type.toLowerCase() === typeFilter.value.toLowerCase()
            );
          }
        }

        let foundResearchers = filteredResearchers;
        let foundPublications = filteredPublications;
        
        if (searchQuery) {
          const fuseResearchers = new Fuse(filteredResearchers, fuseOptionsResearchers);
          const researcherResults = fuseResearchers.search(searchQuery);
          foundResearchers = researcherResults.map((result) => result.item);

          const fusePublications = new Fuse(filteredPublications, fuseOptionsPublications);
          const publicationResults = fusePublications.search(searchQuery);
          foundPublications = publicationResults.map((result) => result.item);
        }

        const uniquePublications = [];
        const seenTitles = new Set();
        
        foundPublications.forEach(pub => {
          const lowerTitle = pub.title?.toLowerCase();
          if (lowerTitle && !seenTitles.has(lowerTitle)) {
            seenTitles.add(lowerTitle);
            uniquePublications.push(pub);
          }
        });

        let sortedPublications = [...uniquePublications];
        
        if (sortBy === 'year_desc') {
          sortedPublications.sort((a, b) => {
            const yearA = parseInt(a.pub_year) || 0;
            const yearB = parseInt(b.pub_year) || 0;
            return yearB - yearA;
          });
        } else if (sortBy === 'year_asc') {
          sortedPublications.sort((a, b) => {
            const yearA = parseInt(a.pub_year) || 0;
            const yearB = parseInt(b.pub_year) || 0;
            return yearA - yearB;
          });
        } else if (sortBy === 'citations_desc') {
          sortedPublications.sort((a, b) => {
            const citA = parseInt(a.num_citations) || 0;
            const citB = parseInt(b.num_citations) || 0;
            return citB - citA;
          });
        } else if (sortBy === 'citations_asc') {
          sortedPublications.sort((a, b) => {
            const citA = parseInt(a.num_citations) || 0;
            const citB = parseInt(b.num_citations) || 0;
            return citA - citB;
          });
        }

        const publicationsWithAllResearchers = sortedPublications.map(pub => {
          let authorsList = [];
          if (pub.authors && typeof pub.authors === 'string') {
            authorsList = pub.authors.split(',').map(author => author.trim());
          }
          
          const associatedResearchers = cachedResearchers.filter(researcher => {
            if (researcher.id === pub.researcherId) return true;
            if (authorsList.length > 0) {
              const researcherName = researcher.name || 
                `${researcher.firstName || ''} ${researcher.lastName || ''}`.trim();
              
              return authorsList.some(author => 
                researcherName && author.includes(researcherName)
              );
            }
            return false;
          });
          
          return {
            ...pub,
            allResearchers: associatedResearchers
          };
        });

        if (foundResearchers.length > 0 || publicationsWithAllResearchers.length > 0) {
          setResearcherData(foundResearchers);
          setPublications(publicationsWithAllResearchers);
          setSuggestions(publicationsWithAllResearchers.map((pub) => pub.title));
          setPublicationCount(publicationsWithAllResearchers.length);
          
          setExpandedAbstracts({});
          setPage(1);
        } else {
          setResearcherData([]);
          setPublications([]);
          setSuggestions([]);
          setPublicationCount(0);
          setError("No results found for your search criteria.");
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Error fetching data: " + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter a search term, select a department, or set filters.");
    }
  };

  const goToProfile = (scholarId) => {
    if (scholarId) {
      navigate(`/profile/${scholarId}`);
    } else {
      console.error("No scholar ID provided");
      setError("Unable to view profile: Missing ID");
    }
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setPublicationViewMode(newMode);
    }
  };

  const toggleAbstract = (pubId) => {
    setExpandedAbstracts(prev => ({
      ...prev,
      [pubId]: !prev[pubId]
    }));
  };

  const toggleSavedPublication = (pubId) => {
    setSavedPublications(prev => {
      const newState = {
        ...prev,
        [pubId]: !prev[pubId]
      };
      
      const message = newState[pubId] 
        ? "Publication saved to your bookmarks" 
        : "Publication removed from your bookmarks";
      
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      
      return newState;
    });
  };
  
  const toggleLikedPublication = (pubId) => {
    setLikedPublications(prev => {
      const newState = {
        ...prev,
        [pubId]: !prev[pubId]
      };
      
      if (newState[pubId]) {
        setSnackbarMessage("Publication added to your favorites");
        setSnackbarOpen(true);
      }
      
      return newState;
    });
  };

  const openPublicationDetails = (publication) => {
    setSelectedPublication(publication);
    setDetailDialogOpen(true);
  };

  const handleInterestToggle = (interest) => {
    const currentIndex = selectedKeywords.indexOf(interest);
    const newKeywords = [...selectedKeywords];
    
    if (currentIndex === -1) {
      newKeywords.push(interest);
    } else {
      newKeywords.splice(currentIndex, 1);
    }
    
    setSelectedKeywords(newKeywords);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    handleSearch(searchTerm);
  };

  const exportToCsv = () => {
    if (publications.length === 0) return;
    
    const csvContent = [
      ["Title", "Authors", "Year", "Journal", "Citations", "DOI", "URL"],
      ...publications.map(pub => [
        pub.title || "",
        pub.authors || "",
        pub.pub_year || "",
        pub.journal_name || "",
        pub.num_citations || "0",
        pub.doi || "",
        pub.pub_url || ""
      ])
    ]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `research_publications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbarMessage("Publications exported to CSV file");
    setSnackbarOpen(true);
  };

  const sharePublication = (publication) => {
    if (navigator.share) {
      navigator.share({
        title: publication.title,
        text: `Check out this research: ${publication.title}`,
        url: publication.pub_url || window.location.href
      }).catch(error => console.error('Error sharing:', error));
    } else {
      const url = publication.pub_url || window.location.href;
      navigator.clipboard.writeText(url)
        .then(() => {
          setSnackbarMessage("Link copied to clipboard");
          setSnackbarOpen(true);
        })
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  const downloadPublication = (publication) => {
    if (publication.pdf_url) {
      window.open(publication.pdf_url, '_blank');
    } else if (publication.pub_url) {
      window.open(publication.pub_url, '_blank');
    } else {
      setSnackbarMessage("No downloadable file available for this publication");
      setSnackbarOpen(true);
    }
  };

  const publicationsByYear = useMemo(() => {
    const yearGroups = {};
    
    publications.forEach(pub => {
      const year = pub.pub_year || 'Unknown Year';
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(pub);
    });
    
    return Object.entries(yearGroups)
      .sort(([yearA], [yearB]) => {
        if (yearA === 'Unknown Year') return 1;
        if (yearB === 'Unknown Year') return -1;
        return parseInt(yearB) - parseInt(yearA);
      })
      .map(([year, pubs]) => ({
        year,
        publications: pubs
      }));
  }, [publications]);
  
  const paginatedPublications = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return publications.slice(start, end);
  }, [publications, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const AdvancedFilters = () => {
    return (
      <Collapse in={showFilters} timeout="auto">
        <ModernFilterPanel>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
            <ScienceOutlinedIcon sx={{ mr: 1.5, color: 'rgb(29, 78, 216)', fontSize: { xs: '1.2rem', sm: '1.3rem' } }} />
            <Typography variant="h6" sx={{ fontWeight: '600', fontSize: { xs: '1rem', sm: '1.1rem' }, color: 'rgb(30, 64, 175)' }}>
              Filter by Research Interests
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 }, mb: 4 }}>
            {commonInterests.map((interest) => (
              <FilterChip
                key={interest}
                label={interest}
                onClick={() => handleInterestToggle(interest)}
                color={selectedKeywords.includes(interest) ? "primary" : "default"}
                variant={selectedKeywords.includes(interest) ? "filled" : "outlined"}
                selected={selectedKeywords.includes(interest)}
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  height: { xs: 32, sm: 36 },
                }}
              />
            ))}
          </Box>
          
          {activeFilters.length > 0 && (
            <ActiveFiltersBox>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1.5 }}>
                <FilterAltIcon color="primary" sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 600 }}>
                  Active filters
                </Typography>
                <ModernButton 
                  size="small" 
                  startIcon={<ClearAllIcon />} 
                  onClick={clearFilters}
                  variant="outlined"
                  sx={{ ml: 'auto', borderRadius: 20 }}
                >
                  Clear All
                </ModernButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {activeFilters.map((filter, index) => (
                  <Chip
                    key={index}
                    label={filter.label}
                    onDelete={() => removeFilter(filter)}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 20,
                      boxShadow: '0 2px 8px rgba(29, 78, 216, 0.15)',
                      '&:hover': {
                        boxShadow: '0 3px 10px rgba(29, 78, 216, 0.25)',
                      }
                    }}
                  />
                ))}
              </Box>
            </ActiveFiltersBox>
          )}
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: 'rgb(30, 64, 175)' }}>
                Publication Year Range
              </Typography>
              <Box sx={{ px: 2, pt: 2 }}>
                <ModernSlider
                  value={yearRange}
                  onChange={(e, newValue) => setYearRange(newValue)}
                  valueLabelDisplay="auto"
                  min={publicationYearRange[0]}
                  max={publicationYearRange[1]}
                  step={1}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                  <Typography variant="body2" color="primary.dark" fontWeight={500}>
                    {yearRange[0]}
                  </Typography>
                  <Typography variant="body2" color="primary.dark" fontWeight={500}>
                    {yearRange[1]}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: 'rgb(30, 64, 175)' }}>
                Citation Count
              </Typography>
              <Box sx={{ px: 2, pt: 2 }}>
                <ModernSlider
                  value={citationRange}
                  onChange={(e, newValue) => setCitationRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={citationCountRange[1]}
                  step={10}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                  <Typography variant="body2" color="primary.dark" fontWeight={500}>
                    {citationRange[0]}
                  </Typography>
                  <Typography variant="body2" color="primary.dark" fontWeight={500}>
                    {citationRange[1]}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel sx={{ color: 'rgb(29, 78, 216)' }}>Publication Type</InputLabel>
                <ModernSelect
                  value={publicationType}

                  onChange={(e) => setPublicationType(e.target.value)}
                  label="Publication Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="article">Articles</MenuItem>
                  <MenuItem value="conference">Conference Papers</MenuItem>
                  <MenuItem value="book">Books</MenuItem>
                  <MenuItem value="chapter">Book Chapters</MenuItem>
                  <MenuItem value="thesis">Theses</MenuItem>
                </ModernSelect>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel sx={{ color: 'rgb(29, 78, 216)' }}>Sort By</InputLabel>
                <ModernSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="relevance">Relevance</MenuItem>
                  <MenuItem value="year_desc">Newest First</MenuItem>
                  <MenuItem value="year_asc">Oldest First</MenuItem>
                  <MenuItem value="citations_desc">Most Cited</MenuItem>
                  <MenuItem value="citations_asc">Least Cited</MenuItem>
                </ModernSelect>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={openAccess} 
                    onChange={(e) => setOpenAccess(e.target.checked)}
                    sx={{ 
                      color: 'rgb(29, 78, 216)',
                      '&.Mui-checked': {
                        color: 'rgb(29, 78, 216)',
                      },
                    }}
                  />
                }
                label="Show Only Open Access Publications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <ModernButton
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearAllIcon />}
                  sx={{ 
                    borderRadius: 30,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  }}
                >
                  Clear Filters
                </ModernButton>
                <ModernButton
                  variant="contained"
                  color="primary"
                  onClick={applyFilters}
                  startIcon={<FilterAltIcon />}
                  sx={{ 
                    borderRadius: 30,
                    bgcolor: "rgb(29, 78, 216)",
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    boxShadow: '0 6px 20px rgba(29, 78, 216, 0.25)',
                    "&:hover": {
                      bgcolor: "rgb(30, 64, 175)",
                      boxShadow: '0 8px 25px rgba(29, 78, 216, 0.35)',
                    },
                  }}
                >
                  Apply Filters
                </ModernButton>
              </Box>
            </Grid>
          </Grid>
        </ModernFilterPanel>
      </Collapse>
    );
  };

  const PublicationListItem = React.memo(({ publication }) => {
    const [open, setOpen] = useState(false);
    const isAbstractExpanded = expandedAbstracts[publication.id] || false;
    const isSaved = savedPublications[publication.id] || false;
    const isLiked = likedPublications[publication.id] || false;
    const hasLongAbstract = publication.abstract && publication.abstract.length > 200;

    const fieldsToShow = Object.keys(publication).filter((field) => {
      const value = publication[field];
      return (
        value &&
        typeof value === "string" &&
        ![
          "title",
          "pub_year",
          "num_citations",
          "authors",
          "cites_per_year",
          "cites_id",
          "researcherId",
          "researcherName",
          "researcherImage",
          "id",
          "abstract",
        ].includes(field)
      );
    });

    return (
      <Card sx={{ 
        mb: 3, 
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)', 
        borderRadius: 3,
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 30px rgba(29, 78, 216, 0.12)',
        }
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flexGrow: 1, pr: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1.5, 
                  fontWeight: '600', 
                  color: 'rgb(29, 78, 216)',
                  '&:hover': {
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => openPublicationDetails(publication)}
              >
                {publication.title || "Untitled Publication"}
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                {publication.allResearchers && publication.allResearchers.length > 0 ? (
                  publication.allResearchers.map((researcher, idx) => (
                    <Chip
                      key={idx}
                      label={researcher?.name || `${researcher?.firstName || ''} ${researcher?.lastName || ''}`.trim() || "Unknown"}
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        const scholarId = researcher.scholar_id || researcher.id;
                        goToProfile(scholarId);
                      }}
                      sx={{ 
                        cursor: 'pointer',
                        borderRadius: 20,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(29, 78, 216, 0.15)',
                        }
                      }}
                    />
                  ))
                ) : (
                  <Chip
                    label="Unknown Author"
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 20 }}
                  />
                )}
              </Stack>
              
              <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {publication.pub_year && (
                    <span>{publication.pub_year}</span>
                  )}
                </Typography>
                
                {publication.journal_name && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {publication.journal_name}
                  </Typography>
                )}
                
                {publication.num_citations !== undefined && (
                  <Chip
                    icon={<FormatQuoteIcon fontSize="small" />}
                    label={`${publication.num_citations} Citations`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      borderRadius: 20,
                      height: 26,
                      boxShadow: '0 2px 8px rgba(29, 78, 216, 0.1)',
                    }}
                  />
                )}
                
                {publication.doi && (
                  <Chip
                    icon={<LinkIcon fontSize="small" />}
                    label={`DOI: ${publication.doi}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={() => window.open(`https://doi.org/${publication.doi}`, '_blank')}
                    clickable
                    sx={{ 
                      borderRadius: 20,
                      height: 26,
                      boxShadow: '0 2px 8px rgba(29, 78, 216, 0.1)',
                    }}
                  />
                )}
              </Box>
              
              {publication.abstract && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mt: 1.5,
                    lineHeight: 1.6,
                    ...(hasLongAbstract && !isAbstractExpanded ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    } : {})
                  }}>
                    {publication.abstract}
                  </Typography>
                  
                  {hasLongAbstract && (
                    <ModernButton 
                      size="small" 
                      onClick={() => toggleAbstract(publication.id)}
                      sx={{ mt: 1.5, fontSize: '0.75rem' }}
                    >
                      {isAbstractExpanded ? "Show Less" : "Read More"}
                    </ModernButton>
                  )}
                </Box>
              )}
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {publication.keywords && (
                  (typeof publication.keywords === 'string' ? 
                    publication.keywords.split(/[,;]/).map(kw => kw.trim()) : 
                    publication.keywords
                  ).filter(Boolean).slice(0, 5).map((keyword, idx) => (
                    <Chip
                      key={idx}
                      label={keyword}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 20,
                        fontSize: '0.7rem',
                        height: 24,
                        bgcolor: 'rgba(29, 78, 216, 0.05)',
                        '&:hover': {
                          bgcolor: 'rgba(29, 78, 216, 0.1)',
                        }
                      }}
                      onClick={() => {
                        if (!selectedKeywords.includes(keyword)) {
                          setSelectedKeywords([...selectedKeywords, keyword]);
                          updateActiveFilters();
                          handleSearch(searchTerm);
                        }
                      }}
                    />
                  ))
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => toggleSavedPublication(publication.id)}
                color={isSaved ? "primary" : "default"}
                sx={{ 
                  backgroundColor: isSaved ? 'rgba(29, 78, 216, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(29, 78, 216, 0.15)',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => toggleLikedPublication(publication.id)}
                color={isLiked ? "primary" : "default"}
                sx={{ 
                  backgroundColor: isLiked ? 'rgba(29, 78, 216, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(29, 78, 216, 0.15)',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              
              <IconButton
                aria-label="expand publication"
                size="small"
                onClick={() => setOpen(!open)}
                sx={{ 
                  backgroundColor: open ? 'rgba(29, 78, 216, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(29, 78, 216, 0.15)',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </Box>
          </Box>
          
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 3 }}>
              <ModernDivider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {fieldsToShow.length > 0 ? (
                  fieldsToShow.map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                        {field.replace(/_/g, " ").toUpperCase()}
                      </Typography>
                      <Typography variant="body2">
                        {field === "pub_url" ? (
                          <ModernButton 
                            variant="text" 
                            startIcon={<LanguageIcon />} 
                            href={publication[field]} 
                            target="_blank"
                            rel="noopener"
                            size="small"
                            sx={{ pl: 0 }}
                          >
                            View Publication
                          </ModernButton>
                        ) : (
                          publication[field]
                        )}
                      </Typography>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      No additional details available for this publication.
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {publication.pub_url && (
                  <ModernButton
                    variant="outlined"
                    size="small"
                    startIcon={<LanguageIcon />}
                    href={publication.pub_url}
                    target="_blank"
                    rel="noopener"
                    sx={{ borderRadius: 30 }}
                  >
                    View Publication
                  </ModernButton>
                )}
                
                <ModernButton
                  variant="outlined"
                  size="small"
                  startIcon={<ShareIcon />}
                  onClick={() => sharePublication(publication)}
                  sx={{ borderRadius: 30 }}
                >
                  Share
                </ModernButton>
                
                <ModernButton
                  variant="outlined"
                  size="small"
                  startIcon={<GetAppIcon />}
                  onClick={() => downloadPublication(publication)}
                  sx={{ borderRadius: 30 }}
                >
                  Download
                </ModernButton>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  });

  const PublicationGridView = ({ publications }) => {
    return (
      <Grid container spacing={3}>
        {publications.map((publication, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <PublicationGridCard>
              <PublicationCardHeader>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {publication.pub_year || "Unknown Year"}
                  </Typography>
                  {publication.num_citations !== undefined && (
                    <Chip
                      icon={<FormatQuoteIcon fontSize="small" />}
                      label={`${publication.num_citations} Citations`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 20, boxShadow: '0 2px 8px rgba(29, 78, 216, 0.1)' }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => toggleSavedPublication(publication.id)}
                    color={savedPublications[publication.id] ? "primary" : "default"}
                  >
                    {savedPublications[publication.id] ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={() => toggleLikedPublication(publication.id)}
                    color={likedPublications[publication.id] ? "primary" : "default"}
                  >
                    {likedPublications[publication.id] ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </PublicationCardHeader>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  color="primary" 
                  sx={{ 
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => openPublicationDetails(publication)}
                >
                  {publication.title || "Untitled Publication"}
                </Typography>
                
                <Box sx={{ mb: 2.5 }}>
                  {publication.allResearchers && publication.allResearchers.map((researcher, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 500,
                        mb: 0.5,
                        transition: 'all 0.2s',
                        '&:hover': { 
                          color: 'primary.main',
                          transform: 'translateX(5px)'
                        },
                      }}
                      onClick={() => {
                        const scholarId = researcher.scholar_id || researcher.id;
                        goToProfile(scholarId);
                      }}
                    >
                      {researcher?.name || `${researcher?.firstName || ''} ${researcher?.lastName || ''}`.trim() || "Unknown"}
                    </Typography>
                  ))}
                </Box>
                
                {publication.abstract && (
                  <Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6,
                        ...(publication.abstract.length > 120 && !expandedAbstracts[publication.id] ? {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        } : {})
                      }}
                    >
                      {publication.abstract}
                    </Typography>
                    
                    {publication.abstract.length > 120 && (
                      <ModernButton 
                        size="small" 
                        onClick={() => toggleAbstract(publication.id)}
                        sx={{ mt: 1.5, fontSize: '0.75rem' }}
                      >
                        {expandedAbstracts[publication.id] ? "Show Less" : "Read More"}
                      </ModernButton>
                    )}
                  </Box>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {publication.keywords && (
                    (typeof publication.keywords === 'string' ? 
                      publication.keywords.split(/[,;]/).map(kw => kw.trim()) : 
                      publication.keywords
                    ).filter(Boolean).slice(0, 3).map((keyword, idx) => (
                      <Chip
                        key={idx}
                        label={keyword}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderRadius: 20,
                          fontSize: '0.65rem',
                          height: 22,
                          bgcolor: 'rgba(29, 78, 216, 0.05)',
                        }}
                        onClick={() => {
                          if (!selectedKeywords.includes(keyword)) {
                            setSelectedKeywords([...selectedKeywords, keyword]);
                            updateActiveFilters();
                            handleSearch(searchTerm);
                          }
                        }}
                      />
                    ))
                  )}
                </Box>
                
                <Box sx={{ mt: 'auto', pt: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {publication.pub_url && (
                      <ModernButton
                        variant="outlined"
                        size="small"
                        startIcon={<LanguageIcon />}
                        href={publication.pub_url}
                        target="_blank"
                        rel="noopener"
                        fullWidth
                        sx={{ borderRadius: 30 }}
                      >
                        View
                      </ModernButton>
                    )}
                    
                    <ModernButton
                      variant="outlined"
                      size="small"
                      startIcon={<GetAppIcon />}
                      onClick={() => downloadPublication(publication)}
                      fullWidth
                      sx={{ borderRadius: 30 }}
                    >
                      Download
                    </ModernButton>
                  </Box>
                </Box>
              </CardContent>
            </PublicationGridCard>
          </Grid>
        ))}
      </Grid>
    );
  };

  const PublicationTimelineView = ({ publicationsByYear }) => {
    return (
      <Box sx={{ pl: 2 }}>
        {publicationsByYear.map(({ year, publications }) => (
          <Box key={year} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 'bold', color: 'primary.main' }}>
              {year}
            </Typography>
            
            {publications.map((publication, index) => (
              <PublicationTimelineItem key={index}>
                <Card sx={{ 
                  mb: 2, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)', 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(29, 78, 216, 0.1)',
                    borderColor: 'rgba(29, 78, 216, 0.2)',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        gutterBottom
                        sx={{ 
                          '&:hover': {
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            color: 'primary.main',
                          }
                        }}
                        onClick={() => openPublicationDetails(publication)}
                      >
                        {publication.title}
                      </Typography>
                      
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => toggleSavedPublication(publication.id)}
                          color={savedPublications[publication.id] ? "primary" : "default"}
                        >
                          {savedPublications[publication.id] ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      {publication.allResearchers?.map((researcher, idx) => (
                        <Chip
                          key={idx}
                          label={researcher?.name || `${researcher?.firstName || ''} ${researcher?.lastName || ''}`.trim() || "Unknown"}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const scholarId = researcher.scholar_id || researcher.id;
                            goToProfile(scholarId);
                          }}
                          sx={{ 
                            cursor: 'pointer',
                            borderRadius: 20,
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.15)',
                            }
                          }}
                        />
                      ))}
                    </Stack>
                    
                    {publication.abstract && (
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.6,
                            ...(publication.abstract.length > 120 && !expandedAbstracts[publication.id] ? {
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            } : {})
                          }}
                        >
                          {publication.abstract}
                        </Typography>
                        
                        {publication.abstract.length > 120 && (
                          <ModernButton 
                            size="small" 
                            onClick={() => toggleAbstract(publication.id)}
                            sx={{ mt: 1 }}
                          >
                            {expandedAbstracts[publication.id] ? "Show Less" : "Read More"}
                          </ModernButton>
                        )}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {publication.journal_name && (
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {publication.journal_name}
                          </Typography>
                        )}
                        
                        {publication.num_citations !== undefined && (
                          <Chip
                            icon={<FormatQuoteIcon fontSize="small" />}
                            label={publication.num_citations}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 20, boxShadow: '0 2px 8px rgba(29, 78, 216, 0.1)' }}
                          />
                        )}
                      </Box>
                      
                      <Box>
                        {publication.pub_url && (
                          <ModernButton
                            variant="outlined"
                            size="small"
                            startIcon={<LanguageIcon />}
                            href={publication.pub_url}
                            target="_blank"
                            rel="noopener"
                            sx={{ borderRadius: 20, fontSize: '0.7rem' }}
                          >
                            View
                          </ModernButton>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </PublicationTimelineItem>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const PublicationTableView = ({ publications }) => {
    return (
      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Citations</TableCell>
              <TableCell>Journal</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {publications.map((publication, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Typography 
                    variant="subtitle2"
                    sx={{ 
                      '&:hover': {
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        color: 'primary.main'
                      }
                    }}
                    onClick={() => openPublicationDetails(publication)}
                  >
                    {publication.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  {publication.allResearchers?.map((researcher, idx) => (
                    <Typography 
                      key={idx} 
                      variant="body2" 
                      sx={{ 
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'color 0.2s',
                        '&:hover': { color: 'primary.main' }
                      }}
                      onClick={() => {
                        const scholarId = researcher.scholar_id || researcher.id;
                        goToProfile(scholarId);
                      }}
                    >
                      {researcher?.name || `${researcher?.firstName || ''} ${researcher?.lastName || ''}`.trim() || "Unknown"}
                    </Typography>
                  ))}
                </TableCell>
                <TableCell>{publication.pub_year || "Unknown"}</TableCell>
                <TableCell>{publication.num_citations || 0}</TableCell>
                <TableCell>{publication.journal_name || "-"}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {publication.pub_url && (
                      <Tooltip title="View Publication">
                        <IconButton
                          size="small"
                          color="primary"
                          href={publication.pub_url}
                          target="_blank"
                          rel="noopener"
                        >
                          <LanguageIcon fontSize="small"/>
                          
                          <LanguageIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => downloadPublication(publication)}
                      >
                        <GetAppIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={savedPublications[publication.id] ? "Remove Bookmark" : "Bookmark"}>
                      <IconButton
                        size="small"
                        color={savedPublications[publication.id] ? "primary" : "default"}
                        onClick={() => toggleSavedPublication(publication.id)}
                      >
                        {savedPublications[publication.id] ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {publications.length > 10 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination 
              count={Math.ceil(publications.length / rowsPerPage)} 
              page={page} 
              onChange={handleChangePage}
              color="primary" 
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </StyledTableContainer>
    );
  };

  const ResearcherCard = ({ researcher }) => {
    const departmentName = departments.find((d) => d.id === researcher.department)?.name || "Unknown Department";
    const researcherName = researcher.name || `${researcher.firstName || ''} ${researcher.lastName || ''}`.trim();
    
    return (
      <StyledResearcherCard>
        <Box sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(135deg, rgba(29, 78, 216, 0.08) 0%, rgba(29, 78, 216, 0.02) 100%)',
          borderBottom: '1px solid rgba(29, 78, 216, 0.1)'
        }}>
          <ResearcherAvatar
            src={researcher.url_picture || "/default-avatar.png"}
            alt={researcherName || "Researcher"}
            sx={{ 
              width: { xs: 80, sm: 80, md: 80 }, 
              height: { xs: 80, sm: 80, md: 80 }, 
              mb: 1.5,
              border: '3px solid white',
              boxShadow: '0 8px 20px rgba(29, 78, 216, 0.2)',
            }}
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'rgb(30, 64, 175)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {researcherName || "Unknown"}
          </Typography>
          
          <Chip 
            icon={<SchoolIcon fontSize="small" />} 
            label={departmentName} 
            size="small"
            sx={{ 
              mt: 1.5, 
              borderRadius: 20,
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.1)',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 15px rgba(29, 78, 216, 0.2)',
              }
            }}
          />
        </Box>
        
        <CardContent sx={{ 
          flexGrow: 0, 
          pt: 2,
          px: 2.5,
          display: 'flex',
          flexDirection: 'column',
          height: "220px", 
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
              <BusinessIcon fontSize="small" sx={{ mr: 1.5, color: 'rgb(29, 78, 216)', flexShrink: 0 }} />
              {researcher.affiliation || "Not provided"}
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
              <EmailIcon fontSize="small" sx={{ mr: 1.5, color: 'rgb(29, 78, 216)', flexShrink: 0 }} />
              {researcher.email || "Not provided"}
            </Typography>
          </Box>
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
              color: 'rgb(30, 64, 175)'
            }}
          >
            Research Interests:
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.8, 
            mb: 2,
            maxHeight: { xs: '80px', sm: '80px', md: '80px' }, 
            overflow: 'hidden'
          }}>
            {researcher.interests ? (
              researcher.interests.slice(0, 4).map((interest, index) => (
                <Chip 
                  key={index}
                  label={interest}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 },
                    borderRadius: 20,
                    boxShadow: '0 2px 8px rgba(29, 78, 216, 0.05)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(29, 78, 216, 0.12)',
                    }
                  }}
                  onClick={() => {
                    if (!selectedKeywords.includes(interest)) {
                      setSelectedKeywords([...selectedKeywords, interest]);
                      updateActiveFilters();
                      handleSearch(searchTerm);
                    }
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No interests provided
              </Typography>
            )}
            
            {researcher.interests && researcher.interests.length > 4 && (
              <Chip 
                label={`+${researcher.interests.length - 4} more`}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  borderRadius: 20,
                  bgcolor: 'rgba(29, 78, 216, 0.1)',
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.05)',
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
            {researcher.publications_count !== undefined && (
              <Chip 
                icon={<BookOutlinedIcon fontSize="small" />}
                label={`${researcher.publications_count || 0} Publications`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 26, sm: 30 },
                  borderRadius: 20,
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.05)',
                }}
              />
            )}
            
            {researcher.citedby !== undefined && (
              <Chip 
                icon={<TrendingUpIcon fontSize="small" />}
                label={`${researcher.citedby || 0} Citations`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 26, sm: 30 },
                  borderRadius: 20,
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.05)',
                }}
              />
            )}
          </Box>
        </CardContent>
        
        <CardActions sx={{ 
          padding: { xs: 2, sm: 2.5 }, 
          pt: 0,
          height: { xs: '60px', sm: '70px' }
        }}>
          <ModernButton
            variant="contained"
            fullWidth
            startIcon={<VisibilityIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
            onClick={() => goToProfile(researcher.scholar_id || researcher.id)}
            sx={{
              bgcolor: "rgb(29, 78, 216)",
              color: "white",
              borderRadius: 30,
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
              py: 1,
              boxShadow: '0 6px 16px rgba(29, 78, 216, 0.25)',
              "&:hover": {
                bgcolor: "rgb(30, 64, 175)",
                boxShadow: '0 8px 20px rgba(29, 78, 216, 0.35)',
              },
            }}
          >
            View Profile
          </ModernButton>
        </CardActions>
      </StyledResearcherCard>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="h-screen flex flex-col" style={{ minHeight: '600px' }}>
      
        <div className="flex-1 bg-gray-50 overflow-y-auto" style={{ minHeight: '100%', backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%)' }}>
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
                    onChange={handleSearchTermChange}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch(searchTerm);
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'rgb(29, 78, 216)' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleSearch(searchTerm)}
                            edge="end"
                            sx={{ 
                              color: 'white',
                              bgcolor: 'rgb(29, 78, 216)',
                              '&:hover': {
                                bgcolor: 'rgb(30, 64, 175)',
                              }
                            }}
                          >
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel sx={{ color: 'rgb(29, 78, 216)' }}>Department</InputLabel>
                    <ModernSelect
                      value={selectedDepartment}
                      onChange={handleDepartmentChange}
                      label="Department"
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
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
                    startIcon={<FilterListIcon />}
                    onClick={toggleFilters}
                    sx={{ 
                      bgcolor: showFilters ? "rgb(29, 78, 216)" : "white",
                      color: showFilters ? "white" : "rgb(29, 78, 216)",
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      "&:hover": {
                        bgcolor: showFilters ? "rgb(30, 64, 175)" : "",
                      },
                    }}
                  >
                    Filters
                  </ModernButton>
                </Grid>

                <Grid item xs={6} sm={3} md={1.5} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <ModernToggleButtonGroup
                      value={publicationViewMode}
                      exclusive
                      onChange={handleViewModeChange}
                      size="small"
                      sx={{ width: '100%' }}
                    >
                      <ModernToggleButton 
                        value="grid" 
                        aria-label="grid view"
                        sx={{ 
                          borderTopLeftRadius: 30,
                          borderBottomLeftRadius: 30,
                          width: '25%',
                          bgcolor: publicationViewMode === "grid" ? "rgb(29, 78, 216)" : "white",
                          color: publicationViewMode === "grid" ? "white" : "rgb(29, 78, 216)",
                        }}
                      >
                        <ViewModuleIcon fontSize="small" />
                      </ModernToggleButton>
                      <ModernToggleButton 
                        value="list" 
                        aria-label="list view"
                        sx={{ 
                          width: '25%',
                          bgcolor: publicationViewMode === "list" ? "rgb(29, 78, 216)" : "white",
                          color: publicationViewMode === "list" ? "white" : "rgb(29, 78, 216)",
                        }}
                      >
                        <ViewListIcon fontSize="small" />
                      </ModernToggleButton>
                      <ModernToggleButton 
                        value="timeline" 
                        aria-label="timeline view"
                        sx={{ 
                          width: '25%',
                          bgcolor: publicationViewMode === "timeline" ? "rgb(29, 78, 216)" : "white",
                          color: publicationViewMode === "timeline" ? "white" : "rgb(29, 78, 216)",
                        }}
                      >
                        <ViewTimelineIcon fontSize="small" />
                      </ModernToggleButton>
                      <ModernToggleButton 
                        value="table" 
                        aria-label="table view"
                        sx={{ 
                          borderTopRightRadius: 30,
                          borderBottomRightRadius: 30,
                          width: '25%',
                          bgcolor: publicationViewMode === "table" ? "rgb(29, 78, 216)" : "white",
                          color: publicationViewMode === "table" ? "white" : "rgb(29, 78, 216)",
                        }}
                      >
                        <TableChartIcon fontSize="small" />
                      </ModernToggleButton>
                    </ModernToggleButtonGroup>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <ModernButton
                    variant="outlined"
                    size="small"
                    startIcon={<SortIcon />}
                    onClick={toggleSortOptions}
                    sx={{ 
                      borderRadius: 30,
                      fontSize: '0.75rem',
                    }}
                  >
                    Sort By
                  </ModernButton>
                  
                  <Collapse in={showSortOptions} orientation="horizontal">
                    <FormControl variant="outlined" size="small" sx={{ ml: 1, minWidth: 150 }}>
                      <ModernSelect
                        value={sortBy}
                        onChange={handleSortChange}
                        sx={{ borderRadius: 30 }}
                      >
                        <MenuItem value="relevance">Relevance</MenuItem>
                        <MenuItem value="year_desc">Newest First</MenuItem>
                        <MenuItem value="year_asc">Oldest First</MenuItem>
                        <MenuItem value="citations_desc">Most Cited</MenuItem>
                        <MenuItem value="citations_asc">Least Cited</MenuItem>
                      </ModernSelect>
                    </FormControl>
                  </Collapse>
                </Box>
                
                {publications.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <ModernButton
                      variant="outlined"
                      size="small"
                      startIcon={<CloudDownloadIcon />}
                      onClick={exportToCsv}
                      sx={{ 
                        borderRadius: 30,
                        fontSize: '0.75rem',
                      }}
                    >
                      Export CSV
                    </ModernButton>
                  </Box>
                )}
              </Box>
            </ModernSearchBar>

            <AdvancedFilters />

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, my: 4 }}>
                <GridLoader size={20} color="rgb(29, 78, 216)" />
              </Box>
            )}

            {error && (
              <Card sx={{ borderRadius: 3, mb: 4, backgroundColor: (theme) => alpha(theme.palette.error.light, 0.1), boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <Typography color="error" align="center" variant="h6">{error}</Typography>
                </CardContent>
              </Card>
            )}

            {!loading && (
              <>
                {researcherData.length > 0 && (
                  <Box sx={{ mb: 5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      mb: 3,
                      pb: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'rgba(29, 78, 216, 0.2)'
                    }}>
                      <PersonIcon sx={{ color: 'rgb(29, 78, 216)', fontSize: '1.5rem' }} />
                      <Typography variant="h5" sx={{ color: 'rgb(30, 64, 175)', fontWeight: 600 }}>Researchers</Typography>
                      <Chip 
                        label={researcherData.length} 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 1, boxShadow: '0 2px 8px rgba(29, 78, 216, 0.2)', borderRadius: 20 }} 
                      />
                    </Box>
                    
                    <Grid container spacing={3} alignItems="stretch">
                      {researcherData.map((researcher, index) => (
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4} 
                          key={index}
                          sx={{ 
                            display: 'flex',
                            height: '100%'
                          }}
                        >
                          <ResearcherCard researcher={researcher} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {publications.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center', 
                      mb: 3,
                      pb: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'rgba(29, 78, 216, 0.2)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ArticleIcon sx={{ color: 'rgb(29, 78, 216)', fontSize: '1.5rem' }} />
                        <Typography variant="h5" sx={{ color: 'rgb(30, 64, 175)', fontWeight: 600 }}>Publications</Typography>
                        <Chip 
                          label={publications.length} 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1, boxShadow: '0 2px 8px rgba(29, 78, 216, 0.2)', borderRadius: 20 }} 
                        />
                        {lastSearchQuery && (
                          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                            for: "{lastSearchQuery}"
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box>
                      {publicationViewMode === 'list' && paginatedPublications.map((pub, index) => (
                        <PublicationListItem key={index} publication={pub} />
                      ))}
                      
                      {publicationViewMode === 'grid' && (
                        <PublicationGridView publications={paginatedPublications} />
                      )}
                      
                      {publicationViewMode === 'timeline' && (
                        <PublicationTimelineView publicationsByYear={publicationsByYear} />
                      )}
                      
                      {publicationViewMode === 'table' && (
                        <PublicationTableView publications={paginatedPublications} />
                      )}
                    </Box>
                    
                    {publicationViewMode !== 'timeline' && publications.length > rowsPerPage && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination 
                          count={Math.ceil(publications.length / rowsPerPage)} 
                          page={page} 
                          onChange={handleChangePage}
                          color="primary" 
                          shape="rounded"
                          showFirstButton
                          showLastButton
                          size="large"
                          sx={{
                            '& .MuiPaginationItem-root': {
                              borderRadius: 8,
                              '&.Mui-selected': {
                                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.2)',
                              }
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {!loading && researcherData.length === 0 && publications.length === 0 && !error && (
                  <Card sx={{ 
                    borderRadius: 3, 
                    mb: 4, 
                    bgcolor: (theme) => alpha(theme.palette.info.light, 0.05),
                    boxShadow: '0 8px 24px rgba(29, 78, 216, 0.05)',
                    border: '1px dashed rgba(29, 78, 216, 0.2)'
                  }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                      <SearchIcon sx={{ fontSize: 70, color: 'rgb(29, 78, 216)', mb: 3, opacity: 0.7 }} />
                      <Typography variant="h5" sx={{ color: 'rgb(30, 64, 175)', fontWeight: 600, mb: 1.5 }}>
                        Start Your Search 
                      </Typography>
                      <Typography align="center" color="text.secondary" variant="body1">
                        Enter a researcher name, publication title, or select a department to begin exploring
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </Box>
        </div>
      </div>
      
      <PublicationDetailDialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        publication={selectedPublication}
      />
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </ThemeProvider>
  );
}

export default SearchTable;