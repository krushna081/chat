import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b141a',
          color: '#e9edef',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong</h1>
          <p style={{ color: '#8696a0', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              window.location.href = '/';
            }}
            style={{
              background: '#00a884',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);