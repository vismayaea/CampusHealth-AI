import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const dashboardPath = user?.role === 'counselor'
      ? '/app/counselor/dashboard'
      : user?.role === 'admin'
        ? '/app/admin/dashboard'
        : '/app/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
