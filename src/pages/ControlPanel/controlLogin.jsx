import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // تأكد من المسار الصحيح

const ControlPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const adminsRef = collection(db, 'admins');

      // جلب بيانات المستخدمين
      const userSnapshot = await getDocs(usersRef);
      const adminSnapshot = await getDocs(adminsRef);

      // دمج البيانات من المستخدمين والإداريين
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || 'N/A',
        firstName: doc.data().firstName || 'N/A',
        lastName: doc.data().lastName || 'N/A',
        role: 'User',
        createdAt: doc.data().createdAt || new Date().toISOString(), // تأكد من وجود تاريخ التسجيل
      }));

      const adminList = adminSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || 'N/A',
        firstName: doc.data().firstName || 'N/A',
        lastName: doc.data().lastName || 'N/A',
        role: 'Admin',
        createdAt: doc.data().createdAt || new Date().toISOString(), // تأكد من وجود تاريخ التسجيل
      }));

      // دمج القائمتين
      const allUsers = [...userList, ...adminList];
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2">User ID</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">First Name</th>
            <th className="border px-4 py-2">Last Name</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Date Registered</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? users.map(user => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.firstName}</td>
              <td className="border px-4 py-2">{user.lastName}</td>
              <td className="border px-4 py-2">{user.role}</td>
              <td className="border px-4 py-2">{new Date(user.createdAt).toLocaleDateString() || 'N/A'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" className="border px-4 py-2 text-center">No registered users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ControlPanel;
