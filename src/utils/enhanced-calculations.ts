/**
 * @deprecated This file is DEPRECATED and will be removed in a future version.
 *
 * All diagnostic logic has been consolidated into the centralized Medical Protocol Engine.
 * Please use the following instead:
 *
 * ```typescript
 * import {
 *   processComprehensiveAssessment,
 *   processQuickAssessment,
 *   calculateRiskLevel
 * } from '../features/diagnostics/engine/MedicalProtocolEngine';
 * ```
 *
 * This provides:
 * - Centralized diagnostic logic
 * - Medical-grade validation
 * - Evidence-based scoring
 * - DC/TMD protocol compliance
 * - Comprehensive test coverage
 * - Better performance and reliability
 *
 * Migration Guide:
 * - Replace TMDDiagnosticEngine.calculateComprehensiveRisk() with processComprehensiveAssessment()
 * - Replace calculateComprehensiveAssessmentRisk() with processComprehensiveAssessment()
 * - Use the utils/index.ts exports which now use the centralized engine
 */

import {
  ComprehensiveAnswers,
  AssessmentResult,
  RiskLevel,
  TMDClassification,
  PainMapping,
} from '../types';

// DC/TMD Diagnostic Criteria Implementation
export class TMDDiagnosticEngine {
  // Calculate comprehensive assessment risk with medical accuracy
  static calculateComprehensiveRisk(answers: ComprehensiveAnswers): AssessmentResult {
    const scores = this.calculateCategoryScores(answers);
    const totalScore = this.calculateTotalScore(scores);
    const riskLevel = this.determineRiskLevel(totalScore);
    const classification = this.classifyTMD(answers, scores);

    return {
      riskLevel,
      score: totalScore.current,
      maxScore: totalScore.maximum,
      confidence: this.calculateConfidence(answers),
      recommendations: this.generateRecommendations(riskLevel, classification, answers),
      timestamp: new Date(),
      assessmentType: 'comprehensive',
      answers,

      // Detailed scores
      painScore: scores.pain.percentage,
      functionalScore: scores.function.percentage,
      soundsScore: scores.sounds.percentage,
      associatedScore: scores.associated.percentage,
      historyScore: scores.history.percentage,

      // Medical classification
      icd10Codes: this.generateICD10Codes(classification),
      dcTmdClassification: classification.category,

      // Clinical flags
      requiresImmediateAttention: this.requiresImmediateAttention(answers, totalScore),
      followUpRecommended: this.needsFollowUp(riskLevel, scores),
      specialistReferral: this.needsSpecialistReferral(riskLevel, classification),
    };
  }

  // Calculate scores for each category
  private static calculateCategoryScores(answers: ComprehensiveAnswers) {
    return {
      pain: this.calculatePainScore(answers),
      function: this.calculateFunctionScore(answers),
      sounds: this.calculateSoundsScore(answers),
      associated: this.calculateAssociatedScore(answers),
      history: this.calculateHistoryScore(answers),
    };
  }

  // Pain Assessment Score (Q1-Q7)
  private static calculatePainScore(answers: ComprehensiveAnswers) {
    let score = 0;
    let maxScore = 0;

    // Q1-Q6: Boolean pain questions (2 points each for Yes)
    const booleanQuestions = [
      answers.q1,
      answers.q2,
      answers.q3,
      answers.q4,
      answers.q5,
      answers.q6,
    ];
    booleanQuestions.forEach((answer) => {
      if (answer !== null) {
        maxScore += 2;
        if (answer === true) score += 2;
      }
    });

    // Q7: Pain severity scale (0-4 DC/TMD standard)
    if (answers.q7 !== null) {
      maxScore += 10;
      score += answers.q7;
    }

    return {
      current: score,
      maximum: maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
    };
  }

  // Jaw Function Score (Q12-Q17)
  private static calculateFunctionScore(answers: ComprehensiveAnswers) {
    let score = 0;
    let maxScore = 0;

    const functionQuestions = [
      answers.q12,
      answers.q13,
      answers.q14,
      answers.q15,
      answers.q16,
      answers.q17,
    ];
    functionQuestions.forEach((answer) => {
      if (answer !== null) {
        maxScore += 3; // Higher weight for functional impairment
        if (answer === true) score += 3;
      }
    });

    return {
      current: score,
      maximum: maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
    };
  }

  // Joint Sounds Score (Q8-Q11)
  private static calculateSoundsScore(answers: ComprehensiveAnswers) {
    let score = 0;
    let maxScore = 0;

    // Q8-Q10: Boolean sound questions
    const soundQuestions = [answers.q8, answers.q9, answers.q10];
    soundQuestions.forEach((answer) => {
      if (answer !== null) {
        maxScore += 1;
        if (answer === true) score += 1;
      }
    });

    // Q11: Sound location (categorical scoring)
    if (answers.q11 !== null) {
      maxScore += 2;
      if (answers.q11 === 'Both sides') score += 2;
      else if (answers.q11 === 'Right side' || answers.q11 === 'Left side') score += 1;
      // 'No sounds' = 0 points
    }

    return {
      current: score,
      maximum: maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
    };
  }

