// src/functions/AuthService.js
import { signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Set session persistence to remain until tab is closed only
export const setupSessionPersistence = async () => {
  try {
    await setPersistence(auth, browserSessionPersistence);
    console.log('Session persistence set successfully');
  } catch (error) {
    console.error('Error setting session persistence:', error);
  }
};

// Modified logout function
export const signOutUser = async () => {
  try {
    // Save current tab ID before signing out
    const tabId = sessionStorage.getItem('currentTabId');
    
    // Sign out
    await signOut(auth);
    
    // Remove tab ID
    sessionStorage.removeItem('currentTabId');
    console.log('Logged out successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error };
  }
};

// Function to create a unique ID for the tab
export const initializeTabId = () => {
  // If there's no tab ID, create a new one
  if (!sessionStorage.getItem('currentTabId')) {
    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('currentTabId', tabId);
    console.log(`Created new tab ID: ${tabId}`);
  }
  return sessionStorage.getItem('currentTabId');
};