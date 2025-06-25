// Shared Types - FSD Architecture
// Global types used across features

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ru' | 'zh';
export type AssessmentType = 'quick' | 'comprehensive' | null;
export type RiskLevel = 'low' | 'moderate' | 'high';

// Base interfaces for components
export interface BaseViewProps {
  lang: Language;
}

export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

// Common data structures
export interface PainMapping {
  location: string;
  intensity: number;
  description?: string;
}

export interface TMDClassification {
  category: string;
  subtype?: string;
  severity: RiskLevel;
}

// Assessment interfaces - Fixed to match actual implementation
export interface QuickAssessmentAnswers {
  q1: boolean | null; // Jaw pain or discomfort
  q2: boolean | null; // Pain worsens with movement
  q3: boolean | null; // Joint sounds
  q4: boolean | null; // Jaw locking
  q5: boolean | null; // Referred symptoms
  q6: boolean | null; // History of trauma/dental work
  q7: boolean | null; // Stiffness or fatigue
  [key: string]: boolean | null; // For dynamic question handling
}

export interface ComprehensiveAnswers {
  q1: boolean | null;
  q2: boolean | null;
  q3: boolean | null;
  q4: boolean | null;
  q5: boolean | null;
  q6: boolean | null;
  q7: number | null;
  q8: boolean | null;
  q9: boolean | null;
  q10: boolean | null;
  q11: string | null;
  q12: boolean | null;
  q13: boolean | null;
  q14: boolean | null;
  q15: boolean | null;
  q16: boolean | null;
  q17: boolean | null;
  q18: boolean | null;
  q19: boolean | null;
  q20: boolean | null;
  q21: boolean | null;
  q22: boolean | null;
  q23: boolean | null;
  q24: number | null;
  q25: string | null;
  q26: boolean | null;
}

// Assessment result interface
export interface AssessmentResult {
  riskLevel: RiskLevel;
  score: number;
  maxScore: number;
  confidence: number;
  recommendations: string[];
  timestamp: Date;
  assessmentType: AssessmentType;
  answers: QuickAssessmentAnswers | ComprehensiveAnswers;

  // Optional detailed scores for comprehensive assessment
  painScore?: number;
  functionalScore?: number;
  soundsScore?: number;
  associatedScore?: number;
  historyScore?: number;

  // Medical classification
  icd10Codes?: string[];
  dcTmdClassification?: string;

  // Clinical flags
  requiresImmediateAttention?: boolean;
  followUpRecommended?: boolean;
  specialistReferral?: boolean;
}

// Storage interface
export interface StoredAssessment {
  id: string;
  result: AssessmentResult;
  expiresAt: Date;
  encrypted: boolean;
  version: string;
  deviceInfo: {
    userAgent: string;
    timestamp: Date;
  };
}

// Component prop interfaces
export interface AssessmentViewProps extends BaseViewProps {
  onComplete: (answers: QuickAssessmentAnswers | ComprehensiveAnswers) => void;
}

export interface ResultViewProps extends BaseViewProps {
  assessmentType: AssessmentType;
  quickAnswers?: QuickAssessmentAnswers;
  comprehensiveAnswers?: ComprehensiveAnswers;
}
