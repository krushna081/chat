import axios from 'axios';

const getDefaultApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  const { protocol, hostname, host, port } = window.location;

  // Use the same tunneled host if the frontend is served via a dev tunnels URL.
  if (hostname.endsWith('.devtunnels.ms')) {
    return `${protocol}//${host}/api`;
  }

  // If the browser is visiting the backend host directly or on port 5000 already,
  // use the same origin and port.
  if (port === '5000') {
    return `${protocol}//${host}/api`;
  }

  // Default to the same hostname on port 5000.
  return `${protocol}//${hostname}:5000/api`;
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || getDefaultApiUrl(),
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  refreshToken: () => API.post('/auth/refresh'),
  resendOTP: (data) => API.post('/auth/resend-otp', data),
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
