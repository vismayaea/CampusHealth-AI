import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/app/admin');

  return (
    <div className="app-layout min-h-screen">
      {/* Mobile menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isAdminRoute={isAdminRoute}
      />
      
      {/* Main content area */}
      <div className="app-content lg:ml-64 min-h-screen">
        {/* Header */}
        <Header 
          onMenuClick={() => setMobileMenuOpen(true)}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          isAdminRoute={isAdminRoute}
        />
        
        {/* Page content */}
        <main className="app-main relative py-6 sm:py-8">
          <div className="app-main-glow pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 blur-3xl" aria-hidden="true" />
          <div className="container-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
