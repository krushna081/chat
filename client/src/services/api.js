import axios from 'axios';

export const getApiBaseUrl = (configured = import.meta.env.VITE_API_URL) => {
  const value = String(configured || '/api').trim();
  return value.replace(/\/+$/, '') || '/api';
};

export const getSocketUrl = () => {
  const configured = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (configured) return configured.replace(/\/+$/, '');

  const apiUrl = String(import.meta.env.VITE_API_URL || '').trim();
  if (/^https?:\/\//i.test(apiUrl)) {
    return new URL(apiUrl).origin;
  }

  return window.location.origin;
};

const API = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 20_000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = API.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRequest = originalRequest?.url?.includes('/auth/');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return API(originalRequest);
      } catch {
        window.dispatchEvent(new Event('relaychat:auth-expired'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  refreshToken: () => API.post('/auth/refresh'),
  resendOTP: (data) => API.post('/auth/resend-otp', data),
  forgotPasswordRequest: (data) => API.post('/auth/forgot-password-request', data),
  verifyResetOTP: (data) => API.post('/auth/verify-reset-otp', data),
};

export const chatAPI = {
  createRoom: (data) => API.post('/chat/create-room', data),
  joinRoom: (data) => API.post('/chat/join-room', data),
  getChatRooms: () => API.get('/chat/rooms'),
  getMessages: (roomId, page = 1) => API.get(`/chat/messages/${roomId}?page=${page}`),
  leaveRoom: (roomId) => API.post(`/chat/leave/${roomId}`),
};

export const userAPI = {
  getProfile: () => API.get('/user/profile'),
  updateProfile: (data) => API.put('/user/profile', data),
  muteNotifications: (data) => API.post('/user/mute-notifications', data),
  unmuteNotifications: (data) => API.post('/user/unmute-notifications', data),
};

export default API;
