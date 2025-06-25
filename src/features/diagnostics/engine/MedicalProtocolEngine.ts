/**
 * Medical Protocol Engine - Centralized TMD Diagnostic System
 *
 * This engine consolidates all TMD diagnostic logic, scoring algorithms, and DC/TMD protocols
 * into a single, testable, and modular system following medical-grade standards.
 *
 * Features:
 * - Pure functions for testability
 * - Singleton pattern for consistency
 * - Evidence-based scoring algorithms
 * - DC/TMD protocol compliance
 * - Comprehensive risk stratification
 * - ICD-10 mapping integration
 *
 * @version 2.1.0
 * @author TMD Diagnostic System
 * @medical-reference DC/TMD Diagnostic Criteria v2.1
 */

import type {
  ComprehensiveAnswers,
  QuickAssessmentAnswers,
  AssessmentResult,
  RiskLevel,
} from '@/types';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

// =====================================================
// MEDICAL CONSTANTS & THRESHOLDS (DC/TMD Protocol)
// =====================================================

/**
 * DC/TMD Protocol Constants
 * Reference: Diagnostic Criteria for Temporomandibular Disorders (DC/TMD) v2.1
 */
export const DC_TMD_CONSTANTS = {
  // Pain Scale Constants (0-4 per DC/TMD standard)
  PAIN_SCALE: {
    MIN: 0,
    MAX: 4,
    THRESHOLD_MILD: 1,
    THRESHOLD_MODERATE: 2,
    THRESHOLD_SEVERE: 3,
  },

  // Risk Level Thresholds (Evidence-based percentages)
  RISK_THRESHOLDS: {
    LOW_MAX: 30,
    MODERATE_MIN: 31,
    MODERATE_MAX: 65,
    HIGH_MIN: 66,
    HIGH_MAX: 100,
  },

  // Category Weights (Clinical evidence-based)
  CATEGORY_WEIGHTS: {
    PAIN: 0.35, // 35% - Primary diagnostic criterion
    FUNCTION: 0.3, // 30% - Functional impact assessment
    JOINT_SOUNDS: 0.15, // 15% - Structural indicators
    ASSOCIATED: 0.1, // 10% - Associated symptoms
    HISTORY: 0.1, // 10% - Risk factors & triggers
  },

  // Confidence Calculation Constants
  CONFIDENCE: {
    MIN_RESPONSES_FULL: 20, // Minimum for full confidence
    MIN_RESPONSES_PARTIAL: 10, // Minimum for partial confidence
    CONSISTENCY_WEIGHT: 0.4, // Weight for response consistency
    COMPLETENESS_WEIGHT: 0.6, // Weight for response completeness
  },

  // ICD-10 Mapping Thresholds
  ICD10_THRESHOLDS: {
    PRIMARY_CONFIDENCE: 80, // Minimum for primary diagnosis
    SECONDARY_CONFIDENCE: 60, // Minimum for secondary diagnosis
    DIFFERENTIAL_CONFIDENCE: 40, // Minimum for differential diagnosis
  },
} as const;

// =====================================================
// CORE INTERFACES & TYPES
// =====================================================

/**
 * Comprehensive scoring result with detailed breakdown
 */
export interface MedicalScoreResult {
  // Overall Assessment
  totalScore: number;
  maxPossibleScore: number;
  normalizedScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-100

  // Category Scores
  categoryScores: {
    pain: CategoryScore;
    function: CategoryScore;
    jointSounds: CategoryScore;
    associated: CategoryScore;
    history: CategoryScore;
  };

  // Clinical Indicators
  clinicalFlags: {
    requiresImmediateAttention: boolean;
    followUpRecommended: boolean;
    specialistReferral: boolean;
    redFlags: string[];
  };

  // Quality Metrics
  qualityMetrics: {
    dataCompleteness: number;
    responseConsistency: number;
    clinicalReliability: number;
  };

  // Metadata
  calculationMetadata: {
    algorithmVersion: string;
    protocolVersion: string;
    calculatedAt: Date;
    processingTimeMs: number;
  };
}

/**
 * Individual category scoring details
 */
export interface CategoryScore {
  rawScore: number;
  maxScore: number;
  weightedScore: number;
  percentage: number;
  interpretation: 'normal' | 'mild' | 'moderate' | 'severe';
  clinicalSignificance: string;
  contributingFactors: string[];
}

/**
 * TMD Classification based on DC/TMD criteria
 */
export interface TMDClassification {
  primaryDiagnosis: {
    code: string;
    description: string;
    confidence: number;
  };
  secondaryDiagnoses: Array<{
    code: string;
    description: string;
    confidence: number;
  }>;
  axis1Disorders: string[];
  axis2Factors: string[];
  severity: 'mild' | 'moderate' | 'severe';
  chronicity: 'acute' | 'chronic' | 'recurrent';
}

