import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalSearchPanel from '../GlobalSearchPanel';
import AppTour from '../AppTour';
import AgentQuotaBanner from '../AgentQuotaBanner';
import { cn } from '../../utils/cn';

const PATH_TO_PAGE_ID = {
  '/': 'dashboard',
  '/tickets': 'tickets',
  '/analytics': 'analytics',
  '/teams': 'teams',
  '/users': 'users',
  '/knowledge-base': 'knowledge-base',
  '/billing': 'billing',
  '/settings/integrations': 'integrations',
  '/settings': 'settings',
};

/**
 * Main layout component that wraps the entire application
 */
const Layout = ({
  children,
  user,
  onNavigate,
  onSearch,
  onThemeChange,
  onLogout,
  theme,
  className,
  activeTeamId,
  activeTeamName,
  userTeams = [],
  onActiveTeamChange,
  onRefreshUserData,
  planName,
  searchQuery,
  searchResults,
  searchLoading,
  searchError,
  tourRun,
  setTourRun,
  tourNonce = 0,
}) => {
  const location = useLocation();
  const activeItem = PATH_TO_PAGE_ID[location.pathname] ?? 'dashboard';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hasTeamSwitcher = userTeams.length > 0 || !!activeTeamId;

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    if (!searchQuery?.trim()) return;
    const handleMouseDown = (e) => {
      const t = e.target;
      if (
        typeof t.closest === 'function' &&
        (t.closest('[data-global-search-field]') || t.closest('[data-global-search-panel]'))
      ) {
        return;
      }
      onSearch?.('');
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [searchQuery, onSearch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppTour
        key={tourNonce}
        run={tourRun}
        setRun={setTourRun}
        hasTeamSwitcher={hasTeamSwitcher}
      />
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        activeItem={activeItem}
        onNavigate={onNavigate}
        theme={theme}
        onThemeChange={onThemeChange}
        className="fixed left-0 top-0 h-full z-40"
        activeTeamId={activeTeamId}
        activeTeamName={activeTeamName}
        userTeams={userTeams}
        onActiveTeamChange={onActiveTeamChange}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'min-h-screen transition-[margin] duration-300 ease-out',
          sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
        )}
      >
        {/* Header */}
        <Header
          user={user}
          planName={planName}
          onSearch={onSearch}
          committedSearchQuery={searchQuery}
          onThemeChange={onThemeChange}
          onLogout={onLogout}
          onNavigate={onNavigate}
          theme={theme}
        />

        <AgentQuotaBanner user={user} />

        {/* Global Search Results */}
        <GlobalSearchPanel
          query={searchQuery}
          results={searchResults}
          loading={searchLoading}
          error={searchError}
          onNavigate={onNavigate}
          onClose={() => onSearch?.('')}
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4.5rem))] sm:pb-6">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {React.Children.map(children, (child) =>
              React.isValidElement(child) && onRefreshUserData
                ? React.cloneElement(child, { onRefreshUserData, activeTeamId, onThemeChange, theme })
                : React.isValidElement(child)
                  ? React.cloneElement(child, { activeTeamId, onThemeChange, theme })
                  : child
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 