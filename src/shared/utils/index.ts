// Shared Utilities - FSD Architecture
// Pure utility functions used across features

export { getSystemTheme } from './theme';
export { trackEvent, setLocalStorage, getLocalStorage } from './analytics';
export { debounce, throttle } from './performance';
export { createAppError, validateInput } from './validation';
export { formatDate, formatTime } from './formatting';
export { calculateRiskLevel, getRiskLevelColor, getRecommendationsByRisk } from './risk';
export { saveAssessment, loadAssessment } from './storage';
