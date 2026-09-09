// Utility functions for managing browser storage and application state

/**
 * Clear all stored data from localStorage and sessionStorage
 */
export const clearAllStorage = () => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('All storage data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

/**
 * Clear only authentication-related data
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    console.log('Authentication data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Clear user preferences (theme, language, etc.)
 */
export const clearUserPreferences = () => {
  try {
    localStorage.removeItem('language');
    localStorage.removeItem('theme');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('userPreferences');
    
    console.log('User preferences cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing user preferences:', error);
    return false;
  }
};

/**
 * Reset application to initial state
 */
export const resetApplication = () => {
  try {
    // Clear all storage
    clearAllStorage();
    
    // Reload the page to reset React state
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Error resetting application:', error);
    return false;
  }
};

/**
 * Get storage usage information
 */
export const getStorageInfo = () => {
  try {
    const localStorageSize = JSON.stringify(localStorage).length;
    const sessionStorageSize = JSON.stringify(sessionStorage).length;
    
    return {
      localStorage: {
        size: localStorageSize,
        items: Object.keys(localStorage).length
      },
      sessionStorage: {
        size: sessionStorageSize,
        items: Object.keys(sessionStorage).length
      },
      totalSize: localStorageSize + sessionStorageSize
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

