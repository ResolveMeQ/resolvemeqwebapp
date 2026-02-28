import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalSearchPanel from '../GlobalSearchPanel';
import { cn } from '../../utils/cn';

const PATH_TO_PAGE_ID = {
  '/': 'dashboard',
  '/tickets': 'tickets',
  '/analytics': 'analytics',
  '/teams': 'teams',
  '/users': 'users',
  '/knowledge-base': 'knowledge-base',
  '/billing': 'billing',
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
  planName,
  searchQuery,
  searchResults,
  searchLoading,
  searchError,
}) => {
  const location = useLocation();
  const activeItem = PATH_TO_PAGE_ID[location.pathname] ?? 'dashboard';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
          onThemeChange={onThemeChange}
          onLogout={onLogout}
          onNavigate={onNavigate}
          theme={theme}
        />

        {/* Global Search Results */}
        <GlobalSearchPanel
          query={searchQuery}
          results={searchResults}
          loading={searchLoading}
          error={searchError}
          onNavigate={onNavigate}
        />

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 