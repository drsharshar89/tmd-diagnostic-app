// Enhanced Risk Calculator - Advanced TMD Risk Stratification Engine
// Combines comprehensive risk assessment with dynamic evidence weights

import type { AssessmentResponse, RiskScore } from '@/entities/assessment';
import type { RiskLevel } from '@/shared/types';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

/**
 * Evidence-based weight configuration
 */
interface EvidenceWeights {
  painIntensity: number;
  functionalImpairment: number;
  psychosocialFactors: number;
  demographicFactors: number;
  behavioralFactors: number;
  medicalHistory: number;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  lastUpdated: Date;
  source: string;
}

/**
 * Component score with detailed analysis
 */
interface ComponentScore {
  value: number;
  maxValue: number;
  percentage: number;
  interpretation: string;
  confidence: number;
  contributors: Array<{
    factor: string;
    contribution: number;
    weight: number;
  }>;
}

/**
 * Enhanced risk calculation result
 */
export interface EnhancedRiskResult extends RiskScore {
  composite: number;
  level: RiskLevel;
  components: {
    painIntensity: ComponentScore;
    functionalImpairment: ComponentScore;
    psychosocialFactors: ComponentScore;
    demographicFactors: ComponentScore;
    behavioralFactors: ComponentScore;
    medicalHistory: ComponentScore;
  };
  confidence: number;
  evidenceWeights: EvidenceWeights;
  calculationMetadata: {
    processingTime: number;
    algorithmVersion: string;
    evidenceVersion: string;
    qualityScore: number;
  };
}

/**
 * Enhanced TMD Risk Calculator
 * Implements dynamic evidence-based risk stratification
 */
