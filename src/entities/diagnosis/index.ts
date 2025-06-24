// Diagnosis Entity - Public API
// Domain-driven design exports for diagnostic results management

// Core diagnosis model and types
export type {
  DiagnosisResult,
  ICD10Code,
  ClinicalRecommendation,
  DifferentialDiagnosis,
  TreatmentPlan,
} from './model/Diagnosis';

// Diagnosis factory and domain services
export { DiagnosisFactory, DiagnosisDomainService } from './model/Diagnosis';

// Re-export for convenience
export type { DiagnosisResult as DiagnosisEntity } from './model/Diagnosis';
