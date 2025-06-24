// Assessment Entity - Public API
// Domain-driven design exports for TMD assessment management

// Core assessment model and types
export type {
  TMDAssessment,
  AssessmentResponse,
  AssessmentResponseValue,
  RiskScore,
  ICD10Code,
  ClinicalRecommendation,
  DiagnosisResult,
  AssessmentSession,
  DCTMDProtocol,
} from './model/Assessment';

// Assessment factory and domain services
export { AssessmentFactory, AssessmentDomainService } from './model/Assessment';

// Re-export for convenience
export type { TMDAssessment as AssessmentEntity } from './model/Assessment';
