// Storage Utilities - FSD Shared Layer
// Functions for managing assessment data persistence

interface AssessmentResult {
  riskLevel: 'low' | 'moderate' | 'high';
  score: number;
  maxScore: number;
  confidence: number;
  timestamp: Date;
  assessmentType: 'quick' | 'comprehensive';
  answers: unknown;
  recommendations: string[];
}

interface StoredAssessment {
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

/**
 * Generates a unique assessment code
 * @returns 6-character uppercase code
 */
export const generateAssessmentCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Helper function to get stored assessment codes (non-PHI)
 */
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

/**
 * Saves an assessment result to local storage
 * @param result - Assessment result to save
 * @returns Generated assessment code
 */
export const saveAssessment = async (result: AssessmentResult): Promise<string> => {
  const { secureStorePHI, PHIClassification } = await import('../../services/HIPAASecurityService');

  const code = generateAssessmentCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours from now

  const storedAssessment: StoredAssessment = {
    id: code,
    result,
    expiresAt,
    encrypted: true, // Now properly encrypted with AES-256-GCM
    version: '1.0.0',
    deviceInfo: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      timestamp: new Date(),
    },
  };

  try {
    // Use HIPAA-compliant secure storage for PHI data
    await secureStorePHI(`assessment_${code}`, storedAssessment, PHIClassification.HIGH);

    // Store only assessment codes (non-PHI) in regular storage for indexing
    const existingCodes = getStoredAssessmentCodes();
    existingCodes.push({
      code,
      timestamp: new Date(),
      expiresAt,
    });

    localStorage.setItem('tmd_assessment_codes', JSON.stringify(existingCodes));
  } catch (error) {
    console.error('Failed to save assessment:', error);
    throw new Error('Unable to save assessment data');
  }

  return code;
};

/**
 * Retrieves all stored assessments, filtering out expired ones
 * @returns Array of valid stored assessments
 */
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
    if (validAssessments.length !== assessments.length) {
      localStorage.setItem('tmd_assessments', JSON.stringify(validAssessments));
    }

    return validAssessments;
  } catch (error) {
    console.error('Failed to retrieve assessments:', error);
    return [];
  }
};

/**
 * Loads a specific assessment by code
 * @param code - Assessment code
 * @returns Stored assessment or null if not found
 */
export const loadAssessment = (code: string): StoredAssessment | null => {
  const assessments = getStoredAssessments();
  return assessments.find((assessment) => assessment.id === code) || null;
};
