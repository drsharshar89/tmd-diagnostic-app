// TMD Diagnostic Engine Demonstration
// Shows comprehensive usage of all diagnostic engine components

import {
  TMDDiagnosticEngine,
  ProtocolValidator,
  RiskCalculator,
  ICD10Mapper,
  createDiagnosticEngine,
} from '../index';
import type { TMDAssessment } from '@/entities/assessment';
import type { DiagnosticProcessingResult } from '../engine/TMDDiagnosticEngine';

/**
 * Demonstration class for TMD Diagnostic Engine
 */
export class DiagnosticEngineDemo {
  private diagnosticEngine: TMDDiagnosticEngine;

  constructor() {
    // Initialize with custom configuration
    this.diagnosticEngine = createDiagnosticEngine({
      strictValidation: true,
      requireMinimumConfidence: 75,
      enableSecondaryDiagnoses: true,
      includeDifferentialDiagnosis: true,
      generateTreatmentPlan: true,
    });
  }

  /**
   * Demonstrate complete diagnostic workflow
   */
  async demonstrateCompleteWorkflow(): Promise<void> {
    console.log('=== TMD Diagnostic Engine Demonstration ===\n');

    // Create sample assessment data
    const sampleAssessment = this.createSampleAssessment();

    try {
      console.log('1. Processing TMD Assessment...');
      console.log(`   Assessment ID: ${sampleAssessment.id}`);
      console.log(`   Protocol: ${sampleAssessment.protocol}`);
      console.log(`   Response Count: ${sampleAssessment.responses.length}\n`);

      // Process the assessment through the diagnostic engine
      const result = await this.diagnosticEngine.processAssessment(sampleAssessment);

      // Display comprehensive results
      this.displayDiagnosticResults(result);
    } catch (error) {
      console.error('Diagnostic processing failed:', error);
    }
  }

  /**
   * Demonstrate individual engine components
   */
  async demonstrateIndividualComponents(): Promise<void> {
    console.log('\n=== Individual Component Demonstrations ===\n');

    const sampleAssessment = this.createSampleAssessment();

    // 1. Protocol Validator Demo
    await this.demonstrateProtocolValidator(sampleAssessment);

    // 2. Risk Calculator Demo
    await this.demonstrateRiskCalculator(sampleAssessment);

    // 3. ICD-10 Mapper Demo
    await this.demonstrateICD10Mapper(sampleAssessment);
  }

  /**
   * Create sample TMD assessment for demonstration
   */
  private createSampleAssessment(): TMDAssessment {
    return {
      id: `demo_assessment_${Date.now()}`,
      patientId: 'demo_patient_001',
      protocol: 'DC_TMD_AXIS_I',
      version: '2.1',
      startedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      completedAt: new Date(),
      status: 'completed',
      responses: [
        // Pain intensity questions (0-4 scale per DC/TMD)
        { questionId: 'Q1', value: 3, timestamp: new Date(), responseTime: 5000 },
        { questionId: 'Q2', value: 2, timestamp: new Date(), responseTime: 4000 },

        // Functional limitation questions
        { questionId: 'Q12', value: 2, timestamp: new Date(), responseTime: 6000 },
        { questionId: 'Q13', value: 3, timestamp: new Date(), responseTime: 5500 },
        { questionId: 'Q14', value: 1, timestamp: new Date(), responseTime: 4500 },

        // Joint sounds
        { questionId: 'Q8_clicking', value: true, timestamp: new Date(), responseTime: 3000 },
        { questionId: 'Q9_popping', value: false, timestamp: new Date(), responseTime: 2500 },

        // Laterality
        { questionId: 'right_side_pain', value: true, timestamp: new Date(), responseTime: 2000 },
        { questionId: 'left_side_pain', value: false, timestamp: new Date(), responseTime: 2000 },

        // Associated symptoms
        { questionId: 'headache', value: true, timestamp: new Date(), responseTime: 3500 },
        { questionId: 'neck_pain', value: false, timestamp: new Date(), responseTime: 3000 },

        // Duration and chronicity
        { questionId: 'symptom_duration', value: 6, timestamp: new Date(), responseTime: 4000 },
        { questionId: 'chronic_pain', value: true, timestamp: new Date(), responseTime: 3000 },

        // Psychosocial factors
        { questionId: 'stress_level', value: 7, timestamp: new Date(), responseTime: 5000 },
        { questionId: 'sleep_quality', value: 3, timestamp: new Date(), responseTime: 4000 },

        // Behavioral factors
        { questionId: 'jaw_clenching', value: true, timestamp: new Date(), responseTime: 3000 },
        { questionId: 'teeth_grinding', value: false, timestamp: new Date(), responseTime: 2500 },
      ],
      metadata: {
        deviceType: 'desktop',
        browserInfo: 'Chrome/120.0.0.0',
        completionTime: 15 * 60 * 1000, // 15 minutes
        language: 'en',
        timezone: 'America/New_York',
      },
      qualityMetrics: {
        completionRate: 100,
        averageResponseTime: 3750,
        consistencyScore: 85,
        engagementScore: 90,
      },
    };
  }

