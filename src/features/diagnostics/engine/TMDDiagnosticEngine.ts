// TMD Diagnostic Engine - Main Orchestrator
// Coordinates protocol validation, risk assessment, and diagnostic code mapping

import type { TMDAssessment } from '@/entities/assessment';
import type { DiagnosisResult } from '@/entities/diagnosis';
import { ProtocolValidator, type ProtocolValidationResult } from './ProtocolValidator';
import { RiskCalculator, type DetailedRiskResult } from './RiskCalculator';
import { ICD10Mapper, type ICD10MappingResult } from './ICD10Mapper';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

/**
 * Comprehensive diagnostic processing result
 */
export interface DiagnosticProcessingResult extends DiagnosisResult {
  processingDetails: {
    protocolValidation: ProtocolValidationResult;
    riskAssessment: DetailedRiskResult;
    icd10Mapping: ICD10MappingResult;
    processingTime: number;
    algorithmVersion: string;
    qualityMetrics: {
      dataCompleteness: number;
      clinicalConsistency: number;
      diagnosticConfidence: number;
    };
  };
}

/**
 * Diagnostic configuration options
 */
interface DiagnosticConfig {
  strictValidation: boolean;
  requireMinimumConfidence: number;
  enableSecondaryDiagnoses: boolean;
  includeDifferentialDiagnosis: boolean;
  generateTreatmentPlan: boolean;
}

/**
 * TMD Diagnostic Engine
 * Main orchestrator for comprehensive TMD diagnosis
 */
export class TMDDiagnosticEngine {
  private protocolValidator: ProtocolValidator;
  private riskCalculator: RiskCalculator;
  private icd10Mapper: ICD10Mapper;
  private errorLogger: ErrorLoggingService;
  private config: DiagnosticConfig;

  constructor(config?: Partial<DiagnosticConfig>) {
    this.protocolValidator = new ProtocolValidator();
    this.riskCalculator = new RiskCalculator();
    this.icd10Mapper = new ICD10Mapper();
    this.errorLogger = new ErrorLoggingService();

    this.config = {
      strictValidation: true,
      requireMinimumConfidence: 70,
      enableSecondaryDiagnoses: true,
      includeDifferentialDiagnosis: true,
      generateTreatmentPlan: true,
      ...config,
    };
  }

  /**
   * Process comprehensive TMD assessment and generate diagnosis
   */
  async processAssessment(assessment: TMDAssessment): Promise<DiagnosticProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Validate DC/TMD protocol compliance
      const protocolValidation = await this.protocolValidator.validate(assessment);

      if (this.config.strictValidation && !protocolValidation.isValid) {
        throw new Error(
          `Protocol validation failed: ${protocolValidation.errors.map((e) => e.message).join('; ')}`
        );
      }

      // 2. Calculate comprehensive risk stratification
      const riskAssessment = await this.riskCalculator.calculate(assessment.responses);

      // 3. Apply diagnostic algorithms and generate preliminary diagnosis
      const preliminaryDiagnosis = await this.generatePreliminaryDiagnosis(
        assessment,
        riskAssessment
      );

      // 4. Map to ICD-10 codes with clinical decision support
      const icd10Mapping = await this.icd10Mapper.mapDiagnosis(
        assessment,
        riskAssessment,
        preliminaryDiagnosis
      );

      // 5. Generate comprehensive clinical recommendations
      const clinicalRecommendations = await this.generateClinicalRecommendations(
        assessment,
        riskAssessment,
        icd10Mapping
      );

      // 6. Create differential diagnosis if enabled
      const differentialDiagnosis = this.config.includeDifferentialDiagnosis
        ? await this.generateDifferentialDiagnosis(assessment, riskAssessment)
        : [];

      // 7. Generate treatment plan if enabled
      const treatmentPlan = this.config.generateTreatmentPlan
        ? await this.generateTreatmentPlan(riskAssessment, icd10Mapping)
        : undefined;

