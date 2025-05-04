import { signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export const setupSessionPersistence = async () => {
  try {
    await setPersistence(auth, browserSessionPersistence);
    console.log('Session persistence set successfully');
  } catch (error) {
    console.error('Error setting session persistence:', error);
  }
};

export const signOutUser = async () => {
  try {
    const tabId = sessionStorage.getItem('currentTabId');
    
    await signOut(auth);
    
    sessionStorage.removeItem('currentTabId');
    console.log('Logged out successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error };
  }
};

export const initializeTabId = () => {
  if (!sessionStorage.getItem('currentTabId')) {
    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('currentTabId', tabId);
    console.log(`Created new tab ID: ${tabId}`);
  }
  return sessionStorage.getItem('currentTabId');
};