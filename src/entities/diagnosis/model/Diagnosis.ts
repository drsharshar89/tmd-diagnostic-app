// Diagnosis Entity Model - Domain-Driven Design
// Evidence-based diagnostic system for TMD with ICD-10 integration

import type { RiskLevel } from '@/shared/types';

/**
 * ICD-10 diagnostic code with full clinical context
 * Supports both ICD-10-CM (Clinical Modification) and ICD-10-PCS (Procedure Coding System)
 */
export interface ICD10Code {
  // Core ICD-10 information
  code: string;
  description: string;
  category: string;
  chapter: string;

  // Clinical context
  primary: boolean;
  confidence: number; // 0-100%
  evidenceLevel: 'definitive' | 'probable' | 'possible' | 'rule_out';

  // Severity and specificity
  severity?: 'mild' | 'moderate' | 'severe' | 'unspecified';
  laterality?: 'left' | 'right' | 'bilateral' | 'unspecified';
  encounter?: 'initial' | 'subsequent' | 'sequela';

  // TMD-specific classifications
  tmdSpecific?: {
    jointInvolved: 'temporomandibular' | 'masticatory_muscles' | 'both';
    painType: 'nociceptive' | 'neuropathic' | 'mixed' | 'unknown';
    functionalImpact: 'none' | 'mild' | 'moderate' | 'severe';
    chronicity: 'acute' | 'subacute' | 'chronic';
  };

  // DC/TMD protocol alignment
  dcTmdAlignment?: {
    axis: 'I' | 'II';
    category: 'myofascial_pain' | 'disc_displacement' | 'arthralgia' | 'arthritis' | 'headache';
    subtype?: string;
    criteria_met: string[];
  };

  // Coding metadata
  codingSystem: 'ICD-10-CM' | 'ICD-10-PCS';
  version: string;
  effectiveDate: Date;

  // Clinical coding information
  codedAt: Date;
  codedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Billing and administrative
  billable: boolean;
  drgImpact?: string;
  complicationFlag?: boolean;

  // Quality indicators
  codingAccuracy?: number; // 0-100%
  clinicalRelevance: number; // 0-100%

  // External references
  snomedCT?: string;
  dsmV?: string;
  customCodes?: Record<string, string>;
}

/**
 * Clinical recommendation with evidence-based support
 */
export interface ClinicalRecommendation {
  id: string;

  // Categorization
  category:
    | 'immediate'
    | 'short_term'
    | 'long_term'
    | 'referral'
    | 'monitoring'
    | 'lifestyle'
    | 'medication';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  type: 'therapeutic' | 'diagnostic' | 'preventive' | 'educational' | 'administrative';

  // Recommendation content
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;

  // Implementation details
  actionSteps: Array<{
    step: number;
    action: string;
    responsible: 'patient' | 'provider' | 'specialist' | 'team';
    timeframe: string;
    resources?: string[];
  }>;

  // Timing and frequency
  timeframe: string;
  frequency?: string;
  duration?: string;
  startDate?: Date;
  endDate?: Date;

  // Evidence base
  evidenceLevel: 'A' | 'B' | 'C' | 'D' | 'Expert_Opinion';
  evidenceDescription: string;
  guidelineSource: string;
  references: Array<{
    title: string;
    authors: string;
    journal: string;
    year: number;
    doi?: string;
    pmid?: string;
  }>;

  // Clinical considerations
  contraindications: string[];
  precautions: string[];
  alternatives: string[];
  costConsiderations?: string;

  // Monitoring and follow-up
  followUpRequired: boolean;
  followUpTimeframe?: string;
  monitoringParameters: Array<{
    parameter: string;
    target: string;
    frequency: string;
    method: string;
  }>;

  // Success criteria
  successCriteria: Array<{
    criterion: string;
    measurement: string;
    target: string;
    timeframe: string;
  }>;

