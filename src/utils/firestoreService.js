import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 


export const updateUserRole = async (uid, newRole) => {
  try {
    const userDocRef = doc(db, `users/${uid}`);
    await updateDoc(userDocRef, {
      role: newRole,
    });
    console.log('User role updated successfully');
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};
