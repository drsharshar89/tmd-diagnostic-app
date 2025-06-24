// Assessment Entity Model - Domain-Driven Design
// DC/TMD Protocol Implementation for TMD Diagnostic System

import type { RiskLevel } from '@/shared/types';

/**
 * DC/TMD Protocol Types
 * Based on Diagnostic Criteria for Temporomandibular Disorders (DC/TMD)
 */
export type DCTMDProtocol = 'DC_TMD_AXIS_I' | 'DC_TMD_AXIS_II';

/**
 * Assessment response types for different question formats
 */
export type AssessmentResponseValue =
  | boolean
  | number
  | string
  | string[]
  | { value: number; location?: string; intensity?: number };

/**
 * Individual assessment response with metadata
 */
export interface AssessmentResponse {
  questionId: string;
  questionText: string;
  value: AssessmentResponseValue;
  timestamp: Date;

  // Response metadata
  responseTime?: number; // milliseconds to answer
  modified?: boolean;
  previousValue?: AssessmentResponseValue;

  // Clinical annotations
  clinicalNotes?: string;
  flagged?: boolean;
  flagReason?: string;

  // Validation
  validated: boolean;
  validationErrors?: string[];
}

/**
 * Risk scoring components following DC/TMD methodology
 */
export interface RiskScore {
  // Overall risk assessment
  overallRisk: RiskLevel;
  overallScore: number;
  maxPossibleScore: number;
  confidenceLevel: number; // 0-100%

  // Component scores
  painScore: {
    value: number;
    maxValue: number;
    interpretation: string;
  };

  functionalScore: {
    value: number;
    maxValue: number;
    interpretation: string;
  };

  psychosocialScore?: {
    value: number;
    maxValue: number;
    interpretation: string;
  };

  // DC/TMD specific scores
  dcTmdScores: {
    axis1Score: number; // Physical findings
    axis2Score?: number; // Psychosocial factors
    painIntensity: number; // 0-4 scale per DC/TMD
    painInterference: number; // 0-4 scale
    jawFunctionalLimitation: number; // 0-4 scale
  };

  // Risk factors identified
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'moderate' | 'high';
    score: number;
    description: string;
  }>;

  // Protective factors
  protectiveFactors: Array<{
    factor: string;
    impact: 'low' | 'moderate' | 'high';
    description: string;
  }>;

  // Scoring metadata
  scoringAlgorithm: string;
  algorithmVersion: string;
  calculatedAt: Date;
  calculatedBy: string;
}

/**
 * ICD-10 diagnostic code with clinical context
 */
export interface ICD10Code {
  code: string;
  description: string;
  category: string;

  // Clinical context
  primary: boolean;
  confidence: number; // 0-100%
  evidenceLevel: 'definitive' | 'probable' | 'possible' | 'rule_out';

  // DC/TMD specific classifications
  dcTmdClassification?: {
    axis: 'I' | 'II';
    subtype?: string;
    laterality?: 'left' | 'right' | 'bilateral';
    severity?: 'mild' | 'moderate' | 'severe';
  };

  // Coding metadata
  codingSystem: 'ICD-10-CM' | 'ICD-10-PCS';
  version: string;
  codedAt: Date;
  codedBy: string;
}

/**
 * Clinical recommendations with evidence base
 */
export interface ClinicalRecommendation {
  id: string;
  category: 'immediate' | 'short_term' | 'long_term' | 'referral' | 'monitoring';
  priority: 'urgent' | 'high' | 'medium' | 'low';

  // Recommendation details
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;

  // Implementation
  actionSteps: string[];
  timeframe: string;
  frequency?: string;
  duration?: string;

  // Clinical context
  evidenceLevel: 'A' | 'B' | 'C' | 'D'; // Evidence-based medicine levels
  guidelineSource: string;
  contraindications?: string[];
  precautions?: string[];

  // Monitoring
  followUpRequired: boolean;
  followUpTimeframe?: string;
  monitoringParameters?: string[];

  // Provider information
  recommendingProvider?: string;
  specialtyRequired?: string;

  // Patient education
  patientInstructions: string;
  educationalResources?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'cancelled' | 'superseded';
}

/**
 * Diagnostic result with comprehensive clinical assessment
 */
export interface DiagnosisResult {
  // Primary diagnosis
  primaryDiagnosis: ICD10Code;

  // Secondary/comorbid diagnoses
  secondaryDiagnoses: ICD10Code[];

  // Differential diagnoses (ruled out or under consideration)
  differentialDiagnoses: Array<{
    diagnosis: ICD10Code;
    likelihood: number; // 0-100%
    status: 'ruled_out' | 'under_consideration' | 'requires_further_evaluation';
    reasoning: string;
  }>;

