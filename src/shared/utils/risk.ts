// Risk Assessment Utilities - FSD Shared Layer
// Functions for calculating and managing risk levels

type RiskLevel = 'low' | 'moderate' | 'high';

/**
 * Gets the color associated with a risk level
 * @param riskLevel - Risk level
 * @returns Color hex code
 */
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

/**
 * Calculates risk level from scores and answers
 * @param totalScore - Total assessment score
 * @param maxScore - Maximum possible score
 * @returns Risk level
 */
export const calculateRiskLevel = (totalScore: number, maxScore: number): RiskLevel => {
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  if (percentage >= 70) return 'high';
  if (percentage >= 40) return 'moderate';
  return 'low';
};

/**
 * Gets recommendations based on risk level
 * @param riskLevel - Calculated risk level
 * @returns Array of recommendation strings
 */
export const getRecommendationsByRisk = (riskLevel: RiskLevel): string[] => {
  switch (riskLevel) {
    case 'low':
      return [
        'Continue with good oral hygiene practices',
        'Regular dental checkups are recommended',
        'Monitor symptoms and seek care if they worsen',
      ];
    case 'moderate':
      return [
        'Schedule a consultation with a dentist or TMD specialist',
        'Consider stress management techniques',
        'Avoid hard or chewy foods temporarily',
        'Apply heat/cold therapy as needed',
      ];
    case 'high':
      return [
        'Seek immediate professional evaluation',
        'Schedule urgent appointment with TMD specialist',
        'Avoid jaw-intensive activities',
        'Consider pain management options',
        'Document symptoms for medical consultation',
      ];
    default:
      return [];
  }
};
