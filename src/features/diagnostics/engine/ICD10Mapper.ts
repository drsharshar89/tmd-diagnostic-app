// ICD-10 Mapper - TMD Diagnostic Code Mapping Engine
// Maps TMD diagnoses to ICD-10 codes with clinical decision support

import type { DiagnosisResult, ICD10Code } from '@/entities/diagnosis';
import type { TMDAssessment } from '@/entities/assessment';
import type { DetailedRiskResult } from './RiskCalculator';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

/**
 * TMD-specific ICD-10 code definitions
 */
interface TMDCodeDefinition {
  code: string;
  description: string;
  category: 'muscle_disorder' | 'joint_disorder' | 'disc_disorder' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  criteria: {
    painThreshold?: number;
    functionalLimitationThreshold?: number;
    symptomDuration?: 'acute' | 'chronic';
    specificSymptoms?: string[];
    excludedConditions?: string[];
  };
  billable: boolean;
  validFrom: string; // ICD-10 version
  clinicalNotes?: string;
}

/**
 * Diagnostic mapping result with clinical context
 */
export interface ICD10MappingResult {
  primaryCode: ICD10Code;
  secondaryCodes: ICD10Code[];
  excludedCodes: Array<{
    code: string;
    reason: string;
    description: string;
  }>;
  clinicalJustification: {
    primaryReason: string;
    supportingEvidence: string[];
    differentialConsiderations: string[];
  };
  billingInformation: {
    primaryBillable: boolean;
    totalBillableCodes: number;
    reimbursementNotes?: string;
  };
  mappingConfidence: number; // 0-100%
}

/**
 * ICD-10 Code Mapper for TMD Diagnoses
 * Implements clinical decision support for accurate coding
 */
export class ICD10Mapper {
  private tmdCodes: TMDCodeDefinition[];
  private errorLogger: ErrorLoggingService;

  constructor() {
    this.errorLogger = new ErrorLoggingService();
    this.tmdCodes = this.initializeTMDCodes();
  }

  /**
   * Map TMD diagnosis to appropriate ICD-10 codes
   */
  async mapDiagnosis(
    assessment: TMDAssessment,
    riskResult: DetailedRiskResult,
    diagnosticFindings?: any
  ): Promise<ICD10MappingResult> {
    try {
      // Analyze clinical presentation
      const clinicalProfile = this.analyzeClinicalProfile(assessment, riskResult);

      // Find matching primary code
      const primaryCode = await this.findPrimaryCode(clinicalProfile);

      // Find secondary codes
      const secondaryCodes = await this.findSecondaryCodes(clinicalProfile, primaryCode);

      // Identify excluded codes
      const excludedCodes = this.identifyExcludedCodes(clinicalProfile, primaryCode);

      // Generate clinical justification
      const clinicalJustification = this.generateClinicalJustification(
        clinicalProfile,
        primaryCode,
        secondaryCodes
      );

      // Calculate billing information
      const billingInformation = this.calculateBillingInformation(primaryCode, secondaryCodes);

      // Calculate mapping confidence
      const mappingConfidence = this.calculateMappingConfidence(
        clinicalProfile,
        primaryCode,
        secondaryCodes
      );

      return {
        primaryCode,
        secondaryCodes,
        excludedCodes,
        clinicalJustification,
        billingInformation,
        mappingConfidence,
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.ASSESSMENT, {
        additionalData: {
          assessmentId: assessment.id,
          riskLevel: riskResult.overallRisk,
        },
      });

      throw new Error(`ICD-10 mapping failed: ${(error as Error).message}`);
    }
  }

