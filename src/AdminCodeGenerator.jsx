import React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';  

const AdminCodeGenerator = () => {
  const generateAdminCode = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const addAdminCodeToFirestore = async (code) => {
    try {
      await setDoc(doc(db, 'admin_codes', code), {
        code: code,
        valid: true,
      });
      console.log('Admin code added successfully!');
    } catch (error) {
      console.error('Error adding admin code:', error);
    }
  };


  const handleGenerate = () => {
    const adminCode = generateAdminCode(12); 
    addAdminCodeToFirestore(adminCode);
  };


  return (
    <div>
      <h2>Generate Admin Code</h2>
      <button onClick={handleGenerate}>Generate Code</button>
    </div>
  );
};

export default AdminCodeGenerator;