  // Provider requirements
  specialtyRequired?: string;
  certificationRequired?: string;
  equipmentRequired?: string[];

  // Patient factors
  patientEducation: {
    instructions: string;
    resources: string[];
    comprehensionLevel: 'basic' | 'intermediate' | 'advanced';
    languages: string[];
  };

  // Risk assessment
  riskBenefit: {
    benefits: string[];
    risks: string[];
    riskMitigation: string[];
    overallAssessment: string;
  };

  // Implementation tracking
  status: 'active' | 'completed' | 'cancelled' | 'superseded' | 'on_hold';
  implementationDate?: Date;
  completionDate?: Date;
  adherence?: number; // 0-100%

  // Quality metrics
  effectiveness?: number; // 0-100%
  patientSatisfaction?: number; // 0-100%
  outcomeAchieved?: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  version: number;
}

/**
 * Differential diagnosis with clinical reasoning
 */
export interface DifferentialDiagnosis {
  diagnosis: ICD10Code;
  likelihood: number; // 0-100%

  // Clinical reasoning
  supportingEvidence: string[];
  contradictingEvidence: string[];
  missingEvidence: string[];

  // Status
  status:
    | 'ruled_out'
    | 'under_consideration'
    | 'requires_further_evaluation'
    | 'confirmed'
    | 'unlikely';
  reasoning: string;

  // Additional testing needed
  additionalTests: Array<{
    test: string;
    rationale: string;
    urgency: 'stat' | 'urgent' | 'routine';
    expectedResult: string;
  }>;

  // Clinical decision support
  decisionTree?: {
    currentNode: string;
    nextSteps: string[];
    branchingCriteria: string[];
  };

  // Metadata
  assessedAt: Date;
  assessedBy: string;
  confidence: number; // 0-100%
  reviewRequired: boolean;
}

/**
 * Treatment plan with comprehensive clinical management
 */
export interface TreatmentPlan {
  id: string;

  // Plan overview
  title: string;
  description: string;
  goals: string[];
  expectedDuration: string;

  // Treatment phases
  phases: Array<{
    phase: number;
    name: string;
    description: string;
    duration: string;
    goals: string[];
    interventions: string[];
    successCriteria: string[];
  }>;

  // Multidisciplinary approach
  careTeam: Array<{
    role: string;
    specialty: string;
    responsibilities: string[];
    contactInfo?: string;
  }>;

  // Interventions
  interventions: Array<{
    type: 'medication' | 'therapy' | 'procedure' | 'lifestyle' | 'device';
    name: string;
    description: string;
    frequency: string;
    duration: string;
    provider: string;
    evidenceLevel: string;
  }>;

  // Monitoring plan
  monitoring: {
    frequency: string;
    parameters: string[];
    methods: string[];
    alerts: Array<{
      condition: string;
      action: string;
      urgency: 'immediate' | 'urgent' | 'routine';
    }>;
  };

  // Patient engagement
  patientRole: {
    responsibilities: string[];
    selfManagement: string[];
    reportingRequirements: string[];
    educationNeeds: string[];
  };

  // Outcomes measurement
  outcomeMetrics: Array<{
    metric: string;
    baseline: string;
    target: string;
    measurement: string;
    frequency: string;
  }>;

  // Plan metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  status: 'draft' | 'active' | 'completed' | 'revised' | 'cancelled';
}

/**
 * Comprehensive diagnostic result with clinical decision support
 */
export interface DiagnosisResult {
  // Core diagnostic information
  primaryDiagnosis: ICD10Code;
  secondaryDiagnoses: ICD10Code[];
  differentialDiagnoses: DifferentialDiagnosis[];

  // Diagnostic confidence and quality
  confidence: number; // 0-100%
  diagnosticCertainty: 'definitive' | 'probable' | 'possible' | 'uncertain';

