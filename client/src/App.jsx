import '@/styles/globals.css';
import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/context/store';
import toast, { Toaster } from 'react-hot-toast';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OTPVerificationPage from '@/pages/OTPVerificationPage';
import DashboardPage from '@/pages/DashboardPage';
import ChatRoomPage from '@/pages/ChatRoomPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import HowItWorksPage from '@/pages/see how it works';

const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0b141a',
    color: '#8696a0',
    fontSize: 14,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: '#00a884',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading...
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    document.documentElement.classList.remove('dark', 'light', 'cyber', 'blue', 'black', 'white');
    document.documentElement.classList.add(theme || 'dark');
  }, [theme, setUser]);

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        style: {
          background: '#1f2c33',
          color: '#e9edef',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          fontSize: 14,
        },
      }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/how-it-works" element={isAuthenticated ? <Navigate to="/dashboard" /> : <HowItWorksPage />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />

          <Route
            path="/chat/:roomId"
            element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>}
          />

          <Route
            path="/settings"
            element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}