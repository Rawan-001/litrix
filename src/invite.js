import { db } from '../firebaseConfig'; 
import { doc, setDoc } from 'firebase/firestore';

export const generateInviteLink = async (adminEmail) => {
    const uniqueToken = generateUniqueToken();
    const inviteLink = `https://litrix-f06e0.web.app/invite?token=abc123xyz
`;
    
    await storeInviteToken(adminEmail, uniqueToken); 
    
    return inviteLink;
};

export const generateUniqueToken = () => {
    return Math.random().toString(36).substr(2, 9); 
};

export const storeInviteToken = async (adminEmail, token) => {
    const inviteDocRef = doc(db, 'invites', adminEmail);
    await setDoc(inviteDocRef, { token });
};
