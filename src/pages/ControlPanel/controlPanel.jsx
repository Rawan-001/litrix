import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, deleteDoc, setDoc, addDoc, serverTimestamp, query, where, collectionGroup } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import NotificationButton from '../ControlPanel/NotificationButton';

import { 
  message, 
  Modal, 
  Tabs, 
  Spin, 
  Button, 
  Input, 
  Select, 
  Badge, 
  Empty, 
  Layout, 
  Space, 
  Card, 
  Tooltip, 
  Collapse, 
  Tag 
} from 'antd';
import { 
  ExclamationCircleOutlined, 
  MailOutlined, 
  ReloadOutlined,
  UserAddOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined, 
  SearchOutlined,
  SendOutlined,
  IdcardOutlined,
  EditOutlined,
  BookOutlined,
  FileTextOutlined,
  CopyOutlined,
  TeamOutlined,
  LockOutlined
} from '@ant-design/icons';




const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;
const { Header, Content } = Layout;
const { Panel } = Collapse;

const ControlPanel = () => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [academicAdmins, setAcademicAdmins] = useState([]);
  const [departmentAdmins, setDepartmentAdmins] = useState([]); 
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [newUserDepartment, setNewUserDepartment] = useState(''); 
  const [activeTab, setActiveTab] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [scholarIdModalVisible, setScholarIdModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [scholarId, setScholarId] = useState('');
  const [googleScholarUrl, setGoogleScholarUrl] = useState('');
  const [userPublications, setUserPublications] = useState({});
  const [publicationsLoading, setPublicationsLoading] = useState({});
  const [publicationsModalVisible, setPublicationsModalVisible] = useState(false);
  const [currentPublications, setCurrentPublications] = useState([]);
  const [currentViewingUser, setCurrentViewingUser] = useState(null);

  const departments = [
    { value: 'All', label: 'All Departments' },
    { value: 'dept_cs', label: 'Computer Science' },
    { value: 'dept_it', label: 'Information Technology' },
    { value: 'dept_sn', label: 'Systems & Networks' },
    { value: 'dept_se', label: 'Software Engineering' }
  ];
  const roles = [
    { value: 'researcher', label: 'Researcher' },
    { value: 'admin', label: 'System Admin' },
    { value: 'academic_admin', label: 'Academic Admin' },
    { value: 'department_admin', label: 'Department Admin' } 
  ];

  const extractScholarIdFromUrl = (url) => {
    try {
      if (!url) return '';
      if (url.includes('scholar.google.com')) {
        const match = url.match(/[?&]user=([^&#]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      return url;
    } catch (error) {
      console.error("Error extracting Scholar ID from URL:", error);
      return url;
    }
  };

  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const adminsRef = collection(db, 'admins');
      const academicAdminsRef = collection(db, 'academicAdmins');
      const departmentAdminsRef = collection(db, 'departmentAdmins'); 
      const pendingUsersRef = collection(db, 'pendingUsers');

      let userSnapshot, adminSnapshot, academicAdminSnapshot, departmentAdminSnapshot, pendingSnapshot;
      try {
        userSnapshot = await getDocs(usersRef);
      } catch (error) {
        console.error("Error fetching users:", error);
        userSnapshot = { docs: [] };
      }
      try {
        adminSnapshot = await getDocs(adminsRef);
      } catch (error) {
        console.error("Error fetching admins:", error);
        adminSnapshot = { docs: [] };
      }
      try {
        academicAdminSnapshot = await getDocs(academicAdminsRef);
      } catch (error) {
        console.error("Error fetching academic admins:", error);
        academicAdminSnapshot = { docs: [] };
      }
      try {
        departmentAdminSnapshot = await getDocs(departmentAdminsRef);
      } catch (error) {
        console.error("Error fetching department admins:", error);
        departmentAdminSnapshot = { docs: [] };
      }
      try {
        pendingSnapshot = await getDocs(pendingUsersRef);
      } catch (error) {
        console.error("Error fetching pending users:", error);
        pendingSnapshot = { docs: [] };
      }

      const userList = userSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'N/A',
            firstName: data.firstName || 'N/A',
            lastName: data.lastName || 'N/A',
            department: data.department || 'N/A',
            googleScholarLink: data.googleScholarLink || 'N/A',
            scholarId: data.scholarId || data.scholar_id || 'N/A',
            scholar_id: data.scholar_id || data.scholarId || 'N/A',
            role: 'researcher',
          };
        } catch (e) {
          console.error(`Error processing user document ${doc.id}:`, e);
          return {
            id: doc.id,
            email: 'Error',
            firstName: 'Error',
            lastName: 'Error',
            department: 'N/A',
            googleScholarLink: 'N/A',
            scholarId: 'N/A',
            scholar_id: 'N/A',
            role: 'researcher',
          };
        }
      });
      const adminList = adminSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'N/A',
            firstName: data.firstName || 'N/A',
            lastName: data.lastName || 'N/A',
            department: data.department || 'N/A',
            googleScholarLink: data.googleScholarLink || 'N/A',
            scholarId: data.scholarId || data.scholar_id || 'N/A',
            scholar_id: data.scholar_id || data.scholarId || 'N/A',
            role: 'admin',
          };
        } catch (e) {
          console.error(`Error processing admin document ${doc.id}:`, e);
          return {
            id: doc.id,
            email: 'Error',
            firstName: 'Error',
            lastName: 'Error',
            department: 'N/A',
            googleScholarLink: 'N/A',
            scholarId: 'N/A',
            scholar_id: 'N/A',
            role: 'admin',
          };
        }
      });
      const academicAdminList = academicAdminSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'N/A',
            firstName: data.firstName || 'N/A',
            lastName: data.lastName || 'N/A',
            department: data.department || 'N/A',
            scholarId: data.scholarId || data.scholar_id || 'N/A',
            scholar_id: data.scholar_id || data.scholarId || 'N/A',
            googleScholarLink: data.googleScholarLink || 'N/A',
            role: 'academic_admin',
          };
        } catch (e) {
          console.error(`Error processing academic admin document ${doc.id}:`, e);
          return {
            id: doc.id,
            email: 'Error',
            firstName: 'Error',
            lastName: 'Error',
            department: 'N/A',
            scholarId: 'N/A',
            scholar_id: 'N/A',
            googleScholarLink: 'N/A',
            role: 'academic_admin',
          };
        }
      });
      const departmentAdminList = departmentAdminSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'N/A',
            firstName: data.firstName || 'N/A',
            lastName: data.lastName || 'N/A',
            department: data.department || 'N/A',
            scholarId: data.scholarId || data.scholar_id || 'N/A',
            scholar_id: data.scholar_id || data.scholarId || 'N/A',
            googleScholarLink: data.googleScholarLink || 'N/A',
            role: 'department_admin',
          };
        } catch (e) {
          console.error(`Error processing department admin document ${doc.id}:`, e);
          return {
            id: doc.id,
            email: 'Error',
            firstName: 'Error',
            lastName: 'Error',
            department: 'N/A',
            scholarId: 'N/A',
            scholar_id: 'N/A',
            googleScholarLink: 'N/A',
            role: 'department_admin',
          };
        }
      });
      const pendingList = pendingSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'N/A',
            firstName: data.firstName || 'N/A',
            lastName: data.lastName || 'N/A',
            requestedRole: data.requestedRole || 'researcher',
            department: data.department || 'N/A', 
            googleScholarLink: data.googleScholarLink || 'N/A',
            scholarId: data.scholarId || data.scholar_id || 'N/A',
            scholar_id: data.scholar_id || data.scholarId || 'N/A',
            createdAt: data.createdAt || null,
          };
        } catch (e) {
          console.error(`Error processing pending user document ${doc.id}:`, e);
          return {
            id: doc.id,
            email: 'Error',
            firstName: 'Error',
            lastName: 'Error',
            requestedRole: 'researcher',
            department: 'N/A',
            googleScholarLink: 'N/A',
            scholarId: 'N/A',
            scholar_id: 'N/A',
            createdAt: null,
          };
        }
      });

      setUsers(userList);
      setAdmins(adminList);
      setAcademicAdmins(academicAdminList);
      setDepartmentAdmins(departmentAdminList); 
      setPendingUsers(pendingList);
      message.success("User data loaded successfully");
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      message.error("Failed to fetch user data: " + error.message);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchUserPublications = async (user) => {
    if (!user || !user.id) {
      message.warning("Invalid user data");
      return [];
    }
    
    setPublicationsLoading(prev => ({ ...prev, [user.id]: true }));
    console.log(`Attempting to fetch publications for ${user.firstName} ${user.lastName} (${user.email})`);
    
    try {
      const scholarId = user.scholarId || user.scholar_id; 
      const scholarIdToUse = (scholarId && scholarId !== 'N/A') 
        ? scholarId 
        : extractScholarIdFromUrl(user.googleScholarLink);
      
      console.log(`Using Scholar ID: ${scholarIdToUse}`);
      
      if (!scholarIdToUse || scholarIdToUse === 'N/A') {
        message.warning("No Scholar ID available. Please add a Google Scholar ID first.");
        setPublicationsLoading(prev => ({ ...prev, [user.id]: false }));
        return [];
      }
      
      let publications = [];
      
      const departments = ['cs', 'it', 'sn', 'se']; 
      
      const deptsToSearch = (user.role === 'department_admin' && user.department && user.department !== 'All' && user.department !== 'N/A')
        ? [user.department.replace('dept_', '')] 
        : departments;
      
      for (const dept of deptsToSearch) {
        try {
          const publicationsPath = `colleges/faculty_computing/departments/${dept}/faculty_members/${scholarIdToUse}/publications`;
          console.log(`Searching in path: ${publicationsPath}`);
          
          const publicationsRef = collection(db, publicationsPath);
          const publicationsSnapshot = await getDocs(publicationsRef);
          
          if (!publicationsSnapshot.empty) {
            console.log(`Found ${publicationsSnapshot.docs.length} publications in ${dept} department`);
            
            const deptPublications = publicationsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || 'Untitled',
                year: data.pub_year || data.year || '',
                journal: data.journal || data.publisher || 'Unknown venue',
                publisher: data.publisher || '',
                url: data.pub_url || data.url || '',
                citations: data.num_citations || 0,
                pages: data.pages || '',
                authors: data.authors || [],
                abstract: data.abstract || '',
                path: publicationsPath + '/' + doc.id,
                ...data
              };
            });
            
            publications = [...publications, ...deptPublications];
          }
        } catch (err) {
          console.error(`Error searching in ${dept} department: ${err.message}`);
        }
      }
      
      if (publications.length === 0 && user.role !== 'department_admin') {
        console.log('No publications found in department paths. Trying collectionGroup query...');
        
        try {
          const publicationsQuery = query(collectionGroup(db, 'publications'));
          const publicationsSnapshot = await getDocs(publicationsQuery);
          
          console.log(`Found ${publicationsSnapshot.docs.length} total publications across all collections`);
          
          const filteredDocs = publicationsSnapshot.docs.filter(doc => {
            const path = doc.ref.path;
            return path.includes(scholarIdToUse);
          });
          
          if (filteredDocs.length > 0) {
            console.log(`Found ${filteredDocs.length} publications via collectionGroup query that match Scholar ID: ${scholarIdToUse}`);
            
            const groupPublications = filteredDocs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                path: doc.ref.path,
                title: data.title || 'Untitled',
                year: data.pub_year || data.year || '',
                journal: data.journal || data.publisher || 'Unknown venue',
                publisher: data.publisher || '',
                url: data.pub_url || data.url || '',
                citations: data.num_citations || 0,
                pages: data.pages || '',
                authors: data.authors || [],
                abstract: data.abstract || '',
                ...data
              };
            });
            
            publications = [...publications, ...groupPublications];
          } else {
            console.log(`No publications found with Scholar ID ${scholarIdToUse} in path`);
          }
        } catch (err) {
          console.error(`Error with collectionGroup query: ${err.message}`);
        }
      }
      
      const uniquePublications = [];
      const titles = new Set();
      
      for (const pub of publications) {
        if (pub.title && !titles.has(pub.title)) {
          titles.add(pub.title);
          uniquePublications.push(pub);
        }
      }
      
      console.log(`Total unique publications found: ${uniquePublications.length}`);
      
      if (uniquePublications.length === 0) {
        message.info(`No publications found for Scholar ID: ${scholarIdToUse}. Make sure the Scholar ID is correct.`);
      }
      
      setUserPublications(prev => ({ ...prev, [user.id]: uniquePublications }));
      return uniquePublications;
    } catch (error) {
      console.error("Error fetching publications:", error);
      message.error(`Failed to fetch publications: ${error.message}`);
      return [];
    } finally {
      setPublicationsLoading(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handleViewPublications = async (user) => {
    setCurrentViewingUser(user);
    setCurrentPublications([]);
    setPublicationsModalVisible(true);
    
    let publications = userPublications[user.id] || [];
    if (publications.length === 0) {
      publications = await fetchUserPublications(user);
    }
    
    if (publications.length === 0) {
      message.info(`No publications found for ${user.firstName} ${user.lastName}`);
    }
    
    setCurrentPublications(publications);
  };

  const handleDeleteUser = async (user) => {
    confirm({
      title: 'Are you sure you want to delete this user?',
      icon: <ExclamationCircleOutlined style={{ color: 'red' }} />,
      content: `You are about to permanently delete user ${user.firstName} ${user.lastName} (${user.email}).`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          let collectionName = getCollectionNameByRole(user.role);
          await deleteDoc(doc(db, collectionName, user.id));
          fetchUsers();
          message.success(`User deleted successfully`);
        } catch (error) {
          console.error("Error deleting user: ", error);
          message.error(`Failed to delete user: ${error.message}`);
        } finally {
          setTableLoading(false);
        }
      },
    });
  };

  const handleChangeUserRole = async (user, newRole) => {
    if (user.role === newRole) return;
    
    const departmentRequired = (newRole === 'department_admin' || newRole === 'academic_admin') && 
                             (!user.department || user.department === 'N/A');
    
    if (departmentRequired) {
      message.error("Department is required for this role. Please set a department first.");
      return;
    }
    
    confirm({
      title: 'Change User Role',
      icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
      content: `Are you sure you want to change ${user.firstName} ${user.lastName}'s role from "${user.role}" to "${newRole}"?`,
      okText: 'Yes, Change',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          
          const userData = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ...(user.department && user.department !== 'N/A' && { department: user.department }),
            ...(user.googleScholarLink && user.googleScholarLink !== 'N/A' && { googleScholarLink: user.googleScholarLink }),
            ...(user.scholarId && user.scholarId !== 'N/A' && { scholarId: user.scholarId }),
            ...(user.scholar_id && user.scholar_id !== 'N/A' && { scholar_id: user.scholar_id }),
            ...(!user.scholarId && user.scholar_id && user.scholar_id !== 'N/A' && { scholarId: user.scholar_id }),
            ...(!user.scholar_id && user.scholarId && user.scholarId !== 'N/A' && { scholar_id: user.scholarId }),
            updatedAt: serverTimestamp(),
            roleChangedAt: serverTimestamp(),
            previousRole: user.role
          };
          
          console.log("Transferring user data:", userData);
          
          const currentCollection = getCollectionNameByRole(user.role);
          await deleteDoc(doc(db, currentCollection, user.id));
          
          const newCollection = getCollectionNameByRole(newRole);
          await setDoc(doc(db, newCollection, user.id), userData);
          
          fetchUsers();
          message.success(`User role changed from ${user.role} to ${newRole} successfully`);
        } catch (error) {
          console.error("Error changing user role: ", error);
          message.error(`Failed to change user role: ${error.message}`);
          
          try {
            const originalCollection = getCollectionNameByRole(user.role);
            const userData = {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              ...(user.department && user.department !== 'N/A' && { department: user.department }),
              ...(user.googleScholarLink && user.googleScholarLink !== 'N/A' && { googleScholarLink: user.googleScholarLink }),
              ...(user.scholarId && user.scholarId !== 'N/A' && { scholarId: user.scholarId }),
              ...(user.scholar_id && user.scholar_id !== 'N/A' && { scholar_id: user.scholar_id })
            };
            await setDoc(doc(db, originalCollection, user.id), userData);
            message.info("Restored original role due to error");
          } catch (restoreError) {
            console.error("Error restoring original role:", restoreError);
            message.error("Critical error occurred. Please refresh the page.");
          }
        } finally {
          setTableLoading(false);
        }
      },
    });
  };
  
  const getCollectionNameByRole = (role) => {
    switch (role) {
      case 'admin':
        return 'admins';
      case 'academic_admin':
        return 'academicAdmins';
      case 'department_admin':
        return 'departmentAdmins';
      case 'researcher':
      default:
        return 'users';
    }
  };

  const handleManageScholarId = (user) => {
    setCurrentUser(user);
    setScholarId(user.scholarId !== 'N/A' ? user.scholarId : (user.scholar_id !== 'N/A' ? user.scholar_id : ''));
    setGoogleScholarUrl(user.googleScholarLink !== 'N/A' ? user.googleScholarLink : '');
    setScholarIdModalVisible(true);
  };

  const handleGoogleScholarUrlChange = (e) => {
    const url = e.target.value;
    setGoogleScholarUrl(url);
    if (url && url.includes('scholar.google.com')) {
      const extractedId = extractScholarIdFromUrl(url);
      if (extractedId) {
        setScholarId(extractedId);
      }
    }
  };

  const handleSaveScholarId = async () => {
    if (!currentUser) return;
    try {
      setTableLoading(true);
      const collectionName = getCollectionNameByRole(currentUser.role);
      await setDoc(doc(db, collectionName, currentUser.id), {
        ...currentUser,
        scholarId: scholarId.trim(),
        scholar_id: scholarId.trim(), 
        ...(googleScholarUrl && { googleScholarLink: googleScholarUrl.trim() })
      }, { merge: true });
      message.success('Scholar ID updated successfully');
      setScholarIdModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating Scholar ID: ", error);
      message.error(`Failed to update Scholar ID: ${error.message}`);
    } finally {
      setTableLoading(false);
    }
  };

  const handleDepartmentChange = (user, newDepartment) => {
    confirm({
      title: 'Change Department',
      icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
      content: `Are you sure you want to change ${user.firstName} ${user.lastName}'s department?`,
      okText: 'Yes, Change',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          const collectionName = getCollectionNameByRole(user.role);
          await setDoc(doc(db, collectionName, user.id), {
            ...user,
            department: newDepartment
          }, { merge: true });
          message.success('Department updated successfully');
          fetchUsers();
        } catch (error) {
          console.error("Error updating department: ", error);
          message.error(`Failed to update department: ${error.message}`);
        } finally {
          setTableLoading(false);
        }
      },
    });
  };
  
  const sendInvitationEmail = async (email, link, role, department = null) => {
    try {
      console.log('Email details:', { email, link, role, department });
      
      if (!email || !validateEmail(email)) {
        message.error('email is not corret');
        return false;
      }
      
      if (!link) {
        message.error('missing');
        return false;
      }
      
      if (!role) {
        message.error('missing role');
        return false;
      }
  
      const requestData = {
        to: email,
        registrationLink: link,
        role: role,
        subject: `Invitation to join as ${getRoleName(role)}${department ? ` in ${getDepartmentName(department)}` : ''}`,
      };
      
      if (department && department !== 'All') {
        requestData.department = department;
      }
      
      console.log('Sending request with data:', requestData);
      
      const response = await fetch(
        'https://sendinvitationemailhttp-qjp3uasyaa-uc.a.run.app',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }
      
      console.log('Parsed response:', result);
  
      if (!result.success) {
        throw new Error(result.message || 'Failed to send email');
      }
      
      return true;
    } catch (error) {
      console.error("Error sending email: ", error);
      message.error(`  Failed to send email  : ${error.message}`);
      return false;
    }
  };

  const getRoleName = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : 'User';
  };

  const getDepartmentName = (deptValue) => {
    const deptObj = departments.find(d => d.value === deptValue);
    return deptObj ? deptObj.label : deptValue;
  };
  const createUniqueLink = async () => {
    const uniqueID = uuidv4();
    const registrationLink = `https://litrix-f06e0.web.app/admin-signup?token=${uniqueID}&role=${newUserRole}`;
  
    try {
      const docRef = await addDoc(collection(db, 'invitations'), {
        email: newUserEmail,
        token: uniqueID,
        role: newUserRole,
        department: newUserDepartment !== 'All' ? newUserDepartment : null,
        registrationLink: registrationLink,
        subject: `Invitation to join as ${getRoleName(newUserRole)}${newUserDepartment && newUserDepartment !== 'All' ? ` in ${getDepartmentName(newUserDepartment)}` : ''}`,
        createdAt: serverTimestamp(),
        sent: false,
        status: 'pending',
        needsEmail: true
      });
  
      setInvitationLoading(false);
      message.success(`Invitation created for ${newUserEmail}. The system will send an email shortly.`);
      setNewUserEmail('');
      setNewUserDepartment('');
  
      setTimeout(async () => {
        const updatedSnap = await getDoc(docRef);
        const updatedData = updatedSnap.data();
        if (updatedData?.sent) {
          message.success('Email sent successfully ✅');
        } else if (updatedData?.status === 'error') {
          message.error('❌ Failed to send email: ' + (updatedData?.errorMessage || 'Unknown error'));
        } else {
          message.warning('Email may be delayed. Check back later.');
        }
      }, 4000);
  
      setGeneratedLink(registrationLink);
      setShowLinkModal(true);
    } catch (error) {
      console.error("Error storing invitation: ", error);
      message.error(`Failed to store invitation: ${error.message}`);
      setInvitationLoading(false);
    }
  };
  

  const handleLinkModalClose = () => {
    setShowLinkModal(false);
    setNewUserEmail('');
    setNewUserDepartment('');
    setGeneratedLink('');
  };

  const handlePendingUserApproval = async (user, approve) => {
    try {
      setTableLoading(true);
      if (approve) {
        confirm({
          title: 'Confirm User Approval',
          icon: <CheckCircleOutlined style={{ color: 'green' }} />,
          content: `Are you sure you want to approve ${user.firstName} ${user.lastName} (${user.email}) as a ${user.requestedRole}${user.department && user.department !== 'N/A' ? ` in the ${getDepartmentName(user.department)} department` : ''}?`,
          okText: 'Yes, Approve',
          cancelText: 'Cancel',
          onOk: async () => {
            try {
              const collectionName = getCollectionNameByRole(user.requestedRole || 'researcher');
              const userData = {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                ...(user.department && user.department !== 'N/A' && { department: user.department }),
                ...(user.googleScholarLink && user.googleScholarLink !== 'N/A' && { googleScholarLink: user.googleScholarLink }),
                ...(user.scholarId && user.scholarId !== 'N/A' && { scholarId: user.scholarId }),
                ...(user.scholar_id && user.scholar_id !== 'N/A' && { scholar_id: user.scholar_id }),
                ...(!user.scholarId && user.scholar_id && user.scholar_id !== 'N/A' && { scholarId: user.scholar_id }),
                ...(!user.scholar_id && user.scholarId && user.scholarId !== 'N/A' && { scholar_id: user.scholarId }),
                approvedAt: serverTimestamp()
              };
              
              await setDoc(doc(db, collectionName, user.id), userData);
              await deleteDoc(doc(db, 'pendingUsers', user.id));
              fetchUsers();
              message.success(`User approved successfully`);
            } catch (error) {
              console.error("Error approving user: ", error);
              message.error(`Failed to approve user: ${error.message}`);
            } finally {
              setTableLoading(false);
            }
          },
        });
      } else {
        confirm({
          title: 'Confirm User Rejection',
          icon: <CloseCircleOutlined style={{ color: 'red' }} />,
          content: `Are you sure you want to reject ${user.firstName} ${user.lastName}'s (${user.email}) request?`,
          okText: 'Yes, Reject',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: async () => {
            try {
              await deleteDoc(doc(db, 'pendingUsers', user.id));
              fetchUsers();
              message.info(`User request rejected`);
            } catch (error) {
              console.error("Error rejecting user: ", error);
              message.error(`Failed to reject user request: ${error.message}`);
            } finally {
              setTableLoading(false);
            }
          },
        });
      }
    } catch (error) {
      console.error("Error processing pending user: ", error);
      message.error(`Failed to process user request: ${error.message}`);
      setTableLoading(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const filterBySearchText = (item) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      item.email.toLowerCase().includes(searchLower) ||
      item.firstName.toLowerCase().includes(searchLower) ||
      item.lastName.toLowerCase().includes(searchLower) ||
      (item.department && item.department.toLowerCase().includes(searchLower)) ||
      (item.scholarId && item.scholarId.toLowerCase().includes(searchLower))
    );
  };

  const filterByDepartment = (item) => {
    if (selectedDepartment === 'All') return true;
    return item.department === selectedDepartment;
  };

  const canManageUser = (manager, user) => {
    if (manager.role === 'admin') return true;
    
    if (manager.role === 'academic_admin' && (user.role === 'researcher' || user.role === 'department_admin')) {
      return true;
    }
    
    if (manager.role === 'department_admin' && user.role === 'researcher') {
      return manager.department === user.department;
    }
    
    return false;
  };

  const filteredUsers = users.filter(user => filterByDepartment(user) && filterBySearchText(user));
  const filteredAcademicAdmins = academicAdmins.filter(admin => filterByDepartment(admin) && filterBySearchText(admin));
  const filteredDepartmentAdmins = departmentAdmins.filter(admin => filterByDepartment(admin) && filterBySearchText(admin));
  const filteredAdmins = admins.filter(admin => filterBySearchText(admin));
  const filteredPendingUsers = pendingUsers.filter(user => filterBySearchText(user));

  useEffect(() => {
    try {
      fetchUsers();
    } catch (error) {
      console.error("Error in initial fetchUsers:", error);
      message.error("Failed to load initial data. Please try refreshing the page.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (newUserRole === 'department_admin' || newUserRole === 'academic_admin') {
      if (!newUserDepartment) {
        const firstDept = departments.find(d => d.value !== 'All');
        if (firstDept) setNewUserDepartment(firstDept.value);
      }
    } else {
      setNewUserDepartment('');
    }
  }, [newUserRole]);


const renderUserTable = (
  users,
  roleType,
  showDepartment = false,
  showScholar = false,
  showScholarId = false,
  showPublications = false,
  allowDepartmentChange = false
) => (
  <div className="overflow-hidden mb-0">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold text-gray-800">{roleType}</h3>
      <Badge count={users.length} showZero overflowCount={999} style={{ backgroundColor: '#1890ff' }} />
    </div>
    <div className="overflow-x-auto">
      <Spin spinning={tableLoading} tip="Loading...">
        {users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                {showDepartment && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                )}
                {showScholar && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Scholar
                  </th>
                )}
                {showScholarId && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scholar ID
                  </th>
                )}
                {showPublications && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publications
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change Role
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.firstName}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.lastName}</td>

                  {showDepartment && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {allowDepartmentChange ? (
                        <Select
                          defaultValue={user.department}
                          style={{ width: 170 }}
                          onChange={value => handleDepartmentChange(user, value)}
                        >
                          {departments
                            .filter(d => d.value !== 'All')
                            .map(d => (
                              <Option key={d.value} value={d.value}>
                                {d.label}
                              </Option>
                            ))}
                        </Select>
                      ) : (
                        getDepartmentName(user.department)
                      )}
                    </td>
                  )}

                  {showScholar && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {user.googleScholarLink && user.googleScholarLink !== 'N/A' ? (
                        <a
                          href={user.googleScholarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Profile
                        </a>
                      ) : (
                        <span className="text-gray-400">Not Available</span>
                      )}
                    </td>
                  )}

                  {showScholarId && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {user.scholarId && user.scholarId !== 'N/A'
                        ? user.scholarId
                        : user.scholar_id && user.scholar_id !== 'N/A'
                        ? user.scholar_id
                        : extractScholarIdFromUrl(user.googleScholarLink)}
                    </td>
                  )}

                  {showPublications && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <Button
                        type="primary"
                        size="small"
                        icon={<BookOutlined />}
                        onClick={() => handleViewPublications(user)}
                      >
                        View
                      </Button>
                    </td>
                  )}

                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    <Select
                      defaultValue={user.role}
                      style={{ width: 170 }}
                      onChange={value => handleChangeUserRole(user, value)}
                    >
                      {roles.map(r => (
                        <Option key={r.value} value={r.value}>
                          {r.label}
                        </Option>
                      ))}
                    </Select>
                  </td>

                  {/* Actions: Send Notification, Delete, Manage Scholar ID */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  <Space size="middle">
                      <NotificationButton recipientId={user.id}>
                      <Button 
        type="primary" 
        size="small" 
        icon={<SendOutlined />} 
        title="Send Notification"
      />
    </NotificationButton>

                      <Tooltip title="Delete User">
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteUser(user)}
                        />
                      </Tooltip>

                      {(showScholar || showScholarId) && (
                        <Tooltip title="Manage Scholar ID">
                          <Button
                            type="link"
                            icon={<IdcardOutlined />}
                            onClick={() => handleManageScholarId(user)}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty description="No users found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </div>
  </div>
);

  
  
  const renderPendingUsersTable = () => (
    <div className="overflow-hidden mb-0">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Pending User Requests</h3>
        <Badge count={filteredPendingUsers.length} showZero overflowCount={999} style={{ backgroundColor: '#faad14' }} />
      </div>
      <div className="overflow-x-auto">
        <Spin spinning={tableLoading} tip="Loading...">
          {filteredPendingUsers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Role</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPendingUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.firstName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.lastName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {user.requestedRole}
                      {user.requestedRole === 'department_admin' && 
                        <Tag color="blue" className="ml-2">Department-specific</Tag>
                      }
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {user.department && user.department !== 'N/A'
                        ? getDepartmentName(user.department)
                        : 'None'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Space size="small">
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handlePendingUserApproval(user, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          danger
                          size="small"
                          icon={<CloseCircleOutlined />}
                          onClick={() => handlePendingUserApproval(user, false)}
                        >
                          Reject
                        </Button>
                      </Space>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty description="No pending requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </div>
    </div>
  );
  
  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm px-4 py-0 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Control Panel</h1>
        <div className="flex items-center">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchUsers} 
            loading={loading}
            className="mr-2"
          >
            Refresh
          </Button>
        </div>
      </Header>
      <Content className="p-6">
        <Spin spinning={loading} tip="Loading initial data...">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-bold mb-4">Invite New Users</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{ width: 250 }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <Select
                  value={newUserRole}
                  style={{ width: 200 }}
                  onChange={(value) => setNewUserRole(value)}
                >
                  {roles.map((role) => (
                    <Option key={role.value} value={role.value}>{role.label}</Option>
                  ))}
                </Select>
              </div>
              
              {(newUserRole === 'department_admin' || newUserRole === 'academic_admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <Select
                    value={newUserDepartment}
                    style={{ width: 200 }}
                    onChange={(value) => setNewUserDepartment(value)}
                  >
                    {departments.filter(dept => dept.value !== 'All').map((dept) => (
                      <Option key={dept.value} value={dept.value}>{dept.label}</Option>
                    ))}
                  </Select>
                </div>
              )}
              
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={createUniqueLink}
                loading={invitationLoading}
              >
                Send Invitation
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">Manage Users</h2>
              <div className="flex items-center">
                <Input
                  prefix={<SearchOutlined className="text-gray-400" />}
                  placeholder="Search users..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250, marginRight: 16 }}
                />
                <Select
                  value={selectedDepartment}
                  style={{ width: 200 }}
                  onChange={(value) => setSelectedDepartment(value)}
                >
                  {departments.map((dept) => (
                    <Option key={dept.value} value={dept.value}>{dept.label}</Option>
                  ))}
                </Select>
              </div>
            </div>

            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              type="card"
            >
              <TabPane 
                tab={
                  <span>
                    <FileTextOutlined />
                    Pending Requests
                    <Badge 
                      count={filteredPendingUsers.length} 
                      style={{ marginLeft: 8 }} 
                      showZero={false}
                    />
                  </span>
                } 
                key="1"
              >
                {renderPendingUsersTable()}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <UserAddOutlined />
                    Researchers
                  </span>
                } 
                key="2"
              >
                {renderUserTable(
                  filteredUsers, 
                  "Researchers", 
                  true, 
                  true, 
                  true,
                  true,
                  true
                )}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <BookOutlined />
                    Academic Admins
                  </span>
                } 
                key="3"
              >
                {renderUserTable(
                  filteredAcademicAdmins, 
                  "Academic Administrators", 
                  true, 
                  true, 
                  true,
                  true,
                  true
                )}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <LockOutlined />
                    Department Admins
                  </span>
                } 
                key="4"
              >
                {renderUserTable(
                  filteredDepartmentAdmins, 
                  "Department Administrators", 
                  true, 
                  true, 
                  true,
                  true,
                  true
                )}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <EditOutlined />
                    System Admins
                  </span>
                } 
                key="5"
              >
                {renderUserTable(filteredAdmins, "System Administrators")}
              </TabPane>
            </Tabs>
          </div>
        </Spin>
      </Content>

      <Modal
        title="Manage Google Scholar ID"
        visible={scholarIdModalVisible}
        onCancel={() => setScholarIdModalVisible(false)}
        onOk={handleSaveScholarId}
        okText="Save"
        confirmLoading={tableLoading}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google Scholar Profile URL
          </label>
          <Input
            placeholder="https://scholar.google.com/citations?user=..."
            value={googleScholarUrl}
            onChange={handleGoogleScholarUrlChange}
          />
          <div className="text-xs text-gray-500 mt-1">
            Enter the full URL to the Google Scholar profile
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scholar ID
          </label>
          <Input
            placeholder="Scholar ID"
            value={scholarId}
            onChange={(e) => setScholarId(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
          Automatically extracted from the URL
          </div>
        </div>
      </Modal>

      <Modal
        title="Registration Link"
        visible={showLinkModal}
        onCancel={handleLinkModalClose}
        footer={[
          <Button key="close" onClick={handleLinkModalClose}>
            Close
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(generatedLink);
              message.success('Link copied to clipboard');
            }}
          >
            Copy Link
          </Button>,
        ]}
      >
        <p className="mb-4">Share this link with the user to complete their registration:</p>
        <Input.TextArea
          value={generatedLink}
          autoSize={{ minRows: 2, maxRows: 3 }}
          readOnly
        />
      </Modal>

      <Modal
        title={currentViewingUser ? `Publications - ${currentViewingUser.firstName} ${currentViewingUser.lastName}` : 'Publications'}
        visible={publicationsModalVisible}
        onCancel={() => setPublicationsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPublicationsModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <Spin spinning={currentViewingUser && publicationsLoading[currentViewingUser.id]}>
          {currentPublications.length > 0 ? (
            <div>
              <div className="mb-4">
                <strong>Total Publications:</strong> {currentPublications.length}
              </div>
              <Collapse accordion className="publication-list">
                {currentPublications.map((pub, index) => (
                  <Panel 
                    key={pub.id || index} 
                    header={
                      <div>
                        <div className="font-medium">{pub.title}</div>
                        <div className="text-sm text-gray-500">
                          {pub.pub_year || pub.year || ''} • {pub.journal || pub.publisher || pub.conference || 'Unknown venue'}
                          {pub.num_citations ? ` • ${pub.num_citations} citations` : ''}
                        </div>
                      </div>
                    }
                  >
                    <Card bordered={false} className="bg-gray-50">
                      {pub.authors && pub.authors.length > 0 && (
                        <div className="mb-2">
                          <strong>Authors:</strong> {Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}
                        </div>
                      )}
                      {pub.publisher && (
                        <div className="mb-2">
                          <strong>Publisher:</strong> {pub.publisher}
                        </div>
                      )}
                      {pub.pages && (
                        <div className="mb-2">
                          <strong>Pages:</strong> {pub.pages}
                        </div>
                      )}
                      {pub.abstract && (
                        <div className="mb-2">
                          <strong>Abstract:</strong> {pub.abstract}
                        </div>
                      )}
                      {(pub.pub_url || pub.url) && (
                        <div>
                          <a 
                            href={pub.pub_url || pub.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Publication
                          </a>
                        </div>
                      )}
                    </Card>
                  </Panel>
                ))}
              </Collapse>
            </div>
          ) : (
            <Empty description="No publications found" />
          )}
        </Spin>
      </Modal>
    </Layout>
  );
};

export default ControlPanel;