  // Risk assessment
  riskStratification: RiskLevel;
  riskFactors: Array<{
    factor: string;
    category: 'modifiable' | 'non_modifiable';
    impact: 'low' | 'moderate' | 'high';
    evidence: string;
  }>;

  // Clinical recommendations
  recommendations: ClinicalRecommendation[];
  treatmentPlan?: TreatmentPlan;

  // Prognosis
  prognosis: {
    shortTerm: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    longTerm: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    factors: string[];
    timeline: string;
    functionalOutcome: string;
  };

  // TMD-specific clinical findings
  tmdFindings: {
    // Physical examination findings
    physicalFindings: {
      rangeOfMotion: {
        maximalOpening: number; // mm
        lateralExcursion: { left: number; right: number }; // mm
        protrusion: number; // mm
        deviation: 'none' | 'left' | 'right';
        deflection: 'none' | 'left' | 'right';
      };

      palpation: {
        musclesPalpated: Array<{
          muscle: string;
          tenderness: 'none' | 'mild' | 'moderate' | 'severe';
          referralPain: boolean;
          location: string;
        }>;

        jointPalpation: {
          lateral: { left: string; right: string };
          posterior: { left: string; right: string };
        };
      };

      jointSounds: {
        left: {
          clicking: 'none' | 'opening' | 'closing' | 'both';
          crepitus: 'none' | 'fine' | 'coarse';
          location: string;
        };
        right: {
          clicking: 'none' | 'opening' | 'closing' | 'both';
          crepitus: 'none' | 'fine' | 'coarse';
          location: string;
        };
      };
    };

    // DC/TMD Axis I findings
    axis1Findings: {
      myofascialPain: {
        present: boolean;
        withLimitedOpening: boolean;
        muscles: string[];
      };

      discDisplacement: {
        withReduction: { left: boolean; right: boolean };
        withoutReduction: { left: boolean; right: boolean };
        withIntermittentLocking: { left: boolean; right: boolean };
      };

      arthralgia: { left: boolean; right: boolean };

      arthritis: { left: boolean; right: boolean };

      headacheAttributedToTMD: boolean;
    };

    // DC/TMD Axis II findings (if assessed)
    axis2Findings?: {
      chronicPainGrade: {
        grade: 0 | 1 | 2 | 3 | 4;
        disabilityScore: number;
        intensityScore: number;
      };

      jawFunctionalLimitation: {
        score: number;
        category: 'no_limitation' | 'mild' | 'moderate' | 'severe';
      };

      psychosocialFactors: {
        depression: { score: number; severity: string };
        anxiety: { score: number; severity: string };
        somaticSymptoms: { score: number; severity: string };
      };
    };

    // Clinical presentation summary
    clinicalPresentation: {
      painLocation: string[];
      painCharacter: string[];
      painTriggers: string[];
      functionalLimitations: string[];
      associatedSymptoms: string[];
      impactOnDailyLife: string[];
    };
  };

  // Diagnostic process documentation
  diagnosticProcess: {
    assessmentMethod: string;
    diagnosticCriteria: string;
    algorithmsUsed: string[];

    // Clinical decision support
    decisionSupport: {
      rulesApplied: string[];
      alertsGenerated: string[];
      recommendationsFollowed: string[];
    };

    // Manual review
    manualReview: {
      required: boolean;
      completed: boolean;
      reviewedBy?: string;
      reviewNotes?: string;
      changesFromAutomatic?: string[];
    };

    // Quality assurance
    qualityChecks: {
      consistencyCheck: boolean;
      completenessCheck: boolean;
      accuracyValidation: boolean;
      clinicalReasonableness: boolean;
    };
  };

  // Quality metrics and validation
  qualityMetrics: {
    dataCompleteness: number; // 0-100%
    responseConsistency: number; // 0-100%
    diagnosticAccuracy?: number; // If validated against gold standard
    clinicalRelevance: number; // 0-100%

    // Validation against clinical standards
    guidelineCompliance: number; // 0-100%
    evidenceAlignment: number; // 0-100%

    // Inter-rater reliability (if applicable)
    interRaterReliability?: number; // 0-100%
  };

