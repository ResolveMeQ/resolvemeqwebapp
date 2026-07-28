// Theme Colors
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  brand: {
    DEFAULT: '#2563eb',
    fg: '#60a5fa',
    muted: '#1d4ed8',
    ink: '#0b1220',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
};

// Ticket Status Types
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CRITICAL: 'critical',
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Ticket Categories
export const TICKET_CATEGORIES = {
  HARDWARE: 'hardware',
  SOFTWARE: 'software',
  NETWORK: 'network',
  ACCESS: 'access',
  EMAIL: 'email',
  OTHER: 'other',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  USER: 'user',
};

// Navigation Items
export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: 'Home',
  },
  {
    id: 'tickets',
    label: 'Tickets',
    href: '/tickets',
    icon: 'Ticket',
  },
  {
    id: 'escalation-queue',
    label: 'Escalation Queue',
    href: '/escalation-queue',
    icon: 'AlertTriangle',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    href: '/workflows',
    icon: 'ListChecks',
  },
  {
    id: 'automation-rules',
    label: 'Automation Rules',
    href: '/settings/automation',
    icon: 'Zap',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
  },
  {
    id: 'teams',
    label: 'Teams',
    href: '/teams',
    icon: 'Users',
  },
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    icon: 'User',
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    href: '/knowledge-base',
    icon: 'BookOpen',
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/billing',
    icon: 'CreditCard',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    href: '/settings/integrations',
    icon: 'Plug',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// Status Configurations
export const STATUS_CONFIG = {
  [TICKET_STATUS.OPEN]: {
    label: 'Open',
    color: 'primary',
    bgColor: 'primary-50',
    textColor: 'primary-700',
    borderColor: 'primary-200',
  },
  [TICKET_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'primary',
    bgColor: 'primary-50',
    textColor: 'primary-700',
    borderColor: 'primary-200',
  },
  [TICKET_STATUS.PENDING]: {
    label: 'Pending',
    color: 'warning',
    bgColor: 'warning-50',
    textColor: 'warning-700',
    borderColor: 'warning-200',
  },
  [TICKET_STATUS.RESOLVED]: {
    label: 'Resolved',
    color: 'success',
    bgColor: 'success-50',
    textColor: 'success-700',
    borderColor: 'success-200',
  },
  [TICKET_STATUS.CLOSED]: {
    label: 'Closed',
    color: 'neutral',
    bgColor: 'neutral-50',
    textColor: 'neutral-700',
    borderColor: 'neutral-200',
  },
  [TICKET_STATUS.CRITICAL]: {
    label: 'Critical',
    color: 'error',
    bgColor: 'error-50',
    textColor: 'error-700',
    borderColor: 'error-200',
  },
};

// Priority Configurations
export const PRIORITY_CONFIG = {
  [PRIORITY_LEVELS.LOW]: {
    label: 'Low',
    color: 'success',
    bgColor: 'success-50',
    textColor: 'success-700',
    borderColor: 'success-200',
  },
  [PRIORITY_LEVELS.MEDIUM]: {
    label: 'Medium',
    color: 'warning',
    bgColor: 'warning-50',
    textColor: 'warning-700',
    borderColor: 'warning-200',
  },
  [PRIORITY_LEVELS.HIGH]: {
    label: 'High',
    color: 'error',
    bgColor: 'error-50',
    textColor: 'error-700',
    borderColor: 'error-200',
  },
  [PRIORITY_LEVELS.CRITICAL]: {
    label: 'Critical',
    color: 'error',
    bgColor: 'error-100',
    textColor: 'error-800',
    borderColor: 'error-300',
  },
};

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// API Endpoints
export const API_ENDPOINTS = {
  TICKETS: '/api/tickets',
  USERS: '/api/users',
  ANALYTICS: '/api/analytics',
  AUTH: '/api/auth',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  TICKET_CREATED: 'Ticket created successfully.',
  TICKET_UPDATED: 'Ticket updated successfully.',
  TICKET_RESOLVED: 'Ticket resolved successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
};

/**
 * Mirrors Django `tickets.models.Ticket.CATEGORY_CHOICES`.
 * Primary source for the UI is GET /api/tickets/categories/; this is the offline fallback.
 */
export const TICKET_CATEGORY_FALLBACK = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'vpn', label: 'VPN' },
  { value: 'printer', label: 'Printer' },
  { value: 'email', label: 'Email' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'network', label: 'Network' },
  { value: 'account', label: 'Account' },
  { value: 'access', label: 'Access' },
  { value: 'phone', label: 'Phone' },
  { value: 'server', label: 'Server' },
  { value: 'security', label: 'Security' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'storage', label: 'Storage' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'offboarding', label: 'Offboarding' },
  { value: 'license_renewal', label: 'License Renewal' },
  { value: 'office_move', label: 'Office Move' },
  { value: 'contractor_access', label: 'Contractor Access' },
  { value: 'hardware_retirement', label: 'Hardware Retirement' },
  { value: 'other', label: 'Other' },
];

// Theme Modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

/** Default UI theme for new users and when no preference is stored. */
export const DEFAULT_THEME = THEME_MODES.LIGHT; 