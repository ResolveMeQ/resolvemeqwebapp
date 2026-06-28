import React, { useState, useEffect } from 'react';
import { TOUR_STORAGE_KEY } from './components/AppTour';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import EscalationQueue from './pages/EscalationQueue';
import Analytics from './pages/Analytics';
import Teams from './pages/Teams';
import Users from './pages/Users';
import KnowledgeBase from './pages/KnowledgeBase';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import CommunityQuestionPublic from './pages/CommunityQuestionPublic';
import KnowledgeBaseArticleRoute from './pages/KnowledgeBaseArticleRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Verify from './pages/auth/Verify';
import './index.css';
import { THEME_MODES } from './constants';
import { TokenService, api } from './services/api';

function safeNextPath(next) {
  const raw = String(next || '').trim();
  if (!raw) return null;
  // Only allow internal relative paths.
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}

function AuthGate({ isAuthenticated, children }) {
  const location = useLocation();
  if (isAuthenticated) return children;
  const next = `${location.pathname}${location.search || ''}`;
  return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState({
    tickets: [],
    communityResolvedTickets: [],
    knowledgeBase: [],
    communityQuestions: [],
    users: [],
  });
  const [theme, setTheme] = useState(THEME_MODES.DARK);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [planName, setPlanName] = useState(null);
  const [tourRun, setTourRun] = useState(false);
  const [tourNonce, setTourNonce] = useState(0);

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
  const loadUserData = React.useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPreferences(null);
      setUserTeams([]);
      setPlanName(null);
      return;
    }
    loadUserData();
  }, [isAuthenticated, loadUserData]);

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setTourRun(true), 900);
    return () => clearTimeout(t);
  }, [isAuthenticated, loading]);

  useEffect(() => {
    const onStartTour = () => {
      setTourNonce((n) => n + 1);
      setTourRun(true);
    };
    window.addEventListener('resolvemeq:start-tour', onStartTour);
    return () => window.removeEventListener('resolvemeq:start-tour', onStartTour);
  }, []);

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
    const savedTheme = localStorage.getItem('theme') || THEME_MODES.DARK;
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === THEME_MODES.AUTO) {
        applyTheme(THEME_MODES.AUTO);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    // Always start by removing dark class to ensure light mode
    root.classList.remove('dark');
    
    if (newTheme === THEME_MODES.DARK) {
      root.classList.add('dark');
    } else if (newTheme === THEME_MODES.LIGHT) {
      root.classList.remove('dark');
    } else if (newTheme === THEME_MODES.AUTO) {
      // Auto mode - follow system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleNavigate = (to) => {
    const path = typeof to === 'string' && to.startsWith('/') ? to : `/${to}`;
    navigate(path);
  };

  const handleSearch = async (query) => {
    const trimmed = (query || '').trim();
    setSearchQuery(trimmed);

    if (!trimmed) {
      setSearchResults({ tickets: [], communityResolvedTickets: [], knowledgeBase: [], communityQuestions: [], users: [] });
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const [ticketSearch, kbArticles, communityQuestions, teamMembers] = await Promise.all([
        api.tickets.search({ q: trimmed }).catch(() => ({})),
        api.knowledgeBase.search(trimmed).catch(() => []),
        api.knowledgeBase.listCommunityQuestions({ q: trimmed, sort: 'votes' }).catch(() => []),
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

      const mine = Array.isArray(ticketSearch?.my_tickets)
        ? ticketSearch.my_tickets
        : Array.isArray(ticketSearch)
          ? ticketSearch
          : [];
      const community = Array.isArray(ticketSearch?.community_resolved)
        ? ticketSearch.community_resolved
        : [];

      setSearchResults({
        tickets: mine,
        communityResolvedTickets: community,
        knowledgeBase: Array.isArray(kbArticles) ? kbArticles : [],
        communityQuestions: Array.isArray(communityQuestions) ? communityQuestions : [],
        users: usersFiltered,
      });
    } catch (err) {
      console.error('Global search failed:', err);
      setSearchError(err?.message || 'Search failed. Please try again.');
      setSearchResults({ tickets: [], communityResolvedTickets: [], knowledgeBase: [], communityQuestions: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setTourRun(false);
    const next = safeNextPath(`${location.pathname}${location.search || ''}`) || '/';
    navigate(`/login?next=${encodeURIComponent(next)}`);
  };

  // Authentication handlers
  const handleLogin = (loginData) => {
    setUser(loginData.user);
    setIsAuthenticated(true);
    const params = new URLSearchParams(window.location.search || '');
    const nextParam = safeNextPath(params.get('next'));
    navigate(nextParam || '/');
  };

  const handleSignup = (userData) => {
    setAuthPage('login');
    navigate('/login');
  };

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
    onRefreshUserData: loadUserData,
    tourRun,
    setTourRun,
    tourNonce,
  };

  const renderMainRoutes = () => (
    <Routes>
      <Route path="/community/q/:slugAndId" element={<CommunityQuestionPublic />} />
      <Route path="/knowledge-base/article/:slugAndId" element={<KnowledgeBaseArticleRoute />} />
      <Route
        path="/"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Dashboard /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/tickets"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Tickets /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/escalation-queue"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><EscalationQueue /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/analytics"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Analytics /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/teams"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Teams /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/users"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Users /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/knowledge-base"
        element={
          <Layout {...layoutProps}>
            <KnowledgeBase isAuthenticated={isAuthenticated} />
          </Layout>
        }
      />
      <Route
        path="/billing"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Billing /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Settings /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/settings/integrations"
        element={
          <AuthGate isAuthenticated={isAuthenticated}>
            <Layout {...layoutProps}><Settings initialTab="integrations" /></Layout>
          </AuthGate>
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/" replace />
            : <Login
                onLogin={handleLogin}
                onNavigateToSignup={() => navigate('/signup')}
                onNavigateToForgotPassword={() => navigate('/forgot-password')}
              />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated
            ? <Navigate to="/" replace />
            : <Signup
                onSignup={handleSignup}
                onNavigateToLogin={() => navigate('/login')}
                onGoogleSignedIn={handleLogin}
              />
        }
      />
      <Route
        path="/verify"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Verify onNavigateToLogin={() => navigate('/login')} />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword onNavigateToLogin={() => navigate('/login')} />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword onNavigateToLogin={() => navigate('/login')} />}
      />
      <Route path="*" element={<Navigate to="/knowledge-base" replace />} />
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

  return renderMainRoutes();
}

export default App;
