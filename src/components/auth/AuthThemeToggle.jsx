import React, { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { THEME_MODES } from '../../constants';
import { applyThemeToDocument, getLocalTheme, normalizeTheme, setLocalTheme } from '../../utils/theme';

const THEME_CYCLE = {
  [THEME_MODES.LIGHT]: THEME_MODES.DARK,
  [THEME_MODES.DARK]: THEME_MODES.AUTO,
  [THEME_MODES.AUTO]: THEME_MODES.LIGHT,
};

const THEME_ICONS = {
  [THEME_MODES.LIGHT]: Sun,
  [THEME_MODES.DARK]: Moon,
  [THEME_MODES.AUTO]: Monitor,
};

/**
 * Theme toggle for auth pages (no app Layout / sidebar).
 */
const AuthThemeToggle = () => {
  const [theme, setTheme] = useState(() => getLocalTheme());

  const handleToggle = () => {
    const current = normalizeTheme(theme);
    const next = THEME_CYCLE[current] || THEME_MODES.LIGHT;
    setTheme(next);
    setLocalTheme(next);
    applyThemeToDocument(next);
  };

  const Icon = THEME_ICONS[normalizeTheme(theme)] || Sun;
  const label = `${normalizeTheme(theme)} mode`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur hover:bg-gray-50 dark:hover:bg-gray-800"
      aria-label={`Switch theme (${label})`}
      title={`Theme: ${label}. Click to change.`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline capitalize">{label}</span>
    </button>
  );
};

export default AuthThemeToggle;