/**
 * Medical protocol configuration
 */
export interface ProtocolConfig {
  strictValidation: boolean;
  minimumConfidence: number;
  enableDifferentialDiagnosis: boolean;
  includeSecondaryDiagnoses: boolean;
  algorithmVersion: string;
  protocolVersion: string;
}

// =====================================================
// MEDICAL PROTOCOL ENGINE (SINGLETON)
// =====================================================

/**
 * Medical Protocol Engine - Centralized TMD Diagnostic System
 * Implements singleton pattern for consistency across the application
 */
export class MedicalProtocolEngine {
  private static instance: MedicalProtocolEngine;
  private errorLogger: ErrorLoggingService;
  private config: ProtocolConfig;

  private constructor(config?: Partial<ProtocolConfig>) {
    this.errorLogger = new ErrorLoggingService();
    this.config = {
      strictValidation: true,
      minimumConfidence: 70,
      enableDifferentialDiagnosis: true,
      includeSecondaryDiagnoses: true,
      algorithmVersion: '2.1.0',
      protocolVersion: 'DC/TMD-2.1',
      ...config,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<ProtocolConfig>): MedicalProtocolEngine {
    if (!MedicalProtocolEngine.instance) {
      MedicalProtocolEngine.instance = new MedicalProtocolEngine(config);
    }
    return MedicalProtocolEngine.instance;
  }

  // =====================================================
  // PUBLIC API - MAIN DIAGNOSTIC METHODS
  // =====================================================

  /**
   * Process comprehensive TMD assessment
   * Main entry point for comprehensive diagnostic evaluation
   */
  public processComprehensiveAssessment(answers: ComprehensiveAnswers): AssessmentResult {
    const startTime = Date.now();

    try {
      // 1. Validate input data
      this.validateComprehensiveAnswers(answers);

      // 2. Calculate medical scores
      const scoreResult = this.calculateComprehensiveScores(answers);

      // 3. Classify TMD condition
      const classification = this.classifyTMDCondition(answers, scoreResult);

      // 4. Generate clinical recommendations
      const recommendations = this.generateClinicalRecommendations(scoreResult, classification);

      // 5. Map to ICD-10 codes
      const icd10Codes = this.mapToICD10Codes(classification);

      const processingTime = Date.now() - startTime;

      return {
        // Core Assessment Result
        riskLevel: scoreResult.riskLevel,
        score: scoreResult.totalScore,
        maxScore: scoreResult.maxPossibleScore,
        confidence: scoreResult.confidence,
        recommendations,
        timestamp: new Date(),
        assessmentType: 'comprehensive',
        answers,

        // Detailed Scores
        painScore: scoreResult.categoryScores.pain.percentage,
        functionalScore: scoreResult.categoryScores.function.percentage,
        soundsScore: scoreResult.categoryScores.jointSounds.percentage,
        associatedScore: scoreResult.categoryScores.associated.percentage,
        historyScore: scoreResult.categoryScores.history.percentage,

        // Medical Classification
        icd10Codes,
        dcTmdClassification: classification.primaryDiagnosis.description,

        // Clinical Flags
        requiresImmediateAttention: scoreResult.clinicalFlags.requiresImmediateAttention,
        followUpRecommended: scoreResult.clinicalFlags.followUpRecommended,
        specialistReferral: scoreResult.clinicalFlags.specialistReferral,
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.ASSESSMENT, {
        additionalData: { assessmentType: 'comprehensive', processingTime: Date.now() - startTime },
      });
      throw error;
    }
  }

  /**
   * Process quick TMD assessment
   * Simplified assessment for initial screening
   */
  public processQuickAssessment(answers: QuickAssessmentAnswers): AssessmentResult {
    const startTime = Date.now();

    try {
      // 1. Validate input
      this.validateQuickAnswers(answers);

      // 2. Calculate quick risk score
      const riskLevel = this.calculateQuickRiskLevel(answers);

      // 3. Generate basic recommendations
      const recommendations = this.generateQuickRecommendations(riskLevel);

      const processingTime = Date.now() - startTime;

      return {
        riskLevel,
        score: this.mapRiskLevelToScore(riskLevel),
        maxScore: 100,
        confidence: this.calculateQuickConfidence(answers),
        recommendations,
        timestamp: new Date(),
        assessmentType: 'quick',
        answers,

        // Basic scores (estimated)
        painScore: this.estimatePainScoreFromQuick(answers),
        functionalScore: this.estimateFunctionScoreFromQuick(answers),
        soundsScore: 0, // Not assessed in quick
        associatedScore: 0, // Not assessed in quick
        historyScore: 0, // Not assessed in quick

        // Minimal classification
        icd10Codes: [],
        dcTmdClassification: 'Screening Assessment',

        // Conservative flags
        requiresImmediateAttention: riskLevel === 'high',
        followUpRecommended: riskLevel !== 'low',
        specialistReferral: riskLevel === 'high',
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.ASSESSMENT, {
        additionalData: { assessmentType: 'quick', processingTime: Date.now() - startTime },
      });
      throw error;
    }
  }

  // =====================================================
  // COMPREHENSIVE ASSESSMENT SCORING (PURE FUNCTIONS)
  // =====================================================

  /**
   * Calculate comprehensive medical scores
   * Pure function for testability
   */
  private calculateComprehensiveScores(answers: ComprehensiveAnswers): MedicalScoreResult {
    // Calculate individual category scores
    const painScore = this.calculatePainScore(answers);
    const functionScore = this.calculateFunctionScore(answers);
    const jointSoundsScore = this.calculateJointSoundsScore(answers);
    const associatedScore = this.calculateAssociatedSymptomsScore(answers);
    const historyScore = this.calculateHistoryScore(answers);

    // Calculate weighted total score
    const totalScore = this.calculateWeightedTotalScore({
      pain: painScore,
      function: functionScore,
      jointSounds: jointSoundsScore,
      associated: associatedScore,
      history: historyScore,
    });

    // Determine risk level
    const riskLevel = this.determineRiskLevel(totalScore.percentage);

    // Calculate confidence
    const confidence = this.calculateConfidence(answers);

    // Assess clinical flags
    const clinicalFlags = this.assessClinicalFlags(answers, totalScore);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(answers);

    return {
      totalScore: totalScore.weighted,
      maxPossibleScore: totalScore.maxPossible,
      normalizedScore: totalScore.percentage,
      riskLevel,
      confidence,

      categoryScores: {
        pain: painScore,
        function: functionScore,
        jointSounds: jointSoundsScore,
        associated: associatedScore,
        history: historyScore,
      },

      clinicalFlags,
      qualityMetrics,

      calculationMetadata: {
        algorithmVersion: this.config.algorithmVersion,
        protocolVersion: this.config.protocolVersion,
        calculatedAt: new Date(),
        processingTimeMs: 0, // Will be set by caller
      },
    };
  }

  /**
   * Calculate pain assessment score (Q1-Q7)
   * Based on DC/TMD pain criteria
   */
  private calculatePainScore(answers: ComprehensiveAnswers): CategoryScore {
    let rawScore = 0;
    let maxScore = 0;
    const contributingFactors: string[] = [];

    // Q1-Q6: Boolean pain questions (2 points each for Yes)
    const painQuestions = [
      { key: 'q1', answer: answers.q1, description: 'Jaw pain at rest' },
      { key: 'q2', answer: answers.q2, description: 'Jaw pain during function' },
      { key: 'q3', answer: answers.q3, description: 'Temple area pain' },
      { key: 'q4', answer: answers.q4, description: 'Ear area pain' },
      { key: 'q5', answer: answers.q5, description: 'Jaw pain when chewing' },
      { key: 'q6', answer: answers.q6, description: 'Jaw pain when yawning' },
    ];

    painQuestions.forEach((q) => {
      if (q.answer !== null) {
        maxScore += 2;
        if (q.answer === true) {
          rawScore += 2;
          contributingFactors.push(q.description);
        }
      }
    });

          // Q7: Pain severity scale (0-4 per DC/TMD standard)
      if (answers.q7 !== null) {
        maxScore += 4; // DC/TMD uses 0-4 scale
        const normalizedPainLevel = Math.min(4, Math.max(0, answers.q7)); // Already 0-4 scale
      rawScore += normalizedPainLevel;

      if (normalizedPainLevel > 0) {
        contributingFactors.push(`Pain intensity: ${normalizedPainLevel}/4`);
      }
    }

    const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
    const weightedScore = (rawScore / maxScore) * DC_TMD_CONSTANTS.CATEGORY_WEIGHTS.PAIN * 100;

    return {
      rawScore,
      maxScore,
      weightedScore: isNaN(weightedScore) ? 0 : weightedScore,
      percentage,
      interpretation: this.interpretScore(percentage),
      clinicalSignificance: this.getPainClinicalSignificance(percentage),
      contributingFactors,
    };
  }

  /**
   * Calculate jaw function score (Q12-Q17)
   * Based on DC/TMD functional limitation criteria
   */
  private calculateFunctionScore(answers: ComprehensiveAnswers): CategoryScore {
    let rawScore = 0;
    let maxScore = 0;
    const contributingFactors: string[] = [];

    const functionQuestions = [
      { key: 'q12', answer: answers.q12, description: 'Difficulty opening mouth wide' },
      { key: 'q13', answer: answers.q13, description: 'Difficulty moving jaw side to side' },
      { key: 'q14', answer: answers.q14, description: 'Difficulty chewing hard foods' },
      { key: 'q15', answer: answers.q15, description: 'Difficulty chewing soft foods' },
      { key: 'q16', answer: answers.q16, description: 'Difficulty with jaw use in general' },
      { key: 'q17', answer: answers.q17, description: 'Jaw locks or catches' },
    ];

    functionQuestions.forEach((q) => {
      if (q.answer !== null) {
        maxScore += 3; // Higher weight for functional impairment per DC/TMD
        if (q.answer === true) {
          rawScore += 3;
          contributingFactors.push(q.description);
        }
      }
    });

    const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
    const weightedScore = (rawScore / maxScore) * DC_TMD_CONSTANTS.CATEGORY_WEIGHTS.FUNCTION * 100;

    return {
      rawScore,
      maxScore,
      weightedScore: isNaN(weightedScore) ? 0 : weightedScore,
      percentage,
      interpretation: this.interpretScore(percentage),
      clinicalSignificance: this.getFunctionClinicalSignificance(percentage),
      contributingFactors,
    };
  }

  /**
   * Calculate joint sounds score (Q8-Q11)
   * Based on DC/TMD joint sound criteria
   */
  private calculateJointSoundsScore(answers: ComprehensiveAnswers): CategoryScore {
    let rawScore = 0;
    let maxScore = 0;
    const contributingFactors: string[] = [];

    // Q8-Q10: Boolean sound questions
    const soundQuestions = [
      { key: 'q8', answer: answers.q8, description: 'Clicking sounds' },
      { key: 'q9', answer: answers.q9, description: 'Grating sounds' },
      { key: 'q10', answer: answers.q10, description: 'Popping sounds' },
    ];

    soundQuestions.forEach((q) => {
      if (q.answer !== null) {
        maxScore += 1;
        if (q.answer === true) {
          rawScore += 1;
          contributingFactors.push(q.description);
        }
      }
    });

    // Q11: Sound location (categorical scoring per DC/TMD)
    if (answers.q11 !== null) {
      maxScore += 2;
      if (answers.q11 === 'Both sides') {
        rawScore += 2;
        contributingFactors.push('Bilateral joint sounds');
      } else if (answers.q11 === 'Right side' || answers.q11 === 'Left side') {
        rawScore += 1;
        contributingFactors.push(`Unilateral joint sounds (${answers.q11})`);
      }
      // 'No sounds' = 0 points
    }

    const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
    const weightedScore =
      (rawScore / maxScore) * DC_TMD_CONSTANTS.CATEGORY_WEIGHTS.JOINT_SOUNDS * 100;

    return {
      rawScore,
      maxScore,
      weightedScore: isNaN(weightedScore) ? 0 : weightedScore,
      percentage,
      interpretation: this.interpretScore(percentage),
      clinicalSignificance: this.getJointSoundsClinicalSignificance(percentage),
      contributingFactors,
    };
  }

  /**
   * Calculate associated symptoms score (Q18-Q21)
   */
  private calculateAssociatedSymptomsScore(answers: ComprehensiveAnswers): CategoryScore {
    let rawScore = 0;
    let maxScore = 0;
    const contributingFactors: string[] = [];

    const associatedQuestions = [
      { key: 'q18', answer: answers.q18, description: 'Headaches' },
      { key: 'q19', answer: answers.q19, description: 'Neck pain' },
      { key: 'q20', answer: answers.q20, description: 'Tooth pain' },
      { key: 'q21', answer: answers.q21, description: 'Ear symptoms' },
    ];

    associatedQuestions.forEach((q) => {
      if (q.answer !== null) {
        maxScore += 1;
        if (q.answer === true) {
          rawScore += 1;
          contributingFactors.push(q.description);
        }
      }
    });

    const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
    const weightedScore =
      (rawScore / maxScore) * DC_TMD_CONSTANTS.CATEGORY_WEIGHTS.ASSOCIATED * 100;

    return {
      rawScore,
      maxScore,
      weightedScore: isNaN(weightedScore) ? 0 : weightedScore,
      percentage,
      interpretation: this.interpretScore(percentage),
      clinicalSignificance: this.getAssociatedClinicalSignificance(percentage),
      contributingFactors,
    };
  }

  /**
   * Calculate history and triggers score (Q22-Q26)
   */
  private calculateHistoryScore(answers: ComprehensiveAnswers): CategoryScore {
    let rawScore = 0;
    let maxScore = 0;
    const contributingFactors: string[] = [];

    // Q22-Q23: Recent events (higher weight per DC/TMD)
    const recentEvents = [
      { key: 'q22', answer: answers.q22, description: 'Recent trauma/injury' },
      { key: 'q23', answer: answers.q23, description: 'Recent dental work' },
    ];

    recentEvents.forEach((q) => {
      if (q.answer !== null) {
        maxScore += 3;
        if (q.answer === true) {
          rawScore += 3;
          contributingFactors.push(q.description);
        }
      }
    });

    // Q24: Stress level (0-10 scale)
    if (answers.q24 !== null) {
      maxScore += 10;
      rawScore += answers.q24;
      if (answers.q24 > 5) {
        contributingFactors.push(`High stress level: ${answers.q24}/10`);
      }
    }

    // Q25: Sleep bruxism (categorical scoring)
    if (answers.q25 !== null) {
      maxScore += 3;
      if (answers.q25 === 'Yes, definitely') {
        rawScore += 3;
        contributingFactors.push('Confirmed sleep bruxism');
      } else if (answers.q25 === 'I think so') {
        rawScore += 2;
        contributingFactors.push('Probable sleep bruxism');
      } else if (answers.q25 === "I don't think so") {
        rawScore += 1;
      }
      // 'No, definitely not' = 0 points
    }

    // Q26: Daytime clenching
    if (answers.q26 !== null) {
      maxScore += 2;
      if (answers.q26 === true) {
        rawScore += 2;
        contributingFactors.push('Daytime jaw clenching');
      }
    }

    const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
    const weightedScore = (rawScore / maxScore) * DC_TMD_CONSTANTS.CATEGORY_WEIGHTS.HISTORY * 100;

    return {
      rawScore,
      maxScore,
      weightedScore: isNaN(weightedScore) ? 0 : weightedScore,
      percentage,
      interpretation: this.interpretScore(percentage),
      clinicalSignificance: this.getHistoryClinicalSignificance(percentage),
      contributingFactors,
    };
  }

  // =====================================================
  // UTILITY FUNCTIONS (PURE FUNCTIONS)
  // =====================================================

  /**
   * Calculate weighted total score from category scores
   */
  private calculateWeightedTotalScore(categoryScores: {
    pain: CategoryScore;
    function: CategoryScore;
    jointSounds: CategoryScore;
    associated: CategoryScore;
    history: CategoryScore;
  }): { weighted: number; maxPossible: number; percentage: number } {
    const weightedSum =
      categoryScores.pain.weightedScore +
      categoryScores.function.weightedScore +
      categoryScores.jointSounds.weightedScore +
      categoryScores.associated.weightedScore +
      categoryScores.history.weightedScore;

    const maxPossible = 100; // Normalized to 100
    const percentage = Math.min(100, Math.max(0, weightedSum));

    return {
      weighted: weightedSum,
      maxPossible,
      percentage,
    };
  }

  /**
   * Determine risk level from normalized score
   */
  private determineRiskLevel(normalizedScore: number): RiskLevel {
    if (normalizedScore <= DC_TMD_CONSTANTS.RISK_THRESHOLDS.LOW_MAX) {
      return 'low';
    } else if (normalizedScore <= DC_TMD_CONSTANTS.RISK_THRESHOLDS.MODERATE_MAX) {
      return 'moderate';
    } else {
      return 'high';
    }
  }

  /**
   * Calculate confidence based on response completeness and consistency
   */
  private calculateConfidence(answers: ComprehensiveAnswers): number {
    const totalQuestions = 26; // Q1-Q26
    let answeredQuestions = 0;
    let consistencyScore = 0;

    // Count answered questions
    Object.values(answers).forEach((answer) => {
      if (answer !== null && answer !== undefined) {
        answeredQuestions++;
      }
    });

    // Calculate completeness score
    const completenessScore = (answeredQuestions / totalQuestions) * 100;

    // Calculate consistency score (simplified)
    // In a real implementation, this would check for logical consistency
    consistencyScore = this.calculateResponseConsistency(answers);

    // Weighted confidence calculation
    const confidence =
      completenessScore * DC_TMD_CONSTANTS.CONFIDENCE.COMPLETENESS_WEIGHT +
      consistencyScore * DC_TMD_CONSTANTS.CONFIDENCE.CONSISTENCY_WEIGHT;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Assess clinical flags for immediate attention, follow-up, and referral
   */
  private assessClinicalFlags(
    answers: ComprehensiveAnswers,
    totalScore: { percentage: number }
  ): {
    requiresImmediateAttention: boolean;
    followUpRecommended: boolean;
    specialistReferral: boolean;
    redFlags: string[];
  } {
    const redFlags: string[] = [];
    let requiresImmediateAttention = false;
    let followUpRecommended = false;
    let specialistReferral = false;

    // Check for red flags requiring immediate attention
    if (answers.q7 !== null && answers.q7 >= 8) {
      redFlags.push('Severe pain level (≥8/10)');
      requiresImmediateAttention = true;
    }

    if (answers.q17 === true) {
      redFlags.push('Jaw locking episodes');
      requiresImmediateAttention = true;
    }

    // Check for follow-up recommendations
    if (totalScore.percentage > DC_TMD_CONSTANTS.RISK_THRESHOLDS.LOW_MAX) {
      followUpRecommended = true;
    }

    // Check for specialist referral
    if (totalScore.percentage > DC_TMD_CONSTANTS.RISK_THRESHOLDS.MODERATE_MAX) {
      specialistReferral = true;
    }

    // Additional clinical indicators
    if (answers.q22 === true || answers.q23 === true) {
      redFlags.push('Recent trauma or dental work');
    }

    if (answers.q24 !== null && answers.q24 >= 8) {
      redFlags.push('High stress level');
      followUpRecommended = true;
    }

    return {
      requiresImmediateAttention,
      followUpRecommended,
      specialistReferral,
      redFlags,
    };
  }

  /**
   * Calculate quality metrics for assessment reliability
   */
  private calculateQualityMetrics(answers: ComprehensiveAnswers): {
    dataCompleteness: number;
    responseConsistency: number;
    clinicalReliability: number;
  } {
    const totalQuestions = 26;
    let answeredQuestions = 0;

    Object.values(answers).forEach((answer) => {
      if (answer !== null && answer !== undefined) {
        answeredQuestions++;
      }
    });

    const dataCompleteness = (answeredQuestions / totalQuestions) * 100;
    const responseConsistency = this.calculateResponseConsistency(answers);
    const clinicalReliability = (dataCompleteness + responseConsistency) / 2;

    return {
      dataCompleteness,
      responseConsistency,
      clinicalReliability,
    };
  }

  /**
   * Calculate response consistency (simplified implementation)
   */
  private calculateResponseConsistency(answers: ComprehensiveAnswers): number {
    // This is a simplified consistency check
    // In a real implementation, this would be more sophisticated
    let consistencyScore = 85; // Base consistency

    // Check for logical inconsistencies
    if (answers.q7 === 0 && (answers.q1 === true || answers.q2 === true)) {
      consistencyScore -= 10; // Pain reported but severity is 0
    }

    if (
      answers.q11 === 'No sounds' &&
      (answers.q8 === true || answers.q9 === true || answers.q10 === true)
    ) {
      consistencyScore -= 10; // Sounds reported but location is "no sounds"
    }

    return Math.max(0, consistencyScore);
  }

  /**
   * Interpret score percentage to clinical categories
   */
  private interpretScore(percentage: number): 'normal' | 'mild' | 'moderate' | 'severe' {
    if (percentage <= 25) return 'normal';
    if (percentage <= 50) return 'mild';
    if (percentage <= 75) return 'moderate';
    return 'severe';
  }

  // =====================================================
  // CLINICAL SIGNIFICANCE METHODS
  // =====================================================

  private getPainClinicalSignificance(percentage: number): string {
    if (percentage <= 25) return 'Minimal pain impact - routine monitoring';
    if (percentage <= 50) return 'Mild pain - conservative management indicated';
    if (percentage <= 75) return 'Moderate pain - active treatment recommended';
    return 'Severe pain - immediate intervention required';
  }

  private getFunctionClinicalSignificance(percentage: number): string {
    if (percentage <= 25) return 'Normal jaw function - no functional limitations';
    if (percentage <= 50) return 'Mild functional impairment - lifestyle modifications';
    if (percentage <= 75) return 'Moderate functional limitation - therapy indicated';
    return 'Severe functional impairment - comprehensive treatment needed';
  }

  private getJointSoundsClinicalSignificance(percentage: number): string {
    if (percentage <= 25) return 'Minimal joint sounds - likely normal variation';
    if (percentage <= 50) return 'Mild joint sounds - monitor for progression';
    if (percentage <= 75) return 'Moderate joint sounds - structural changes possible';
    return 'Significant joint sounds - detailed imaging recommended';
  }

  private getAssociatedClinicalSignificance(percentage: number): string {
    if (percentage <= 25) return 'Few associated symptoms - localized condition';
    if (percentage <= 50) return 'Some associated symptoms - regional involvement';
    if (percentage <= 75) return 'Multiple associated symptoms - systemic consideration';
    return 'Extensive associated symptoms - comprehensive evaluation needed';
  }

  private getHistoryClinicalSignificance(percentage: number): string {
    if (percentage <= 25) return 'Low risk factors - good prognosis';
    if (percentage <= 50) return 'Some risk factors - monitor triggers';
    if (percentage <= 75) return 'Multiple risk factors - address contributing factors';
    return 'High risk profile - comprehensive risk management required';
  }

  // =====================================================
  // TMD CLASSIFICATION & ICD-10 MAPPING
  // =====================================================

  /**
   * Classify TMD condition based on DC/TMD criteria
   */
  private classifyTMDCondition(
    answers: ComprehensiveAnswers,
    scoreResult: MedicalScoreResult
  ): TMDClassification {
    // Simplified classification logic
    // In a real implementation, this would follow complete DC/TMD decision trees

    const severity = this.determineSeverity(scoreResult.normalizedScore);
    const chronicity = this.determineChronicity(answers);

    return {
      primaryDiagnosis: {
        code: 'M26.62',
        description: 'Temporomandibular joint disorder, unspecified',
        confidence: scoreResult.confidence,
      },
      secondaryDiagnoses: [],
      axis1Disorders: this.identifyAxis1Disorders(answers, scoreResult),
      axis2Factors: this.identifyAxis2Factors(answers),
      severity,
      chronicity,
    };
  }

  private determineSeverity(normalizedScore: number): 'mild' | 'moderate' | 'severe' {
    if (normalizedScore <= 40) return 'mild';
    if (normalizedScore <= 70) return 'moderate';
    return 'severe';
  }

  private determineChronicity(answers: ComprehensiveAnswers): 'acute' | 'chronic' | 'recurrent' {
    // Simplified chronicity determination - would need more detailed timeline data
    return 'chronic'; // Default assumption for TMD
  }

  private identifyAxis1Disorders(
    answers: ComprehensiveAnswers,
    scoreResult: MedicalScoreResult
  ): string[] {
    const disorders: string[] = [];

    if (scoreResult.categoryScores.pain.percentage > 50) {
      disorders.push('Myofascial pain with referral');
    }

    if (scoreResult.categoryScores.jointSounds.percentage > 50) {
      disorders.push('Disc displacement');
    }

    if (scoreResult.categoryScores.function.percentage > 50) {
      disorders.push('Arthralgia');
    }

    return disorders;
  }

  private identifyAxis2Factors(answers: ComprehensiveAnswers): string[] {
    const factors: string[] = [];

    // Stress factors
    if (answers.q24 && answers.q24 > 6) {
      factors.push('High stress levels');
    }

    // Parafunctional behaviors
    if (answers.q25 === 'Yes, definitely' || answers.q26) {
      factors.push('Parafunctional behaviors (bruxism/clenching)');
    }

    return factors;
  }

  /**
   * Map TMD classification to ICD-10 codes
   */
  private mapToICD10Codes(classification: TMDClassification): string[] {
    // Standard ICD-10 codes for TMD
    const codes: string[] = ['M26.62']; // Arthralgia of temporomandibular joint

    if (classification.severity === 'severe') {
      codes.push('M26.63'); // Articular disc disorder of TMJ
    }

    return codes;
  }

  /**
   * Generate clinical recommendations based on assessment results
   */
  private generateClinicalRecommendations(
    scoreResult: MedicalScoreResult,
    classification: TMDClassification
  ): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    switch (scoreResult.riskLevel) {
      case 'low':
        recommendations.push('Continue self-care measures');
        recommendations.push('Monitor symptoms for any changes');
        recommendations.push('Practice stress reduction techniques');
        break;

      case 'moderate':
        recommendations.push('Schedule follow-up appointment in 4-6 weeks');
        recommendations.push('Consider conservative treatment options');
        recommendations.push('Implement jaw exercise program');
        break;

      case 'high':
        recommendations.push('Urgent consultation with TMD specialist');
        recommendations.push('Consider prescription anti-inflammatory medication');
        recommendations.push('Implement comprehensive jaw rest protocol');
        recommendations.push('Evaluate for occlusal splint therapy');
        recommendations.push('Consider referral to TMD specialist');
        break;
    }

    // Category-specific recommendations
    if (scoreResult.categoryScores.pain.percentage > 60) {
      recommendations.push('Pain management consultation recommended');
    }

    if (scoreResult.categoryScores.function.percentage > 60) {
      recommendations.push('Physical therapy evaluation for jaw function');
    }

    if (scoreResult.categoryScores.history.percentage > 60) {
      recommendations.push('Address contributing risk factors and triggers');
    }

    return recommendations;
  }

  // =====================================================
  // QUICK ASSESSMENT METHODS
  // =====================================================

  /**
   * Calculate quick assessment risk level
   */
  private calculateQuickRiskLevel(answers: QuickAssessmentAnswers): RiskLevel {
    // Simplified risk calculation for quick assessment
    const description = answers.description.toLowerCase();

    // High risk indicators
    const highRiskKeywords = ['severe', 'intense', 'unbearable', 'constant', 'locking', 'stuck'];
    const moderateRiskKeywords = ['moderate', 'frequent', 'difficulty', 'clicking', 'popping'];

    if (highRiskKeywords.some((keyword) => description.includes(keyword))) {
      return 'high';
    }

    if (moderateRiskKeywords.some((keyword) => description.includes(keyword))) {
      return 'moderate';
    }

    return 'low';
  }

  private calculateQuickConfidence(answers: QuickAssessmentAnswers): number {
    // Simple confidence based on description length and detail
    const wordCount = answers.description.trim().split(/\s+/).length;

    if (wordCount >= 20) return 75;
    if (wordCount >= 10) return 60;
    if (wordCount >= 5) return 45;
    return 30;
  }

  private generateQuickRecommendations(riskLevel: RiskLevel): string[] {
    switch (riskLevel) {
      case 'low':
        return [
          'Monitor symptoms and note any changes',
          'Apply warm compresses for comfort',
          'Avoid hard or chewy foods temporarily',
        ];

      case 'moderate':
        return [
          'Complete comprehensive assessment for detailed evaluation',
          'Consult with healthcare provider if symptoms persist',
          'Practice jaw relaxation techniques',
        ];

      case 'high':
        return [
          'Seek immediate professional evaluation',
          'Complete comprehensive assessment urgently',
          'Avoid jaw overuse and implement jaw rest',
        ];

      default:
        return [];
    }
  }

  private mapRiskLevelToScore(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case 'low':
        return 25;
      case 'moderate':
        return 55;
      case 'high':
        return 85;
      default:
        return 0;
    }
  }

