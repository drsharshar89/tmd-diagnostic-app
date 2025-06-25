import { Language } from '../i18n';

// Assessment Types
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
  // Pain Assessment Questions (Q1-Q7)
  q1: boolean | null; // Jaw pain at rest
  q2: boolean | null; // Pain when opening mouth wide
  q3: boolean | null; // Pain when chewing
  q4: boolean | null; // Temple pain
  q5: boolean | null; // Ear pain
  q6: boolean | null; // Morning jaw stiffness
  q7: number | null; // Pain severity (0-4 DC/TMD standard)

  // Joint Sounds (Q8-Q11)
  q8: boolean | null; // Clicking sounds
  q9: boolean | null; // Popping sounds
  q10: boolean | null; // Grinding/crepitus
  q11: string | null; // Sound location

  // Jaw Function (Q12-Q17)
  q12: boolean | null; // Limited mouth opening
  q13: boolean | null; // Jaw locking closed
  q14: boolean | null; // Jaw locking open
  q15: boolean | null; // Deviation when opening
  q16: boolean | null; // Difficulty chewing hard foods
  q17: boolean | null; // Fatigue when chewing

  // Associated Symptoms (Q18-Q21)
  q18: boolean | null; // Headaches
  q19: boolean | null; // Neck pain
  q20: boolean | null; // Tinnitus
  q21: boolean | null; // Dizziness

  // History and Triggers (Q22-Q26)
  q22: boolean | null; // Recent dental work
  q23: boolean | null; // Trauma to jaw/face
  q24: number | null; // Stress levels (0-4 DC/TMD standard)
  q25: string | null; // Sleep bruxism
  q26: boolean | null; // Daytime clenching
}

// Question Types
export interface QuestionData {
  text: string;
  type: 'yesno' | 'scale' | 'choice';
  category:
    | 'Pain Assessment'
    | 'Joint Sounds'
    | 'Jaw Function'
    | 'Associated Symptoms'
    | 'History & Triggers';
  options?: string[];
}

export type AssessmentType = 'quick' | 'comprehensive' | null;
export type RiskLevel = 'low' | 'moderate' | 'high';
export type Theme = 'light' | 'dark';

// Component Props
export interface BaseViewProps {
  lang: Language;
}

export interface AssessmentViewProps extends BaseViewProps {
  onComplete: (answers: QuickAssessmentAnswers | ComprehensiveAnswers) => void;
}

export interface ResultViewProps extends BaseViewProps {
  assessmentType: AssessmentType;
  quickAnswers?: QuickAssessmentAnswers | undefined;
  comprehensiveAnswers?: ComprehensiveAnswers | undefined;
}

export interface ThemeAndLangToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

// Enhanced Assessment Result
export interface AssessmentResult {
  riskLevel: RiskLevel;
  score: number;
  maxScore: number;
  confidence: number; // 0-1
  recommendations: string[];
  timestamp: Date;
  assessmentType: AssessmentType;
  answers: QuickAssessmentAnswers | ComprehensiveAnswers;

  // Detailed Analysis
  painScore?: number;
  functionalScore?: number;
  soundsScore?: number;
  associatedScore?: number;
  historyScore?: number;

  // Medical Codes
  icd10Codes?: string[];
  dcTmdClassification?: string;

  // Flags
  requiresImmediateAttention: boolean;
  followUpRecommended: boolean;
  specialistReferral: boolean;
}

// Enhanced Storage
export interface StoredAssessment {
  id: string;
  result: AssessmentResult;
  expiresAt: Date;
  encrypted: boolean;
  version: string;
  deviceInfo?: {
    userAgent: string;
    timestamp: Date;
    ipHash?: string;
  };
}

// Application State
export interface AppState {
  language: Language;
  theme: Theme;
  assessmentType: AssessmentType;
  quickAnswers?: QuickAssessmentAnswers;
  comprehensiveAnswers?: ComprehensiveAnswers;
  currentAssessment?: AssessmentResult;

  // User Preferences
  preferences: {
    autoSave: boolean;
    soundEnabled: boolean;
    highContrast: boolean;
    largeFonts: boolean;
    reducedMotion: boolean;
  };

  // Analytics
  analytics: {
    sessionId: string;
    startTime: Date;
    pageViews: number;
    assessmentsCompleted: number;
  };
}

// Navigation
export type RouteParams = {
  '/': void;
  '/quick-assessment': void;
  '/comprehensive-assessment': void;
  '/results': void;
  '/history': void;
  '/settings': void;
  '/privacy': void;
  '/help': void;
};

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
}

// Analytics Event
export interface AnalyticsEvent {
  event: string;
  category: 'assessment' | 'navigation' | 'user_action' | 'medical' | 'performance' | 'error';
  label?: string;
  value?: number;
  customDimensions?: Record<string, string | number>;
}

// Medical Data Types
export interface PainMapping {
  region: string;
  intensity: number; // 0-4 DC/TMD standard
  frequency: 'constant' | 'intermittent' | 'occasional';
  triggers: string[];
  relievers: string[];
}

export interface TMDClassification {
  category: 'muscle' | 'joint' | 'mixed';
  subtype: string;
  severity: 'mild' | 'moderate' | 'severe';
  chronicity: 'acute' | 'chronic';
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number; // 0-1
}

// Security Types
export interface SecurityContext {
  isEncrypted: boolean;
  hashVersion: string;
  lastUpdated: Date;
  accessCount: number;
  ipRestrictions?: string[];
}

// Performance Types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  bundleSize: number;
  assessmentCompletionTime: number;
}
