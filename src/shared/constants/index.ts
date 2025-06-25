/**
 * Centralized constants for the TMD Diagnostic Application
 * All application-wide constants should be defined here
 */

// =====================================================
// MEDICAL CONSTANTS - DC/TMD Protocol
// =====================================================

export const MEDICAL_CONSTANTS = {
  PAIN_SCALE: {
    MIN: 0,
    MAX: 4,
    LEVELS: {
      NONE: 0,
      MILD: 1,
      MODERATE: 2,
      SEVERE: 3,
      EXTREME: 4,
    } as const,
  },
  ASSESSMENT_TYPES: {
    QUICK: 'quick',
    COMPREHENSIVE: 'comprehensive',
  } as const,
  RISK_LEVELS: {
    LOW: 'low',
    MODERATE: 'moderate',
    HIGH: 'high',
  } as const,
  TMD_CATEGORIES: {
    MYOFASCIAL: 'myofascial',
    ARTHRALGIA: 'arthralgia',
    DISC_DISPLACEMENT: 'disc_displacement',
    DEGENERATIVE: 'degenerative',
  } as const,
} as const;

// =====================================================
// UI CONSTANTS
// =====================================================

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  TOUCH_TARGET_MIN_SIZE: 44, // pixels
  Z_INDEX: {
    MODAL: 1000,
    TOOLTIP: 900,
    DROPDOWN: 800,
    HEADER: 100,
    DEFAULT: 1,
  } as const,
  BREAKPOINTS: {
    MOBILE: 320,
    TABLET: 768,
    DESKTOP: 1024,
    WIDE: 1440,
  } as const,
} as const;

// =====================================================
// PERFORMANCE CONSTANTS
// =====================================================

export const PERFORMANCE_CONSTANTS = {
  MAX_BUNDLE_SIZE: 500 * 1024, // 500KB
  TARGET_FPS: 60,
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  LAZY_LOAD_THRESHOLD: 0.1,
  VIRTUAL_SCROLL_BUFFER: 3,
  IMAGE_QUALITY: {
    THUMBNAIL: 0.6,
    STANDARD: 0.8,
    HIGH: 0.95,
  } as const,
} as const;

// =====================================================
// SECURITY CONSTANTS
// =====================================================

export const SECURITY_CONSTANTS = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  CSRF_HEADER: 'X-CSRF-Token',
  RATE_LIMIT: {
    WINDOW: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  } as const,
} as const;

// =====================================================
// API CONSTANTS
// =====================================================

export const API_CONSTANTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  ENDPOINTS: {
    ASSESSMENT: '/assessment',
    DIAGNOSIS: '/diagnosis',
    PATIENT: '/patient',
    REPORT: '/report',
  } as const,
} as const;

// =====================================================
// VALIDATION CONSTANTS
// =====================================================

export const VALIDATION_CONSTANTS = {
  NAME_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
} as const;

// =====================================================
// STORAGE CONSTANTS
// =====================================================

export const STORAGE_CONSTANTS = {
  KEYS: {
    THEME: 'tmd_theme',
    LANGUAGE: 'tmd_language',
    USER_PREFERENCES: 'tmd_user_preferences',
    ASSESSMENT_DRAFT: 'tmd_assessment_draft',
    CSRF_TOKEN: 'tmd_csrf_token',
  } as const,
  EXPIRY: {
    DRAFT: 24 * 60 * 60 * 1000, // 24 hours
    CACHE: 60 * 60 * 1000, // 1 hour
  } as const,
} as const;

// =====================================================
// FEATURE FLAGS
// =====================================================

export const FEATURE_FLAGS = {
  ENABLE_3D_PAIN_MAPPING: true,
  ENABLE_VOICE_INPUT: false,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ANALYTICS: true,
  ENABLE_PWA: true,
  ENABLE_ADVANCED_DIAGNOSTICS: true,
} as const;

// =====================================================
// ERROR CODES
// =====================================================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  MEDICAL_LOGIC_ERROR: 'MEDICAL_LOGIC_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

// Type exports for TypeScript
export type PainLevel = typeof MEDICAL_CONSTANTS.PAIN_SCALE.LEVELS[keyof typeof MEDICAL_CONSTANTS.PAIN_SCALE.LEVELS];
export type AssessmentType = typeof MEDICAL_CONSTANTS.ASSESSMENT_TYPES[keyof typeof MEDICAL_CONSTANTS.ASSESSMENT_TYPES];
export type RiskLevel = typeof MEDICAL_CONSTANTS.RISK_LEVELS[keyof typeof MEDICAL_CONSTANTS.RISK_LEVELS];
export type TMDCategory = typeof MEDICAL_CONSTANTS.TMD_CATEGORIES[keyof typeof MEDICAL_CONSTANTS.TMD_CATEGORIES];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];