  // Overall diagnostic confidence
  confidence: number; // 0-100%

  // Risk stratification
  riskStratification: RiskLevel;

  // Clinical recommendations
  recommendations: ClinicalRecommendation[];

  // DC/TMD specific findings
  dcTmdFindings: {
    // Axis I: Physical findings
    axis1Findings: {
      myofascialPain: boolean;
      discDisplacement: boolean;
      arthralgia: boolean;
      arthritis: boolean;
      headacheAttributedToTMD: boolean;
    };

    // Axis II: Psychosocial factors (if assessed)
    axis2Findings?: {
      chronicPainGrade: number;
      jawFunctionalLimitation: number;
      depressionScore?: number;
      anxietyScore?: number;
      somaticSymptoms?: number;
    };

    // Clinical presentation
    clinicalPresentation: {
      painLocation: string[];
      painCharacter: string[];
      functionalLimitations: string[];
      associatedSymptoms: string[];
    };
  };

  // Diagnostic process metadata
  diagnosticProcess: {
    assessmentMethod: string;
    diagnosticCriteria: string;
    algorithmUsed: string;
    manualReview: boolean;
    reviewedBy?: string;
    reviewNotes?: string;
  };

  // Quality assurance
  qualityMetrics: {
    dataCompleteness: number; // 0-100%
    responseConsistency: number; // 0-100%
    diagnosticAccuracy?: number; // If validated
    clinicalRelevance: number; // 0-100%
  };

  // Timestamps
  diagnosisDate: Date;
  lastUpdated: Date;
  validUntil?: Date;
}

/**
 * Assessment session metadata
 */
export interface AssessmentSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds

  // Session context
  assessmentMode: 'self_administered' | 'clinician_assisted' | 'clinician_administered';
  location: 'clinic' | 'home' | 'telemedicine' | 'other';
  deviceInfo: {
    type: 'desktop' | 'tablet' | 'mobile' | 'other';
    browser?: string;
    operatingSystem?: string;
    screenSize?: string;
  };

  // Session quality
  completionRate: number; // 0-100%
  interruptionCount: number;
  technicalIssues?: string[];

  // Assistance provided
  assistanceProvided: boolean;
  assistanceType?: 'language' | 'technical' | 'medical' | 'accessibility';
  assistantId?: string;

  // Data integrity
  dataIntegrityChecks: {
    responseTimeValidation: boolean;
    consistencyChecks: boolean;
    completenessValidation: boolean;
    anomalyDetection: boolean;
  };
}

/**
 * Main TMD Assessment entity
 * Implements DC/TMD protocol with comprehensive clinical data
 */
export interface TMDAssessment {
  // Core identification
  id: string;
  patientId: string;

  // Assessment protocol
  protocol: DCTMDProtocol;
  protocolVersion: string;

  // Assessment data
  responses: AssessmentResponse[];
  riskScore: RiskScore;
  diagnosis: DiagnosisResult;

  // Session information
  session: AssessmentSession;

  // Clinical context
  clinicalContext: {
    assessmentReason: 'screening' | 'diagnostic' | 'follow_up' | 'research' | 'second_opinion';
    referralSource?: string;
    urgency: 'routine' | 'urgent' | 'emergent';
    priorAssessments: string[]; // IDs of previous assessments
  };

  // Provider information
  clinicianId?: string;
  clinicianName?: string;
  supervisingPhysician?: string;
  facilityId?: string;

  // Status and workflow
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'finalized' | 'cancelled';
  workflowStage: 'assessment' | 'scoring' | 'diagnosis' | 'review' | 'complete';

  // Timestamps
  timestamp: Date;
  scheduledDate?: Date;
  completedAt?: Date;
  reviewedAt?: Date;
  finalizedAt?: Date;

  // Quality assurance
  qualityAssurance: {
    validated: boolean;
    validatedBy?: string;
    validatedAt?: Date;
    validationNotes?: string;

    // Peer review
    peerReviewed: boolean;
    reviewedBy?: string;
    reviewNotes?: string;

    // Audit trail
    auditTrail: Array<{
      action: string;
      userId: string;
      timestamp: Date;
      details?: string;
    }>;
  };