  private estimatePainScoreFromQuick(answers: QuickAssessmentAnswers): number {
    const description = answers.description.toLowerCase();

    if (description.includes('severe') || description.includes('intense')) return 80;
    if (description.includes('moderate') || description.includes('significant')) return 50;
    if (description.includes('mild') || description.includes('slight')) return 25;

    return 35; // Default estimate
  }

  private estimateFunctionScoreFromQuick(answers: QuickAssessmentAnswers): number {
    const description = answers.description.toLowerCase();

    if (
      description.includes('difficulty') ||
      description.includes('hard') ||
      description.includes('cannot')
    )
      return 60;
    if (description.includes('sometimes') || description.includes('occasionally')) return 30;

    return 20; // Default estimate
  }

  // =====================================================
  // VALIDATION METHODS
  // =====================================================

  private validateComprehensiveAnswers(answers: ComprehensiveAnswers): void {
    if (!answers) {
      throw new Error('Assessment answers are required');
    }

    // Check for minimum required responses
    const answeredCount = Object.values(answers).filter(
      (answer) => answer !== null && answer !== undefined
    ).length;

    if (answeredCount < 10) {
      throw new Error('Insufficient responses for reliable assessment');
    }

    // Validate pain scale if provided
    if (answers.q7 !== null && (answers.q7 < 0 || answers.q7 > 10)) {
      throw new Error('Pain scale must be between 0 and 10');
    }

    // Validate stress scale if provided
    if (answers.q24 !== null && (answers.q24 < 1 || answers.q24 > 10)) {
      throw new Error('Stress scale must be between 1 and 10');
    }
  }

