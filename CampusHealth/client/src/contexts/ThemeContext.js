import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { settingsAPI } from '../services/api';

const ThemeContext = createContext();
const validThemes = ['light', 'dark', 'highContrast'];
const validFontSizes = ['small', 'medium', 'large'];

const readPreference = (key, allowed, fallback) => {
  const saved = localStorage.getItem(key);
  return allowed.includes(saved) ? saved : fallback;
};

const applyPreferences = (theme, fontSize) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.fontSize = fontSize;
  document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
};

export function ThemeProvider({ children }) {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() => readPreference('theme', validThemes, 'light'));
  const [fontSize, setFontSize] = useState(() => readPreference('fontSize', validFontSizes, 'medium'));
  const [isSaving, setIsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const loadedUserId = useRef(null);

  const applyAndStore = useCallback((theme, size) => {
    setCurrentTheme(theme);
    setFontSize(size);
    localStorage.setItem('theme', theme);
    localStorage.setItem('fontSize', size);
    applyPreferences(theme, size);
  }, []);

  useEffect(() => {
    applyPreferences(currentTheme, fontSize);
  }, [currentTheme, fontSize]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user?._id || loadedUserId.current === user._id) return;
    loadedUserId.current = user._id;
    settingsAPI.getSettings()
      .then(({ data }) => {
        const theme = validThemes.includes(data.settings?.theme) ? data.settings.theme : 'light';
        const size = validFontSizes.includes(data.settings?.fontSize) ? data.settings.fontSize : 'medium';
        applyAndStore(theme, size);
        setSettingsError('');
      })
      .catch(() => setSettingsError('Saved account settings could not be loaded.'));
  }, [applyAndStore, isAuthLoading, isAuthenticated, user?._id]);

  const persist = useCallback(async (theme, size) => {
    if (!isAuthenticated) return;
    setIsSaving(true);
    setSettingsError('');
    try {
      await settingsAPI.updateSettings({ theme, fontSize: size });
    } catch (_) {
      setSettingsError('Applied locally, but account settings could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated]);

  const changeTheme = (theme) => {
    if (!validThemes.includes(theme)) return;
    applyAndStore(theme, fontSize);
    persist(theme, fontSize);
  };

  const changeFontSize = (size) => {
    if (!validFontSizes.includes(size)) return;
    applyAndStore(currentTheme, size);
    persist(currentTheme, size);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme, fontSize, isSaving, settingsError, changeTheme, changeFontSize
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