  /**
   * Initialize TMD-specific ICD-10 codes
   */
  private initializeTMDCodes(): TMDCodeDefinition[] {
    return [
      // Muscle Disorders (M79.1)
      {
        code: 'M79.1',
        description: 'Myalgia',
        category: 'muscle_disorder',
        severity: 'mild',
        criteria: {
          painThreshold: 2,
          specificSymptoms: ['muscle_pain', 'muscle_tenderness'],
          excludedConditions: ['joint_disorder', 'disc_displacement'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'Use for muscle-related TMD pain without joint involvement',
      },

      // Joint Disorders - Arthralgia (M25.511, M25.512)
      {
        code: 'M25.511',
        description: 'Pain in right temporomandibular joint',
        category: 'joint_disorder',
        severity: 'mild',
        criteria: {
          painThreshold: 1,
          specificSymptoms: ['joint_pain', 'right_side'],
          functionalLimitationThreshold: 1,
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'Specific to right TMJ pain',
      },

      {
        code: 'M25.512',
        description: 'Pain in left temporomandibular joint',
        category: 'joint_disorder',
        severity: 'mild',
        criteria: {
          painThreshold: 1,
          specificSymptoms: ['joint_pain', 'left_side'],
          functionalLimitationThreshold: 1,
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'Specific to left TMJ pain',
      },

      {
        code: 'M25.513',
        description: 'Pain in bilateral temporomandibular joints',
        category: 'joint_disorder',
        severity: 'moderate',
        criteria: {
          painThreshold: 2,
          specificSymptoms: ['joint_pain', 'bilateral'],
          functionalLimitationThreshold: 2,
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For bilateral TMJ involvement',
      },

      // Disc Disorders (M26.601, M26.602, M26.603)
      {
        code: 'M26.601',
        description: 'Right temporomandibular joint disorder, unspecified',
        category: 'disc_disorder',
        severity: 'moderate',
        criteria: {
          painThreshold: 2,
          functionalLimitationThreshold: 2,
          specificSymptoms: ['clicking', 'popping', 'locking', 'right_side'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For right TMJ disc displacement or dysfunction',
      },

      {
        code: 'M26.602',
        description: 'Left temporomandibular joint disorder, unspecified',
        category: 'disc_disorder',
        severity: 'moderate',
        criteria: {
          painThreshold: 2,
          functionalLimitationThreshold: 2,
          specificSymptoms: ['clicking', 'popping', 'locking', 'left_side'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For left TMJ disc displacement or dysfunction',
      },

      {
        code: 'M26.603',
        description: 'Bilateral temporomandibular joint disorder, unspecified',
        category: 'disc_disorder',
        severity: 'severe',
        criteria: {
          painThreshold: 3,
          functionalLimitationThreshold: 3,
          specificSymptoms: ['clicking', 'popping', 'locking', 'bilateral'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For bilateral TMJ disc displacement or dysfunction',
      },

      // Specific Disc Displacement Codes
      {
        code: 'M26.611',
        description: 'Adhesions and ankylosis of right temporomandibular joint',
        category: 'disc_disorder',
        severity: 'severe',
        criteria: {
          painThreshold: 3,
          functionalLimitationThreshold: 4,
          specificSymptoms: ['severe_limitation', 'locking', 'right_side'],
          symptomDuration: 'chronic',
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For severe right TMJ dysfunction with adhesions',
      },

      {
        code: 'M26.612',
        description: 'Adhesions and ankylosis of left temporomandibular joint',
        category: 'disc_disorder',
        severity: 'severe',
        criteria: {
          painThreshold: 3,
          functionalLimitationThreshold: 4,
          specificSymptoms: ['severe_limitation', 'locking', 'left_side'],
          symptomDuration: 'chronic',
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For severe left TMJ dysfunction with adhesions',
      },

      {
        code: 'M26.613',
        description: 'Adhesions and ankylosis of bilateral temporomandibular joint',
        category: 'disc_disorder',
        severity: 'severe',
        criteria: {
          painThreshold: 4,
          functionalLimitationThreshold: 4,
          specificSymptoms: ['severe_limitation', 'locking', 'bilateral'],
          symptomDuration: 'chronic',
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For severe bilateral TMJ dysfunction with adhesions',
      },

      // Articular Disc Displacement
      {
        code: 'M26.621',
        description: 'Articular disc disorder of right temporomandibular joint',
        category: 'disc_disorder',
        severity: 'moderate',
        criteria: {
          painThreshold: 2,
          functionalLimitationThreshold: 2,
          specificSymptoms: ['clicking', 'disc_displacement', 'right_side'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'Specific for right TMJ disc displacement',
      },

      {
        code: 'M26.622',
        description: 'Articular disc disorder of left temporomandibular joint',
        category: 'disc_disorder',
        severity: 'moderate',
        criteria: {
          painThreshold: 2,
          functionalLimitationThreshold: 2,
          specificSymptoms: ['clicking', 'disc_displacement', 'left_side'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'Specific for left TMJ disc displacement',
      },

      {
        code: 'M26.623',
        description: 'Articular disc disorder of bilateral temporomandibular joint',
        category: 'disc_disorder',
        severity: 'severe',
        criteria: {
          painThreshold: 3,
          functionalLimitationThreshold: 3,
          specificSymptoms: ['clicking', 'disc_displacement', 'bilateral'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For bilateral TMJ disc displacement',
      },

      // Secondary/Associated Conditions
      {
        code: 'G44.1',
        description: 'Vascular headache, not elsewhere classified',
        category: 'other',
        severity: 'mild',
        criteria: {
          specificSymptoms: ['headache', 'vascular_component'],
          excludedConditions: ['migraine'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For TMD-associated headaches',
      },

      {
        code: 'M79.3',
        description: 'Panniculitis, unspecified',
        category: 'other',
        severity: 'mild',
        criteria: {
          specificSymptoms: ['muscle_inflammation', 'trigger_points'],
        },
        billable: true,
        validFrom: '2023',
        clinicalNotes: 'For associated myofascial pain',
      },
    ];
  }

  /**
   * Analyze clinical profile from assessment and risk data
   */
  private analyzeClinicalProfile(assessment: TMDAssessment, riskResult: DetailedRiskResult): any {
    const responses = assessment.responses;

    // Extract pain characteristics
    const painIntensity = Math.max(
      ...responses
        .filter((r) => r.questionId.includes('pain') || ['Q1', 'Q2'].includes(r.questionId))
        .map((r) => (typeof r.value === 'number' ? r.value : 0))
    );

    // Extract functional limitations
    const functionalLimitation =
      responses
        .filter(
          (r) => r.questionId.includes('function') || ['Q12', 'Q13', 'Q14'].includes(r.questionId)
        )
        .reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) / 3;

    // Extract joint symptoms
    const hasJointSounds = responses.some(
      (r) =>
        (r.questionId.includes('clicking') || r.questionId.includes('popping')) &&
        (r.value === true || r.value === 'yes')
    );

    const hasLocking = responses.some(
      (r) => r.questionId.includes('locking') && (r.value === true || r.value === 'yes')
    );

    // Extract laterality
    const rightSideSymptoms = responses.some(
      (r) => r.questionId.includes('right') && (r.value === true || r.value === 'yes')
    );

    const leftSideSymptoms = responses.some(
      (r) => r.questionId.includes('left') && (r.value === true || r.value === 'yes')
    );

    const bilateral = rightSideSymptoms && leftSideSymptoms;

    // Extract associated symptoms
    const hasHeadache = responses.some(
      (r) => r.questionId.includes('headache') && (r.value === true || r.value === 'yes')
    );

    const hasNeckPain = responses.some(
      (r) => r.questionId.includes('neck') && (r.value === true || r.value === 'yes')
    );

    // Determine symptom duration
    const durationResponse = responses.find((r) => r.questionId.includes('duration'));
    const ischronic =
      durationResponse &&
      (durationResponse.value === 'chronic' ||
        (typeof durationResponse.value === 'number' && durationResponse.value > 3));

    return {
      painIntensity,
      functionalLimitation,
      hasJointSounds,
      hasLocking,
      bilateral,
      rightSideSymptoms,
      leftSideSymptoms,
      hasHeadache,
      hasNeckPain,
      ischronic,
      riskLevel: riskResult.overallRisk,
      overallScore: riskResult.overallScore,
      symptomProfile: this.buildSymptomProfile(responses),
    };
  }

  /**
   * Build symptom profile for matching
   */
  private buildSymptomProfile(responses: any[]): string[] {
    const symptoms: string[] = [];

    responses.forEach((response) => {
      if (response.value === true || response.value === 'yes') {
        if (response.questionId.includes('clicking')) symptoms.push('clicking');
        if (response.questionId.includes('popping')) symptoms.push('popping');
        if (response.questionId.includes('locking')) symptoms.push('locking');
        if (response.questionId.includes('grinding')) symptoms.push('grinding');
        if (response.questionId.includes('muscle')) symptoms.push('muscle_pain');
        if (response.questionId.includes('joint')) symptoms.push('joint_pain');
        if (response.questionId.includes('headache')) symptoms.push('headache');
        if (response.questionId.includes('neck')) symptoms.push('neck_pain');
        if (response.questionId.includes('right')) symptoms.push('right_side');
        if (response.questionId.includes('left')) symptoms.push('left_side');
      }
    });

    return symptoms;
  }

  /**
   * Find primary ICD-10 code based on clinical profile
   */
  private async findPrimaryCode(clinicalProfile: any): Promise<ICD10Code> {
    // Score each code based on clinical match
    const codeScores = this.tmdCodes.map((code) => ({
      code,
      score: this.calculateCodeMatchScore(code, clinicalProfile),
    }));

    // Sort by score and select best match
    codeScores.sort((a, b) => b.score - a.score);
    const bestMatch = codeScores[0];

    if (bestMatch.score < 0.3) {
      // Low confidence match - use generic code
      const genericCode = this.tmdCodes.find((c) => c.code === 'M26.603') || this.tmdCodes[0];
      return this.createICD10Code(genericCode, 'Primary diagnosis based on clinical presentation');
    }

    return this.createICD10Code(
      bestMatch.code,
      `Primary diagnosis - ${bestMatch.score.toFixed(2)} confidence match`
    );
  }

  /**
   * Find secondary ICD-10 codes
   */
  private async findSecondaryCodes(
    clinicalProfile: any,
    primaryCode: ICD10Code
  ): Promise<ICD10Code[]> {
    const secondaryCodes: ICD10Code[] = [];

    // Add headache code if present
    if (clinicalProfile.hasHeadache) {
      const headacheCode = this.tmdCodes.find((c) => c.code === 'G44.1');
      if (headacheCode) {
        secondaryCodes.push(
          this.createICD10Code(headacheCode, 'Secondary diagnosis - TMD-associated headache')
        );
      }
    }

    // Add muscle disorder code if primary is joint-related
    if (primaryCode.code.startsWith('M25') || primaryCode.code.startsWith('M26')) {
      const muscleCode = this.tmdCodes.find((c) => c.code === 'M79.1');
      if (muscleCode && clinicalProfile.symptomProfile.includes('muscle_pain')) {
        secondaryCodes.push(
          this.createICD10Code(muscleCode, 'Secondary diagnosis - Associated myalgia')
        );
      }
    }

    return secondaryCodes;
  }

  /**
   * Calculate code match score
   */
  private calculateCodeMatchScore(code: TMDCodeDefinition, clinicalProfile: any): number {
    let score = 0;

    // Pain threshold match
    if (code.criteria.painThreshold) {
      const painMatch = Math.min(1, clinicalProfile.painIntensity / code.criteria.painThreshold);
      score += painMatch * 0.4;
    }

    // Functional limitation match
    if (code.criteria.functionalLimitationThreshold) {
      const funcMatch = Math.min(
        1,
        clinicalProfile.functionalLimitation / code.criteria.functionalLimitationThreshold
      );
      score += funcMatch * 0.3;
    }

    // Symptom match
    if (code.criteria.specificSymptoms) {
      const symptomMatches = code.criteria.specificSymptoms.filter((symptom) =>
        clinicalProfile.symptomProfile.includes(symptom)
      ).length;
      const symptomScore = symptomMatches / code.criteria.specificSymptoms.length;
      score += symptomScore * 0.3;
    }

    // Laterality match
    if (code.description.includes('bilateral') && clinicalProfile.bilateral) {
      score += 0.1;
    } else if (code.description.includes('right') && clinicalProfile.rightSideSymptoms) {
      score += 0.1;
    } else if (code.description.includes('left') && clinicalProfile.leftSideSymptoms) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Create ICD10Code object
   */
  private createICD10Code(codeDefinition: TMDCodeDefinition, clinicalReason: string): ICD10Code {
    return {
      code: codeDefinition.code,
      description: codeDefinition.description,
      category: codeDefinition.category,
      chapter: 'Diseases of the musculoskeletal system and connective tissue',
      primary: true,
      confidence: 85,
      evidenceLevel: 'probable',
      severity: codeDefinition.severity,
      codingSystem: 'ICD-10-CM',
      version: codeDefinition.validFrom,
      effectiveDate: new Date(),
      codedAt: new Date(),
      codedBy: 'automated_system',
      billable: codeDefinition.billable,
      clinicalRelevance: 90,
    };
  }

  /**
   * Identify excluded codes
   */
  private identifyExcludedCodes(
    clinicalProfile: any,
    primaryCode: ICD10Code
  ): Array<{
    code: string;
    reason: string;
    description: string;
  }> {
    const excluded: Array<{ code: string; reason: string; description: string }> = [];

    // Find codes that should be excluded based on primary diagnosis
    this.tmdCodes.forEach((code) => {
      if (code.code !== primaryCode.code && code.criteria.excludedConditions) {
        const shouldExclude = code.criteria.excludedConditions.some((condition) => {
          if (condition === 'joint_disorder' && primaryCode.code.startsWith('M25')) return true;
          if (condition === 'disc_displacement' && primaryCode.code.startsWith('M26.6'))
            return true;
          if (condition === 'muscle_disorder' && primaryCode.code === 'M79.1') return true;
          return false;
        });

        if (shouldExclude) {
          excluded.push({
            code: code.code,
            reason: `Excluded due to primary diagnosis ${primaryCode.code}`,
            description: code.description,
          });
        }
      }
    });

    return excluded;
  }

  /**
   * Generate clinical justification
   */
  private generateClinicalJustification(
    clinicalProfile: any,
    primaryCode: ICD10Code,
    secondaryCodes: ICD10Code[]
  ): {
    primaryReason: string;
    supportingEvidence: string[];
    differentialConsiderations: string[];
  } {
    const supportingEvidence: string[] = [];
    const differentialConsiderations: string[] = [];

    // Build supporting evidence
    if (clinicalProfile.painIntensity >= 2) {
      supportingEvidence.push(
        `Moderate to severe pain intensity (${clinicalProfile.painIntensity}/4)`
      );
    }

    if (clinicalProfile.functionalLimitation >= 2) {
      supportingEvidence.push(
        `Significant functional limitations (${clinicalProfile.functionalLimitation.toFixed(1)}/4)`
      );
    }

    if (clinicalProfile.hasJointSounds) {
      supportingEvidence.push('Joint sounds (clicking/popping) present');
    }

    if (clinicalProfile.hasLocking) {
      supportingEvidence.push('Joint locking episodes reported');
    }

    if (clinicalProfile.bilateral) {
      supportingEvidence.push('Bilateral symptom presentation');
    }

    // Build differential considerations
    if (primaryCode.code.startsWith('M26')) {
      differentialConsiderations.push('Consider disc displacement vs. muscle disorder');
      differentialConsiderations.push('Evaluate for degenerative joint disease');
    }

    if (primaryCode.code.startsWith('M25')) {
      differentialConsiderations.push('Rule out systemic arthritis');
      differentialConsiderations.push('Consider myofascial pain syndrome');
    }

    const primaryReason = `Clinical presentation consistent with ${primaryCode.description.toLowerCase()} based on pain intensity, functional impact, and symptom profile`;

    return {
      primaryReason,
      supportingEvidence,
      differentialConsiderations,
    };
  }

  /**
   * Calculate billing information
   */
  private calculateBillingInformation(
    primaryCode: ICD10Code,
    secondaryCodes: ICD10Code[]
  ): {
    primaryBillable: boolean;
    totalBillableCodes: number;
    reimbursementNotes?: string;
  } {
    const billableCodes = [primaryCode, ...secondaryCodes].filter((code) => code.billable);

    const result: {
      primaryBillable: boolean;
      totalBillableCodes: number;
      reimbursementNotes?: string;
    } = {
      primaryBillable: primaryCode.billable,
      totalBillableCodes: billableCodes.length,
    };

    if (billableCodes.length > 1) {
      result.reimbursementNotes =
        'Multiple billable diagnoses - verify payer requirements for combination billing';
    }

    return result;
  }

  /**
   * Calculate mapping confidence
   */
  private calculateMappingConfidence(
    clinicalProfile: any,
    primaryCode: ICD10Code,
    secondaryCodes: ICD10Code[]
  ): number {
    let confidence = 70; // Base confidence

    // Increase confidence based on clear clinical indicators
    if (clinicalProfile.painIntensity >= 3) confidence += 10;
    if (clinicalProfile.functionalLimitation >= 3) confidence += 10;
    if (clinicalProfile.hasJointSounds && primaryCode.code.startsWith('M26')) confidence += 10;
    if (clinicalProfile.bilateral && primaryCode.description.includes('bilateral')) confidence += 5;

    // Decrease confidence for ambiguous presentations
    if (clinicalProfile.painIntensity < 2 && clinicalProfile.functionalLimitation < 2)
      confidence -= 15;
    if (!clinicalProfile.hasJointSounds && primaryCode.code.startsWith('M26.6')) confidence -= 10;

    return Math.max(50, Math.min(95, confidence));
  }

  /**
   * Validate ICD-10 code assignment
   */
  async validateCodeAssignment(mappingResult: ICD10MappingResult): Promise<{
    isValid: boolean;
    validationErrors: string[];
    recommendations: string[];
  }> {
    const validationErrors: string[] = [];
    const recommendations: string[] = [];

    // Check for code conflicts
    const allCodes = [mappingResult.primaryCode, ...mappingResult.secondaryCodes];
    const codeConflicts = this.checkCodeConflicts(allCodes);
    validationErrors.push(...codeConflicts);

    // Check confidence levels
    if (mappingResult.mappingConfidence < 70) {
      recommendations.push('Consider clinical review due to low mapping confidence');
    }

    // Check for missing secondary codes
    if (
      mappingResult.primaryCode.code.startsWith('M26') &&
      !mappingResult.secondaryCodes.some((c) => c.code === 'M79.1')
    ) {
      recommendations.push('Consider adding myalgia code (M79.1) for associated muscle pain');
    }

    return {
      isValid: validationErrors.length === 0,
      validationErrors,
      recommendations,
    };
  }

  /**
   * Check for code conflicts
   */
  private checkCodeConflicts(codes: ICD10Code[]): string[] {
    const conflicts: string[] = [];

    // Check for mutually exclusive codes
    const hasJointCode = codes.some((c) => c.code.startsWith('M25'));
    const hasDiscCode = codes.some((c) => c.code.startsWith('M26.6'));
    const hasMuscleCode = codes.some((c) => c.code === 'M79.1');

    if (hasJointCode && hasDiscCode) {
      conflicts.push(
        'Joint pain and disc disorder codes may be redundant - verify clinical justification'
      );
    }

    // Check for bilateral vs. unilateral conflicts
    const hasBilateral = codes.some((c) => c.description.includes('bilateral'));
    const hasUnilateral = codes.some(
      (c) => c.description.includes('right') || c.description.includes('left')
    );

    if (hasBilateral && hasUnilateral) {
      conflicts.push('Bilateral and unilateral codes present - verify laterality');
    }

    return conflicts;
  }
}