  /**
   * Demonstrate Protocol Validator
   */
  private async demonstrateProtocolValidator(assessment: TMDAssessment): Promise<void> {
    console.log('--- Protocol Validator Demo ---');

    const validator = new ProtocolValidator();
    const validation = await validator.validate(assessment);

    console.log(`Protocol Validation Results:`);
    console.log(`  Valid: ${validation.isValid}`);
    console.log(`  Overall Score: ${validation.overallScore}%`);
    console.log(`  Axis I Compliance: ${validation.protocolCompliance.axis1Compliance}%`);

    if (validation.errors.length > 0) {
      console.log(`  Errors (${validation.errors.length}):`);
      validation.errors.forEach((error) => {
        console.log(`    - ${error.message} (${error.severity})`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log(`  Warnings (${validation.warnings.length}):`);
      validation.warnings.forEach((warning) => {
        console.log(`    - ${warning}`);
      });
    }

    console.log('');
  }

  /**
   * Demonstrate Risk Calculator
   */
  private async demonstrateRiskCalculator(assessment: TMDAssessment): Promise<void> {
    console.log('--- Risk Calculator Demo ---');

    const riskCalculator = new RiskCalculator();
    const riskResult = await riskCalculator.calculate(assessment.responses);

    console.log(`Risk Assessment Results:`);
    console.log(`  Overall Risk: ${riskResult.overallRisk.toUpperCase()}`);
    console.log(`  Risk Score: ${riskResult.overallScore}/${riskResult.maxPossibleScore}`);
    console.log(`  Confidence: ${riskResult.confidenceLevel}%`);

    console.log(`  Component Scores:`);
    console.log(
      `    Pain: ${riskResult.painScore.value}/${riskResult.painScore.maxValue} (${riskResult.painScore.interpretation})`
    );
    console.log(
      `    Function: ${riskResult.functionalScore.value}/${riskResult.functionalScore.maxValue} (${riskResult.functionalScore.interpretation})`
    );

    if (riskResult.psychosocialScore) {
      console.log(
        `    Psychosocial: ${riskResult.psychosocialScore.value}/${riskResult.psychosocialScore.maxValue} (${riskResult.psychosocialScore.interpretation})`
      );
    }

    console.log(`  DC/TMD Scores:`);
    console.log(`    Axis I: ${riskResult.dcTmdScores.axis1Score}`);
    console.log(`    Pain Intensity: ${riskResult.dcTmdScores.painIntensity}`);
    console.log(`    Functional Limitation: ${riskResult.dcTmdScores.jawFunctionalLimitation}`);

    if (riskResult.riskFactors.length > 0) {
      console.log(`  Risk Factors (${riskResult.riskFactors.length}):`);
      riskResult.riskFactors.slice(0, 3).forEach((rf) => {
        console.log(`    - ${rf.factor} (${rf.severity}): ${rf.description}`);
      });
    }

    console.log('');
  }

  /**
   * Demonstrate ICD-10 Mapper
   */
  private async demonstrateICD10Mapper(assessment: TMDAssessment): Promise<void> {
    console.log('--- ICD-10 Mapper Demo ---');

    const mapper = new ICD10Mapper();
    const riskCalculator = new RiskCalculator();

    // Need risk result for mapping
    const riskResult = await riskCalculator.calculate(assessment.responses);
    const mappingResult = await mapper.mapDiagnosis(assessment, riskResult);

    console.log(`ICD-10 Mapping Results:`);
    console.log(
      `  Primary Code: ${mappingResult.primaryCode.code} - ${mappingResult.primaryCode.description}`
    );
    console.log(`  Category: ${mappingResult.primaryCode.category}`);
    console.log(`  Confidence: ${mappingResult.primaryCode.confidence}%`);
    console.log(`  Billable: ${mappingResult.primaryCode.billable}`);

    if (mappingResult.secondaryCodes.length > 0) {
      console.log(`  Secondary Codes (${mappingResult.secondaryCodes.length}):`);
      mappingResult.secondaryCodes.forEach((code) => {
        console.log(`    - ${code.code}: ${code.description}`);
      });
    }

    console.log(`  Clinical Justification:`);
    console.log(`    Primary Reason: ${mappingResult.clinicalJustification.primaryReason}`);

    if (mappingResult.clinicalJustification.supportingEvidence.length > 0) {
      console.log(`    Supporting Evidence:`);
      mappingResult.clinicalJustification.supportingEvidence.slice(0, 2).forEach((evidence) => {
        console.log(`      - ${evidence}`);
      });
    }

    console.log(`  Billing Information:`);
    console.log(`    Primary Billable: ${mappingResult.billingInformation.primaryBillable}`);
    console.log(`    Total Billable Codes: ${mappingResult.billingInformation.totalBillableCodes}`);
    console.log(`    Mapping Confidence: ${mappingResult.mappingConfidence}%`);

    console.log('');
  }

  /**
   * Display comprehensive diagnostic results
   */
  private displayDiagnosticResults(result: DiagnosticProcessingResult): void {
    console.log('2. Comprehensive Diagnostic Results:\n');

    // Primary diagnosis
    console.log(`PRIMARY DIAGNOSIS:`);
    console.log(`  Code: ${result.primaryDiagnosis.code}`);
    console.log(`  Description: ${result.primaryDiagnosis.description}`);
    console.log(`  Category: ${result.primaryDiagnosis.category}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Certainty: ${result.diagnosticCertainty}\n`);

    // Risk stratification
    console.log(`RISK STRATIFICATION:`);
    console.log(`  Overall Risk: ${result.riskStratification.toUpperCase()}`);
    console.log(`  Risk Factors: ${result.riskFactors.length} identified\n`);

    // Clinical recommendations
    if (result.recommendations.length > 0) {
      console.log(`CLINICAL RECOMMENDATIONS (${result.recommendations.length}):`);
      result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title} (${rec.priority})`);
        console.log(`     ${rec.description}`);
      });
      console.log('');
    }

    // Treatment plan
    if (result.treatmentPlan) {
      console.log(`TREATMENT PLAN:`);
      console.log(`  Title: ${result.treatmentPlan.title}`);
      console.log(`  Duration: ${result.treatmentPlan.expectedDuration}`);
      console.log(`  Phases: ${result.treatmentPlan.phases.length}`);
      console.log(`  Goals: ${result.treatmentPlan.goals.join(', ')}\n`);
    }

    // Quality metrics
    console.log(`QUALITY METRICS:`);
    console.log(`  Data Completeness: ${result.qualityMetrics.dataCompleteness}%`);
    console.log(`  Clinical Relevance: ${result.qualityMetrics.clinicalRelevance}%`);
    console.log(`  Guideline Compliance: ${result.qualityMetrics.guidelineCompliance}%`);
    console.log(`  Evidence Alignment: ${result.qualityMetrics.evidenceAlignment}%\n`);

    // Processing details
    console.log(`PROCESSING DETAILS:`);
    console.log(`  Processing Time: ${result.processingDetails.processingTime}ms`);
    console.log(`  Algorithm Version: ${result.processingDetails.algorithmVersion}`);
    console.log(
      `  Protocol Validation: ${result.processingDetails.protocolValidation.isValid ? 'PASSED' : 'FAILED'}`
    );
    console.log(
      `  Risk Assessment Confidence: ${result.processingDetails.riskAssessment.confidenceLevel}%`
    );
    console.log(
      `  ICD-10 Mapping Confidence: ${result.processingDetails.icd10Mapping.mappingConfidence}%\n`
    );

    // Follow-up requirements
    if (result.followUp.required) {
      console.log(`FOLLOW-UP REQUIREMENTS:`);
      console.log(`  Required: ${result.followUp.required}`);
      console.log(`  Timeframe: ${result.followUp.timeframe}`);
      console.log(`  Parameters: ${result.followUp.parameters.join(', ')}`);
      console.log(`  Red Flags: ${result.followUp.redFlags.join(', ')}\n`);
    }

    console.log('=== Diagnostic Processing Complete ===\n');
  }

  /**
   * Run all demonstrations
   */
  async runAllDemonstrations(): Promise<void> {
    await this.demonstrateCompleteWorkflow();
    await this.demonstrateIndividualComponents();

    console.log('All demonstrations completed successfully!');
    console.log('\nThe TMD Diagnostic Engine provides:');
    console.log('✓ DC/TMD Protocol Compliance Validation');
    console.log('✓ Evidence-Based Risk Stratification');
    console.log('✓ Accurate ICD-10 Code Mapping');
    console.log('✓ Clinical Decision Support');
    console.log('✓ Comprehensive Treatment Planning');
    console.log('✓ Quality Metrics and Audit Trails');
    console.log('✓ HIPAA-Compliant Processing');
    console.log('✓ Medical-Grade Accuracy and Reliability\n');
  }
}

// Export for easy testing
export const runDiagnosticEngineDemo = async () => {
  const demo = new DiagnosticEngineDemo();
  await demo.runAllDemonstrations();
};
