import { DEFAULT_THEME, STORAGE_KEYS, THEME_MODES } from '../constants';

const VALID_THEMES = new Set(Object.values(THEME_MODES));

/** Normalize any theme string to light | dark | auto. */
export function normalizeTheme(value) {
  const v = String(value || '').trim().toLowerCase();
  if (VALID_THEMES.has(v)) return v;
  return DEFAULT_THEME;
}

/** Read cached theme from localStorage (pre-auth / fast boot). */
export function getLocalTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (!stored) return DEFAULT_THEME;
    return normalizeTheme(stored);
  } catch {
    return DEFAULT_THEME;
  }
}

/** Whether the user has already made an explicit theme choice on this device/browser. */
export function hasLocalTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) != null;
  } catch {
    return false;
  }
}

export function setLocalTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, normalizeTheme(theme));
  } catch {
    /* private browsing */
  }
}

/** Apply Tailwind dark class on <html> for light / dark / auto. */
export function applyThemeToDocument(theme) {
  const mode = normalizeTheme(theme);
  const root = document.documentElement;
  root.classList.remove('dark');

  if (mode === THEME_MODES.DARK) {
    root.classList.add('dark');
  } else if (mode === THEME_MODES.AUTO) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    }
  }
  return mode;
}
