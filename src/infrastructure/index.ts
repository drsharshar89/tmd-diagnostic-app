// Infrastructure Layer - FSD Architecture
// External services and integrations

// API Client
export {
  APIClient,
  createAPIClient,
  defaultAPIConfig,
  type APIConfig,
  type RequestOptions,
  type APIResponse,
  type APIError,
  type Assessment,
  type DiagnosticResult,
} from './api/client';

// Storage Repository
export {
  AssessmentRepository,
  createAssessmentRepository,
  assessmentRepository,
} from './storage/assessmentRepository';

// Analytics Service
export {
  MedicalAnalytics,
  createMedicalAnalytics,
  medicalAnalytics,
  DiagnosticEventType,
  trackAssessmentStarted,
  trackAssessmentCompleted,
  trackQuestionAnswered,
  trackPerformanceMetric,
  trackError,
  type DiagnosticEvent,
} from './monitoring/analytics';

// Re-export commonly used types for convenience
export type { AssessmentResult, StoredAssessment } from '@/shared/types';
