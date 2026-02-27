import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Analytics from './pages/Analytics';
import Teams from './pages/Teams';
import Users from './pages/Users';
import KnowledgeBase from './pages/KnowledgeBase';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import './index.css';
import { THEME_MODES } from './constants';
import { TokenService, api } from './services/api';

function App() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState({
    tickets: [],
    knowledgeBase: [],
    users: [],
  });
  const [theme, setTheme] = useState(THEME_MODES.LIGHT);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [planName, setPlanName] = useState(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = TokenService.getAccessToken();
      const savedUser = TokenService.getUser();
      
      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      } else if (token) {
        try {
          const userData = await api.auth.getCurrentUser();
          TokenService.setUser(userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          TokenService.clearTokens();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Load preferences, user's teams, and subscription (for header plan badge) when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setPreferences(null);
      setUserTeams([]);
      setPlanName(null);
      return;
    }
    const load = async () => {
      try {
        const [prefs, teams, sub] = await Promise.all([
          api.settings.getPreferences(),
          api.teams.list().catch(() => []),
          api.billing.getSubscription().catch(() => null),
        ]);
        setPreferences(prefs || null);
        setUserTeams(Array.isArray(teams) ? teams : []);
        const name = sub?.plan_detail?.name ?? sub?.plan?.name ?? null;
        setPlanName(name || null);
      } catch {
        setPreferences(null);
        setUserTeams([]);
        setPlanName(null);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleActiveTeamChange = async (teamId) => {
    try {
      await api.settings.updatePreferences({ active_team: teamId || null });
      const prefs = await api.settings.getPreferences();
      setPreferences(prefs || null);
    } catch (e) {
      console.error('Failed to set active team:', e);
    }
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

  const handleNavigate = (to) => {
    const path = typeof to === 'string' && to.startsWith('/') ? to : `/${to}`;
    navigate(path);
  };

  const handleSearch = async (query) => {
    const trimmed = (query || '').trim();
    setSearchQuery(trimmed);

    if (!trimmed) {
      setSearchResults({ tickets: [], knowledgeBase: [], users: [] });
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const [tickets, kbArticles, teamMembers] = await Promise.all([
        api.tickets.search({ q: trimmed }).catch(() => []),
        api.knowledgeBase.search(trimmed).catch(() => []),
        api.users.listTeamMembers().catch(() => []),
      ]);

      const lower = trimmed.toLowerCase();
      const usersFiltered = (Array.isArray(teamMembers) ? teamMembers : []).filter((u) => {
        const fullName = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim();
        return (
          (fullName && fullName.toLowerCase().includes(lower)) ||
          (u.email && u.email.toLowerCase().includes(lower)) ||
          (u.username && u.username.toLowerCase().includes(lower))
        );
      });

      setSearchResults({
        tickets: Array.isArray(tickets) ? tickets : [],
        knowledgeBase: Array.isArray(kbArticles) ? kbArticles : [],
        users: usersFiltered,
      });
    } catch (err) {
      console.error('Global search failed:', err);
      setSearchError(err?.message || 'Search failed. Please try again.');
      setSearchResults({ tickets: [], knowledgeBase: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  // Authentication handlers
  const handleLogin = (loginData) => {
    setUser(loginData.user);
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleSignup = (userData) => {
    setAuthPage('login');
    navigate('/login');
  };

  const handleForgotPassword = (email) => {
    navigate('/reset-password');
  };

  const handleResetPassword = (passwordData) => {
    setAuthPage('login');
    navigate('/login');
  };

  const renderAuthRoutes = () => (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} onNavigateToSignup={() => navigate('/signup')} onNavigateToForgotPassword={() => navigate('/forgot-password')} />} />
      <Route path="/signup" element={<Signup onSignup={handleSignup} onNavigateToLogin={() => navigate('/login')} />} />
      <Route path="/forgot-password" element={<ForgotPassword onSubmit={handleForgotPassword} onNavigateToLogin={() => navigate('/login')} />} />
      <Route path="/reset-password" element={<ResetPassword onSubmit={handleResetPassword} onNavigateToLogin={() => navigate('/login')} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  const layoutProps = {
    user,
    planName,
    onNavigate: handleNavigate,
    onSearch: handleSearch,
    onThemeChange: handleThemeChange,
    onLogout: handleLogout,
    theme,
    searchQuery,
    searchResults,
    searchLoading,
    searchError,
    activeTeamId: preferences?.active_team,
    activeTeamName: preferences?.active_team_name,
    userTeams,
    onActiveTeamChange: handleActiveTeamChange,
  };

  const renderMainRoutes = () => (
    <Routes>
      <Route path="/" element={<Layout {...layoutProps}><Dashboard /></Layout>} />
      <Route path="/tickets" element={<Layout {...layoutProps}><Tickets /></Layout>} />
      <Route path="/analytics" element={<Layout {...layoutProps}><Analytics /></Layout>} />
      <Route path="/teams" element={<Layout {...layoutProps}><Teams /></Layout>} />
      <Route path="/users" element={<Layout {...layoutProps}><Users /></Layout>} />
      <Route path="/knowledge-base" element={<Layout {...layoutProps}><KnowledgeBase /></Layout>} />
      <Route path="/billing" element={<Layout {...layoutProps}><Billing /></Layout>} />
      <Route path="/settings" element={<Layout {...layoutProps}><Settings /></Layout>} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication routes if not authenticated
  if (!isAuthenticated) {
    return renderAuthRoutes();
  }

  return renderMainRoutes();
}

export default App;
