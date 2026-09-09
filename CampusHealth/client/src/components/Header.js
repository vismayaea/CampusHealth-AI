import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, Bell, Settings, LogOut, User, Globe } from 'lucide-react';
import { notificationsAPI } from '../services/api';

function Header({ onMenuClick, onSidebarToggle, isAdminRoute }) {
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage, languages, t } = useLanguage();
  const { currentTheme, changeTheme, fontSize, changeFontSize, isSaving, settingsError } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const languageMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (_) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = window.setInterval(loadUnreadCount, 60000);
    window.addEventListener('notifications-updated', loadUnreadCount);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('notifications-updated', loadUnreadCount);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      const target = event.target;
      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setShowLanguageMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setShowSettingsMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowLanguageMenu(false);
        setShowSettingsMenu(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, []);

  useEffect(() => {
    setShowLanguageMenu(false);
    setShowSettingsMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setShowLanguageMenu(false);
  };

  const toggleLanguageMenu = () => {
    setShowLanguageMenu((isOpen) => !isOpen);
    setShowSettingsMenu(false);
    setShowUserMenu(false);
  };

  const toggleSettingsMenu = () => {
    setShowSettingsMenu((isOpen) => !isOpen);
    setShowLanguageMenu(false);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu((isOpen) => !isOpen);
    setShowLanguageMenu(false);
    setShowSettingsMenu(false);
  };

  const handleThemeChange = (theme) => {
    changeTheme(theme);
  };

  const handleFontSizeChange = (size) => {
    changeFontSize(size);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-soft backdrop-blur-xl">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 transition-colors focus-ring"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <button
              onClick={onSidebarToggle}
              className="hidden lg:block p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 transition-colors focus-ring"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="ml-2">
              <h1 className="text-lg font-black tracking-tight text-neutral-900 sm:text-xl">
                {isAdminRoute ? t('adminDashboardTitle') : t('appTitle')}
              </h1>
              <p className="hidden text-xs font-medium text-neutral-500 sm:block">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Language selector */}
            <div ref={languageMenuRef} className="relative">
              <button
                onClick={toggleLanguageMenu}
                className="flex items-center space-x-2 p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 focus-ring"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {languages[currentLanguage]?.name || 'English'}
                </span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-neutral-200 bg-white/95 shadow-strong backdrop-blur-xl z-100 overflow-hidden">
                  <div className="py-1">
                    {Object.values(languages).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 transition-colors ${
                          currentLanguage === lang.code ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div ref={settingsMenuRef} className="relative">
              <button
                onClick={toggleSettingsMenu}
                aria-label={t('settings')}
                aria-expanded={showSettingsMenu}
                className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 focus-ring"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white/95 shadow-strong backdrop-blur-xl z-100">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-neutral-900 mb-3">{t('settings')}</h3>
                    
                    {/* Theme */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-neutral-700 mb-2">{t('theme')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.keys({ light: 'Light', dark: 'Dark', highContrast: 'High Contrast' }).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => handleThemeChange(theme)}
                            aria-pressed={currentTheme === theme}
                            className={`min-h-10 px-2 py-2 text-xs rounded focus-ring ${
                              currentTheme === theme 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            }`}
                          >
                            {theme === 'light' ? t('light') : theme === 'dark' ? t('dark') : t('highContrast')}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Font Size */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-2">{t('fontSize')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => handleFontSizeChange(size)}
                            aria-pressed={fontSize === size}
                            className={`min-h-10 px-3 py-2 text-xs rounded focus-ring ${
                              fontSize === size 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            }`}
                          >
                            {t(size)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 min-h-5 text-xs" aria-live="polite">
                      {isSaving && <span className="text-neutral-500">{t('savingSettings')}</span>}
                      {!isSaving && settingsError && <span className="text-danger-600">{settingsError}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button
              aria-label={unreadCount ? t('unreadNotifications', { count: unreadCount }) : t('notifications')}
              onClick={() => {
                setShowLanguageMenu(false);
                setShowSettingsMenu(false);
                setShowUserMenu(false);
                navigate('/app/notifications');
              }}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 relative focus-ring"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 focus-ring"
              >
                <div className="h-9 w-9 bg-primary-700 rounded-2xl flex items-center justify-center shadow-soft">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden text-sm font-semibold sm:inline">{user?.firstName}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-neutral-200 bg-white/95 shadow-strong backdrop-blur-xl z-100 overflow-hidden">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-neutral-500 border-b border-neutral-200">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      {t('profile')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