  // Follow-up and monitoring
  followUp: {
    required: boolean;
    timeframe?: string;
    parameters: string[];
    redFlags: string[];

    // Scheduled follow-ups
    scheduledVisits: Array<{
      type: string;
      timeframe: string;
      purpose: string;
      provider: string;
    }>;
  };

  // Patient communication
  patientCommunication: {
    diagnosisExplanation: string;
    prognosisDiscussion: string;
    treatmentOptions: string;
    riskBenefitDiscussion: string;
    patientQuestions: string[];
    patientConcerns: string[];
  };

  // Legal and regulatory
  regulatoryCompliance: {
    hipaaCompliant: boolean;
    informedConsent: boolean;
    patientRights: boolean;
    qualityReporting: boolean;
  };

  // Timestamps and versioning
  diagnosisDate: Date;
  lastUpdated: Date;
  version: number;
  validUntil?: Date;

  // Provider information
  diagnosingProvider: {
    id: string;
    name: string;
    credentials: string;
    specialty: string;
    licenseNumber?: string;
  };

  // Facility information
  facility?: {
    id: string;
    name: string;
    type: string;
    accreditation: string[];
  };
}

/**
 * Diagnosis factory for creating diagnostic results
 */
export class DiagnosisFactory {
  static createNewDiagnosis(
    primaryDiagnosis: ICD10Code,
    providerId: string,
    providerName: string
  ): DiagnosisResult {
    const now = new Date();

    return {
      primaryDiagnosis,
      secondaryDiagnoses: [],
      differentialDiagnoses: [],
      confidence: primaryDiagnosis.confidence,
      diagnosticCertainty: this.mapConfidenceToCertainty(primaryDiagnosis.confidence),
      riskStratification: 'low',
      riskFactors: [],
      recommendations: [],
      prognosis: {
        shortTerm: 'unknown',
        longTerm: 'unknown',
        factors: [],
        timeline: 'To be determined',
        functionalOutcome: 'Assessment pending',
      },
      tmdFindings: this.createEmptyTMDFindings(),
      diagnosticProcess: {
        assessmentMethod: 'DC_TMD_Protocol',
        diagnosticCriteria: 'DC/TMD v2.0',
        algorithmsUsed: ['automated_scoring'],
        decisionSupport: {
          rulesApplied: [],
          alertsGenerated: [],
          recommendationsFollowed: [],
        },
        manualReview: {
          required: primaryDiagnosis.confidence < 80,
          completed: false,
        },
        qualityChecks: {
          consistencyCheck: false,
          completenessCheck: false,
          accuracyValidation: false,
          clinicalReasonableness: false,
        },
      },
      qualityMetrics: {
        dataCompleteness: 0,
        responseConsistency: 100,
        clinicalRelevance: 0,
        guidelineCompliance: 0,
        evidenceAlignment: 0,
      },
      followUp: {
        required: true,
        parameters: ['pain_level', 'functional_status', 'treatment_response'],
        redFlags: ['severe_pain_increase', 'new_neurological_symptoms', 'treatment_failure'],
      },
      patientCommunication: {
        diagnosisExplanation: 'Diagnosis pending completion of assessment',
        prognosisDiscussion: 'Prognosis will be discussed upon diagnosis confirmation',
        treatmentOptions: 'Treatment options will be presented based on final diagnosis',
        riskBenefitDiscussion: 'Risk-benefit analysis pending',
        patientQuestions: [],
        patientConcerns: [],
      },
      regulatoryCompliance: {
        hipaaCompliant: true,
        informedConsent: false,
        patientRights: true,
        qualityReporting: true,
      },
      diagnosisDate: now,
      lastUpdated: now,
      version: 1,
      diagnosingProvider: {
        id: providerId,
        name: providerName,
        credentials: 'To be updated',
        specialty: 'TMD Specialist',
      },
    };
  }

