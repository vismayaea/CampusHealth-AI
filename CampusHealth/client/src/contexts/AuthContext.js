import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, setAuthTokens, clearAuthTokens, getRefreshToken } from '../services/api';
import toast from 'react-hot-toast';
import { createDemoAuthPayload, findDemoAccount } from '../utils/demoAccounts';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token') || sessionStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (token?.startsWith('demo-token-') && storedUser) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: JSON.parse(storedUser),
            token
          }
        });
        return;
      }
      const refreshToken = getRefreshToken();
      if (!token && !refreshToken) {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
        return;
      }
      try {
        if (!token && refreshToken) {
          const refreshed = await authAPI.refresh(refreshToken);
          setAuthTokens(refreshed.data, true);
        }
        const response = await authAPI.getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: localStorage.getItem('token') || sessionStorage.getItem('token')
          }
        });
      } catch (error) {
        clearAuthTokens();
        dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired. Please login again.' });
      }
    };
    restoreSession();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });

    
    try {
      const response = await authAPI.login(credentials);
      setAuthTokens(response.data, Boolean(credentials.rememberMe));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data.user, token: response.data.token } });
      toast.success(`Welcome back, ${response.data.user.firstName || response.data.user.name}!`);
      return { success: true, user: response.data.user };
    } catch (error) {
      const demoAccount = findDemoAccount(credentials);
      const canUseLocalDemo = demoAccount && (!error.response || error.response.status === 503);
      if (canUseLocalDemo) {
        const payload = createDemoAuthPayload(demoAccount);
        setAuthTokens(payload, Boolean(credentials.rememberMe));
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: payload.user, token: payload.token } });
        toast.success(`Demo mode: ${payload.user.name} signed in`);
        return { success: true, user: payload.user };
      }

      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.register(userData);
      setAuthTokens(response.data, Boolean(userData.rememberMe));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data.user, token: response.data.token } });
      toast.success(`Welcome to Campus Mental Health, ${response.data.user.firstName || response.data.user.name}!`);
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const googleLogin = async ({ idToken, rememberMe = true, department, year }) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.google({ idToken, rememberMe, department, year });
      setAuthTokens(response.data, rememberMe);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data.user, token: response.data.token } });
      toast.success(`Welcome, ${response.data.user.firstName || response.data.user.name}!`);
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout(getRefreshToken());
    } catch (_) {
      // Logout is best-effort; always clear local auth state.
    }
    clearAuthTokens();
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully. Please log in again.');
      clearAuthTokens();
      dispatch({ type: 'LOGOUT' });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider value={{ ...state, login, register, googleLogin, logout, updateProfile, changePassword, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
