// Shared Configuration - FSD Architecture
// Centralized application configuration

export const APP_CONFIG = {
  // Application metadata
  name: 'TMD Diagnostic Tool',
  version: '1.0.0',
  description: 'Professional Medical Assessment for TMD',

  // Assessment settings
  assessment: {
    maxStorageDurationHours: 48,
    minDescriptionLength: 10,
    maxQuestionsPerPage: 5,
    autoSaveInterval: 30000, // 30 seconds
  },

  // Medical standards
  medical: {
    painScaleMax: 4, // DC/TMD standard (not 0-10)
    confidenceThreshold: 60, // Minimum confidence for recommendations
    immediateAttentionThreshold: 70, // Risk score requiring immediate attention
    specialistReferralThreshold: 80, // Risk score requiring specialist
  },

  // Performance settings
  performance: {
    debounceDelay: 300,
    throttleDelay: 100,
    maxBundleSize: 500, // KB
    targetFPS: 60,
  },

  // Storage settings
  storage: {
    prefix: 'tmd_',
    maxAssessments: 10,
    encryptionEnabled: true,
  },

  // UI settings
  ui: {
    defaultTheme: 'light' as const,
    defaultLanguage: 'en' as const,
    animationDuration: 300,
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
    },
  },

  // Development settings
  development: {
    enableLogs: process.env.NODE_ENV === 'development',
    enableAnalytics: process.env.NODE_ENV === 'production',
    apiMockDelay: 500,
  },
} as const;

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isDevelopment,
    isProduction,
    apiUrl: process.env.VITE_API_URL || 'http://localhost:3000',
    analyticsKey: process.env.VITE_ANALYTICS_KEY || '',
    sentryDsn: process.env.VITE_SENTRY_DSN || '',
  };
};