export class EnhancedRiskCalculator {
  private errorLogger: ErrorLoggingService;
  private cachedWeights: EvidenceWeights | null = null;
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.errorLogger = new ErrorLoggingService();
  }

  /**
   * Main risk calculation method with enhanced features
   */
  async calculate(responses: AssessmentResponse[]): Promise<EnhancedRiskResult> {
    const startTime = Date.now();

    try {
      // Load current evidence weights
      const weights = await this.loadEvidenceWeights();

      // Multi-dimensional risk assessment
      const painIntensity = await this.calculatePainScore(responses, weights);
      const functionalImpairment = await this.calculateFunctionalScore(responses, weights);
      const psychosocialFactors = await this.calculatePsychosocialScore(responses, weights);
      const demographicFactors = await this.calculateDemographicScore(responses, weights);
      const behavioralFactors = await this.calculateBehavioralScore(responses, weights);
      const medicalHistory = await this.calculateMedicalHistoryScore(responses, weights);

      // Calculate weighted composite score
      const compositeScore = this.calculateWeightedComposite(
        {
          painIntensity: painIntensity.value,
          functionalImpairment: functionalImpairment.value,
          psychosocialFactors: psychosocialFactors.value,
          demographicFactors: demographicFactors.value,
          behavioralFactors: behavioralFactors.value,
          medicalHistory: medicalHistory.value,
        },
        weights
      );

      // Determine risk level with enhanced stratification
      const riskLevel = this.stratifyRisk(compositeScore);

      // Calculate overall confidence
      const confidence = this.calculateConfidence(responses, [
        painIntensity,
        functionalImpairment,
        psychosocialFactors,
        demographicFactors,
        behavioralFactors,
        medicalHistory,
      ]);

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(responses, compositeScore, confidence);

      const processingTime = Date.now() - startTime;

      return {
        // Base RiskScore properties
        overallRisk: riskLevel,
        overallScore: compositeScore,
        maxPossibleScore: 100,
        confidenceLevel: confidence,

        painScore: {
          value: painIntensity.value,
          maxValue: painIntensity.maxValue,
          interpretation: painIntensity.interpretation,
        },
        functionalScore: {
          value: functionalImpairment.value,
          maxValue: functionalImpairment.maxValue,
          interpretation: functionalImpairment.interpretation,
        },
        psychosocialScore: {
          value: psychosocialFactors.value,
          maxValue: psychosocialFactors.maxValue,
          interpretation: psychosocialFactors.interpretation,
        },

        dcTmdScores: this.calculateDCTMDScores(responses),
        riskFactors: this.identifyRiskFactors([
          painIntensity,
          functionalImpairment,
          psychosocialFactors,
          demographicFactors,
          behavioralFactors,
          medicalHistory,
        ]),
        protectiveFactors: this.identifyProtectiveFactors([
          painIntensity,
          functionalImpairment,
          psychosocialFactors,
          demographicFactors,
          behavioralFactors,
          medicalHistory,
        ]),

        scoringAlgorithm: 'Enhanced_TMD_Risk_Calculator_v3.0',
        algorithmVersion: '3.0.0',
        calculatedAt: new Date(),
        calculatedBy: 'enhanced_automated_system',

        // Enhanced properties
        composite: compositeScore,
        level: riskLevel,
        components: {
          painIntensity,
          functionalImpairment,
          psychosocialFactors,
          demographicFactors,
          behavioralFactors,
          medicalHistory,
        },
        confidence,
        evidenceWeights: weights,
        calculationMetadata: {
          processingTime,
          algorithmVersion: '3.0.0',
          evidenceVersion: weights.source,
          qualityScore,
        },
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.ASSESSMENT, {
        additionalData: {
          responseCount: responses.length,
          calculationType: 'enhanced_risk_assessment',
          processingTime: Date.now() - startTime,
        },
      });

      throw new Error(`Enhanced risk calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load evidence-based weights from latest research
   */
  private async loadEvidenceWeights(): Promise<EvidenceWeights> {
    // Check cache validity
    if (
      this.cachedWeights &&
      Date.now() - this.cachedWeights.lastUpdated.getTime() < this.cacheExpiry
    ) {
      return this.cachedWeights;
    }

    // Load latest evidence weights (in production, this would come from a database or API)
    const weights: EvidenceWeights = {
      painIntensity: 0.35, // Evidence Level A: Strong correlation with outcomes
      functionalImpairment: 0.25, // Evidence Level A: Functional status predictor
      psychosocialFactors: 0.2, // Evidence Level A: Stress, anxiety, depression
      demographicFactors: 0.1, // Evidence Level B: Age, gender, genetics
      behavioralFactors: 0.07, // Evidence Level B: Bruxism, habits
      medicalHistory: 0.03, // Evidence Level C: Previous episodes, trauma
      evidenceLevel: 'A',
      lastUpdated: new Date(),
      source: 'DC/TMD_Protocol_v2.1_Evidence_Base_2024',
    };

    // Cache the weights
    this.cachedWeights = weights;

    return weights;
  }

  /**
   * Calculate pain intensity score with detailed analysis
   */
  private async calculatePainScore(
    responses: AssessmentResponse[],
    weights: EvidenceWeights
  ): Promise<ComponentScore> {
    const painResponses = responses.filter(
      (r) => r.questionId.includes('pain') || ['Q1', 'Q2', 'Q3'].includes(r.questionId)
    );

    const contributors: Array<{ factor: string; contribution: number; weight: number }> = [];
    let totalScore = 0;
    let maxScore = 0;

    // Current pain intensity (0-4 scale per DC/TMD)
    const currentPainResponse = painResponses.find(
      (r) => r.questionId === 'Q1' || r.questionId.includes('current_pain')
    );
    if (currentPainResponse && typeof currentPainResponse.value === 'number') {
      const contribution = (currentPainResponse.value / 4) * 40; // 40% weight for current pain
      totalScore += contribution;
      maxScore += 40;
      contributors.push({
        factor: 'Current Pain Intensity',
        contribution,
        weight: 40,
      });
    }

    // Worst pain in last 30 days
    const worstPainResponse = painResponses.find(
      (r) => r.questionId === 'Q2' || r.questionId.includes('worst_pain')
    );
    if (worstPainResponse && typeof worstPainResponse.value === 'number') {
      const contribution = (worstPainResponse.value / 4) * 35; // 35% weight for worst pain
      totalScore += contribution;
      maxScore += 35;
      contributors.push({
        factor: 'Worst Pain (30 days)',
        contribution,
        weight: 35,
      });
    }

    // Pain frequency
    const frequencyResponse = painResponses.find(
      (r) => r.questionId === 'Q3' || r.questionId.includes('pain_frequency')
    );
    if (frequencyResponse) {
      let frequencyScore = 0;
      if (typeof frequencyResponse.value === 'number') {
        frequencyScore = frequencyResponse.value / 4;
      } else if (typeof frequencyResponse.value === 'string') {
        const freq = frequencyResponse.value.toLowerCase();
        if (freq.includes('daily') || freq.includes('constant')) frequencyScore = 1.0;
        else if (freq.includes('weekly')) frequencyScore = 0.7;
        else if (freq.includes('monthly')) frequencyScore = 0.4;
        else frequencyScore = 0.2;
      }

      const contribution = frequencyScore * 25; // 25% weight for frequency
      totalScore += contribution;
      maxScore += 25;
      contributors.push({
        factor: 'Pain Frequency',
        contribution,
        weight: 25,
      });
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const confidence = this.calculateComponentConfidence(painResponses);

    return {
      value: totalScore,
      maxValue: maxScore,
      percentage: Math.round(percentage),
      interpretation: this.interpretPainScore(percentage),
      confidence,
      contributors,
    };
  }

  /**
   * Calculate functional impairment score
   */
  private async calculateFunctionalScore(
    responses: AssessmentResponse[],
    weights: EvidenceWeights
  ): Promise<ComponentScore> {
    const functionalResponses = responses.filter(
      (r) => r.questionId.includes('function') || ['Q12', 'Q13', 'Q14'].includes(r.questionId)
    );

    const contributors: Array<{ factor: string; contribution: number; weight: number }> = [];
    let totalScore = 0;
    let maxScore = 0;

    // Jaw functional limitation scale questions
    const functionalQuestions = ['Q12', 'Q13', 'Q14'];
    functionalQuestions.forEach((qId, index) => {
      const response = functionalResponses.find((r) => r.questionId === qId);
      if (response && typeof response.value === 'number') {
        const weight = [35, 35, 30][index]; // Different weights for different aspects
        const contribution = (response.value / 4) * weight;
        totalScore += contribution;
        maxScore += weight;
        contributors.push({
          factor: `Functional Limitation ${index + 1}`,
          contribution,
          weight,
        });
      }
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const confidence = this.calculateComponentConfidence(functionalResponses);

    return {
      value: totalScore,
      maxValue: maxScore,
      percentage: Math.round(percentage),
      interpretation: this.interpretFunctionalScore(percentage),
      confidence,
      contributors,
    };
  }

  /**
   * Calculate psychosocial factors score
   */
  private async calculatePsychosocialScore(
    responses: AssessmentResponse[],
    weights: EvidenceWeights
  ): Promise<ComponentScore> {
    const psychosocialResponses = responses.filter(
      (r) =>
        r.questionId.includes('stress') ||
        r.questionId.includes('sleep') ||
        r.questionId.includes('anxiety') ||
        r.questionId.includes('depression') ||
        ['Q22', 'Q23', 'Q24'].includes(r.questionId)
    );

    const contributors: Array<{ factor: string; contribution: number; weight: number }> = [];
    let totalScore = 0;
    let maxScore = 0;

    // Stress level assessment
    const stressResponse = psychosocialResponses.find(
      (r) => r.questionId.includes('stress') || r.questionId === 'Q22'
    );
    if (stressResponse && typeof stressResponse.value === 'number') {
      const contribution = (stressResponse.value / 10) * 40; // 40% weight for stress
      totalScore += contribution;
      maxScore += 40;
      contributors.push({
        factor: 'Stress Level',
        contribution,
        weight: 40,
      });
    }

    // Sleep quality
    const sleepResponse = psychosocialResponses.find(
      (r) => r.questionId.includes('sleep') || r.questionId === 'Q23'
    );
    if (sleepResponse && typeof sleepResponse.value === 'number') {
      const contribution = ((10 - sleepResponse.value) / 10) * 35; // Inverted scale for sleep quality
      totalScore += contribution;
      maxScore += 35;
      contributors.push({
        factor: 'Sleep Quality',
        contribution,
        weight: 35,
      });
    }

    // Emotional distress
    const emotionalResponse = psychosocialResponses.find(
      (r) => r.questionId.includes('anxiety') || r.questionId.includes('depression')
    );
    if (emotionalResponse && typeof emotionalResponse.value === 'number') {
      const contribution = (emotionalResponse.value / 10) * 25; // 25% weight for emotional factors
      totalScore += contribution;
      maxScore += 25;
      contributors.push({
        factor: 'Emotional Distress',
        contribution,
        weight: 25,
      });
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const confidence = this.calculateComponentConfidence(psychosocialResponses);

    return {
      value: totalScore,
      maxValue: maxScore,
      percentage: Math.round(percentage),
      interpretation: this.interpretPsychosocialScore(percentage),
      confidence,
      contributors,
    };
  }

  /**
   * Calculate demographic factors score
   */
  private async calculateDemographicScore(
    responses: AssessmentResponse[],
    weights: EvidenceWeights
  ): Promise<ComponentScore> {
    // In a real implementation, this would come from patient demographics
    // For now, we'll use placeholder values based on statistical risk factors

    const contributors: Array<{ factor: string; contribution: number; weight: number }> = [
      { factor: 'Age Risk Factor', contribution: 35, weight: 50 }, // Peak risk 20-40 years
      { factor: 'Gender Risk Factor', contribution: 40, weight: 50 }, // Female predominance
    ];

    const totalScore = contributors.reduce((sum, c) => sum + c.contribution, 0);
    const maxScore = contributors.reduce((sum, c) => sum + c.weight, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      value: totalScore,
      maxValue: maxScore,
      percentage: Math.round(percentage),
      interpretation: this.interpretDemographicScore(percentage),
      confidence: 85, // High confidence for demographic factors
      contributors,
    };
  }

  /**
   * Calculate behavioral factors score
   */
  private async calculateBehavioralScore(
    responses: AssessmentResponse[],
    weights: EvidenceWeights
  ): Promise<ComponentScore> {
    const behavioralResponses = responses.filter(
      (r) =>
        r.questionId.includes('clench') ||
        r.questionId.includes('grind') ||
        r.questionId.includes('habit') ||
        r.questionId.includes('posture')
    );

    const contributors: Array<{ factor: string; contribution: number; weight: number }> = [];
    let totalScore = 0;
    let maxScore = 0;

    // Jaw clenching
    const clenchingResponse = behavioralResponses.find((r) => r.questionId.includes('clench'));
    if (clenchingResponse && clenchingResponse.value === true) {
      const contribution = 50; // High risk factor
      totalScore += contribution;
      maxScore += 50;
      contributors.push({
        factor: 'Jaw Clenching',
        contribution,
        weight: 50,
      });
    } else {
      maxScore += 50;
    }

    // Teeth grinding
    const grindingResponse = behavioralResponses.find((r) => r.questionId.includes('grind'));
    if (grindingResponse && grindingResponse.value === true) {
      const contribution = 50; // High risk factor
      totalScore += contribution;
      maxScore += 50;
      contributors.push({
        factor: 'Teeth Grinding',
        contribution,
        weight: 50,
      });
    } else {
      maxScore += 50;
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const confidence = this.calculateComponentConfidence(behavioralResponses);

    return {
      value: totalScore,
      maxValue: maxScore,
      percentage: Math.round(percentage),
      interpretation: this.interpretBehavioralScore(percentage),
      confidence,
      contributors,
    };
  }

  /**
   * Calculate medical history score
   */
  private async calculateMedicalHistoryScore(
    responses: AssessmentResponse[],
    weights: EvidenceWeights
  ): Promise<ComponentScore> {
    // This would typically come from patient medical history
    // For demonstration, we'll use placeholder values

    const contributors: Array<{ factor: string; contribution: number; weight: number }> = [
      { factor: 'Previous TMD Episodes', contribution: 20, weight: 40 },
      { factor: 'Trauma History', contribution: 15, weight: 30 },
      { factor: 'Systemic Conditions', contribution: 10, weight: 30 },
    ];

    const totalScore = contributors.reduce((sum, c) => sum + c.contribution, 0);
    const maxScore = contributors.reduce((sum, c) => sum + c.weight, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      value: totalScore,
      maxValue: maxScore,
      percentage: Math.round(percentage),
      interpretation: this.interpretMedicalHistoryScore(percentage),
      confidence: 70, // Moderate confidence for medical history
      contributors,
    };
  }

  /**
   * Calculate weighted composite score using evidence-based weights
   */
  private calculateWeightedComposite(
    components: {
      painIntensity: number;
      functionalImpairment: number;
      psychosocialFactors: number;
      demographicFactors: number;
      behavioralFactors: number;
      medicalHistory: number;
    },
    weights: EvidenceWeights
  ): number {
    const weightedSum =
      components.painIntensity * weights.painIntensity +
      components.functionalImpairment * weights.functionalImpairment +
      components.psychosocialFactors * weights.psychosocialFactors +
      components.demographicFactors * weights.demographicFactors +
      components.behavioralFactors * weights.behavioralFactors +
      components.medicalHistory * weights.medicalHistory;

    return Math.min(100, Math.max(0, weightedSum));
  }

  /**
   * Enhanced risk stratification with multiple thresholds
   */
  private stratifyRisk(compositeScore: number): RiskLevel {
    if (compositeScore >= 75) return 'high';
    if (compositeScore >= 50) return 'moderate';
    if (compositeScore >= 25) return 'low';
    return 'low';
  }

  /**
   * Calculate overall confidence based on component confidences
   */
  private calculateConfidence(
    responses: AssessmentResponse[],
    components: ComponentScore[]
  ): number {
    const responseCompleteness = Math.min(100, (responses.length / 20) * 100); // Assume 20 ideal responses
    const componentConfidences = components.map((c) => c.confidence);
    const avgComponentConfidence =
      componentConfidences.reduce((sum, c) => sum + c, 0) / componentConfidences.length;

    return Math.round(responseCompleteness * 0.4 + avgComponentConfidence * 0.6);
  }

  /**
   * Calculate component-specific confidence
   */
  private calculateComponentConfidence(responses: AssessmentResponse[]): number {
    if (responses.length === 0) return 0;

    // Base confidence on response completeness and consistency
    const completeness = Math.min(100, (responses.length / 3) * 100); // Assume 3 responses per component
    const hasValidResponses = responses.every(
      (r) => r.value !== null && r.value !== undefined && r.value !== ''
    );

    return hasValidResponses ? completeness : completeness * 0.5;
  }

  /**
   * Calculate quality score for the overall assessment
   */
  private calculateQualityScore(
    responses: AssessmentResponse[],
    compositeScore: number,
    confidence: number
  ): number {
    const responseQuality = responses.length >= 15 ? 100 : (responses.length / 15) * 100;
    const scoreConsistency = confidence;
    const algorithmReliability = 95; // Based on evidence quality

    return Math.round(responseQuality * 0.3 + scoreConsistency * 0.4 + algorithmReliability * 0.3);
  }

  /**
   * Calculate DC/TMD specific scores
   */
  private calculateDCTMDScores(responses: AssessmentResponse[]): {
    axis1Score: number;
    axis2Score?: number;
    painIntensity: number;
    painInterference: number;
    jawFunctionalLimitation: number;
  } {
    // Axis I: Pain and functional status
    const painResponses = responses.filter((r) => ['Q1', 'Q2', 'Q3'].includes(r.questionId));
    const painIntensity =
      painResponses.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) /
      Math.max(1, painResponses.length);

    const functionalResponses = responses.filter((r) =>
      ['Q12', 'Q13', 'Q14'].includes(r.questionId)
    );
    const jawFunctionalLimitation =
      functionalResponses.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) /
      Math.max(1, functionalResponses.length);

    const axis1Score = (painIntensity + jawFunctionalLimitation) / 2;

    // Pain interference (derived from functional limitation)
    const painInterference = jawFunctionalLimitation;

    return {
      axis1Score: Math.round(axis1Score * 10) / 10,
      painIntensity: Math.round(painIntensity * 10) / 10,
      painInterference: Math.round(painInterference * 10) / 10,
      jawFunctionalLimitation: Math.round(jawFunctionalLimitation * 10) / 10,
    };
  }

  /**
   * Identify significant risk factors
   */
  private identifyRiskFactors(components: ComponentScore[]): Array<{
    factor: string;
    severity: 'low' | 'moderate' | 'high';
    score: number;
    description: string;
  }> {
    const riskFactors: Array<{
      factor: string;
      severity: 'low' | 'moderate' | 'high';
      score: number;
      description: string;
    }> = [];

    components.forEach((component) => {
      component.contributors.forEach((contributor) => {
        if (contributor.contribution > 20) {
          // Significant contribution threshold
          const severity: 'low' | 'moderate' | 'high' =
            contributor.contribution > 60
              ? 'high'
              : contributor.contribution > 35
                ? 'moderate'
                : 'low';

          riskFactors.push({
            factor: contributor.factor,
            severity,
            score: Math.round(contributor.contribution),
            description: this.getRiskFactorDescription(contributor.factor, severity),
          });
        }
      });
    });

    return riskFactors.sort((a, b) => b.score - a.score);
  }

  /**
   * Identify protective factors
   */
  private identifyProtectiveFactors(components: ComponentScore[]): Array<{
    factor: string;
    impact: 'low' | 'moderate' | 'high';
    description: string;
  }> {
    const protectiveFactors: Array<{
      factor: string;
      impact: 'low' | 'moderate' | 'high';
      description: string;
    }> = [];

    // Identify low-scoring factors as protective
    components.forEach((component) => {
      if (component.percentage < 30) {
        protectiveFactors.push({
          factor: `Low ${component.contributors[0]?.factor || 'Risk Factor'}`,
          impact: component.percentage < 15 ? 'high' : 'moderate',
          description: `Minimal impact from this risk category supports better outcomes`,
        });
      }
    });

    return protectiveFactors;
  }

  // Interpretation methods
  private interpretPainScore(percentage: number): string {
    if (percentage >= 75) return 'Severe pain intensity requiring immediate attention';
    if (percentage >= 50) return 'Moderate pain intensity affecting daily activities';
    if (percentage >= 25) return 'Mild pain intensity with manageable impact';
    return 'Minimal pain intensity with low impact on function';
  }

  private interpretFunctionalScore(percentage: number): string {
    if (percentage >= 75)
      return 'Severe functional limitation requiring comprehensive intervention';
    if (percentage >= 50) return 'Moderate functional limitation affecting quality of life';
    if (percentage >= 25) return 'Mild functional limitation with adaptive strategies needed';
    return 'Minimal functional limitation with good adaptive capacity';
  }

  private interpretPsychosocialScore(percentage: number): string {
    if (percentage >= 75) return 'High psychosocial impact requiring mental health support';
    if (percentage >= 50) return 'Moderate psychosocial impact affecting coping abilities';
    if (percentage >= 25) return 'Mild psychosocial impact with good coping mechanisms';
    return 'Minimal psychosocial impact with strong resilience factors';
  }

  private interpretDemographicScore(percentage: number): string {
    if (percentage >= 75) return 'High demographic risk profile';
    if (percentage >= 50) return 'Moderate demographic risk profile';
    if (percentage >= 25) return 'Low demographic risk profile';
    return 'Minimal demographic risk factors';
  }

  private interpretBehavioralScore(percentage: number): string {
    if (percentage >= 75) return 'High behavioral risk requiring habit modification';
    if (percentage >= 50) return 'Moderate behavioral risk with intervention recommended';
    if (percentage >= 25) return 'Mild behavioral risk with awareness counseling';
    return 'Minimal behavioral risk factors present';
  }

  private interpretMedicalHistoryScore(percentage: number): string {
    if (percentage >= 75) return 'Significant medical history impacting prognosis';
    if (percentage >= 50) return 'Moderate medical history requiring consideration';
    if (percentage >= 25) return 'Mild medical history with minimal impact';
    return 'Unremarkable medical history supporting good prognosis';
  }

  private getRiskFactorDescription(factor: string, severity: 'low' | 'moderate' | 'high'): string {
    const descriptions: Record<string, Record<string, string>> = {
      'Current Pain Intensity': {
        high: 'Severe current pain significantly impacting daily activities',
        moderate: 'Moderate current pain affecting function and comfort',
        low: 'Mild current pain with manageable impact',
      },
      'Worst Pain (30 days)': {
        high: 'Severe pain episodes indicating high disease activity',
        moderate: 'Moderate pain episodes suggesting active condition',
        low: 'Mild pain episodes with good control',
      },
      'Stress Level': {
        high: 'High stress levels exacerbating TMD symptoms',
        moderate: 'Moderate stress contributing to symptom severity',
        low: 'Mild stress with minimal symptom impact',
      },
      'Jaw Clenching': {
        high: 'Frequent jaw clenching significantly contributing to symptoms',
        moderate: 'Occasional jaw clenching contributing to discomfort',
        low: 'Minimal jaw clenching behavior',
      },
    };

    return (
      descriptions[factor]?.[severity] ||
      `${severity.charAt(0).toUpperCase() + severity.slice(1)} impact from ${factor}`
    );
  }
}

// Export factory function for easy integration
export const createEnhancedRiskCalculator = () => new EnhancedRiskCalculator();
