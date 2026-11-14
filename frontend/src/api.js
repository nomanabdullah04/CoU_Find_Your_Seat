import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://cou-find-your-seat.onrender.com');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token for admin calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cou_admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and automatic logout on expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('cou_admin_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/admin/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem('cou_admin_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('cou_admin_access_token');
          localStorage.removeItem('cou_admin_refresh_token');
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        }
      } else {
        localStorage.removeItem('cou_admin_access_token');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Public API endpoints
export const searchSeat = (admissionRoll, verifyField = null) => {
  return api.post('/api/seat/search/', {
    admission_roll: admissionRoll,
    verify_field: verifyField,
  });
};

export const getSiteSettings = () => api.get('/api/seat/settings/');
export const getCenters = () => api.get('/api/centers/');
export const getCenterDetail = (id) => api.get(`/api/centers/${id}/`);
export const getAdmissionSteps = () => api.get('/api/steps/');
export const getNotices = () => api.get('/api/notices/');
export const getFAQs = () => api.get('/api/faq/');
export const getHelpData = () => api.get('/api/help/');

// Admin Authentication
export const adminLogin = (username, password) =>
  api.post('/api/admin/login/', { username, password });

// Admin Dashboard Analytics
export const getAdminStats = () => api.get('/api/admin/stats/');

// Admin Excel Upload & Batches
export const downloadExcelTemplate = () =>
  api.get('/api/admin/template/', { responseType: 'blob' });

export const uploadSeatPlan = (formData) =>
  api.post('/api/admin/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getAdminBatches = () => api.get('/api/admin/upload/');
export const confirmBatchImport = (batchId) =>
  api.post(`/api/admin/upload/${batchId}/confirm/`);
export const rollbackBatch = (batchId) =>
  api.post(`/api/admin/upload/${batchId}/rollback/`);

// Admin Centers CRUD
export const getAdminCenters = () => api.get('/api/admin/centers/');
export const createAdminCenter = (formData) =>
  api.post('/api/admin/centers/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateAdminCenter = (id, formData) =>
  api.patch(`/api/admin/centers/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteAdminCenter = (id) => api.delete(`/api/admin/centers/${id}/`);

// Admin Notices CRUD
export const getAdminNotices = () => api.get('/api/admin/notices/');
export const createAdminNotice = (data) => api.post('/api/admin/notices/', data);
export const updateAdminNotice = (id, data) => api.patch(`/api/admin/notices/${id}/`, data);
export const deleteAdminNotice = (id) => api.delete(`/api/admin/notices/${id}/`);

// Admin Steps CRUD
export const getAdminSteps = () => api.get('/api/admin/steps/');
export const createAdminStep = (data) => api.post('/api/admin/steps/', data);
export const updateAdminStep = (id, data) => api.patch(`/api/admin/steps/${id}/`, data);
export const deleteAdminStep = (id) => api.delete(`/api/admin/steps/${id}/`);

// Admin FAQ CRUD
export const getAdminFAQs = () => api.get('/api/admin/faq/');
export const createAdminFAQ = (data) => api.post('/api/admin/faq/', data);
export const updateAdminFAQ = (id, data) => api.patch(`/api/admin/faq/${id}/`, data);
export const deleteAdminFAQ = (id) => api.delete(`/api/admin/faq/${id}/`);

// Admin Help & Associations CRUD
export const getAdminAssociations = () => api.get('/api/admin/associations/');
export const createAdminAssociation = (data) => api.post('/api/admin/associations/', data);
export const updateAdminAssociation = (id, data) => api.patch(`/api/admin/associations/${id}/`, data);
export const deleteAdminAssociation = (id) => api.delete(`/api/admin/associations/${id}/`);

export const getAdminContacts = () => api.get('/api/admin/contacts/');
export const createAdminContact = (data) => api.post('/api/admin/contacts/', data);
export const updateAdminContact = (id, data) => api.patch(`/api/admin/contacts/${id}/`, data);
export const deleteAdminContact = (id) => api.delete(`/api/admin/contacts/${id}/`);

export const getAdminHelplines = () => api.get('/api/admin/helplines/');
export const createAdminHelpline = (data) => api.post('/api/admin/helplines/', data);
export const updateAdminHelpline = (id, data) => api.patch(`/api/admin/helplines/${id}/`, data);
export const deleteAdminHelpline = (id) => api.delete(`/api/admin/helplines/${id}/`);

// Admin Settings
export const getAdminSettings = () => api.get('/api/admin/settings/');
export const updateAdminSettings = (data) => api.patch('/api/admin/settings/', data);

export default api;
