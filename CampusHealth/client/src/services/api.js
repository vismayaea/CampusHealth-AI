import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthTokens = (data, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;
  storage.setItem('token', data.token || data.accessToken);
  storage.setItem('refreshToken', data.refreshToken || '');
  if (data.user) storage.setItem('user', JSON.stringify(data.user));
  other.removeItem('token');
  other.removeItem('refreshToken');
  other.removeItem('user');
};

export const getRefreshToken = () => localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

export const clearAuthTokens = () => {
  ['token', 'refreshToken', 'user'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry && getRefreshToken()) {
      original._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: getRefreshToken() });
        const remember = Boolean(localStorage.getItem('refreshToken'));
        setAuthTokens(response.data, remember);
        original.headers.Authorization = `Bearer ${response.data.token || response.data.accessToken}`;
        return api(original);
      } catch (_) {
        clearAuthTokens();
      }
    } else if (error.response?.status === 401) {
      clearAuthTokens();
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  google: (data) => api.post('/auth/google', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Chatbot API
export const chatbotAPI = {
  startSession: (context) => api.post('/chatbot/start-session', context),
  sendMessage: (data) => api.post('/chatbot/message', data),
  getSessions: () => api.get('/chatbot/sessions'),
  getSession: (sessionId) => api.get(`/chatbot/session/${sessionId}`),
  endSession: (data) => api.post('/chatbot/end-session', data),
};

// Screening API
export const screeningAPI = {
  submitScreening: (data) => api.post('/screening/submit', data),
  getHistory: (params) => api.get('/screening/history', { params }),
};

// Appointments API
export const appointmentsAPI = {
  getCounselors: () => api.get('/counselors'),
  createAppointment: (data) => api.post('/appointments', data),
  getStudentAppointments: (studentId) => api.get(`/appointments/student/${studentId}`),
  getCounselorAppointments: (counselorId) => api.get(`/appointments/counselor/${counselorId}`),
  getAvailability: (params) => api.get('/appointments/availability', { params }),
  updateAppointmentStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
};

// Counselors API
export const counselorsAPI = {
  getCounselors: (params) => api.get('/counselors', { params }),
};

// Resources API
export const resourcesAPI = {
  getResources: (params) => api.get('/resources', { params }),
  getResource: (id) => api.get(`/resources/${id}`),
  createResource: (data) => api.post('/resources', data),
  deleteResource: (id) => api.delete(`/resources/${id}`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
};

// Forum API
export const forumAPI = {
  getPosts: (params) => api.get('/forum/posts', { params }),
  getPost: (id) => api.get(`/forum/posts/${id}`),
  createPost: (data) => api.post('/forum/posts', data),
  updatePost: (id, data) => api.put(`/forum/posts/${id}`, data),
  deletePost: (id) => api.delete(`/forum/posts/${id}`),
  likePost: (id) => api.post(`/forum/posts/${id}/like`),
  unlikePost: (id) => api.delete(`/forum/posts/${id}/like`),
  addComment: (id, data) => api.post(`/forum/posts/${id}/comments`, data),
  removeComment: (id, replyId) => api.delete(`/forum/posts/${id}/comments/${replyId}`),
  pinComment: (id, replyId) => api.patch(`/forum/posts/${id}/comments/${replyId}/pin`),
  reportPost: (id, reason) => api.post(`/forum/posts/${id}/report`, { reason }),
  getCategories: () => api.get('/forum/categories/list'),
  getReports: () => api.get('/forum/moderation/reports'),
  moderateReports: (id, action) => api.patch(`/forum/posts/${id}/reports/moderate`, { action }),
  pinPost: (id) => api.patch(`/forum/posts/${id}/pin`),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDashboardOverview: (timeframe) => api.get(`/admin/dashboard/overview?timeframe=${timeframe}`),
  getSystemHealth: () => api.get('/admin/analytics/system-health'),
  getUserAnalytics: (timeframe, groupBy) => api.get(`/admin/analytics/users?timeframe=${timeframe}&groupBy=${groupBy}`),
  getMentalHealthAnalytics: (timeframe) => api.get(`/admin/analytics/mental-health?timeframe=${timeframe}`),
  getEngagementAnalytics: (timeframe) => api.get(`/admin/analytics/engagement?timeframe=${timeframe}`),
  generateReport: (params) => api.get('/admin/reports/generate', { params }),
};

// Activities API
export const activitiesAPI = {
  getActivities: (params) => api.get('/activities', { params }),
  getMyActivities: () => api.get('/activities/my'),
  getActivity: (id) => api.get(`/activities/${id}`),
  createActivity: (payload) => api.post('/activities', payload),
  updateActivity: (id, payload) => api.put(`/activities/${id}`, payload),
  deleteActivity: (id) => api.delete(`/activities/${id}`),
  register: (id) => api.post(`/activities/${id}/register`),
  cancelRegistration: (id) => api.delete(`/activities/${id}/register`),
  getRegistrations: (id) => api.get(`/activities/${id}/registrations`),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

// Survey API
export const surveyAPI = {
  createSurvey: (data) => api.post('/surveys/create', data),
  getActiveSurveys: () => api.get('/surveys/active'),
  getMySurveys: () => api.get('/surveys/me'),
  submitSurvey: (id, data) => api.post(`/surveys/${id}/submit`, data),
  getSurveyResults: (id) => api.get(`/surveys/${id}/results`),
};

export default api;
