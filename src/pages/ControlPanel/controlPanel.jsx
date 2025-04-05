import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import emailjs from 'emailjs-com';
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

const ControlPanel = () => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [adminEmail, setAdminEmail] = useState('');

  const departments = ['All', 'dept_cs', 'dept_it', 'dept_sn', 'dept_se'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const adminsRef = collection(db, 'admins');
      const pendingUsersRef = collection(db, 'pendingUsers'); 

      const userSnapshot = await getDocs(usersRef);
      const adminSnapshot = await getDocs(adminsRef);
      const pendingSnapshot = await getDocs(pendingUsersRef);

      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || 'N/A',
        firstName: doc.data().firstName || 'N/A',
        lastName: doc.data().lastName || 'N/A',
        department: doc.data().department || 'N/A',
        googleScholarLink: doc.data().googleScholarLink || 'N/A',
        role: 'User',
      }));

      const adminList = adminSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || 'N/A',
        firstName: doc.data().firstName || 'N/A',
        lastName: doc.data().lastName || 'N/A',
        role: 'Admin',
      }));

      const pendingList = pendingSnapshot.docs.map(doc => ({ 
        id: doc.id,
        email: doc.data().email || 'N/A',
        firstName: doc.data().firstName || 'N/A',
        lastName: doc.data().lastName || 'N/A',
      }));

      setUsers(userList);
      setAdmins(adminList);
      setPendingUsers(pendingList); 
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, isAdmin) => {
    try {
      if (isAdmin) {
        await deleteDoc(doc(db, 'admins', userId));
      } else {
        await deleteDoc(doc(db, 'users', userId));
      }
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  };

  const sendEmail = (userEmail, registrationLink) => {
    const templateParams = {
      email: userEmail,
      registration_link: registrationLink,
    };

    emailjs.send('service_xwxd76g', 'template_ot7w717', templateParams, 'TogpmdmQpVJE5hH3Y')
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        message.success(`Email sent to ${userEmail}`);
      }, (error) => {
        console.error('FAILED...', error);
        message.error(`Failed to send email: ${error.message}`);
      });
  };

  const createUniqueLink = (email) => {
    if (!email) {
      message.error("Please enter the email.");
      return;
    }

    const uniqueID = uuidv4();
    const registrationLink = `https://litrix-f06e0.web.app/admin-signup?token=${uniqueID}`;
    sendEmail(email, registrationLink);
    setAdminEmail(''); 
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = selectedDepartment === 'All' ? users : users.filter(user => user.department === selectedDepartment);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 overflow-y-auto h-screen"> 
      <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
      
      <div className="mb-4">
        <label className="mr-2">Select Department:</label>
        <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="border rounded px-3 py-1">
          {departments.map(department => (
            <option key={department} value={department}>{department}</option>
          ))}
        </select>
      </div>

      <h3 className="text-lg font-semibold mb-2">Researchers</h3>
      <table className="min-w-full bg-white border border-gray-300 mb-4">
        <thead>
          <tr>
            <th className="border px-4 py-2">User ID</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">First Name</th>
            <th className="border px-4 py-2">Last Name</th>
            <th className="border px-4 py-2">Department</th>
            <th className="border px-4 py-2">Google Scholar Link</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.firstName}</td>
              <td className="border px-4 py-2">{user.lastName}</td>
              <td className="border px-4 py-2">{user.department}</td>
              <td className="border px-4 py-2">
                <a href={user.googleScholarLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{user.googleScholarLink}</a>
              </td>
              <td className="border px-4 py-2">
                <button onClick={() => handleDeleteUser(user.id, false)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="7" className="border px-4 py-2 text-center">No researchers found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mb-2">Admins</h3>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2">User ID</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">First Name</th>
            <th className="border px-4 py-2">Last Name</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.length > 0 ? admins.map(admin => (
            <tr key={admin.id}>
              <td className="border px-4 py-2">{admin.id}</td>
              <td className="border px-4 py-2">{admin.email}</td>
              <td className="border px-4 py-2">{admin.firstName}</td>
              <td className="border px-4 py-2">{admin.lastName}</td>
              <td className="border px-4 py-2">
                <button onClick={() => handleDeleteUser(admin.id, true)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" className="border px-4 py-2 text-center">No admins found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mb-2">Pending Profiles</h3> 
      <table className="min-w-full bg-white border border-gray-300 mb-4">
        <thead>
          <tr>
            <th className="border px-4 py-2">User ID</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">First Name</th>
            <th className="border px-4 py-2">Last Name</th>
          </tr>
        </thead>
        <tbody>
          {pendingUsers.length > 0 ? pendingUsers.map(user => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.firstName}</td>
              <td className="border px-4 py-2">{user.lastName}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="border px-4 py-2 text-center">No pending profiles found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Send Registration Link to Admin</h3>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="Enter admin email"
          className="border rounded px-3 py-1 mb-2"
        />
        <button onClick={() => createUniqueLink(adminEmail)} className="bg-blue-500 text-white rounded px-4 py-2">Send Link</button>
      </div>
    </div>
  );
};

export default ControlPanel;
