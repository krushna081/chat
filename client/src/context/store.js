import { create } from 'zustand';
import { authAPI, chatAPI, userAPI } from '../services/api.js';
import { clearStoredEncryptionKeys } from '../utils/encryption.js';

let initializationPromise = null;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,
  error: null,

  initializeAuth: async () => {
    if (get().initialized) return;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
      set({ loading: true, error: null });
      try {
        const response = await authAPI.refreshToken();
        set({
          user: response.data.user,
          isAuthenticated: true,
          loading: false,
          initialized: true,
        });
      } catch {
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          initialized: true,
        });
      } finally {
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Sign in failed');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout request failed:', error.message);
    }
    clearStoredEncryptionKeys();
    useChatStore.getState().reset();
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      initialized: true,
      error: null,
    });
  },

  signup: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.signup({ username, email, password });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Sign up failed');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  verifyOTP: async (email, otp, username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.verifyOTP({ email, otp, username, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Verification failed');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  refreshUser: async () => {
    try {
      const response = await userAPI.getProfile();
      set({ user: response.data.user, isAuthenticated: true });
      return response.data.user;
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      throw error;
    }
  },

  forgotPasswordRequest: async (email) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.forgotPasswordRequest({ email });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Could not request a reset code');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  verifyResetOTP: async (email, otp, newPassword) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.verifyResetOTP({ email, otp, newPassword });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Could not reset password');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  authExpired: () => {
    clearStoredEncryptionKeys();
    useChatStore.getState().reset();
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      initialized: true,
      error: null,
    });
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  resetLoading: () => set({ loading: false }),
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
      console.error('Fetch rooms failed:', error.message);
      set({ loading: false });
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  addMessage: (message) => {
    const { messages } = get();
    if (!messages.find((item) => String(item._id) === String(message._id))) {
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
    set({ typingUsers: get().typingUsers.filter((id) => id !== userId) });
  },

  clearTypingUsers: () => set({ typingUsers: [] }),

  addOnlineUser: (userId) => {
    const { onlineUsers } = get();
    if (!onlineUsers.includes(userId)) {
      set({ onlineUsers: [...onlineUsers, userId] });
    }
  },

  removeOnlineUser: (userId) => {
    set({ onlineUsers: get().onlineUsers.filter((id) => id !== userId) });
  },

  reset: () =>
    set({
      chatRooms: [],
      currentRoom: null,
      messages: [],
      loading: false,
      typingUsers: [],
      onlineUsers: [],
    }),
}));

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const useThemeStore = create((set) => ({
  theme: readStoredTheme(),

  setTheme: (theme) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', nextTheme);
    } catch {
      // Theme persistence is optional.
    }
    set({ theme: nextTheme });
  },
}));
