import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Home, 
  MessageCircle, 
  Heart, 
  Calendar, 
  BookOpen, 
  Users, 
  User, 
  BarChart3,
  X,
  FileText,
  Brain
} from 'lucide-react';

function Sidebar({ isOpen, onClose, isAdminRoute }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const studentNavItems = [
    { key: 'dashboard', href: '/app/dashboard', icon: Home },
    { key: 'chatbot', href: '/app/chatbot', icon: MessageCircle },
    { key: 'screening', href: '/app/screening', icon: Heart },
    { key: 'mlPredict', href: '/app/predict', icon: Brain },
    { key: 'appointments', href: '/app/appointments', icon: Calendar },
    { key: 'counselors', href: '/app/counselors', icon: Users },
    { key: 'activities', href: '/app/activities', icon: FileText },
    { key: 'resources', href: '/app/resources', icon: BookOpen },
    { key: 'forum', href: '/app/forum', icon: Users },
    { key: 'profile', href: '/app/profile', icon: User },
  ];

  const adminNavItems = [
    { key: 'dashboard', href: '/app/admin/dashboard', icon: BarChart3 },
    { key: 'users', href: '/app/admin/users', icon: Users },
    { key: 'analytics', href: '/app/admin/analytics', icon: BarChart3 },
    { key: 'reports', href: '/app/admin/reports', icon: FileText },
    { key: 'resources', href: '/app/admin/resources', icon: BookOpen },
    { key: 'forum', href: '/app/admin/forum', icon: Users },
  ];

  const counselorNavItems = [
    { key: 'dashboard', href: '/app/counselor/dashboard', icon: Home },
    { key: 'appointments', href: '/app/counselor/appointments', icon: Calendar },
    { key: 'counselors', href: '/app/counselors', icon: Users },
    { key: 'activitiesManagement', href: '/app/activities', icon: FileText },
    { key: 'activityAnalysis', href: '/app/activities-list', icon: BarChart3 },
    { key: 'mlPredict', href: '/app/predict', icon: Brain },
    { key: 'resources', href: '/app/resources', icon: BookOpen },
    { key: 'forum', href: '/app/forum', icon: Users },
    { key: 'profile', href: '/app/profile', icon: User },
  ];

  const getNavItems = () => {
    if (isAdminRoute) return adminNavItems;
    if (user?.role === 'counselor') return counselorNavItems;
    return studentNavItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-white/70 bg-white/90 shadow-strong backdrop-blur-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0
      `}>
        <div className="flex items-center justify-between h-20 px-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700 to-success-600 text-white shadow-medium">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight text-neutral-900">
                {isAdminRoute ? t('adminStudio') : 'CampusHealth'}
              </h2>
              <p className="text-xs font-medium text-neutral-500">{t('wellnessSaaS')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.key}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-semibold rounded-2xl transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-700 text-white shadow-soft' 
                      : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-800'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-primary-600'}
                  `} />
                  {t(item.key)}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          <div className="flex items-center rounded-2xl bg-neutral-50 p-3">
            <div className="h-10 w-10 bg-primary-700 rounded-2xl flex items-center justify-center shadow-soft">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
