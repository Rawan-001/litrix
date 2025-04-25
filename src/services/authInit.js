// src/services/authInit.js
import { setupSessionPersistence, initializeTabId } from './AuthService';

// Initialize authentication settings
export const initAuth = () => {
  // Generate a unique ID for this tab session
  const tabId = initializeTabId();
  
  // Set up browser session persistence
  setupSessionPersistence();
  
  console.log(`Authentication initialized with tab ID: ${tabId}`);
};