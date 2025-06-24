import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { THEME_MODES } from '../../constants';

/**
 * Header component with search, notifications, and user menu
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Function} props.onSearch - Function to handle search
 * @param {Function} props.onThemeChange - Function to handle theme change
 * @param {Function} props.onLogout - Function to handle logout
 * @param {string} props.theme - Current theme mode
 * @param {string} props.className - Additional CSS classes
 */
const Header = ({
  user = {
    name: 'Nyuydine BIll',
    email: 'nyuydine.bill@resolvemeq.com',
    avatar: null,
    role: 'admin'
  },
  onSearch,
  onThemeChange,
  onLogout,
  theme = THEME_MODES.LIGHT,
  className
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const themeMenuRef = useRef(null);

  // Handle clicking outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleThemeChange = (newTheme) => {
    onThemeChange?.(newTheme);
    setIsThemeMenuOpen(false);
  };

  const themeOptions = [
    { value: THEME_MODES.LIGHT, icon: Sun, label: 'Light' },
    { value: THEME_MODES.DARK, icon: Moon, label: 'Dark' },
    { value: THEME_MODES.AUTO, icon: Monitor, label: 'Auto' },
  ];

  const notifications = [
    {
      id: 1,
      title: 'New ticket assigned',
      message: 'You have been assigned ticket #1234',
      time: '2 minutes ago',
      type: 'info'
    },
    {
      id: 2,
      title: 'System update',
      message: 'Scheduled maintenance completed',
      time: '1 hour ago',
      type: 'success'
    },
    {
      id: 3,
      title: 'Critical alert',
      message: 'High priority ticket requires attention',
      time: '3 hours ago',
      type: 'warning'
    }
  ];

  return (
    <header className={cn(
      'sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/20 shadow-lg',
      className
    )}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors duration-200 z-10" size={20} />
              <input
                type="text"
                placeholder="Search tickets, users, or anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/30 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-200 group-hover:bg-white/80 dark:group-hover:bg-gray-800/80 group-hover:border-blue-300/50 dark:group-hover:border-blue-600/50 focus:bg-white/90 dark:focus:bg-gray-800/90 focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 hover:scale-110"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Billing Status */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/30 dark:border-blue-700/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Pro Plan</span>
          </div>

          {/* Theme Toggle */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => {
                setIsThemeMenuOpen(!isThemeMenuOpen);
                setIsNotificationsOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible-ring"
              aria-label="Theme options"
            >
              {themeOptions.find(option => option.value === theme)?.icon && 
                React.createElement(themeOptions.find(option => option.value === theme).icon, { 
                  size: 20,
                  className: "text-gray-600 dark:text-gray-300"
                })
              }
            </button>

            <AnimatePresence>
              {isThemeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 rounded-lg shadow-lg z-50"
                >
                  <div className="p-2">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value)}
                        className={cn(
                          'w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors',
                          theme === option.value
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                      >
                        <option.icon size={16} />
                        <span>{option.label}</span>
                        {theme === option.value && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsUserMenuOpen(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible-ring relative"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 rounded-lg shadow-lg z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                            notification.type === 'info' && 'bg-blue-500',
                            notification.type === 'success' && 'bg-green-500',
                            notification.type === 'warning' && 'bg-yellow-500',
                            notification.type === 'error' && 'bg-red-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible-ring"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 rounded-lg shadow-lg z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        // Navigate to settings
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 