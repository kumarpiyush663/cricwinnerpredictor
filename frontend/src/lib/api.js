import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with defaults
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Optionally redirect to login
      if (window.location.pathname !== '/login' && 
          window.location.pathname !== '/signup' &&
          !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Tournament APIs
export const tournamentApi = {
  getAll: () => api.get('/tournaments'),
  getActive: () => api.get('/tournaments/active'),
  create: (data) => api.post('/admin/tournaments', data),
  update: (id, data) => api.put(`/admin/tournaments/${id}`, data),
  delete: (id) => api.delete(`/admin/tournaments/${id}`)
};

// Match APIs
export const matchApi = {
  getAll: (tournamentId) => api.get('/matches', { params: { tournament_id: tournamentId } }),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/admin/matches', data),
  createBulk: (matches) => api.post('/admin/matches/bulk', { matches }),
  update: (id, data) => api.put(`/admin/matches/${id}`, data),
  delete: (id) => api.delete(`/admin/matches/${id}`),
  sync: (tournamentId) => api.post('/admin/matches/sync', null, { params: { tournament_id: tournamentId } })
};

// Auth APIs
export const authApi = {
  requestAccount: (data) => api.post('/auth/request-account', data)
};

// Nomination APIs
export const nominationApi = {
  getAll: () => api.get('/admin/nominations'),
  create: (data) => api.post('/admin/nominations', data),
  createBulk: (nominations) => api.post('/admin/nominations/bulk', { nominations }),
  resendInvite: (id) => api.post(`/admin/nominations/${id}/resend-invite`),
  approve: (id) => api.post(`/admin/nominations/${id}/approve`),
  delete: (id) => api.delete(`/admin/nominations/${id}`)
};

// Prediction APIs
export const predictionApi = {
  getMy: (tournamentId) => api.get('/predictions/my', { params: { tournament_id: tournamentId } }),
  submit: (data) => api.post('/predictions', data),
  getForMatch: (matchId) => api.get(`/predictions/match/${matchId}`)
};

// Leaderboard APIs
export const leaderboardApi = {
  get: (tournamentId, stageFilter) => api.get('/leaderboard', { 
    params: { tournament_id: tournamentId, stage_filter: stageFilter } 
  })
};

// Report APIs
export const reportApi = {
  get: (tournamentId) => api.get(`/report/${tournamentId}`),
  finalize: (tournamentId) => api.post(`/admin/report/${tournamentId}/finalize`)
};

// Admin Stats
export const adminApi = {
  getStats: () => api.get('/admin/stats')
};

export default api;
