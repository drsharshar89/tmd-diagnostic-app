// Assessment Feature Public API
// This is the main export file for the assessment feature

export { QuickAssessmentView } from './components/QuickAssessmentView';
export { ComprehensiveAssessmentView } from './components/ComprehensiveAssessmentView';
export { HomeView } from './components/HomeView';
export { useAssessment } from './hooks/useAssessment';
export { useAssessmentValidation } from './hooks/useAssessmentValidation';
export { useQuickAssessment } from './hooks/useQuickAssessment';

// Types
export type { QuickAssessmentAnswers, ComprehensiveAnswers, AssessmentType } from './types';

// Stores
export { assessmentStore } from './stores/assessmentStore';

// Utils
export {
  calculateAssessmentRisk,
  validateQuickAssessment,
  validateComprehensiveAssessment,
  getAssessmentCompleteness,
} from './utils/validation';

// Assessment Feature Barrel Exports

// Types - Re-export from shared types for compatibility
export type { 
  QuickAssessmentAnswers, 
  ComprehensiveAnswers, 
  AssessmentType,
  RiskLevel,
  AssessmentResult 
} from '@/shared/types';

// Config
export { default as quickAssessmentConfig } from './config/quick-assessment.json';
