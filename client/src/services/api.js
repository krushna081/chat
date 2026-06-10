import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }
  const { protocol, hostname, host } = window.location;
  if (hostname.endsWith('.devtunnels.ms')) {
    return `${protocol}//${host}/api`;
  }
  return 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await API.post('/auth/refresh');
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  refreshToken: () => API.post('/auth/refresh'),
  resendOTP: (data) => API.post('/auth/resend-otp', data),
  forgotPasswordRequest: (data) => API.post('/auth/forgot-password-request', data),
  verifyResetOTP: (data) => API.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

// Chat endpoints
export const chatAPI = {
  createRoom: (data) => API.post('/chat/create-room', data),
  joinRoom: (data) => API.post('/chat/join-room', data),
  getChatRooms: () => API.get('/chat/rooms'),
  getMessages: (roomId, page = 1) => API.get(`/chat/messages/${roomId}?page=${page}`),
  leaveRoom: (roomId) => API.post(`/chat/leave/${roomId}`),
};

// User endpoints
export const userAPI = {
  getProfile: () => API.get('/user/profile'),
  updateProfile: (data) => API.put('/user/profile', data),
  muteNotifications: (data) => API.post('/user/mute-notifications', data),
  unmuteNotifications: (data) => API.post('/user/unmute-notifications', data),
};

export default API;
