import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Ticket, 
  BarChart3, 
  Users, 
  User,
  BookOpen,
  Settings,
  CreditCard,
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
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
  onThemeChange,
  activeTeamId,
  activeTeamName,
  userTeams = [],
  onActiveTeamChange,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target)) setTeamDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const iconMap = {
    Home,
    Ticket,
    BarChart3,
    Users,
    User,
    BookOpen,
    Settings,
    CreditCard,
  };

  const themeIcons = {
    [THEME_MODES.LIGHT]: Sun,
    [THEME_MODES.DARK]: Moon,
    [THEME_MODES.AUTO]: Monitor,
  };

  const handleNavigate = (path) => {
    onNavigate?.(path);
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

  const navigationGroups = [
    {
      label: 'Operations',
      items: NAVIGATION_ITEMS.filter(item => ['dashboard', 'tickets'].includes(item.id))
    },
    {
      label: 'Intelligence',
      items: NAVIGATION_ITEMS.filter(item => ['analytics', 'knowledge-base'].includes(item.id))
    },
    {
      label: 'Management',
      items: NAVIGATION_ITEMS.filter(item => ['teams', 'users'].includes(item.id))
    },
    {
      label: 'Account',
      items: NAVIGATION_ITEMS.filter(item => ['billing', 'settings'].includes(item.id))
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2.5"
            >
              <img src="/logo.png" alt="ResolveMeQ" className="h-7 w-auto object-contain" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">ResolveMeQ</span>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full"
            >
              <img src="/logo.png" alt="ResolveMeQ" className="h-7 w-7 object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = activeItem === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.href)}
                    className={cn(
                      'w-full flex items-center px-3 py-2 rounded-lg transition-colors duration-150 text-left group',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      <Icon size={18} />
                    </div>
                    
                    {!collapsed && (
                      <span className={cn('ml-3 text-sm font-medium', isActive && 'font-semibold')}>
                        {item.label}
                      </span>
                    )}
                    
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Active team switcher */}
      {(userTeams.length > 0 || activeTeamId) && (
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800" ref={teamDropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors duration-150 text-left',
                'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
              title={collapsed ? (activeTeamName || 'Select team') : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <Users size={18} />
                </div>
                {!collapsed && (
                  <span className="font-medium truncate text-sm">
                    {activeTeamName || 'Select team'}
                  </span>
                )}
              </div>
              {!collapsed && <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />}
            </button>
            <AnimatePresence>
              {teamDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={cn(
                    'absolute py-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-50 max-h-48 overflow-y-auto',
                    collapsed
                      ? 'left-full ml-2 top-0 min-w-[180px]'
                      : 'left-0 right-0 bottom-full mb-2'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => { onActiveTeamChange?.(null); setTeamDropdownOpen(false); }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors duration-150',
                      !activeTeamId ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    No team selected
                  </button>
                  {userTeams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { onActiveTeamChange?.(t.id); setTeamDropdownOpen(false); }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm truncate transition-colors duration-150',
                        activeTeamId === t.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleThemeChange}
          className="w-full flex items-center px-3 py-2 rounded-lg transition-colors duration-150 text-left group hover:bg-gray-100 dark:hover:bg-gray-800"
          title={collapsed ? `${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode` : undefined}
        >
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {React.createElement(themeIcons[theme], { size: 18 })}
          </div>
          
          {!collapsed && (
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </span>
          )}
        </button>
      </div>

      {/* Collapse button when collapsed */}
      {collapsed && (
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={collapsed ? 'closed' : 'open'}
        className={cn(
          'hidden lg:flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800',
          className
        )}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
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
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="lg:hidden fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl z-50"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="ResolveMeQ" className="h-7 w-auto object-contain" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">ResolveMeQ</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                aria-label="Close menu"
              >
                <X size={18} />
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