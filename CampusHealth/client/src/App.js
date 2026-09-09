import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import ScreeningPage from './pages/ScreeningPage';
import AppointmentsPage from './pages/AppointmentsPage';
import CounselorsPage from './pages/CounselorsPage';
import ResourcesPage from './pages/ResourcesPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ForumPage from './pages/ForumPage';
import ForumPostPage from './pages/ForumPostPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminResourcesPage from './pages/admin/AdminResourcesPage';
import AdminForumPage from './pages/admin/AdminForumPage';

// Counselor Pages
import CounselorDashboardPage from './pages/counselor/CounselorDashboardPage';
import SurveysPage from './pages/counselor/SurveysPage';
import SurveyResultsPage from './pages/counselor/SurveyResultsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import AnalyzeSurveyPage from './pages/AnalyzeSurveyPage';
import PredictPage from './pages/PredictPage';

import NotFoundPage from './pages/NotFoundPage';

function App() {
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <div className="App app-root notranslate min-h-screen" translate="no">
            <React.Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected routes */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="chatbot" element={<ChatbotPage />} />
                  <Route path="screening" element={<ScreeningPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="counselors" element={<CounselorsPage />} />
                  <Route path="resources" element={<ResourcesPage />} />
                  <Route path="resources/:id" element={<ResourceDetailPage />} />
                  <Route path="forum" element={<ForumPage />} />
                  <Route path="forum/posts/:id" element={<ForumPostPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="predict" element={<PredictPage />} />

                  {/* Activities */}
                  <Route path="activities" element={<ActivitiesPage />} />

                  {/* New pages for counselors */}
                  <Route
                    path="counselor/dashboard"
                    element={
                      <ProtectedRoute requiredRole="counselor">
                        <CounselorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="counselor/appointments"
                    element={
                      <ProtectedRoute requiredRole="counselor">
                        <CounselorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="activities/create"
                    element={
                      <ProtectedRoute requiredRole="counselor">
                        <CreateSurveyPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="activities/analyze"
                    element={
                      <ProtectedRoute requiredRole="counselor">
                        <AnalyzeSurveyPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="activities-list"
                    element={
                      <ProtectedRoute requiredRole="counselor">
                        <SurveysPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="activities/:id/results"
                    element={
                      <ProtectedRoute requiredRole="counselor">
                        <SurveyResultsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin routes */}
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Navigate to="/app/admin/dashboard" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminUsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/analytics"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminAnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/reports"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/resources"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminResourcesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/forum"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminForumPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </React.Suspense>
          </div>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
