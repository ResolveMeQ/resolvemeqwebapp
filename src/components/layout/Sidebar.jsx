import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Ticket, 
  BarChart3, 
  Users, 
  User,
  Settings,
  CreditCard,
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { NAVIGATION_ITEMS, THEME_MODES } from '../../constants';

/**
 * Sidebar component with responsive design and glassmorphism effects
 * @param {Object} props - Component props
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.onToggle - Function to toggle sidebar state
 * @param {string} props.activeItem - Currently active navigation item
 * @param {Function} props.onNavigate - Function to handle navigation
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.theme - Current theme mode
 * @param {Function} props.onThemeChange - Function to handle theme changes
 */
const Sidebar = ({
  collapsed = false,
  onToggle,
  activeItem = 'dashboard',
  onNavigate,
  className,
  theme = THEME_MODES.LIGHT,
  onThemeChange
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const iconMap = {
    Home,
    Ticket,
    BarChart3,
    Users,
    User,
    Settings,
    CreditCard,
  };

  const themeIcons = {
    [THEME_MODES.LIGHT]: Sun,
    [THEME_MODES.DARK]: Moon,
    [THEME_MODES.AUTO]: Monitor,
  };

  const handleNavigate = (itemId) => {
    onNavigate?.(itemId);
    setIsMobileOpen(false);
  };

  const handleThemeChange = () => {
    const themes = Object.values(THEME_MODES);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    onThemeChange?.(themes[nextIndex]);
  };

  const sidebarVariants = {
    open: { width: 280, transition: { duration: 0.3, ease: 'easeOut' } },
    closed: { width: 80, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const itemVariants = {
    open: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    closed: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">ResolveMeQ</span>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible-ring"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = activeItem === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left group',
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                'flex-shrink-0 w-6 h-6 flex items-center justify-center',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
              )}>
                <Icon size={20} />
              </div>
              
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 py-2">
        <button
          onClick={handleThemeChange}
          className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left group hover:bg-gray-100 dark:hover:bg-gray-800"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
            {React.createElement(themeIcons[theme], { size: 20 })}
          </div>
          
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-medium text-gray-600 dark:text-gray-300"
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="footer-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by ResolveMeQ
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                v1.0.0
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="footer-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">RMQ</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={collapsed ? 'closed' : 'open'}
        className={cn(
          'hidden lg:flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-700/20 shadow-lg',
          className
        )}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/20 dark:border-gray-700/20"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-700/20 shadow-lg z-50"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">ResolveMeQ</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar; 