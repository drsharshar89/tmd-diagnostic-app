// Protocol Validator - DC/TMD Compliance Engine
// Validates assessment responses against DC/TMD protocol standards

import type { TMDAssessment, AssessmentResponse } from '@/entities/assessment';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

/**
 * DC/TMD Protocol validation rules and criteria
 */
interface ProtocolRule {
  id: string;
  name: string;
  description: string;
  category: 'required' | 'conditional' | 'recommended';
  severity: 'error' | 'warning' | 'info';
  validator: (assessment: TMDAssessment) => ValidationResult;
}

/**
 * Validation result for individual rules
 */
interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
  suggestedAction?: string;
}

/**
 * Complete protocol validation result
 */
export interface ProtocolValidationResult {
  isValid: boolean;
  overallScore: number; // 0-100%
  errors: Array<{
    ruleId: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    details?: string;
    suggestedAction?: string;
  }>;
  warnings: string[];
  recommendations: string[];
  protocolCompliance: {
    axis1Compliance: number; // 0-100%
    axis2Compliance?: number; // 0-100%
    overallCompliance: number; // 0-100%
  };
}

/**
 * DC/TMD Protocol Validator
 * Ensures assessment compliance with diagnostic criteria
 */
export class ProtocolValidator {
  private rules: ProtocolRule[];
  private errorLogger: ErrorLoggingService;

  constructor() {
    this.errorLogger = new ErrorLoggingService();
    this.rules = this.initializeProtocolRules();
  }