  // Associated Symptoms Score (Q18-Q21)
  private static calculateAssociatedScore(answers: ComprehensiveAnswers) {
    let score = 0;
    let maxScore = 0;

    const associatedQuestions = [answers.q18, answers.q19, answers.q20, answers.q21];
    associatedQuestions.forEach((answer) => {
      if (answer !== null) {
        maxScore += 1;
        if (answer === true) score += 1;
      }
    });

    return {
      current: score,
      maximum: maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
    };
  }

  // History and Triggers Score (Q22-Q26)
  private static calculateHistoryScore(answers: ComprehensiveAnswers) {
    let score = 0;
    let maxScore = 0;

    // Q22-Q23: Recent events (higher weight)
    const recentEvents = [answers.q22, answers.q23];
    recentEvents.forEach((answer) => {
      if (answer !== null) {
        maxScore += 3;
        if (answer === true) score += 3;
      }
    });

    // Q24: Stress level (direct score 1-10)
    if (answers.q24 !== null) {
      maxScore += 10;
      score += answers.q24;
    }

    // Q25: Sleep bruxism (categorical scoring)
    if (answers.q25 !== null) {
      maxScore += 3;
      if (answers.q25 === 'Yes, definitely') score += 3;
      else if (answers.q25 === 'I think so') score += 2;
      else if (answers.q25 === "I don't think so") score += 1;
      // 'No, definitely not' = 0 points
    }

    // Q26: Daytime clenching
    if (answers.q26 !== null) {
      maxScore += 2;
      if (answers.q26 === true) score += 2;
    }

    return {
      current: score,
      maximum: maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
    };
  }

  // Calculate total weighted score
  private static calculateTotalScore(scores: {
    pain: { current: number; maximum: number; percentage: number };
    function: { current: number; maximum: number; percentage: number };
    sounds: { current: number; maximum: number; percentage: number };
    associated: { current: number; maximum: number; percentage: number };
    history: { current: number; maximum: number; percentage: number };
  }): { current: number; maximum: number; percentage: number } {
    const weights = {
      pain: 0.35, // 35% - most important
      function: 0.3, // 30% - functional impact
      sounds: 0.15, // 15% - diagnostic indicator
      associated: 0.1, // 10% - comorbidities
      history: 0.1, // 10% - risk factors
    } as const;

    const weightedScore =
      scores.pain.percentage * weights.pain +
      scores.function.percentage * weights.function +
      scores.sounds.percentage * weights.sounds +
      scores.associated.percentage * weights.associated +
      scores.history.percentage * weights.history;

    return {
      current: Math.round(weightedScore),
      maximum: 100,
      percentage: Math.round(weightedScore),
    };
  }

  // Determine risk level based on total score
  private static determineRiskLevel(totalScore: { current: number; maximum: number }): RiskLevel {
    const percentage = totalScore.current;

    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'moderate';
    return 'low';
  }

  // Calculate confidence level based on completeness and consistency
  private static calculateConfidence(answers: ComprehensiveAnswers): number {
    const totalQuestions = 26;
    let answeredQuestions = 0;

    // Count answered questions
    Object.values(answers).forEach((answer) => {
      if (answer !== null && answer !== undefined) {
        answeredQuestions++;
      }
    });

    const completeness = answeredQuestions / totalQuestions;

    // Check for consistency (simplified logic)
    let consistencyScore = 1.0;

    // If no pain but functional problems (inconsistent)
    if (!answers.q1 && !answers.q2 && !answers.q3 && (answers.q12 || answers.q13)) {
      consistencyScore -= 0.2;
    }

    // If high stress but no symptoms (less likely)
    if (answers.q24 && answers.q24 > 7 && !answers.q1 && !answers.q2) {
      consistencyScore -= 0.1;
    }

    return Math.max(0.5, completeness * consistencyScore);
  }

  // Classify TMD type based on DC/TMD criteria
  private static classifyTMD(answers: ComprehensiveAnswers, scores: any): TMDClassification {
    let category: 'muscle' | 'joint' | 'mixed' = 'muscle';
    let subtype = 'myofascial pain';

    // Determine primary category
    const hasJointSounds = answers.q8 || answers.q9 || answers.q10;
    const hasJointLocking = answers.q13 || answers.q14;
    const hasPain = answers.q1 || answers.q2 || answers.q3;

    if (hasJointSounds && hasJointLocking) {
      category = 'joint';
      subtype = 'disc displacement with reduction';
    } else if (hasJointSounds && !hasJointLocking) {
      category = 'joint';
      subtype = 'disc displacement without reduction';
    } else if (hasPain && scores.pain.percentage > 50) {
      category = 'muscle';
      subtype = 'myofascial pain';
    }

    if (hasJointSounds && hasPain) {
      category = 'mixed';
      subtype = 'muscle and joint disorder';
    }

    // Determine severity
    let severity: 'mild' | 'moderate' | 'severe' = 'mild';
    if (scores.function.percentage > 60) severity = 'severe';
    else if (scores.function.percentage > 30) severity = 'moderate';

    // Determine chronicity (simplified - would need timeline data)
    const chronicity: 'acute' | 'chronic' = 'chronic'; // Default assumption

    return { category, subtype, severity, chronicity };
  }