  // Privacy and compliance
  privacySettings: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionPeriod: number; // days
    encryptionLevel: 'standard' | 'enhanced' | 'maximum';
    accessRestrictions?: string[];
  };

  // Research and analytics
  researchConsent?: {
    participationConsent: boolean;
    dataUseConsent: boolean;
    contactConsent: boolean;
    consentDate: Date;
    withdrawalDate?: Date;
  };

  // Integration data
  externalReferences?: {
    ehrRecordId?: string;
    labOrderId?: string;
    imagingStudyId?: string;
    referralId?: string;
  };
}

/**
 * Assessment factory for creating new assessment instances
 */
export class AssessmentFactory {
  static createNewAssessment(
    patientId: string,
    protocol: DCTMDProtocol,
    clinicianId?: string
  ): TMDAssessment {
    const now = new Date();
    const sessionId = this.generateSessionId();

    return {
      id: this.generateAssessmentId(),
      patientId,
      protocol,
      protocolVersion: '2.0',
      responses: [],
      riskScore: this.createEmptyRiskScore(),
      diagnosis: this.createEmptyDiagnosis(),
      session: {
        sessionId,
        startTime: now,
        assessmentMode: clinicianId ? 'clinician_administered' : 'self_administered',
        location: 'clinic',
        deviceInfo: {
          type: 'desktop',
        },
        completionRate: 0,
        interruptionCount: 0,
        assistanceProvided: false,
        dataIntegrityChecks: {
          responseTimeValidation: false,
          consistencyChecks: false,
          completenessValidation: false,
          anomalyDetection: false,
        },
      },
      clinicalContext: {
        assessmentReason: 'diagnostic',
        urgency: 'routine',
        priorAssessments: [],
      },
      clinicianId,
      status: 'draft',
      workflowStage: 'assessment',
      timestamp: now,
      qualityAssurance: {
        validated: false,
        peerReviewed: false,
        auditTrail: [
          {
            action: 'assessment_created',
            userId: clinicianId || 'system',
            timestamp: now,
            details: `Assessment created with protocol ${protocol}`,
          },
        ],
      },
      privacySettings: {
        dataClassification: 'confidential',
        retentionPeriod: 2555, // 7 years
        encryptionLevel: 'enhanced',
      },
    };
  }

