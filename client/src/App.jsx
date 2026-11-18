import '@/styles/globals.css';
import { lazy, Suspense, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/context/store';
import { Toaster } from 'react-hot-toast';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const OTPVerificationPage = lazy(() => import('@/pages/OTPVerificationPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ChatRoomPage = lazy(() => import('@/pages/ChatRoomPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));

const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <span className="page-loader-spinner" aria-hidden="true" />
    <span>Loading RelayChat…</span>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  if (loading || !initialized) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const authExpired = useAuthStore((state) => state.authExpired);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'cyber', 'blue', 'black', 'white');
    root.classList.add(theme === 'light' ? 'light' : 'dark');
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f0f2f5' : '#0b141a');
  }, [theme]);

  useEffect(() => {
    const handleExpired = () => authExpired();
    window.addEventListener('relaychat:auth-expired', handleExpired);
    return () => window.removeEventListener('relaychat:auth-expired', handleExpired);
  }, [authExpired]);

  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            className: 'relay-toast',
            style: {
              background: theme === 'light' ? '#ffffff' : '#1f2c33',
              color: theme === 'light' ? '#111b21' : '#e9edef',
              border:
                theme === 'light'
                  ? '1px solid rgba(0,0,0,0.08)'
                  : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              fontSize: 14,
            },
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
            />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/signup"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />}
            />
            <Route path="/verify-otp" element={<OTPVerificationPage />} />
            <Route
              path="/how-it-works"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HowItWorksPage />}
            />

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
    </MotionConfig>
  );
}
