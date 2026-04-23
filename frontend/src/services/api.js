import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ Get token from either storage
const getToken = () => {
  return localStorage.getItem('cv_token') ||
         sessionStorage.getItem('cv_token') ||
         localStorage.getItem('token') ||
         sessionStorage.getItem('token')
}

// ✅ Add token to every request automatically
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ✅ Handle 401 — token expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('cv_refresh') ||
                           sessionStorage.getItem('cv_refresh') ||
                           localStorage.getItem('refreshToken') ||
                           sessionStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          )
          const { access_token, refresh_token: newRefresh } = res.data

          // Save new tokens
          const inLocal = !!(
            localStorage.getItem('cv_token') ||
            localStorage.getItem('token')
          )
          const storage = inLocal ? localStorage : sessionStorage
          storage.setItem('cv_token', access_token)
          if (newRefresh) storage.setItem('cv_refresh', newRefresh)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          // Refresh failed — clear storage and redirect to login
          ;['cv_token','cv_refresh','cv_user','token','refreshToken','user'].forEach(k => {
            localStorage.removeItem(k)
            sessionStorage.removeItem(k)
          })
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } else {
        // No refresh token — redirect to login
        ;['cv_token','cv_refresh','cv_user','token','refreshToken','user'].forEach(k => {
          localStorage.removeItem(k)
          sessionStorage.removeItem(k)
        })
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth APIs ────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// ─── Certificate APIs ─────────────────────────────────────
export const certificateAPI = {
  upload: (formData) => api.post('/certificates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verify: (certificateId) =>
    api.get(`/certificates/verify/${certificateId}`),
  verifyFull: (certificateId) =>
    api.get(`/certificates/verify-full/${certificateId}`),
  verifyByOCR: (formData) => api.post('/certificates/verify-by-ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/certificates/all', { params }),
  revoke: (certificateId, reason) => api.post(
    `/certificates/revoke/${certificateId}?reason=${encodeURIComponent(reason)}`
  ),
  getQR: (certificateId) =>
    `${API_BASE_URL}/certificates/qr/${certificateId}`,
  retryBlockchain: (certId) =>
    api.post(`/certificates/retry-blockchain/${certId}`),
  retryOCR: (certId) =>
    api.post(`/certificates/retry-ocr/${certId}`),
  bulkUpload: (formData) => api.post('/certificates/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  search: (params) => api.get('/certificates/search', { params }),
}

// ─── Blockchain APIs ──────────────────────────────────────
export const blockchainAPI = {
  store: (certificateId) =>
    api.post(`/blockchain/store/${certificateId}`),
  verify: (certificateId) =>
    api.get(`/blockchain/verify/${certificateId}`),
  status: () => api.get('/blockchain/status'),
}

// ─── OCR APIs ─────────────────────────────────────────────
export const ocrAPI = {
  extract: (certificateId) =>
    api.post(`/ocr/extract/${certificateId}`),
  extractUpload: (formData) => api.post('/ocr/extract-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// ─── Fraud APIs ───────────────────────────────────────────
export const fraudAPI = {
  analyze: (certificateId) =>
    api.post(`/fraud/analyze/${certificateId}`),
  status: (certificateId) =>
    api.get(`/fraud/status/${certificateId}`),
}

// ─── Analytics APIs ───────────────────────────────────────
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  stats: () => api.get('/analytics/stats'),
  trends: () => api.get('/analytics/trends'),
}

// ─── Institution Request APIs ─────────────────────────────
export const institutionRequestAPI = {
  submit: (data) => api.post('/institution-requests/submit', data),
  getAll: (status) => api.get('/institution-requests/all', { params: { status } }),
  getPendingCount: () => api.get('/institution-requests/pending-count'),
  approve: (id) => api.post(`/institution-requests/approve/${id}`),
  reject: (id, reason) => api.post(`/institution-requests/reject/${id}`, null, {
    params: { reason }
  }),
}

// ─── Notification APIs ────────────────────────────────────
export const notificationAPI = {
  getAll: (unreadOnly = false) =>
    api.get(`/notifications/`, { params: { unread_only: unreadOnly } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

// ─── User Management APIs ─────────────────────────────────
export const userAPI = {
  getAll: (params) => api.get('/users/', { params }),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  unlock: (id) => api.put(`/users/${id}/unlock`),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api