import '@/styles/globals.css';
import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/context/store';
import toast, { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OTPVerificationPage from '@/pages/OTPVerificationPage';
import DashboardPage from '@/pages/DashboardPage';
import ChatRoomPage from '@/pages/ChatRoomPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-cyber-900">
    <div className="text-4xl text-cyber-100 animate-pulse">Loading...</div>
  </div>
);

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    // Restore user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Apply theme classes
    document.documentElement.classList.remove('dark', 'light', 'cyber');
    if (theme === 'cyber') {
      document.documentElement.classList.add('dark', 'cyber');
    } else {
      document.documentElement.classList.add(theme);
    }
  }, [theme, setUser]);

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <ChatRoomPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