  private static mapConfidenceToCertainty(
    confidence: number
  ): 'definitive' | 'probable' | 'possible' | 'uncertain' {
    if (confidence >= 90) return 'definitive';
    if (confidence >= 70) return 'probable';
    if (confidence >= 50) return 'possible';
    return 'uncertain';
  }

  private static createEmptyTMDFindings() {
    return {
      physicalFindings: {
        rangeOfMotion: {
          maximalOpening: 0,
          lateralExcursion: { left: 0, right: 0 },
          protrusion: 0,
          deviation: 'none' as const,
          deflection: 'none' as const,
        },
        palpation: {
          musclesPalpated: [],
          jointPalpation: {
            lateral: { left: 'not_assessed', right: 'not_assessed' },
            posterior: { left: 'not_assessed', right: 'not_assessed' },
          },
        },
        jointSounds: {
          left: {
            clicking: 'none' as const,
            crepitus: 'none' as const,
            location: 'not_assessed',
          },
          right: {
            clicking: 'none' as const,
            crepitus: 'none' as const,
            location: 'not_assessed',
          },
        },
      },
      axis1Findings: {
        myofascialPain: {
          present: false,
          withLimitedOpening: false,
          muscles: [],
        },
        discDisplacement: {
          withReduction: { left: false, right: false },
          withoutReduction: { left: false, right: false },
          withIntermittentLocking: { left: false, right: false },
        },
        arthralgia: { left: false, right: false },
        arthritis: { left: false, right: false },
        headacheAttributedToTMD: false,
      },
      clinicalPresentation: {
        painLocation: [],
        painCharacter: [],
        painTriggers: [],
        functionalLimitations: [],
        associatedSymptoms: [],
        impactOnDailyLife: [],
      },
    };
  }
}

/**
 * Diagnosis domain service for clinical decision support
 */
export class DiagnosisDomainService {
  /**
   * Validate diagnosis against clinical guidelines
   */
  static validateDiagnosis(diagnosis: DiagnosisResult): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Primary diagnosis validation
    if (!diagnosis.primaryDiagnosis) {
      errors.push('Primary diagnosis is required');
    } else {
      if (diagnosis.primaryDiagnosis.confidence < 50) {
        warnings.push('Primary diagnosis confidence is low (<50%)');
      }

      if (
        !diagnosis.primaryDiagnosis.evidenceLevel ||
        diagnosis.primaryDiagnosis.evidenceLevel === 'possible'
      ) {
        warnings.push('Primary diagnosis evidence level is low');
      }
    }

    // ICD-10 code validation
    if (!this.validateICD10Code(diagnosis.primaryDiagnosis.code)) {
      errors.push('Invalid ICD-10 code format');
    }

    // Clinical consistency checks
    if (diagnosis.confidence < 70 && diagnosis.diagnosticCertainty === 'definitive') {
      warnings.push('Diagnostic certainty inconsistent with confidence level');
    }

    // Treatment recommendations
    if (diagnosis.recommendations.length === 0) {
      recommendations.push('Consider adding clinical recommendations');
    }

