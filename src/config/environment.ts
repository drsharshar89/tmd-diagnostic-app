// Environment configuration helper
export const ENV = {
  // Application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'TMD Diagnostic Tool',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'production',
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,

  // API
  API_URL: import.meta.env.VITE_API_URL || '',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),

  // Security
  ENABLE_ENCRYPTION: import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false',
  ENABLE_SECURITY_HEADERS: import.meta.env.VITE_ENABLE_SECURITY_HEADERS !== 'false',
  CSP_REPORT_URI: import.meta.env.VITE_CSP_REPORT_URI || '',

  // Analytics
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID || '',
  GTM_ID: import.meta.env.VITE_GTM_ID || '',

  // Error Logging
  ENABLE_ERROR_LOGGING: import.meta.env.VITE_ENABLE_ERROR_LOGGING !== 'false',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'error',

  // Features
  ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA !== 'false',
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
  ENABLE_ADVANCED_ANALYTICS: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS !== 'false',
  ENABLE_MEDICAL_COMPLIANCE: import.meta.env.VITE_ENABLE_MEDICAL_COMPLIANCE !== 'false',

  // Medical
  HIPAA_MODE: import.meta.env.VITE_HIPAA_MODE !== 'false',
  MEDICAL_DISCLAIMER: import.meta.env.VITE_MEDICAL_DISCLAIMER !== 'false',
  REQUIRE_CONSENT: import.meta.env.VITE_REQUIRE_CONSENT !== 'false',

  // Storage
  STORAGE_ENCRYPTION: import.meta.env.VITE_STORAGE_ENCRYPTION !== 'false',
  STORAGE_EXPIRY_HOURS: parseInt(import.meta.env.VITE_STORAGE_EXPIRY_HOURS || '48', 10),
  MAX_STORED_ASSESSMENTS: parseInt(import.meta.env.VITE_MAX_STORED_ASSESSMENTS || '10', 10),

  // Development
  DEV_TOOLS: import.meta.env.VITE_DEV_TOOLS === 'true',
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};

// Validate critical environment variables
export const validateEnvironment = (): void => {
  const requiredInProduction = [];

  if (ENV.IS_PRODUCTION) {
    const missing = requiredInProduction.filter((key) => !ENV[key as keyof typeof ENV]);

    if (missing.length > 0) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Warn about security settings
  if (!ENV.ENABLE_ENCRYPTION && ENV.HIPAA_MODE) {
    console.warn('HIPAA mode is enabled but encryption is disabled. This may not be compliant.');
  }

  if (ENV.DEBUG_MODE && ENV.IS_PRODUCTION) {
    console.warn('Debug mode is enabled in production. This should be disabled.');
  }
};

// Feature flag helper
export const isFeatureEnabled = (feature: keyof typeof ENV): boolean => {
  const value = ENV[feature];
  return typeof value === 'boolean' ? value : value === 'true';
};

// Environment-specific configuration
export const getConfig = () => {
  return {
    app: {
      name: ENV.APP_NAME,
      version: ENV.APP_VERSION,
      environment: ENV.APP_ENVIRONMENT,
    },
    security: {
      encryption: ENV.ENABLE_ENCRYPTION,
      headers: ENV.ENABLE_SECURITY_HEADERS,
      cspReportUri: ENV.CSP_REPORT_URI,
    },
    analytics: {
      enabled: ENV.ENABLE_ANALYTICS,
      gaTrackingId: ENV.GA_TRACKING_ID,
      gtmId: ENV.GTM_ID,
    },
    features: {
      pwa: ENV.ENABLE_PWA,
      offline: ENV.ENABLE_OFFLINE_MODE,
      advancedAnalytics: ENV.ENABLE_ADVANCED_ANALYTICS,
      medicalCompliance: ENV.ENABLE_MEDICAL_COMPLIANCE,
    },
    medical: {
      hipaaMode: ENV.HIPAA_MODE,
      disclaimer: ENV.MEDICAL_DISCLAIMER,
      requireConsent: ENV.REQUIRE_CONSENT,
    },
    storage: {
      encryption: ENV.STORAGE_ENCRYPTION,
      expiryHours: ENV.STORAGE_EXPIRY_HOURS,
      maxAssessments: ENV.MAX_STORED_ASSESSMENTS,
    },
  };
};