  private validateQuickAnswers(answers: QuickAssessmentAnswers): void {
    if (!answers || !answers.description) {
      throw new Error('Description is required for quick assessment');
    }

    if (answers.description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters long');
    }
  }
}

// =====================================================
// FACTORY FUNCTIONS FOR EASY USAGE
// =====================================================

/**
 * Create or get the medical protocol engine instance
 */
export const createMedicalProtocolEngine = (
  config?: Partial<ProtocolConfig>
): MedicalProtocolEngine => {
  return MedicalProtocolEngine.getInstance(config);
};

/**
 * Process comprehensive assessment (convenience function)
 */
export const processComprehensiveAssessment = (
  answers: ComprehensiveAnswers,
  config?: Partial<ProtocolConfig>
): AssessmentResult => {
  const engine = createMedicalProtocolEngine(config);
  return engine.processComprehensiveAssessment(answers);
};

/**
 * Process quick assessment (convenience function)
 */
export const processQuickAssessment = (
  answers: QuickAssessmentAnswers,
  config?: Partial<ProtocolConfig>
): AssessmentResult => {
  const engine = createMedicalProtocolEngine(config);
  return engine.processQuickAssessment(answers);
};

/**
 * Calculate risk level only (convenience function)
 */
export const calculateRiskLevel = (
  assessmentType: 'quick' | 'comprehensive',
  answers: QuickAssessmentAnswers | ComprehensiveAnswers,
  config?: Partial<ProtocolConfig>
): RiskLevel => {
  const engine = createMedicalProtocolEngine(config);

  if (assessmentType === 'quick') {
    return engine.processQuickAssessment(answers as QuickAssessmentAnswers).riskLevel;
  } else {
    return engine.processComprehensiveAssessment(answers as ComprehensiveAnswers).riskLevel;
  }
};