    // Follow-up requirements
    if (diagnosis.followUp.required && !diagnosis.followUp.timeframe) {
      warnings.push('Follow-up timeframe not specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Calculate diagnostic quality score
   */
  static calculateQualityScore(diagnosis: DiagnosisResult): number {
    let score = 0;
    let maxScore = 0;

    // Confidence score (0-25 points)
    score += (diagnosis.confidence / 100) * 25;
    maxScore += 25;

    // Evidence quality (0-20 points)
    const evidenceScore = this.getEvidenceScore(diagnosis.primaryDiagnosis.evidenceLevel);
    score += evidenceScore;
    maxScore += 20;

    // Completeness (0-20 points)
    score += (diagnosis.qualityMetrics.dataCompleteness / 100) * 20;
    maxScore += 20;

    // Clinical relevance (0-15 points)
    score += (diagnosis.qualityMetrics.clinicalRelevance / 100) * 15;
    maxScore += 15;

    // Guideline compliance (0-10 points)
    score += (diagnosis.qualityMetrics.guidelineCompliance / 100) * 10;
    maxScore += 10;

    // Documentation quality (0-10 points)
    const docScore = this.assessDocumentationQuality(diagnosis);
    score += docScore;
    maxScore += 10;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate clinical summary
   */
  static generateClinicalSummary(diagnosis: DiagnosisResult): string {
    const qualityScore = this.calculateQualityScore(diagnosis);

    return `
Clinical Diagnosis Summary
=========================

Primary Diagnosis: ${diagnosis.primaryDiagnosis.description} (${diagnosis.primaryDiagnosis.code})
Diagnostic Confidence: ${diagnosis.confidence}% (${diagnosis.diagnosticCertainty})
Risk Level: ${diagnosis.riskStratification.toUpperCase()}

TMD Clinical Findings:
- Myofascial Pain: ${diagnosis.tmdFindings.axis1Findings.myofascialPain.present ? 'Present' : 'Absent'}
- Disc Displacement: ${this.summarizeDiscDisplacement(diagnosis.tmdFindings.axis1Findings.discDisplacement)}
- Joint Arthralgia: ${this.summarizeArthralgia(diagnosis.tmdFindings.axis1Findings.arthralgia)}
- TMD-related Headache: ${diagnosis.tmdFindings.axis1Findings.headacheAttributedToTMD ? 'Present' : 'Absent'}

Clinical Recommendations: ${diagnosis.recommendations.length} recommendations provided
Quality Score: ${qualityScore}/100

Prognosis:
- Short-term: ${diagnosis.prognosis.shortTerm}
- Long-term: ${diagnosis.prognosis.longTerm}

Next Steps: ${diagnosis.followUp.required ? `Follow-up in ${diagnosis.followUp.timeframe || 'TBD'}` : 'No follow-up required'}
    `.trim();
  }

  private static validateICD10Code(code: string): boolean {
    // Basic ICD-10 format validation
    const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,3})?$/;
    return icd10Pattern.test(code);
  }

  private static getEvidenceScore(evidenceLevel: string): number {
    switch (evidenceLevel) {
      case 'definitive':
        return 20;
      case 'probable':
        return 15;
      case 'possible':
        return 10;
      case 'rule_out':
        return 5;
      default:
        return 0;
    }
  }

  private static assessDocumentationQuality(diagnosis: DiagnosisResult): number {
    let score = 0;

    if (diagnosis.patientCommunication.diagnosisExplanation.length > 50) score += 2;
    if (diagnosis.recommendations.length > 0) score += 3;
    if (diagnosis.followUp.parameters.length > 0) score += 2;
    if (diagnosis.diagnosticProcess.manualReview.completed) score += 3;

    return Math.min(10, score);
  }

  private static summarizeDiscDisplacement(displacement: any): string {
    const findings = [];
    if (displacement.withReduction.left || displacement.withReduction.right) {
      findings.push('with reduction');
    }
    if (displacement.withoutReduction.left || displacement.withoutReduction.right) {
      findings.push('without reduction');
    }
    return findings.length > 0 ? findings.join(', ') : 'None';
  }

  private static summarizeArthralgia(arthralgia: any): string {
    const sides = [];
    if (arthralgia.left) sides.push('left');
    if (arthralgia.right) sides.push('right');
    return sides.length > 0 ? sides.join(' and ') : 'None';
  }
}

// Export all types for use in other modules
export type {
  ICD10Code,
  ClinicalRecommendation,
  DifferentialDiagnosis,
  TreatmentPlan,
  DiagnosisResult,
};
