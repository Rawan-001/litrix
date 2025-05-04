import { setupSessionPersistence, initializeTabId } from './AuthService';

export const initAuth = () => {
  const tabId = initializeTabId();
  
  setupSessionPersistence();
  
  console.log(`Authentication initialized with tab ID: ${tabId}`);
};