// Risk Calculator - TMD Risk Stratification Engine
// Calculates comprehensive risk scores based on DC/TMD protocol and clinical evidence

import type { AssessmentResponse, RiskScore } from '@/entities/assessment';
import type { RiskLevel } from '@/shared/types';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

/**
 * Risk factor definition with clinical evidence
 */
interface RiskFactor {
  id: string;
  name: string;
  category: 'demographic' | 'clinical' | 'behavioral' | 'psychosocial' | 'medical';
  weight: number; // 1-10 scale
  evidenceLevel: 'A' | 'B' | 'C' | 'D'; // Evidence-based medicine levels
  description: string;
  calculator: (responses: AssessmentResponse[]) => number; // Returns 0-1 multiplier
}

/**
 * Risk calculation configuration
 */
interface RiskCalculationConfig {
  maxScore: number;
  thresholds: {
    low: number;
    moderate: number;
    high: number;
  };
  weightingFactors: {
    pain: number;
    function: number;
    psychosocial: number;
    medical: number;
  };
}

/**
 * Detailed risk calculation result
 */
export interface DetailedRiskResult extends RiskScore {
  calculationDetails: {
    rawScore: number;
    normalizedScore: number;
    factorContributions: Array<{
      factorId: string;
      factorName: string;
      contribution: number;
      weight: number;
      evidenceLevel: string;
    }>;
    thresholdAnalysis: {
      currentLevel: RiskLevel;
      nextThreshold: number;
      distanceToNext: number;
    };
  };
}

/**
 * TMD Risk Calculator
 * Implements evidence-based risk stratification algorithms
 */
export class RiskCalculator {
  private riskFactors: RiskFactor[];
  private config: RiskCalculationConfig;
  private errorLogger: ErrorLoggingService;

  constructor() {
    this.errorLogger = new ErrorLoggingService();
    this.config = this.initializeConfig();
    this.riskFactors = this.initializeRiskFactors();
  }