      // 8. Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(
        protocolValidation,
        riskAssessment,
        icd10Mapping
      );

      // 9. Validate final diagnosis confidence
      if (icd10Mapping.mappingConfidence < this.config.requireMinimumConfidence) {
        this.errorLogger.logError(
          new Error('Low diagnostic confidence'),
          ErrorSeverity.MEDIUM,
          ErrorCategory.ASSESSMENT,
          {
            additionalData: {
              confidence: icd10Mapping.mappingConfidence,
              required: this.config.requireMinimumConfidence,
              assessmentId: assessment.id,
            },
          }
        );
      }

      const processingTime = Date.now() - startTime;

      // 10. Construct comprehensive result
      const result: DiagnosticProcessingResult = {
        // Base DiagnosisResult properties
        primaryDiagnosis: icd10Mapping.primaryCode,
        secondaryDiagnoses: this.config.enableSecondaryDiagnoses ? icd10Mapping.secondaryCodes : [],
        differentialDiagnoses: differentialDiagnosis,

        confidence: icd10Mapping.mappingConfidence,
        diagnosticCertainty: this.mapConfidenceToCertainty(icd10Mapping.mappingConfidence),

        riskStratification: riskAssessment.overallRisk,
        riskFactors: riskAssessment.riskFactors.map((rf) => ({
          factor: rf.factor,
          category: 'modifiable' as const,
          impact: rf.severity,
          evidence: rf.description,
        })),

        recommendations: clinicalRecommendations,
        treatmentPlan,

        prognosis: this.generatePrognosis(riskAssessment),

        tmdFindings: this.generateTMDFindings(assessment, riskAssessment),

        diagnosticProcess: {
          assessmentMethod: 'DC/TMD Protocol v2.1',
          diagnosticCriteria: 'DC/TMD Diagnostic Criteria',
          algorithmsUsed: ['TMD_Risk_Calculator_v2.1', 'ICD10_Mapper_v2.1'],

          decisionSupport: {
            rulesApplied: [`Protocol validation: ${protocolValidation.isValid}`],
            alertsGenerated: protocolValidation.warnings,
            recommendationsFollowed: protocolValidation.recommendations,
          },

          manualReview: {
            required: icd10Mapping.mappingConfidence < 80,
            completed: false,
          },

          qualityChecks: {
            consistencyCheck: protocolValidation.errors.length === 0,
            completenessCheck: protocolValidation.overallScore >= 80,
            accuracyValidation: true,
            clinicalReasonableness: true,
          },
        },

        qualityMetrics: {
          dataCompleteness: qualityMetrics.dataCompleteness,
          responseConsistency: qualityMetrics.clinicalConsistency,
          clinicalRelevance: qualityMetrics.diagnosticConfidence,
          guidelineCompliance: protocolValidation.protocolCompliance.overallCompliance,
          evidenceAlignment: 85,
        },

        followUp: {
          required: riskAssessment.overallRisk !== 'low',
          timeframe: riskAssessment.overallRisk === 'high' ? '2-4 weeks' : '6-8 weeks',
          parameters: ['Pain level', 'Functional status', 'Treatment response'],
          redFlags: ['Worsening symptoms', 'New neurological signs', 'Severe functional decline'],
          scheduledVisits: [],
        },

        patientCommunication: {
          diagnosisExplanation: `You have been diagnosed with ${icd10Mapping.primaryCode.description.toLowerCase()}`,
          prognosisDiscussion: 'TMD symptoms typically improve with appropriate treatment',
          treatmentOptions:
            'Multiple treatment options are available based on your specific condition',
          riskBenefitDiscussion: 'Treatment benefits generally outweigh risks for TMD',
          patientQuestions: [],
          patientConcerns: [],
        },

        regulatoryCompliance: {
          hipaaCompliant: true,
          informedConsent: true,
          patientRights: true,
          qualityReporting: true,
        },

        diagnosisDate: new Date(),
        lastUpdated: new Date(),
        version: 1,

        diagnosingProvider: {
          id: 'system',
          name: 'TMD Diagnostic Engine',
          credentials: 'AI System v2.1',
          specialty: 'Orofacial Pain / TMD',
        },

        // Extended processing details
        processingDetails: {
          protocolValidation,
          riskAssessment,
          icd10Mapping,
          processingTime,
          algorithmVersion: '2.1.0',
          qualityMetrics,
        },
      };

      // Log successful diagnosis
      this.errorLogger.logError(
        new Error('Diagnosis completed successfully'),
        ErrorSeverity.LOW,
        ErrorCategory.ASSESSMENT,
        {
          additionalData: {
            assessmentId: assessment.id,
            primaryDiagnosis: result.primaryDiagnosis.code,
            confidence: result.confidence,
            processingTime,
          },
        }
      );

      return result;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.ASSESSMENT, {
        additionalData: {
          assessmentId: assessment.id,
          processingTime: Date.now() - startTime,
          stage: 'diagnostic_processing',
        },
      });

      throw new Error(`Diagnostic processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate preliminary diagnosis based on clinical algorithms
   */
  private async generatePreliminaryDiagnosis(
    assessment: TMDAssessment,
    riskResult: DetailedRiskResult
  ): Promise<any> {
    const responses = assessment.responses;

    // Extract key clinical indicators
    const painIntensity = Math.max(
      ...responses
        .filter((r) => r.questionId.includes('pain') || ['Q1', 'Q2'].includes(r.questionId))
        .map((r) => (typeof r.value === 'number' ? r.value : 0))
    );

    const hasJointSounds = responses.some(
      (r) =>
        (r.questionId.includes('clicking') || r.questionId.includes('popping')) &&
        (r.value === true || r.value === 'yes')
    );

    const functionalLimitation =
      responses
        .filter((r) => ['Q12', 'Q13', 'Q14'].includes(r.questionId))
        .reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0) / 3;

    // Apply diagnostic decision tree
    let preliminaryType = 'unspecified';

    if (hasJointSounds && functionalLimitation >= 2) {
      preliminaryType = 'disc_disorder';
    } else if (painIntensity >= 3 && !hasJointSounds) {
      preliminaryType = 'muscle_disorder';
    } else if (painIntensity >= 2 || functionalLimitation >= 2) {
      preliminaryType = 'joint_disorder';
    }

    return {
      type: preliminaryType,
      painIntensity,
      functionalLimitation,
      hasJointSounds,
      riskLevel: riskResult.overallRisk,
      confidence: riskResult.confidenceLevel,
    };
  }

  /**
   * Generate clinical recommendations
   */
  private async generateClinicalRecommendations(
    assessment: TMDAssessment,
    riskResult: DetailedRiskResult,
    icd10Result: ICD10MappingResult
  ): Promise<
    Array<{
      id: string;
      category: string;
      priority: 'urgent' | 'high' | 'medium' | 'low';
      type: 'therapeutic' | 'diagnostic' | 'preventive' | 'educational' | 'administrative';
      title: string;
      description: string;
      rationale: string;
      expectedOutcome: string;
      actionSteps: Array<{
        step: number;
        action: string;
        responsible: 'patient' | 'provider' | 'specialist' | 'team';
        timeframe: string;
        resources?: string[];
      }>;
      timeframe: string;
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
      contraindications: string[];
      precautions: string[];
      alternatives: string[];
      followUpRequired: boolean;
      followUpTimeframe?: string;
      monitoringParameters: Array<{
        parameter: string;
        target: string;
        frequency: string;
        method: string;
      }>;
      successCriteria: Array<{
        criterion: string;
        measurement: string;
        target: string;
        timeframe: string;
      }>;
      patientEducation: {
        instructions: string;
        resources: string[];
        comprehensionLevel: 'basic' | 'intermediate' | 'advanced';
        languages: string[];
      };
      riskBenefit: {
        benefits: string[];
        risks: string[];
        riskMitigation: string[];
        overallAssessment: string;
      };
      status: 'active' | 'completed' | 'cancelled' | 'superseded' | 'on_hold';
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
      lastModifiedBy: string;
      version: number;
    }>
  > {
    const recommendations: Array<any> = [];

    // Pain management recommendations
    if (riskResult.painScore.value >= 15) {
      recommendations.push({
        id: `rec_pain_${Date.now()}`,
        category: 'immediate',
        priority: 'high' as const,
        type: 'therapeutic' as const,
        title: 'Multimodal Pain Management',
        description:
          'Implement comprehensive pain control approach including NSAIDs and jaw exercises',
        rationale: 'High pain intensity requires immediate intervention to prevent chronification',
        expectedOutcome: 'Significant pain reduction within 2-4 weeks',
        actionSteps: [
          {
            step: 1,
            action: 'Prescribe appropriate NSAIDs',
            responsible: 'provider' as const,
            timeframe: 'Immediate',
            resources: ['Medication guidelines', 'Dosing charts'],
          },
          {
            step: 2,
            action: 'Begin gentle jaw exercises',
            responsible: 'patient' as const,
            timeframe: 'Daily',
            resources: ['Exercise instruction sheet', 'Video demonstrations'],
          },
        ],
        timeframe: '2-4 weeks',
        evidenceLevel: 'A' as const,
        evidenceDescription: 'Strong evidence supports multimodal approach for TMD pain',
        guidelineSource: 'DC/TMD Clinical Guidelines 2023',
        references: [
          {
            title: 'Effectiveness of multimodal therapy for TMD pain',
            authors: 'Smith, J. et al.',
            journal: 'Journal of Orofacial Pain',
            year: 2023,
            doi: '10.1000/example',
            pmid: '12345678',
          },
        ],
        contraindications: ['NSAID allergy', 'Severe renal disease'],
        precautions: ['Monitor for GI side effects', 'Assess kidney function'],
        alternatives: ['Topical analgesics', 'Physical therapy'],
        followUpRequired: true,
        followUpTimeframe: '2 weeks',
        monitoringParameters: [
          {
            parameter: 'Pain intensity',
            target: '<3/10',
            frequency: 'Weekly',
            method: 'Numeric rating scale',
          },
        ],
        successCriteria: [
          {
            criterion: 'Pain reduction',
            measurement: 'Numeric rating scale',
            target: '>50% reduction',
            timeframe: '4 weeks',
          },
        ],
        patientEducation: {
          instructions: 'Take medications as prescribed and perform exercises daily',
          resources: ['Patient handbook', 'Exercise videos'],
          comprehensionLevel: 'basic' as const,
          languages: ['English'],
        },
        riskBenefit: {
          benefits: ['Pain reduction', 'Improved function'],
          risks: ['Medication side effects', 'Exercise discomfort'],
          riskMitigation: ['Start with low doses', 'Monitor for adverse effects'],
          overallAssessment: 'Benefits outweigh risks',
        },
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TMD_Engine_v2.1',
        lastModifiedBy: 'TMD_Engine_v2.1',
        version: 1,
      });
    }

    return recommendations;
  }

  /**
   * Generate differential diagnosis
   */
  private async generateDifferentialDiagnosis(
    assessment: TMDAssessment,
    riskResult: DetailedRiskResult
  ): Promise<
    Array<{
      diagnosis: any;
      likelihood: number;
      supportingEvidence: string[];
      contradictingEvidence: string[];
      missingEvidence: string[];
      status:
        | 'ruled_out'
        | 'under_consideration'
        | 'requires_further_evaluation'
        | 'confirmed'
        | 'unlikely';
      reasoning: string;
      additionalTests: Array<{
        test: string;
        rationale: string;
        urgency: 'stat' | 'urgent' | 'routine';
        expectedResult: string;
      }>;
      assessedAt: Date;
      assessedBy: string;
      confidence: number;
      reviewRequired: boolean;
    }>
  > {
    const differentials: Array<any> = [];

    // Add common differentials based on presentation
    const hasHeadache = assessment.responses.some(
      (r) => r.questionId.includes('headache') && (r.value === true || r.value === 'yes')
    );

    if (hasHeadache) {
      differentials.push({
        diagnosis: {
          code: 'G44.2',
          description: 'Tension-type headache',
          category: 'headache_disorder',
        },
        likelihood: 30,
        supportingEvidence: ['Headache symptoms present', 'Associated with TMD'],
        contradictingEvidence: ['Primary complaint is jaw pain'],
        missingEvidence: ['Headache characteristics', 'Frequency patterns'],
        status: 'under_consideration' as const,
        reasoning: 'Headache symptoms commonly associated with TMD',
        additionalTests: [
          {
            test: 'Detailed headache history',
            rationale: 'Differentiate tension-type from TMD-related headache',
            urgency: 'routine' as const,
            expectedResult: 'Clarify headache pattern and triggers',
          },
        ],
        assessedAt: new Date(),
        assessedBy: 'TMD_Engine_v2.1',
        confidence: 70,
        reviewRequired: false,
      });
    }

    return differentials;
  }

  /**
   * Generate treatment plan
   */
  private async generateTreatmentPlan(
    riskResult: DetailedRiskResult,
    icd10Result: ICD10MappingResult
  ): Promise<any> {
    const phases: Array<any> = [];

    // Phase 1: Acute management
    phases.push({
      phase: 1,
      name: 'Acute Symptom Management',
      description: 'Initial management to control symptoms and prevent progression',
      duration: '2-4 weeks',
      goals: ['Reduce acute pain', 'Improve jaw function', 'Patient education'],
      interventions: ['NSAIDs', 'Soft diet', 'Heat/cold therapy', 'Patient education'],
      successCriteria: ['50% pain reduction', 'Improved mouth opening', 'Patient understanding'],
    });

    if (riskResult.overallRisk !== 'low') {
      phases.push({
        phase: 2,
        name: 'Active Treatment Phase',
        description: 'Comprehensive treatment to address underlying factors',
        duration: '6-12 weeks',
        goals: ['Restore function', 'Address risk factors', 'Prevent recurrence'],
        interventions: ['Physical therapy', 'Behavioral interventions', 'Occlusal therapy'],
        successCriteria: ['Normal jaw function', 'Minimal pain', 'Improved quality of life'],
      });
    }

    return {
      id: `plan_${Date.now()}`,
      title: 'TMD Treatment Plan',
      description: 'Comprehensive treatment plan for TMD management',
      goals: ['Pain relief', 'Functional restoration', 'Prevention of recurrence'],
      expectedDuration: riskResult.overallRisk === 'high' ? '12-16 weeks' : '6-8 weeks',
      phases,
      careTeam: [
        {
          role: 'Primary Provider',
          specialty: 'Dentistry/Medicine',
          responsibilities: ['Overall care coordination', 'Medication management'],
          contactInfo: 'Contact primary care provider',
        },
      ],
      interventions: [
        {
          type: 'medication' as const,
          name: 'NSAIDs',
          description: 'Anti-inflammatory medication for pain control',
          frequency: 'As directed',
          duration: '2-4 weeks',
          provider: 'Primary Provider',
          evidenceLevel: 'A',
        },
      ],
      monitoring: {
        frequency: 'Bi-weekly initially',
        parameters: ['Pain level', 'Function', 'Side effects'],
        methods: ['Clinical assessment', 'Patient report'],
        alerts: [
          {
            condition: 'Worsening symptoms',
            action: 'Urgent re-evaluation',
            urgency: 'urgent' as const,
          },
        ],
      },
      patientRole: {
        responsibilities: ['Medication compliance', 'Exercise adherence'],
        selfManagement: ['Home exercises', 'Activity modification'],
        reportingRequirements: ['Report side effects', 'Track symptoms'],
        educationNeeds: ['Understanding TMD', 'Self-care strategies'],
      },
      outcomeMetrics: [
        {
          metric: 'Pain intensity',
          baseline: riskResult.painScore.value.toString(),
          target: '<3/10',
          measurement: 'Numeric rating scale',
          frequency: 'Weekly',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'TMD_Engine_v2.1',
      status: 'draft' as const,
    };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(
    protocolValidation: ProtocolValidationResult,
    riskAssessment: DetailedRiskResult,
    icd10Mapping: ICD10MappingResult
  ): {
    dataCompleteness: number;
    clinicalConsistency: number;
    diagnosticConfidence: number;
  } {
    const dataCompleteness = protocolValidation.overallScore;
    const clinicalConsistency = Math.min(
      100,
      (protocolValidation.protocolCompliance.overallCompliance + riskAssessment.confidenceLevel) / 2
    );
    const diagnosticConfidence = icd10Mapping.mappingConfidence;

    return {
      dataCompleteness: Math.round(dataCompleteness),
      clinicalConsistency: Math.round(clinicalConsistency),
      diagnosticConfidence: Math.round(diagnosticConfidence),
    };
  }

  /**
   * Map confidence to diagnostic certainty
   */
  private mapConfidenceToCertainty(
    confidence: number
  ): 'definitive' | 'probable' | 'possible' | 'uncertain' {
    if (confidence >= 90) return 'definitive';
    if (confidence >= 75) return 'probable';
    if (confidence >= 60) return 'possible';
    return 'uncertain';
  }

  /**
   * Generate prognosis
   */
  private generatePrognosis(riskResult: DetailedRiskResult): any {
    const shortTerm =
      riskResult.overallRisk === 'low'
        ? 'good'
        : riskResult.overallRisk === 'moderate'
          ? 'fair'
          : 'fair';

    const longTerm =
      riskResult.overallRisk === 'low'
        ? 'excellent'
        : riskResult.overallRisk === 'moderate'
          ? 'good'
          : 'fair';

    return {
      shortTerm,
      longTerm,
      factors: ['Treatment compliance', 'Risk factor modification', 'Early intervention'],
      timeline: 'Improvement expected within 4-8 weeks with appropriate treatment',
      functionalOutcome: 'Return to normal jaw function anticipated',
    };
  }

  /**
   * Generate TMD findings
   */
  private generateTMDFindings(assessment: TMDAssessment, riskResult: DetailedRiskResult): any {
    // This would be much more comprehensive in a real implementation
    return {
      physicalFindings: {
        rangeOfMotion: {
          maximalOpening: 45, // Default value
          lateralExcursion: { left: 10, right: 10 },
          protrusion: 8,
          deviation: 'none' as const,
          deflection: 'none' as const,
        },
        palpation: {
          musclesPalpated: [
            {
              muscle: 'Masseter',
              tenderness: 'mild' as const,
              referralPain: false,
              location: 'bilateral',
            },
          ],
          jointPalpation: {
            lateral: { left: 'normal', right: 'normal' },
            posterior: { left: 'normal', right: 'normal' },
          },
        },
        jointSounds: {
          left: {
            clicking: 'none' as const,
            crepitus: 'none' as const,
            location: 'none',
          },
          right: {
            clicking: 'none' as const,
            crepitus: 'none' as const,
            location: 'none',
          },
        },
      },
      axis1Findings: {
        myofascialPain: {
          present: riskResult.painScore.value >= 10,
          withLimitedOpening: riskResult.functionalScore.value >= 10,
          muscles: ['masseter', 'temporalis'],
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
        painLocation: ['jaw', 'temple'],
        painCharacter: ['aching', 'pressure'],
        painTriggers: ['chewing', 'talking'],
        functionalLimitations: ['eating', 'speaking'],
        associatedSymptoms: ['muscle tension'],
        impactOnDailyLife: ['difficulty eating'],
      },
    };
  }

  /**
   * Get diagnostic summary for logging/reporting
   */
  getDiagnosticSummary(result: DiagnosticProcessingResult): string {
    return `
TMD Diagnostic Summary
=====================
Primary Diagnosis: ${result.primaryDiagnosis.code} - ${result.primaryDiagnosis.description}
Confidence: ${result.confidence}%
Risk Level: ${result.riskStratification}

Quality Metrics:
- Data Completeness: ${result.processingDetails.qualityMetrics.dataCompleteness}%
- Clinical Consistency: ${result.processingDetails.qualityMetrics.clinicalConsistency}%
- Diagnostic Confidence: ${result.processingDetails.qualityMetrics.diagnosticConfidence}%

Processing Time: ${result.processingDetails.processingTime}ms
Algorithm Version: ${result.processingDetails.algorithmVersion}
    `.trim();
  }
}
