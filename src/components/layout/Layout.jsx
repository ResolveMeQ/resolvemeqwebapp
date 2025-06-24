import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../utils/cn';

/**
 * Main layout component that wraps the entire application
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {Object} props.user - Current user object
 * @param {Function} props.onNavigate - Function to handle navigation
 * @param {Function} props.onSearch - Function to handle search
 * @param {Function} props.onThemeChange - Function to handle theme change
 * @param {Function} props.onLogout - Function to handle logout
 * @param {string} props.theme - Current theme mode
 * @param {string} props.className - Additional CSS classes
 */
const Layout = ({
  children,
  user,
  onNavigate,
  onSearch,
  onThemeChange,
  onLogout,
  theme,
  className
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleNavigate = (itemId) => {
    setActiveItem(itemId);
    onNavigate?.(itemId);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        activeItem={activeItem}
        onNavigate={handleNavigate}
        theme={theme}
        onThemeChange={onThemeChange}
        className="fixed left-0 top-0 h-full z-40"
      />

      {/* Main Content Area */}
      <div className={cn(
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70',
        'min-h-screen'
      )}>
        {/* Header */}
        <Header
          user={user}
          onSearch={onSearch}
          onThemeChange={onThemeChange}
          onLogout={onLogout}
          theme={theme}
        />

        {/* Page Content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 