  /**
   * Calculate comprehensive risk score from assessment responses
   */
  async calculate(responses: AssessmentResponse[]): Promise<DetailedRiskResult> {
    try {
      // Validate input responses
      this.validateResponses(responses);

      // Calculate individual factor contributions
      const factorContributions = this.calculateFactorContributions(responses);

      // Calculate weighted risk score
      const rawScore = this.calculateWeightedScore(factorContributions);
      const normalizedScore = this.normalizeScore(rawScore);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(normalizedScore);

      // Calculate component scores
      const componentScores = this.calculateComponentScores(responses, factorContributions);

      // Generate risk factors and protective factors
      const { riskFactors, protectiveFactors } = this.identifyRiskFactors(factorContributions);

      // Calculate threshold analysis
      const thresholdAnalysis = this.calculateThresholdAnalysis(normalizedScore, riskLevel);

      return {
        // Base RiskScore properties
        overallRisk: riskLevel,
        overallScore: normalizedScore,
        maxPossibleScore: this.config.maxScore,
        confidenceLevel: this.calculateConfidence(responses, factorContributions),

        painScore: componentScores.pain,
        functionalScore: componentScores.function,
        psychosocialScore: componentScores.psychosocial,

        dcTmdScores: this.calculateDCTMDScores(responses),
        riskFactors,
        protectiveFactors,

        scoringAlgorithm: 'TMD_Risk_Calculator_v2.1',
        algorithmVersion: '2.1.0',
        calculatedAt: new Date(),
        calculatedBy: 'automated_system',

        // Detailed calculation information
        calculationDetails: {
          rawScore,
          normalizedScore,
          factorContributions: factorContributions.map((fc) => ({
            factorId: fc.factor.id,
            factorName: fc.factor.name,
            contribution: fc.contribution,
            weight: fc.factor.weight,
            evidenceLevel: fc.factor.evidenceLevel,
          })),
          thresholdAnalysis,
        },
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.ASSESSMENT, {
        additionalData: {
          responseCount: responses.length,
          calculationType: 'risk_assessment',
        },
      });

      throw new Error(`Risk calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Initialize risk calculation configuration
   */
  private initializeConfig(): RiskCalculationConfig {
    return {
      maxScore: 100,
      thresholds: {
        low: 30,
        moderate: 60,
        high: 80,
      },
      weightingFactors: {
        pain: 0.35,
        function: 0.25,
        psychosocial: 0.25,
        medical: 0.15,
      },
    };
  }

  /**
   * Initialize evidence-based risk factors
   */
  private initializeRiskFactors(): RiskFactor[] {
    return [
      // Demographic Risk Factors
      {
        id: 'DEMO_AGE',
        name: 'Age Risk Factor',
        category: 'demographic',
        weight: 6,
        evidenceLevel: 'A',
        description: 'Peak TMD onset age 20-40 years',
        calculator: (responses) => {
          // This would typically come from patient demographics
          // For now, we'll use a placeholder calculation
          return 0.7; // Moderate risk
        },
      },

      {
        id: 'DEMO_GENDER',
        name: 'Gender Risk Factor',
        category: 'demographic',
        weight: 8,
        evidenceLevel: 'A',
        description: 'Female gender associated with higher TMD prevalence',
        calculator: (responses) => {
          // This would come from patient demographics
          return 0.8; // Higher risk for females
        },
      },

      // Pain-Related Risk Factors
      {
        id: 'PAIN_INTENSITY',
        name: 'Pain Intensity',
        category: 'clinical',
        weight: 9,
        evidenceLevel: 'A',
        description: 'Higher pain intensity correlates with worse outcomes',
        calculator: (responses) => {
          const painResponses = responses.filter(
            (r) => r.questionId.includes('pain') || ['Q1', 'Q2'].includes(r.questionId)
          );

          const maxPain = Math.max(
            ...painResponses.map((r) => (typeof r.value === 'number' ? r.value : 0))
          );

          return Math.min(1, maxPain / 4); // Normalize to 0-1
        },
      },

      {
        id: 'PAIN_FREQUENCY',
        name: 'Pain Frequency',
        category: 'clinical',
        weight: 7,
        evidenceLevel: 'A',
        description: 'Frequent pain episodes indicate chronic condition',
        calculator: (responses) => {
          const frequencyResponse = responses.find(
            (r) => r.questionId.includes('frequency') || r.questionId === 'Q3'
          );

          if (!frequencyResponse) return 0;

          if (typeof frequencyResponse.value === 'string') {
            const freq = frequencyResponse.value.toLowerCase();
            if (freq.includes('daily') || freq.includes('constant')) return 1.0;
            if (freq.includes('weekly')) return 0.7;
            if (freq.includes('monthly')) return 0.4;
            return 0.2;
          }

          return typeof frequencyResponse.value === 'number'
            ? Math.min(1, frequencyResponse.value / 4)
            : 0;
        },
      },

      // Functional Risk Factors
      {
        id: 'FUNC_LIMITATION',
        name: 'Functional Limitations',
        category: 'clinical',
        weight: 8,
        evidenceLevel: 'A',
        description: 'Jaw functional limitations impact quality of life',
        calculator: (responses) => {
          const functionalResponses = responses.filter(
            (r) =>
              r.questionId.includes('chewing') ||
              r.questionId.includes('opening') ||
              ['Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17'].includes(r.questionId)
          );

          const limitationScores = functionalResponses.map((r) =>
            typeof r.value === 'number' ? r.value : 0
          );

          const avgLimitation =
            limitationScores.length > 0
              ? limitationScores.reduce((sum, score) => sum + score, 0) / limitationScores.length
              : 0;

          return Math.min(1, avgLimitation / 4);
        },
      },

      // Joint-Related Risk Factors
      {
        id: 'JOINT_SOUNDS',
        name: 'Joint Sounds',
        category: 'clinical',
        weight: 6,
        evidenceLevel: 'B',
        description: 'Joint clicking/popping may indicate disc displacement',
        calculator: (responses) => {
          const jointResponses = responses.filter(
            (r) =>
              r.questionId.includes('clicking') ||
              r.questionId.includes('popping') ||
              ['Q8', 'Q9', 'Q10', 'Q11'].includes(r.questionId)
          );

          const hasJointSounds = jointResponses.some(
            (r) =>
              r.value === true || r.value === 'yes' || (typeof r.value === 'number' && r.value > 0)
          );

          return hasJointSounds ? 0.6 : 0.1;
        },
      },

      // Psychosocial Risk Factors
      {
        id: 'STRESS_LEVEL',
        name: 'Stress Level',
        category: 'psychosocial',
        weight: 7,
        evidenceLevel: 'A',
        description: 'High stress levels exacerbate TMD symptoms',
        calculator: (responses) => {
          const stressResponse = responses.find(
            (r) => r.questionId.includes('stress') || r.questionId === 'Q22'
          );

          if (!stressResponse || typeof stressResponse.value !== 'number') return 0.5;

          return Math.min(1, stressResponse.value / 10);
        },
      },

      {
        id: 'SLEEP_QUALITY',
        name: 'Sleep Quality',
        category: 'psychosocial',
        weight: 6,
        evidenceLevel: 'B',
        description: 'Poor sleep quality associated with chronic pain',
        calculator: (responses) => {
          const sleepResponse = responses.find(
            (r) => r.questionId.includes('sleep') || r.questionId === 'Q21'
          );

          if (!sleepResponse || typeof sleepResponse.value !== 'number') return 0.5;

          // Invert scale - lower sleep quality = higher risk
          return Math.min(1, (10 - sleepResponse.value) / 10);
        },
      },

      // Behavioral Risk Factors
      {
        id: 'BRUXISM_CLENCHING',
        name: 'Bruxism/Clenching',
        category: 'behavioral',
        weight: 8,
        evidenceLevel: 'A',
        description: 'Teeth grinding and clenching major TMD risk factors',
        calculator: (responses) => {
          const bruxismResponses = responses.filter(
            (r) =>
              r.questionId.includes('grinding') ||
              r.questionId.includes('clenching') ||
              r.questionId === 'Q23'
          );

          const hasBruxism = bruxismResponses.some(
            (r) =>
              r.value === true || r.value === 'yes' || (typeof r.value === 'number' && r.value > 2)
          );

          return hasBruxism ? 0.9 : 0.2;
        },
      },

      // Medical History Risk Factors
      {
        id: 'TRAUMA_HISTORY',
        name: 'Trauma History',
        category: 'medical',
        weight: 7,
        evidenceLevel: 'B',
        description: 'Head/neck trauma increases TMD risk',
        calculator: (responses) => {
          const traumaResponses = responses.filter(
            (r) =>
              r.questionId.includes('trauma') ||
              r.questionId.includes('injury') ||
              r.questionId === 'Q25'
          );

          const hasTrauma = traumaResponses.some((r) => r.value === true || r.value === 'yes');

          return hasTrauma ? 0.7 : 0.1;
        },
      },

      {
        id: 'ASSOCIATED_CONDITIONS',
        name: 'Associated Medical Conditions',
        category: 'medical',
        weight: 6,
        evidenceLevel: 'B',
        description: 'Arthritis, fibromyalgia, and chronic pain conditions',
        calculator: (responses) => {
          const conditionResponses = responses.filter(
            (r) =>
              r.questionId.includes('arthritis') ||
              r.questionId.includes('fibromyalgia') ||
              r.questionId.includes('chronic') ||
              ['Q18', 'Q19', 'Q20'].includes(r.questionId)
          );

          const conditionCount = conditionResponses.filter(
            (r) => r.value === true || r.value === 'yes'
          ).length;

          return Math.min(1, conditionCount / 3);
        },
      },
    ];
  }

  /**
   * Validate assessment responses
   */
  private validateResponses(responses: AssessmentResponse[]): void {
    if (!responses || responses.length === 0) {
      throw new Error('No assessment responses provided');
    }

    // Check for required response types
    const hasNumericResponses = responses.some((r) => typeof r.value === 'number');
    if (!hasNumericResponses) {
      throw new Error('Assessment must include numeric pain/function ratings');
    }
  }

  /**
   * Calculate individual factor contributions
   */
  private calculateFactorContributions(responses: AssessmentResponse[]): Array<{
    factor: RiskFactor;
    contribution: number;
    confidence: number;
  }> {
    return this.riskFactors.map((factor) => {
      try {
        const multiplier = factor.calculator(responses);
        const contribution = factor.weight * multiplier;
        const confidence = this.calculateFactorConfidence(factor, responses);

        return {
          factor,
          contribution,
          confidence,
        };
      } catch (error) {
        this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.ASSESSMENT, {
          additionalData: {
            factorId: factor.id,
            factorName: factor.name,
          },
        });

        return {
          factor,
          contribution: 0,
          confidence: 0,
        };
      }
    });
  }

  /**
   * Calculate weighted total score
   */
  private calculateWeightedScore(
    contributions: Array<{ factor: RiskFactor; contribution: number }>
  ): number {
    const totalWeight = this.riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedSum = contributions.reduce((sum, contrib) => sum + contrib.contribution, 0);

    return (weightedSum / totalWeight) * this.config.maxScore;
  }

  /**
   * Normalize score to 0-100 range
   */
  private normalizeScore(rawScore: number): number {
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): RiskLevel {
    if (score >= this.config.thresholds.high) return 'high';
    if (score >= this.config.thresholds.moderate) return 'moderate';
    return 'low';
  }

  /**
   * Calculate component scores
   */
  private calculateComponentScores(
    responses: AssessmentResponse[],
    contributions: Array<{ factor: RiskFactor; contribution: number }>
  ): {
    pain: { value: number; maxValue: number; interpretation: string };
    function: { value: number; maxValue: number; interpretation: string };
    psychosocial: { value: number; maxValue: number; interpretation: string };
  } {
    const painContributions = contributions.filter(
      (c) => c.factor.category === 'clinical' && c.factor.id.includes('PAIN')
    );

    const functionContributions = contributions.filter(
      (c) => c.factor.category === 'clinical' && c.factor.id.includes('FUNC')
    );

    const psychosocialContributions = contributions.filter(
      (c) => c.factor.category === 'psychosocial'
    );

    const painScore = painContributions.reduce((sum, c) => sum + c.contribution, 0);
    const functionScore = functionContributions.reduce((sum, c) => sum + c.contribution, 0);
    const psychosocialScore = psychosocialContributions.reduce((sum, c) => sum + c.contribution, 0);

    return {
      pain: {
        value: Math.round(painScore),
        maxValue: 20,
        interpretation: this.interpretComponentScore(painScore, 'pain'),
      },
      function: {
        value: Math.round(functionScore),
        maxValue: 20,
        interpretation: this.interpretComponentScore(functionScore, 'function'),
      },
      psychosocial: {
        value: Math.round(psychosocialScore),
        maxValue: 20,
        interpretation: this.interpretComponentScore(psychosocialScore, 'psychosocial'),
      },
    };
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
    const painIntensityResponses = responses.filter(
      (r) => r.questionId.includes('pain_intensity') || ['Q1', 'Q2'].includes(r.questionId)
    );

    const painInterferenceResponses = responses.filter(
      (r) => r.questionId.includes('interference') || r.questionId === 'Q7'
    );

    const functionalResponses = responses.filter(
      (r) => r.questionId.includes('function') || ['Q12', 'Q13', 'Q14'].includes(r.questionId)
    );

    const painIntensity = Math.max(
      ...painIntensityResponses.map((r) => (typeof r.value === 'number' ? r.value : 0))
    );

    const painInterference = Math.max(
      ...painInterferenceResponses.map((r) => (typeof r.value === 'number' ? r.value : 0))
    );

    const jawFunctionalLimitation =
      functionalResponses.length > 0
        ? functionalResponses.reduce(
            (sum, r) => sum + (typeof r.value === 'number' ? r.value : 0),
            0
          ) / functionalResponses.length
        : 0;

    return {
      axis1Score: Math.round((painIntensity + painInterference) * 10),
      painIntensity: Math.min(4, painIntensity),
      painInterference: Math.min(4, painInterference),
      jawFunctionalLimitation: Math.min(4, jawFunctionalLimitation),
    };
  }

  /**
   * Identify risk and protective factors
   */
  private identifyRiskFactors(contributions: Array<{ factor: RiskFactor; contribution: number }>): {
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'moderate' | 'high';
      score: number;
      description: string;
    }>;
    protectiveFactors: Array<{
      factor: string;
      impact: 'low' | 'moderate' | 'high';
      description: string;
    }>;
  } {
    const riskFactors = contributions
      .filter((c) => c.contribution > 5)
      .map((c) => ({
        factor: c.factor.name,
        severity:
          c.contribution > 15
            ? ('high' as const)
            : c.contribution > 10
              ? ('moderate' as const)
              : ('low' as const),
        score: Math.round(c.contribution),
        description: c.factor.description,
      }));

    const protectiveFactors = contributions
      .filter((c) => c.contribution < 2)
      .map((c) => ({
        factor: c.factor.name,
        impact: 'low' as const,
        description: `Low ${c.factor.name.toLowerCase()} provides protective effect`,
      }));

    return { riskFactors, protectiveFactors };
  }

  /**
   * Calculate threshold analysis
   */
  private calculateThresholdAnalysis(
    score: number,
    currentLevel: RiskLevel
  ): {
    currentLevel: RiskLevel;
    nextThreshold: number;
    distanceToNext: number;
  } {
    let nextThreshold: number;

    if (currentLevel === 'low') {
      nextThreshold = this.config.thresholds.moderate;
    } else if (currentLevel === 'moderate') {
      nextThreshold = this.config.thresholds.high;
    } else {
      nextThreshold = 100;
    }

    return {
      currentLevel,
      nextThreshold,
      distanceToNext: nextThreshold - score,
    };
  }

  /**
   * Calculate overall confidence level
   */
  private calculateConfidence(
    responses: AssessmentResponse[],
    contributions: Array<{ factor: RiskFactor; contribution: number; confidence: number }>
  ): number {
    const avgFactorConfidence =
      contributions.reduce((sum, c) => sum + c.confidence, 0) / contributions.length;
    const responseCompleteness = Math.min(100, (responses.length / 26) * 100); // Assuming 26 total questions

    return Math.round((avgFactorConfidence + responseCompleteness) / 2);
  }

  /**
   * Calculate confidence for individual factor
   */
  private calculateFactorConfidence(factor: RiskFactor, responses: AssessmentResponse[]): number {
    // Base confidence on evidence level and data availability
    const evidenceScores = { A: 90, B: 75, C: 60, D: 45 };
    const baseConfidence = evidenceScores[factor.evidenceLevel];

    // Adjust based on relevant response availability
    const relevantResponses = responses.filter((r) =>
      factor.id
        .toLowerCase()
        .split('_')
        .some((part) => r.questionId.toLowerCase().includes(part))
    );

    const dataAvailability = relevantResponses.length > 0 ? 100 : 50;

    return Math.round((baseConfidence + dataAvailability) / 2);
  }

  /**
   * Interpret component scores
   */
  private interpretComponentScore(score: number, component: string): string {
    const interpretations = {
      pain: {
        low: 'Minimal pain impact',
        moderate: 'Moderate pain affecting daily activities',
        high: 'Severe pain significantly impacting function',
      },
      function: {
        low: 'No significant functional limitations',
        moderate: 'Moderate functional impairment',
        high: 'Severe functional limitations',
      },
      psychosocial: {
        low: 'Minimal psychosocial impact',
        moderate: 'Moderate psychosocial concerns',
        high: 'Significant psychosocial distress',
      },
    };

    const level = score > 15 ? 'high' : score > 8 ? 'moderate' : 'low';
    return interpretations[component as keyof typeof interpretations][level];
  }
}
