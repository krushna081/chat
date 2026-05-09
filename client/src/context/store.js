import { create } from 'zustand';
import { authAPI, chatAPI, userAPI } from '../services/api.js';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { user, accessToken } = response.data;
      set({
        user,
        isAuthenticated: true,
        loading: false,
      });
      localStorage.setItem('user', JSON.stringify(user));
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  signup: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.signup({ username, email, password });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Signup failed';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  verifyOTP: async (email, otp, username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.verifyOTP({ email, otp, username, password });
      const { user, accessToken } = response.data;
      set({
        user,
        isAuthenticated: true,
        loading: false,
      });
      localStorage.setItem('user', JSON.stringify(user));
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'OTP verification failed';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  refreshUser: async () => {
    try {
      const response = await userAPI.getProfile();
      set({ user: response.data.user });
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

export const useChatStore = create((set, get) => ({
  chatRooms: [],
  currentRoom: null,
  messages: [],
  loading: false,
  typingUsers: [],
  onlineUsers: [],

  fetchChatRooms: async () => {
    set({ loading: true });
    try {
      const response = await chatAPI.getChatRooms();
      set({ chatRooms: response.data.chatRooms, loading: false });
    } catch (error) {
      console.error('Fetch rooms error:', error);
      set({ loading: false });
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  addMessage: (message) => {
    const { messages } = get();
    if (!messages.find((m) => m._id === message._id)) {
      set({ messages: [...messages, message] });
    }
  },

  setMessages: (messages) => set({ messages }),

  addTypingUser: (userId) => {
    const { typingUsers } = get();
    if (!typingUsers.includes(userId)) {
      set({ typingUsers: [...typingUsers, userId] });
    }
  },

  removeTypingUser: (userId) => {
    const { typingUsers } = get();
    set({ typingUsers: typingUsers.filter((id) => id !== userId) });
  },

  addOnlineUser: (userId) => {
    const { onlineUsers } = get();
    if (!onlineUsers.includes(userId)) {
      set({ onlineUsers: [...onlineUsers, userId] });
    }
  },

  removeOnlineUser: (userId) => {
    const { onlineUsers } = get();
    set({ onlineUsers: onlineUsers.filter((id) => id !== userId) });
  },
}));

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
}));
