import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Analytics from './pages/Analytics';
import Teams from './pages/Teams';
import Users from './pages/Users';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import './index.css';
import { THEME_MODES } from './constants';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(THEME_MODES.LIGHT);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState('login');

  // Mock user data
  const user = {
    name: 'Nyuydine Bill',
    email: 'nyuydine.bill@resolvemeq.com',
    avatar: null,
    role: 'admin'
  };

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || THEME_MODES.LIGHT;
    console.log('Initial theme:', savedTheme);
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (savedTheme === THEME_MODES.AUTO) {
        console.log('System theme changed, applying auto mode');
        applyTheme(THEME_MODES.AUTO);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    console.log('Applying theme:', newTheme);
    
    // Always start by removing dark class to ensure light mode
    root.classList.remove('dark');
    
    if (newTheme === THEME_MODES.DARK) {
      root.classList.add('dark');
      console.log('Dark mode applied');
    } else if (newTheme === THEME_MODES.LIGHT) {
      root.classList.remove('dark');
      console.log('Light mode applied');
    } else if (newTheme === THEME_MODES.AUTO) {
      // Auto mode - follow system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
        console.log('Auto mode: Dark (system preference)');
      } else {
        root.classList.remove('dark');
        console.log('Auto mode: Light (system preference)');
      }
    }
    
    // Log the current state
    console.log('Current dark class:', root.classList.contains('dark'));
  };

  const handleThemeChange = (newTheme) => {
    console.log('Theme change requested:', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthPage('login');
    console.log('Logging out...');
  };

  // Authentication handlers
  const handleLogin = (credentials) => {
    // For now, accept any credentials
    console.log('Login attempt:', credentials);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleSignup = (userData) => {
    // For now, accept any signup data
    console.log('Signup attempt:', userData);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleForgotPassword = (email) => {
    // For now, just log the email
    console.log('Forgot password for:', email);
    setAuthPage('reset-password');
  };

  const handleResetPassword = (passwordData) => {
    // For now, just log the password reset
    console.log('Password reset:', passwordData);
    setAuthPage('login');
  };

  const renderAuthPage = () => {
    switch (authPage) {
      case 'login':
        return <Login onLogin={handleLogin} onNavigateToSignup={() => setAuthPage('signup')} onNavigateToForgotPassword={() => setAuthPage('forgot-password')} />;
      case 'signup':
        return <Signup onSignup={handleSignup} onNavigateToLogin={() => setAuthPage('login')} />;
      case 'forgot-password':
        return <ForgotPassword onSubmit={handleForgotPassword} onNavigateToLogin={() => setAuthPage('login')} />;
      case 'reset-password':
        return <ResetPassword onSubmit={handleResetPassword} onNavigateToLogin={() => setAuthPage('login')} />;
      default:
        return <Login onLogin={handleLogin} onNavigateToSignup={() => setAuthPage('signup')} onNavigateToForgotPassword={() => setAuthPage('forgot-password')} />;
    }
  };

  const renderPage = () => {
    try {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'tickets':
          return <Tickets />;
        case 'analytics':
          return <Analytics />;
        case 'teams':
          return <Teams />;
        case 'users':
          return <Users />;
        case 'billing':
          return <Billing />;
        case 'settings':
          return <Settings />;
        default:
          return <Dashboard />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Page</h2>
          <p className="text-gray-600 mb-4">Something went wrong. Please try refreshing the page.</p>
          <p className="text-sm text-gray-500 mb-4">Error: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }
  };

  // Show authentication pages if not authenticated
  if (!isAuthenticated) {
    return renderAuthPage();
  }

  return (
    <Layout
      user={user}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      onThemeChange={handleThemeChange}
      onLogout={handleLogout}
      theme={theme}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
