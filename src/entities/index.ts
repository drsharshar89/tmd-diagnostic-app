// Entities Layer - Feature-Sliced Design
// Domain-driven design entities for TMD diagnostic system

// Patient Entity
export type {
  Patient,
  PatientDemographics,
  MedicalHistory,
  Medication,
  Allergy,
  PatientConsent,
  ClinicalNotes,
  CareTeam,
  PatientEntity,
} from './patient';

export { PatientFactory, PatientDomainService } from './patient';

// Assessment Entity
export type {
  TMDAssessment,
  AssessmentResponse,
  AssessmentResponseValue,
  RiskScore,
  AssessmentSession,
  DCTMDProtocol,
  AssessmentEntity,
} from './assessment';

export { AssessmentFactory, AssessmentDomainService } from './assessment';

// Diagnosis Entity
export type {
  DiagnosisResult,
  ICD10Code,
  ClinicalRecommendation,
  DifferentialDiagnosis,
  TreatmentPlan,
  DiagnosisEntity,
} from './diagnosis';

export { DiagnosisFactory, DiagnosisDomainService } from './diagnosis';
