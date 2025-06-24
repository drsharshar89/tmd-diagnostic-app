// Analytics Utilities - FSD Shared Layer
// Functions for tracking user events and data storage

/**
 * Track user events for analytics
 * @param event - Event name
 * @param category - Event category
 * @param label - Optional label
 * @param value - Optional numeric value
 */
export const trackEvent = (
  event: string,
  category: string,
  label?: string,
  value?: number
): void => {
  // In a real app, this would integrate with analytics service
  // Analytics event logged
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', { event, category, label, value });
  }
};

/**
 * Safely store data in localStorage
 * @param key - Storage key
 * @param value - Value to store
 */
export const setLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage error handled gracefully
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to save to localStorage:', error);
    }
  }
};

/**
 * Safely retrieve data from localStorage
 * @param key - Storage key
 * @param defaultValue - Default value if key not found
 * @returns Retrieved value or default
 */
export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    // Read error handled gracefully
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to read from localStorage:', error);
    }
    return defaultValue;
  }
};