  /**
   * Validate assessment against DC/TMD protocol
   */
  async validate(assessment: TMDAssessment): Promise<ProtocolValidationResult> {
    try {
      const errors: Array<{
        ruleId: string;
        message: string;
        severity: 'error' | 'warning' | 'info';
        details?: string;
        suggestedAction?: string;
      }> = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Run all validation rules
      for (const rule of this.rules) {
        try {
          const result = rule.validator(assessment);

          if (!result.passed) {
            if (rule.severity === 'error') {
              errors.push({
                ruleId: rule.id,
                message: result.message,
                severity: rule.severity,
                details: result.details,
                suggestedAction: result.suggestedAction,
              });
            } else if (rule.severity === 'warning') {
              warnings.push(result.message);
            } else {
              recommendations.push(result.message);
            }
          }
        } catch (error) {
          this.errorLogger.logError(
            error as Error,
            ErrorSeverity.MEDIUM,
            ErrorCategory.VALIDATION,
            {
              additionalData: {
                ruleId: rule.id,
                assessmentId: assessment.id,
              },
            }
          );

          errors.push({
            ruleId: rule.id,
            message: `Validation rule failed: ${rule.name}`,
            severity: 'error',
            details: (error as Error).message,
          });
        }
      }

      // Calculate compliance scores
      const protocolCompliance = this.calculateProtocolCompliance(assessment, errors);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(errors, warnings, protocolCompliance);

      return {
        isValid: errors.filter((e) => e.severity === 'error').length === 0,
        overallScore,
        errors,
        warnings,
        recommendations,
        protocolCompliance,
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.VALIDATION, {
        additionalData: {
          assessmentId: assessment.id,
          protocol: assessment.protocol,
        },
      });

      throw new Error(`Protocol validation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Initialize DC/TMD protocol validation rules
   */
  private initializeProtocolRules(): ProtocolRule[] {
    return [
      // Basic Assessment Requirements
      {
        id: 'BASIC_001',
        name: 'Assessment Completeness',
        description: 'Assessment must have minimum required responses',
        category: 'required',
        severity: 'error',
        validator: (assessment) => {
          const requiredQuestions = this.getRequiredQuestions(assessment.protocol);
          const answeredQuestions = assessment.responses.map((r) => r.questionId);
          const missingQuestions = requiredQuestions.filter((q) => !answeredQuestions.includes(q));

          return {
            passed: missingQuestions.length === 0,
            message:
              missingQuestions.length > 0
                ? `Missing responses for ${missingQuestions.length} required questions`
                : 'All required questions answered',
            details:
              missingQuestions.length > 0 ? `Missing: ${missingQuestions.join(', ')}` : undefined,
            suggestedAction:
              missingQuestions.length > 0
                ? 'Complete all required assessment questions before proceeding'
                : undefined,
          };
        },
      },

      // Pain Assessment Rules (DC/TMD Axis I)
      {
        id: 'PAIN_001',
        name: 'Pain Intensity Scale Validation',
        description: 'Pain intensity must use 0-4 scale per DC/TMD protocol',
        category: 'required',
        severity: 'error',
        validator: (assessment) => {
          const painResponses = assessment.responses.filter(
            (r) =>
              r.questionId.includes('pain_intensity') ||
              r.questionId.includes('Q1') ||
              r.questionId.includes('Q2')
          );

          for (const response of painResponses) {
            if (typeof response.value === 'number') {
              if (response.value < 0 || response.value > 4) {
                return {
                  passed: false,
                  message: 'Pain intensity values must be between 0-4 (DC/TMD standard)',
                  details: `Found value: ${response.value} for question ${response.questionId}`,
                  suggestedAction:
                    'Use 0-4 scale: 0=none, 1=mild, 2=moderate, 3=severe, 4=very severe',
                };
              }
            }
          }

          return {
            passed: true,
            message: 'Pain intensity scales are valid',
          };
        },
      },

      // Functional Assessment Rules
      {
        id: 'FUNC_001',
        name: 'Jaw Function Assessment',
        description: 'Functional limitations must be properly assessed',
        category: 'required',
        severity: 'warning',
        validator: (assessment) => {
          const functionalQuestions = assessment.responses.filter(
            (r) =>
              r.questionId.includes('chewing') ||
              r.questionId.includes('opening') ||
              r.questionId.includes('function') ||
              ['Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17'].includes(r.questionId)
          );

          if (functionalQuestions.length === 0) {
            return {
              passed: false,
              message: 'No functional assessment responses found',
              details: 'Functional assessment is critical for TMD diagnosis',
              suggestedAction: 'Include questions about jaw function, chewing, and mouth opening',
            };
          }

          return {
            passed: true,
            message: 'Functional assessment completed',
          };
        },
      },

      // Joint Sounds Assessment
      {
        id: 'JOINT_001',
        name: 'Joint Sounds Documentation',
        description: 'Joint sounds must be properly documented for DC/TMD',
        category: 'conditional',
        severity: 'warning',
        validator: (assessment) => {
          const jointSoundQuestions = assessment.responses.filter(
            (r) =>
              r.questionId.includes('clicking') ||
              r.questionId.includes('popping') ||
              r.questionId.includes('grating') ||
              ['Q8', 'Q9', 'Q10', 'Q11'].includes(r.questionId)
          );

          const hasPositiveResponse = jointSoundQuestions.some(
            (r) =>
              r.value === true || r.value === 'yes' || (typeof r.value === 'number' && r.value > 0)
          );

          if (hasPositiveResponse && jointSoundQuestions.length < 3) {
            return {
              passed: false,
              message: 'Incomplete joint sounds assessment',
              details: 'When joint sounds are reported, comprehensive assessment is needed',
              suggestedAction: 'Document timing, location, and characteristics of joint sounds',
            };
          }

          return {
            passed: true,
            message: 'Joint sounds assessment is adequate',
          };
        },
      },

      // Associated Symptoms
      {
        id: 'ASSOC_001',
        name: 'Associated Symptoms Assessment',
        description: 'Associated symptoms should be comprehensively evaluated',
        category: 'recommended',
        severity: 'info',
        validator: (assessment) => {
          const associatedSymptoms = assessment.responses.filter(
            (r) =>
              r.questionId.includes('headache') ||
              r.questionId.includes('neck') ||
              r.questionId.includes('ear') ||
              r.questionId.includes('sleep') ||
              ['Q18', 'Q19', 'Q20', 'Q21'].includes(r.questionId)
          );

          if (associatedSymptoms.length < 2) {
            return {
              passed: false,
              message: 'Limited assessment of associated symptoms',
              details: 'Associated symptoms provide important diagnostic context',
              suggestedAction:
                'Consider evaluating headaches, neck pain, ear symptoms, and sleep quality',
            };
          }

          return {
            passed: true,
            message: 'Associated symptoms adequately assessed',
          };
        },
      },

      // Response Consistency
      {
        id: 'CONS_001',
        name: 'Response Consistency Check',
        description: 'Assessment responses should be internally consistent',
        category: 'required',
        severity: 'warning',
        validator: (assessment) => {
          const inconsistencies = this.checkResponseConsistency(assessment.responses);

          if (inconsistencies.length > 0) {
            return {
              passed: false,
              message: `Found ${inconsistencies.length} response inconsistencies`,
              details: inconsistencies.join('; '),
              suggestedAction: 'Review and verify inconsistent responses with patient',
            };
          }

          return {
            passed: true,
            message: 'Responses are consistent',
          };
        },
      },

      // Protocol-Specific Rules
      {
        id: 'PROTO_001',
        name: 'Protocol Version Compliance',
        description: 'Assessment must comply with specified DC/TMD protocol version',
        category: 'required',
        severity: 'error',
        validator: (assessment) => {
          const supportedVersions = ['2.0', '2.1'];

          if (!supportedVersions.includes(assessment.protocolVersion)) {
            return {
              passed: false,
              message: `Unsupported protocol version: ${assessment.protocolVersion}`,
              details: `Supported versions: ${supportedVersions.join(', ')}`,
              suggestedAction: 'Update to supported protocol version',
            };
          }

          return {
            passed: true,
            message: 'Protocol version is supported',
          };
        },
      },
    ];
  }

  /**
   * Get required questions for protocol
   */
  private getRequiredQuestions(protocol: string): string[] {
    const baseQuestions = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];

    if (protocol === 'DC_TMD_AXIS_I') {
      return [...baseQuestions, 'Q8', 'Q9', 'Q10', 'Q11'];
    } else if (protocol === 'DC_TMD_AXIS_II') {
      return [...baseQuestions, 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17'];
    }

    return baseQuestions;
  }

  /**
   * Check response consistency
   */
  private checkResponseConsistency(responses: AssessmentResponse[]): string[] {
    const inconsistencies: string[] = [];

    // Example consistency checks
    const painIntensityResponses = responses.filter(
      (r) => r.questionId.includes('pain_intensity') || r.questionId === 'Q1'
    );

    const functionalLimitationResponses = responses.filter(
      (r) => r.questionId.includes('limitation') || ['Q12', 'Q13', 'Q14'].includes(r.questionId)
    );

    // Check if high pain but no functional limitations
    const hasHighPain = painIntensityResponses.some(
      (r) => typeof r.value === 'number' && r.value >= 3
    );

    const hasNoLimitations = functionalLimitationResponses.every(
      (r) => r.value === 0 || r.value === false || r.value === 'none'
    );

    if (hasHighPain && hasNoLimitations) {
      inconsistencies.push('High pain intensity reported but no functional limitations indicated');
    }

    // Add more consistency checks as needed

    return inconsistencies;
  }

  /**
   * Calculate protocol compliance scores
   */
  private calculateProtocolCompliance(
    assessment: TMDAssessment,
    errors: Array<{ ruleId: string; severity: string }>
  ): { axis1Compliance: number; axis2Compliance?: number; overallCompliance: number } {
    const axis1Rules = this.rules.filter(
      (r) => r.id.startsWith('PAIN_') || r.id.startsWith('JOINT_') || r.id.startsWith('BASIC_')
    );

    const axis2Rules = this.rules.filter(
      (r) => r.id.startsWith('FUNC_') || r.id.startsWith('ASSOC_')
    );

    const axis1Errors = errors.filter(
      (e) => axis1Rules.some((r) => r.id === e.ruleId) && e.severity === 'error'
    );

    const axis2Errors = errors.filter(
      (e) => axis2Rules.some((r) => r.id === e.ruleId) && e.severity === 'error'
    );

    const axis1Compliance = Math.max(0, 100 - (axis1Errors.length / axis1Rules.length) * 100);
    const axis2Compliance =
      assessment.protocol === 'DC_TMD_AXIS_II'
        ? Math.max(0, 100 - (axis2Errors.length / axis2Rules.length) * 100)
        : undefined;

    const overallCompliance =
      axis2Compliance !== undefined ? (axis1Compliance + axis2Compliance) / 2 : axis1Compliance;

    return {
      axis1Compliance: Math.round(axis1Compliance),
      axis2Compliance: axis2Compliance ? Math.round(axis2Compliance) : undefined,
      overallCompliance: Math.round(overallCompliance),
    };
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(
    errors: Array<{ severity: string }>,
    warnings: string[],
    protocolCompliance: { overallCompliance: number }
  ): number {
    const errorPenalty = errors.filter((e) => e.severity === 'error').length * 20;
    const warningPenalty = warnings.length * 5;

    const baseScore = protocolCompliance.overallCompliance;
    const finalScore = Math.max(0, baseScore - errorPenalty - warningPenalty);

    return Math.round(finalScore);
  }

  /**
   * Get validation summary for logging
   */
  getValidationSummary(result: ProtocolValidationResult): string {
    return `
Protocol Validation Summary
==========================
Overall Score: ${result.overallScore}/100
Valid: ${result.isValid ? 'YES' : 'NO'}

Compliance:
- Axis I: ${result.protocolCompliance.axis1Compliance}%
- Axis II: ${result.protocolCompliance.axis2Compliance || 'N/A'}%
- Overall: ${result.protocolCompliance.overallCompliance}%

Issues:
- Errors: ${result.errors.filter((e) => e.severity === 'error').length}
- Warnings: ${result.warnings.length}
- Recommendations: ${result.recommendations.length}
    `.trim();
  }
}
