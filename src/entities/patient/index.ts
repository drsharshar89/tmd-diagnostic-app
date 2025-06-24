// Patient Entity - Public API
// Domain-driven design exports for patient management

// Core patient model and types
export type {
  Patient,
  PatientDemographics,
  MedicalHistory,
  Medication,
  Allergy,
  PatientConsent,
  ClinicalNotes,
  CareTeam,
} from './model/Patient';

// Patient factory and domain services
export { PatientFactory, PatientDomainService } from './model/Patient';

// Re-export for convenience
export type { Patient as PatientEntity } from './model/Patient';
