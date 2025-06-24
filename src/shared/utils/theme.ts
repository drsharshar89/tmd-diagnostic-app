// Theme Utilities - FSD Shared Layer
// Pure functions for theme management

/**
 * Detects system theme preference
 * @returns 'light' or 'dark' based on system preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};
