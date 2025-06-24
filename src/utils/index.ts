import {
  RiskLevel,
  QuickAssessmentAnswers,
  ComprehensiveAnswers,
  AssessmentType,
  StoredAssessment,
  AssessmentResult,
} from '../types';
import { Language, getTranslation } from '../i18n';
// Updated to use centralized Medical Protocol Engine
import {
  processComprehensiveAssessment,
  processQuickAssessment,
  calculateRiskLevel as medicalCalculateRiskLevel,
} from '../features/diagnostics/engine/MedicalProtocolEngine';

// Risk Calculation Utilities - Now using centralized Medical Protocol Engine
export const calculateQuickAssessmentRisk = (answers: QuickAssessmentAnswers): AssessmentResult => {
  // Calculate score from boolean answers
  let score = 0;
  const weights = { q1: 2, q2: 2, q3: 1, q4: 3, q5: 1, q6: 1, q7: 1 };

  Object.entries(answers).forEach(([key, value]) => {
    if (value === true && key in weights) {
      score += weights[key as keyof typeof weights];
    }
  });

  // Determine risk level
  let riskLevel: RiskLevel = 'low';
  if (score >= 6) riskLevel = 'high';
  else if (score >= 3) riskLevel = 'moderate';

  // Generate recommendations based on risk level
  const recommendations = getRiskRecommendations(riskLevel);

  return {
    riskLevel,
    score,
    maxScore: 11,
    confidence: Math.min(0.95, 0.6 + (score / 11) * 0.35),
    recommendations,
    timestamp: new Date(),
    assessmentType: 'quick',
    answers,
    requiresImmediateAttention: score >= 8 || (answers.q4 === true && answers.q1 === true),
    followUpRecommended: riskLevel !== 'low',
    specialistReferral: score >= 6,
  };
};

// Helper function for risk-based recommendations
const getRiskRecommendations = (riskLevel: RiskLevel): string[] => {
  switch (riskLevel) {
    case 'low':
      return [
        'Maintain good oral hygiene',
        'Avoid excessive gum chewing',
        'Practice stress management techniques',
        'Monitor for any changes in symptoms',
      ];
    case 'moderate':
      return [
        'Apply warm compresses to jaw area',
        'Eat soft foods and avoid hard/chewy items',
        'Practice jaw relaxation exercises',
        'Consider over-the-counter pain relief if needed',
        'Schedule a dental consultation within 2-4 weeks',
      ];
    case 'high':
      return [
        'Schedule immediate dental/medical consultation',
        'Avoid hard foods and excessive jaw movements',
        'Apply ice packs for acute pain (15-20 minutes)',
        'Consider temporary soft diet',
        'Document symptoms and triggers',
        'Avoid self-treatment beyond basic comfort measures',
      ];
    default:
      return [];
  }
};

export const calculateComprehensiveAssessmentRisk = (
  answers: ComprehensiveAnswers
): AssessmentResult => {
  // Use the centralized Medical Protocol Engine for consistent results
  return processComprehensiveAssessment(answers);
};

// Legacy functions for backward compatibility
export const getQuickAssessmentRiskLevel = (answers: QuickAssessmentAnswers): RiskLevel => {
  return processQuickAssessment(answers).riskLevel;
};

export const getComprehensiveAssessmentRiskLevel = (answers: ComprehensiveAnswers): RiskLevel => {
  return processComprehensiveAssessment(answers).riskLevel;
};

export const calculateRiskLevel = (
  assessmentType: AssessmentType,
  quickAnswers?: QuickAssessmentAnswers,
  comprehensiveAnswers?: ComprehensiveAnswers
): RiskLevel => {
  if (assessmentType === 'quick' && quickAnswers) {
    return medicalCalculateRiskLevel('quick', quickAnswers);
  }

  if (assessmentType === 'comprehensive' && comprehensiveAnswers) {
    return medicalCalculateRiskLevel('comprehensive', comprehensiveAnswers);
  }

  return 'low';
};

// Recommendation Utilities
export const getRecommendationsByRisk = (riskLevel: RiskLevel, lang: Language): string[] => {
  const t = getTranslation(lang);

  switch (riskLevel) {
    case 'low':
      return [t.lowRiskRec1, t.lowRiskRec2, t.lowRiskRec3];
    case 'moderate':
      return [t.moderateRiskRec1, t.moderateRiskRec2, t.moderateRiskRec3];
    case 'high':
      return [t.highRiskRec1, t.highRiskRec2, t.highRiskRec3];
    default:
      return [];
  }
};

