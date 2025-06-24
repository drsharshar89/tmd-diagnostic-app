// Assessment Feature Public API
// This is the main export file for the assessment feature

export { QuickAssessmentView } from './components/QuickAssessmentView';
export { ComprehensiveAssessmentView } from './components/ComprehensiveAssessmentView';
export { HomeView } from './components/HomeView';
export { useAssessment } from './hooks/useAssessment';
export { useAssessmentValidation } from './hooks/useAssessmentValidation';

// Types
export type { QuickAssessmentAnswers, ComprehensiveAnswers, AssessmentType } from './types';

// Stores
export { assessmentStore } from './stores/assessmentStore';

// Utils
export {
  validateQuickAssessment,
  validateComprehensiveAssessment,
  getAssessmentCompleteness,
} from './utils/validation';