  private static generateAssessmentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ASSESS_${timestamp}_${random}`.toUpperCase();
  }

  private static generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `SES_${timestamp}_${random}`.toUpperCase();
  }

  private static createEmptyRiskScore(): RiskScore {
    const now = new Date();

    return {
      overallRisk: 'low',
      overallScore: 0,
      maxPossibleScore: 100,
      confidenceLevel: 0,
      painScore: {
        value: 0,
        maxValue: 20,
        interpretation: 'No pain reported',
      },
      functionalScore: {
        value: 0,
        maxValue: 20,
        interpretation: 'No functional limitations',
      },
      dcTmdScores: {
        axis1Score: 0,
        painIntensity: 0,
        painInterference: 0,
        jawFunctionalLimitation: 0,
      },
      riskFactors: [],
      protectiveFactors: [],
      scoringAlgorithm: 'DC_TMD_v2.0',
      algorithmVersion: '2.0.1',
      calculatedAt: now,
      calculatedBy: 'system',
    };
  }

  private static createEmptyDiagnosis(): DiagnosisResult {
    const now = new Date();

    return {
      primaryDiagnosis: {
        code: 'Z00.00',
        description: 'Assessment pending',
        category: 'Preliminary',
        primary: true,
        confidence: 0,
        evidenceLevel: 'possible',
        codingSystem: 'ICD-10-CM',
        version: '2024',
        codedAt: now,
        codedBy: 'system',
      },
      secondaryDiagnoses: [],
      differentialDiagnoses: [],
      confidence: 0,
      riskStratification: 'low',
      recommendations: [],
      dcTmdFindings: {
        axis1Findings: {
          myofascialPain: false,
          discDisplacement: false,
          arthralgia: false,
          arthritis: false,
          headacheAttributedToTMD: false,
        },
        clinicalPresentation: {
          painLocation: [],
          painCharacter: [],
          functionalLimitations: [],
          associatedSymptoms: [],
        },
      },
      diagnosticProcess: {
        assessmentMethod: 'DC_TMD_Protocol',
        diagnosticCriteria: 'DC/TMD v2.0',
        algorithmUsed: 'automated_scoring',
        manualReview: false,
      },
      qualityMetrics: {
        dataCompleteness: 0,
        responseConsistency: 100,
        clinicalRelevance: 0,
      },
      diagnosisDate: now,
      lastUpdated: now,
    };
  }
}

/**
 * Assessment domain service for business logic
 */
export class AssessmentDomainService {
  /**
   * Validate assessment completeness and consistency
   */
  static validateAssessment(assessment: TMDAssessment): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    completeness: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!assessment.patientId) {
      errors.push('Patient ID is required');
    }

    if (!assessment.protocol) {
      errors.push('Assessment protocol must be specified');
    }

    // Response validation
    const requiredQuestions = this.getRequiredQuestions(assessment.protocol);
    const answeredQuestions = assessment.responses.map((r) => r.questionId);
    const missingQuestions = requiredQuestions.filter((q) => !answeredQuestions.includes(q));

    if (missingQuestions.length > 0) {
      warnings.push(`Missing responses for questions: ${missingQuestions.join(', ')}`);
    }

    // Response consistency checks
    const inconsistencies = this.checkResponseConsistency(assessment.responses);
    if (inconsistencies.length > 0) {
      warnings.push(...inconsistencies);
    }

    // Calculate completeness
    const completeness = (answeredQuestions.length / requiredQuestions.length) * 100;

    // Quality thresholds
    if (completeness < 80) {
      warnings.push('Assessment is less than 80% complete');
    }

    if (assessment.session.interruptionCount > 3) {
      warnings.push('High number of session interruptions may affect data quality');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness,
    };
  }

  /**
   * Calculate assessment duration and performance metrics
   */
  static calculatePerformanceMetrics(assessment: TMDAssessment): {
    totalDuration: number;
    averageResponseTime: number;
    timePerQuestion: Record<string, number>;
    efficiencyScore: number;
  } {
    const session = assessment.session;
    const responses = assessment.responses;

    const totalDuration = session.endTime
      ? session.endTime.getTime() - session.startTime.getTime()
      : Date.now() - session.startTime.getTime();

    const responseTimes = responses
      .filter((r) => r.responseTime !== undefined)
      .map((r) => r.responseTime!);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

    const timePerQuestion: Record<string, number> = {};
    responses.forEach((response) => {
      if (response.responseTime !== undefined) {
        timePerQuestion[response.questionId] = response.responseTime;
      }
    });

    // Calculate efficiency score (0-100)
    const expectedDuration = responses.length * 30000; // 30 seconds per question
    const efficiencyScore = Math.max(
      0,
      Math.min(100, (expectedDuration / Math.max(totalDuration, 1)) * 100)
    );

    return {
      totalDuration,
      averageResponseTime,
      timePerQuestion,
      efficiencyScore,
    };
  }

  /**
   * Generate assessment summary for clinical review
   */
  static generateAssessmentSummary(assessment: TMDAssessment): string {
    const validation = this.validateAssessment(assessment);
    const metrics = this.calculatePerformanceMetrics(assessment);

    return `
TMD Assessment Summary
=====================
Assessment ID: ${assessment.id}
Patient ID: ${assessment.patientId}
Protocol: ${assessment.protocol}
Status: ${assessment.status}

Completion Metrics:
- Completeness: ${validation.completeness.toFixed(1)}%
- Duration: ${Math.round(metrics.totalDuration / 60000)} minutes
- Efficiency Score: ${metrics.efficiencyScore.toFixed(1)}%

Risk Assessment:
- Overall Risk: ${assessment.riskScore.overallRisk.toUpperCase()}
- Risk Score: ${assessment.riskScore.overallScore}/${assessment.riskScore.maxPossibleScore}
- Confidence: ${assessment.riskScore.confidenceLevel}%

Primary Diagnosis: ${assessment.diagnosis.primaryDiagnosis.description}
Diagnostic Confidence: ${assessment.diagnosis.confidence}%

Quality Indicators:
${validation.errors.length > 0 ? `- Errors: ${validation.errors.join('; ')}` : '- No errors detected'}
${validation.warnings.length > 0 ? `- Warnings: ${validation.warnings.join('; ')}` : '- No warnings'}

Recommendations: ${assessment.diagnosis.recommendations.length} clinical recommendations provided
    `.trim();
  }

  private static getRequiredQuestions(protocol: DCTMDProtocol): string[] {
    // This would be defined based on the specific protocol requirements
    // For now, returning a sample set
    if (protocol === 'DC_TMD_AXIS_I') {
      return ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];
    } else {
      return ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];
    }
  }

  private static checkResponseConsistency(responses: AssessmentResponse[]): string[] {
    const inconsistencies: string[] = [];

    // Example consistency checks
    // This would be expanded based on specific clinical logic

    return inconsistencies;
  }
}

// Export types for use in other modules
export type {
  AssessmentResponse,
  AssessmentResponseValue,
  RiskScore,
  ICD10Code,
  ClinicalRecommendation,
  DiagnosisResult,
  AssessmentSession,
};