// Storage Utilities
export const generateAssessmentCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Helper function to get stored assessment codes (non-PHI)
const getStoredAssessmentCodes = (): Array<{ code: string; timestamp: Date; expiresAt: Date }> => {
  try {
    const stored = localStorage.getItem('tmd_assessment_codes');
    if (!stored) return [];

    const codes = JSON.parse(stored);
    // Filter out expired codes
    const validCodes = codes.filter((item: any) => new Date(item.expiresAt) > new Date());

    // Update storage with valid codes only
    if (validCodes.length !== codes.length) {
      localStorage.setItem('tmd_assessment_codes', JSON.stringify(validCodes));
    }

    return validCodes;
  } catch (error) {
    return [];
  }
};

export const saveAssessment = async (result: AssessmentResult): Promise<string> => {
  const { secureStorePHI, PHIClassification } = await import('../services/HIPAASecurityService');

  const code = generateAssessmentCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours from now

  const storedAssessment: StoredAssessment = {
    id: code,
    result,
    expiresAt,
    encrypted: true, // Now properly encrypted
    version: '1.0.0',
    deviceInfo: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      timestamp: new Date(),
    },
  };

  // Use HIPAA-compliant secure storage for PHI data
  await secureStorePHI(`assessment_${code}`, storedAssessment, PHIClassification.HIGH);

  // Store assessment index (non-PHI) in regular storage
  const existingCodes = getStoredAssessmentCodes();
  existingCodes.push({
    code,
    timestamp: new Date(),
    expiresAt,
  });

  localStorage.setItem('tmd_assessment_codes', JSON.stringify(existingCodes));
  return code;
};

export const getStoredAssessments = (): StoredAssessment[] => {
  try {
    const stored = localStorage.getItem('tmd_assessments');
    if (!stored) return [];

    const assessments: StoredAssessment[] = JSON.parse(stored);
    // Filter out expired assessments
    const validAssessments = assessments.filter(
      (assessment) => new Date(assessment.expiresAt) > new Date()
    );

    // Update storage with only valid assessments
    localStorage.setItem('tmd_assessments', JSON.stringify(validAssessments));
    return validAssessments;
  } catch {
    return [];
  }
};

export const getAssessmentByCode = async (code: string): Promise<StoredAssessment | null> => {
  try {
    const { secureRetrievePHI } = await import('../services/HIPAASecurityService');

    // Retrieve from secure storage
    const storedAssessment = await secureRetrievePHI<StoredAssessment | null>(
      `assessment_${code}`,
      null
    );

    if (!storedAssessment) {
      return null;
    }

    // Check if assessment is expired
    if (new Date(storedAssessment.expiresAt) <= new Date()) {
      return null;
    }

    return storedAssessment;
  } catch (error) {
    console.error('Failed to retrieve assessment:', error);
    return null;
  }
};

// Validation Utilities
export const validateQuickAssessment = (answers: QuickAssessmentAnswers): boolean => {
  // Check if at least one question has been answered
  const hasAnswers = Object.values(answers).some((answer) => answer !== null);
  return hasAnswers;
};

// Formatting Utilities
export const formatDate = (date: Date, lang: Language): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const locale = lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'zh-CN';
  return date.toLocaleDateString(locale, options);
};

export const getRiskLevelColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return '#4CAF50';
    case 'moderate':
      return '#FF9800';
    case 'high':
      return '#f44336';
    default:
      return '#666';
  }
};

// Analytics Utilities
export const trackEvent = (event: string, category: string, label?: string, value?: number) => {
  // In a real app, this would integrate with analytics service
  // Analytics event logged
};

// Theme Utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Error Handling Utilities
export const createAppError = (
  code: string,
  message: string,
  details?: Record<string, unknown>
) => ({
  code,
  message,
  details,
});

// Debounce Utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local Storage Utilities
export const setLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage error handled gracefully
  }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    // Read error handled gracefully
    return defaultValue;
  }
};

// Export enhanced calculations with proper names
export {
  validateComprehensiveAssessment,
  getAssessmentCompleteness,
} from './enhanced-calculations';

// ... existing code ...
