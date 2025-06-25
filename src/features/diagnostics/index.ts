// Diagnostics Feature Public API
// Medical-grade TMD diagnostic engine and related functionality

// =====================================================
// CENTRALIZED MEDICAL PROTOCOL ENGINE (RECOMMENDED)
// =====================================================
export {
  MedicalProtocolEngine,
  createMedicalProtocolEngine,
  processComprehensiveAssessment,
  processQuickAssessment,
  calculateRiskLevel,
  type MedicalScoreResult,
  type CategoryScore,
  type TMDClassification,
  type ProtocolConfig,
} from './engine/MedicalProtocolEngine';

// Import for factory function
import { createMedicalProtocolEngine } from './engine/MedicalProtocolEngine';

// =====================================================
// LEGACY ENGINES (DEPRECATED - Use MedicalProtocolEngine)
// =====================================================
/** @deprecated Use MedicalProtocolEngine instead */
export { TMDDiagnosticEngine, type DiagnosticProcessingResult } from './engine/TMDDiagnosticEngine';
/** @deprecated Use MedicalProtocolEngine instead */
export { ProtocolValidator, type ProtocolValidationResult } from './engine/ProtocolValidator';
/** @deprecated Use MedicalProtocolEngine instead */
export { RiskCalculator, type DetailedRiskResult } from './engine/RiskCalculator';
/** @deprecated Use MedicalProtocolEngine instead */
export {
  EnhancedRiskCalculator,
  type EnhancedRiskResult,
  createEnhancedRiskCalculator,
} from './engine/EnhancedRiskCalculator';
/** @deprecated Use MedicalProtocolEngine instead */
export { ICD10Mapper, type ICD10MappingResult } from './engine/ICD10Mapper';

// =====================================================
// FACTORY FUNCTIONS
// =====================================================

// Primary factory function (recommended)
export const createDiagnosticEngine = createMedicalProtocolEngine;

// Legacy factory function for backward compatibility
/** @deprecated Use createMedicalProtocolEngine instead */
export const createLegacyDiagnosticEngine = (config?: any) => {
  const { TMDDiagnosticEngine } = require('./engine/TMDDiagnosticEngine');
  return new TMDDiagnosticEngine(config);
};

// Diagnostics Feature Barrel Exports

// Main Engine
export { TMDDiagnosticEngine } from './engine/TMDDiagnosticEngine';
export { MedicalProtocolEngine } from './engine/MedicalProtocolEngine';

// Supporting Engines
export { ProtocolValidator } from './engine/ProtocolValidator';
export { RiskCalculator } from './engine/RiskCalculator';
export { EnhancedRiskCalculator } from './engine/EnhancedRiskCalculator';
export { ICD10Mapper } from './engine/ICD10Mapper';

// Types
export type { 
  DiagnosticProcessingResult,
  ProtocolValidationResult,
  DetailedRiskResult,
  ICD10MappingResult 
} from './engine/TMDDiagnosticEngine';

// Factory function for TMD Engine
export const createTMDEngine = (config?: any) => {
  const { TMDDiagnosticEngine } = require('./engine/TMDDiagnosticEngine');
  return new TMDDiagnosticEngine(config);
};