  // Generate ICD-10 codes based on classification
  private static generateICD10Codes(classification: TMDClassification): string[] {
    const codes: string[] = [];

    switch (classification.category) {
      case 'muscle':
        codes.push('M79.1'); // Myalgia
        codes.push('K07.60'); // Temporomandibular joint disorder, unspecified
        break;
      case 'joint':
        codes.push('M26.60'); // Temporomandibular joint disorder, unspecified
        codes.push('M26.63'); // Articular disc disorder of temporomandibular joint
        break;
      case 'mixed':
        codes.push('M26.60'); // Temporomandibular joint disorder, unspecified
        codes.push('M79.1'); // Myalgia
        break;
    }

    return codes;
  }

  // Check if immediate attention is required
  private static requiresImmediateAttention(
    answers: ComprehensiveAnswers,
    totalScore: any
  ): boolean {
    // Severe pain (>8/10)
    if (answers.q7 && answers.q7 > 8) return true;

    // Jaw locking
    if (answers.q13 || answers.q14) return true;

    // High total score with functional impairment
    if (totalScore.current > 80 && (answers.q12 || answers.q16)) return true;

    return false;
  }

  // Check if follow-up is recommended
  private static needsFollowUp(riskLevel: RiskLevel, scores: any): boolean {
    return riskLevel !== 'low' || scores.pain.percentage > 30;
  }

  // Check if specialist referral is needed
  private static needsSpecialistReferral(
    riskLevel: RiskLevel,
    classification: TMDClassification
  ): boolean {
    return (
      riskLevel === 'high' ||
      classification.severity === 'severe' ||
      classification.category === 'joint'
    );
  }

  // Generate personalized recommendations
  private static generateRecommendations(
    riskLevel: RiskLevel,
    classification: TMDClassification,
    answers: ComprehensiveAnswers
  ): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    switch (riskLevel) {
      case 'high':
        recommendations.push('Seek immediate professional evaluation from a TMD specialist');
        recommendations.push('Consider imaging studies (MRI, CT) for detailed diagnosis');
        recommendations.push('Document pain patterns and triggers for your healthcare provider');
        break;
      case 'moderate':
        recommendations.push('Schedule a consultation with a dentist or oral medicine specialist');
        recommendations.push('Consider conservative treatment options');
        recommendations.push('Monitor symptoms and track improvement');
        break;
      case 'low':
        recommendations.push('Practice preventive measures and self-care');
        recommendations.push('Monitor for any worsening of symptoms');
        recommendations.push('Consider lifestyle modifications');
        break;
    }

    // Symptom-specific recommendations
    if (answers.q7 && answers.q7 > 5) {
      recommendations.push('Apply heat or cold therapy to affected areas');
      recommendations.push('Consider over-the-counter pain relievers as directed');
    }

    if (answers.q8 || answers.q9) {
      recommendations.push('Avoid wide opening of the mouth');
      recommendations.push('Cut food into smaller pieces');
    }

    if (answers.q25 === 'Yes, definitely' || answers.q26) {
      recommendations.push('Consider a nightguard to protect teeth from grinding');
      recommendations.push('Practice stress reduction techniques');
    }

    if (answers.q24 && answers.q24 > 6) {
      recommendations.push('Implement stress management strategies');
      recommendations.push('Consider relaxation techniques or counseling');
    }

    // Always include general advice
    recommendations.push('Maintain good posture and avoid jaw strain');
    recommendations.push('Follow up if symptoms worsen or persist');

    return recommendations;
  }
}

// Export convenience functions
/** @deprecated Use processComprehensiveAssessment from MedicalProtocolEngine instead */
export const calculateComprehensiveAssessmentRisk = (
  answers: ComprehensiveAnswers
): AssessmentResult => {
  return TMDDiagnosticEngine.calculateComprehensiveRisk(answers);
};

/** @deprecated Use MedicalProtocolEngine validation instead */
export const validateComprehensiveAssessment = (answers: ComprehensiveAnswers): boolean => {
  // At least 15 out of 26 questions must be answered for valid assessment
  const answeredCount = Object.values(answers).filter(
    (answer) => answer !== null && answer !== undefined
  ).length;

  return answeredCount >= 15;
};

/** @deprecated Use MedicalProtocolEngine quality metrics instead */
export const getAssessmentCompleteness = (answers: ComprehensiveAnswers): number => {
  const totalQuestions = 26;
  const answeredQuestions = Object.values(answers).filter(
    (answer) => answer !== null && answer !== undefined
  ).length;

  return (answeredQuestions / totalQuestions) * 100;
};
