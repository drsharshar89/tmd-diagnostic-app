/**
 * Medical Protocol Engine - Comprehensive Test Suite
 *
 * Tests all diagnostic logic, scoring algorithms, and edge cases
 * with realistic patient scenarios for TMD assessment validation.
 *
 * @version 2.1.0
 * @author TMD Diagnostic System Test Suite
 */

import {
  MedicalProtocolEngine,
  createMedicalProtocolEngine,
  processComprehensiveAssessment,
  processQuickAssessment,
  calculateRiskLevel,
  type MedicalScoreResult,
  type CategoryScore,
  type TMDClassification,
  type ProtocolConfig,
} from './MedicalProtocolEngine';

import type { ComprehensiveAnswers, QuickAssessmentAnswers, RiskLevel } from '@/types';

// =====================================================
// TEST DATA - REALISTIC PATIENT SCENARIOS
// =====================================================

/**
 * Patient 1: Low Risk - Minimal TMD symptoms
 * 28-year-old office worker with occasional jaw tension
 */
const LOW_RISK_PATIENT: ComprehensiveAnswers = {
  // Pain Assessment (Q1-Q7) - Minimal pain
  q1: false, // No jaw pain at rest
  q2: true, // Mild jaw pain during function
  q3: false, // No temple pain
  q4: false, // No ear pain
  q5: false, // No pain when chewing
  q6: false, // No pain when yawning
  q7: 2, // Low pain intensity (2/10)

  // Joint Sounds (Q8-Q11) - Some clicking
  q8: true, // Clicking sounds
  q9: false, // No grating
  q10: false, // No popping
  q11: 'Right side', // Unilateral sounds

  // Function (Q12-Q17) - Normal function
  q12: false, // No difficulty opening wide
  q13: false, // No difficulty moving side to side
  q14: false, // No difficulty with hard foods
  q15: false, // No difficulty with soft foods
  q16: false, // No general jaw difficulty
  q17: false, // No locking

  // Associated Symptoms (Q18-Q21) - Few symptoms
  q18: false, // No headaches
  q19: true, // Some neck pain
  q20: false, // No tooth pain
  q21: false, // No ear symptoms

  // History & Triggers (Q22-Q26) - Low risk factors
  q22: false, // No recent trauma
  q23: false, // No recent dental work
  q24: 3, // Low stress (3/10)
  q25: "I don't think so", // Unlikely bruxism
  q26: false, // No daytime clenching
};

/**
 * Patient 2: Moderate Risk - Functional TMD with stress
 * 35-year-old teacher with work-related stress and jaw dysfunction
 */
const MODERATE_RISK_PATIENT: ComprehensiveAnswers = {
  // Pain Assessment (Q1-Q7) - Moderate pain
  q1: true, // Jaw pain at rest
  q2: true, // Jaw pain during function
  q3: true, // Temple pain
  q4: false, // No ear pain
  q5: true, // Pain when chewing
  q6: true, // Pain when yawning
  q7: 5, // Moderate pain (5/10)

  // Joint Sounds (Q8-Q11) - Multiple sounds
  q8: true, // Clicking
  q9: true, // Grating
  q10: false, // No popping
  q11: 'Both sides', // Bilateral sounds

  // Function (Q12-Q17) - Some limitations
  q12: true, // Difficulty opening wide
  q13: true, // Difficulty moving side to side
  q14: true, // Difficulty with hard foods
  q15: false, // No difficulty with soft foods
  q16: true, // General jaw difficulty
  q17: false, // No locking

  // Associated Symptoms (Q18-Q21) - Multiple symptoms
  q18: true, // Headaches
  q19: true, // Neck pain
  q20: false, // No tooth pain
  q21: true, // Ear symptoms

  // History & Triggers (Q22-Q26) - Moderate risk
  q22: false, // No recent trauma
  q23: false, // No recent dental work
  q24: 7, // High stress (7/10)
  q25: 'I think so', // Probable bruxism
  q26: true, // Daytime clenching
};

/**
 * Patient 3: High Risk - Severe TMD with multiple complications
 * 45-year-old with chronic TMD, recent trauma, and severe symptoms
 */
const HIGH_RISK_PATIENT: ComprehensiveAnswers = {
  // Pain Assessment (Q1-Q7) - Severe pain
  q1: true, // Jaw pain at rest
  q2: true, // Jaw pain during function
  q3: true, // Temple pain
  q4: true, // Ear pain
  q5: true, // Pain when chewing
  q6: true, // Pain when yawning
  q7: 8, // Severe pain (8/10)

  // Joint Sounds (Q8-Q11) - All sounds present
  q8: true, // Clicking
  q9: true, // Grating
  q10: true, // Popping
  q11: 'Both sides', // Bilateral sounds

  // Function (Q12-Q17) - Severe limitations
  q12: true, // Difficulty opening wide
  q13: true, // Difficulty moving side to side
  q14: true, // Difficulty with hard foods
  q15: true, // Difficulty with soft foods
  q16: true, // General jaw difficulty
  q17: true, // Locking episodes

  // Associated Symptoms (Q18-Q21) - All symptoms
  q18: true, // Headaches
  q19: true, // Neck pain
  q20: true, // Tooth pain
  q21: true, // Ear symptoms

  // History & Triggers (Q22-Q26) - High risk
  q22: true, // Recent trauma
  q23: true, // Recent dental work
  q24: 9, // Very high stress (9/10)
  q25: 'Yes, definitely', // Confirmed bruxism
  q26: true, // Daytime clenching
};

// Quick Assessment Test Data
const QUICK_LOW_RISK: QuickAssessmentAnswers = {
  q1: true,  // Mild jaw discomfort
  q2: true,  // Occasionally when chewing hard foods
  q3: false, // No sounds
  q4: false, // No locking
  q5: false, // No referred symptoms
  q6: false, // No history
  q7: false  // Not severe
};

const QUICK_MODERATE_RISK: QuickAssessmentAnswers = {
  q1: true,  // Frequent jaw pain
  q2: true,  // Pain when stressed
  q3: true,  // Clicking sounds
  q4: false, // No locking mentioned
  q5: false, // No referred pain
  q6: false, // No history mentioned
  q7: true   // Difficulty opening mouth/chewing
};

const QUICK_HIGH_RISK: QuickAssessmentAnswers = {
  q1: true,  // Severe constant jaw pain
  q2: true,  // Unbearable pain
  q3: false, // No sounds mentioned
  q4: true,  // Jaw frequently locks
  q5: true,  // Pain affects daily life
  q6: false, // No history mentioned
  q7: true   // Intense, impossible to eat
};

// =====================================================
// TEST SUITE SETUP
// =====================================================

describe('MedicalProtocolEngine', () => {
  let engine: MedicalProtocolEngine;

  beforeEach(() => {
    // Reset singleton for each test
    (MedicalProtocolEngine as any).instance = undefined;
    engine = createMedicalProtocolEngine({
      strictValidation: true,
      minimumConfidence: 70,
      algorithmVersion: '2.1.0-test',
    });
  });

  afterEach(() => {
    // Clean up singleton
    (MedicalProtocolEngine as any).instance = undefined;
  });

  // =====================================================
  // SINGLETON PATTERN TESTS
  // =====================================================

  describe('Singleton Pattern', () => {
    it('should return the same instance for multiple calls', () => {
      const engine1 = createMedicalProtocolEngine();
      const engine2 = createMedicalProtocolEngine();

      expect(engine1).toBe(engine2);
    });

    it('should maintain configuration across instances', () => {
      const config = { algorithmVersion: '2.1.0-test', minimumConfidence: 85 };
      const engine1 = createMedicalProtocolEngine(config);
      const engine2 = createMedicalProtocolEngine();

      expect(engine1).toBe(engine2);
    });
  });

  // =====================================================
  // COMPREHENSIVE ASSESSMENT TESTS
  // =====================================================

  describe('Comprehensive Assessment Processing', () => {
    it('should correctly assess low-risk patient', () => {
      const result = engine.processComprehensiveAssessment(LOW_RISK_PATIENT);

      // Core assessment validation
      expect(result.riskLevel).toBe('low');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.assessmentType).toBe('comprehensive');
      expect(result.timestamp).toBeInstanceOf(Date);

      // Score validation
      expect(result.painScore).toBeLessThan(40);
      expect(result.functionalScore).toBeLessThan(30);
      expect(result.soundsScore).toBeGreaterThan(0);

      // Clinical flags
      expect(result.requiresImmediateAttention).toBe(false);
      expect(result.followUpRecommended).toBe(false);
      expect(result.specialistReferral).toBe(false);

      // Recommendations
      expect(result.recommendations).toContain('Continue current oral habits');
      expect(result.recommendations).toContain('Apply warm compresses if discomfort occurs');
    });

    it('should correctly assess moderate-risk patient', () => {
      const result = engine.processComprehensiveAssessment(MODERATE_RISK_PATIENT);

      // Core assessment validation
      expect(result.riskLevel).toBe('moderate');
      expect(result.confidence).toBeGreaterThan(75);

      // Score validation
      expect(result.painScore).toBeGreaterThan(50);
      expect(result.functionalScore).toBeGreaterThan(40);
      expect(result.soundsScore).toBeGreaterThan(60);
      expect(result.historyScore).toBeGreaterThan(40);

      // Clinical flags
      expect(result.requiresImmediateAttention).toBe(false);
      expect(result.followUpRecommended).toBe(true);
      expect(result.specialistReferral).toBe(false);

      // Recommendations
      expect(result.recommendations).toContain(
        'Consult with a dentist or oral medicine specialist'
      );
      expect(result.recommendations).toContain('Consider stress management techniques');
    });

    it('should correctly assess high-risk patient', () => {
      const result = engine.processComprehensiveAssessment(HIGH_RISK_PATIENT);

      // Core assessment validation
      expect(result.riskLevel).toBe('high');
      expect(result.confidence).toBeGreaterThan(85);

      // Score validation - all categories should be elevated
      expect(result.painScore).toBeGreaterThan(70);
      expect(result.functionalScore).toBeGreaterThan(70);
      expect(result.soundsScore).toBeGreaterThan(80);
      expect(result.associatedScore).toBeGreaterThan(75);
      expect(result.historyScore).toBeGreaterThan(80);

      // Clinical flags - should trigger all alerts
      expect(result.requiresImmediateAttention).toBe(true);
      expect(result.followUpRecommended).toBe(true);
      expect(result.specialistReferral).toBe(true);

      // ICD-10 codes should be present
      expect(result.icd10Codes).toContain('M26.62');

      // Recommendations should include urgent care
      expect(result.recommendations).toContain('Seek immediate professional evaluation');
      expect(result.recommendations).toContain('Consider referral to TMD specialist');
    });
  });

  // =====================================================
  // QUICK ASSESSMENT TESTS
  // =====================================================

  describe('Quick Assessment Processing', () => {
    it('should correctly assess low-risk quick description', () => {
      const result = engine.processQuickAssessment(QUICK_LOW_RISK);

      expect(result.riskLevel).toBe('low');
      expect(result.assessmentType).toBe('quick');
      expect(result.confidence).toBeGreaterThan(40);
      expect(result.dcTmdClassification).toBe('Screening Assessment');

      // Should recommend monitoring
      expect(result.recommendations).toContain('Monitor symptoms and note any changes');
    });

    it('should correctly assess moderate-risk quick description', () => {
      const result = engine.processQuickAssessment(QUICK_MODERATE_RISK);

      expect(result.riskLevel).toBe('moderate');
      expect(result.confidence).toBeGreaterThan(60);

      // Should recommend comprehensive assessment
      expect(result.recommendations).toContain(
        'Complete comprehensive assessment for detailed evaluation'
      );
    });

    it('should correctly assess high-risk quick description', () => {
      const result = engine.processQuickAssessment(QUICK_HIGH_RISK);

      expect(result.riskLevel).toBe('high');
      expect(result.requiresImmediateAttention).toBe(true);
      expect(result.specialistReferral).toBe(true);

      // Should recommend immediate care
      expect(result.recommendations).toContain('Seek immediate professional evaluation');
    });
  });

  // =====================================================
  // VALIDATION TESTS
  // =====================================================

  describe('Input Validation', () => {
    it('should reject null/undefined comprehensive answers', () => {
      expect(() => {
        engine.processComprehensiveAssessment(null as any);
      }).toThrow('Assessment answers are required');

      expect(() => {
        engine.processComprehensiveAssessment(undefined as any);
      }).toThrow('Assessment answers are required');
    });

    it('should reject insufficient comprehensive responses', () => {
      const insufficientAnswers: ComprehensiveAnswers = {
        q1: true,
        q2: null,
        q3: null,
        q4: null,
        q5: null,
        q6: null,
        q7: null,
        q8: null,
        q9: null,
        q10: null,
        q11: null,
        q12: null,
        q13: null,
        q14: null,
        q15: null,
        q16: null,
        q17: null,
        q18: null,
        q19: null,
        q20: null,
        q21: null,
        q22: null,
        q23: null,
        q24: null,
        q25: null,
        q26: null,
      };

      expect(() => {
        engine.processComprehensiveAssessment(insufficientAnswers);
      }).toThrow('Insufficient responses for reliable assessment');
    });

    it('should validate pain scale ranges', () => {
      const invalidPainPatient = { ...LOW_RISK_PATIENT, q7: 15 };

      expect(() => {
        engine.processComprehensiveAssessment(invalidPainPatient);
      }).toThrow('Pain scale must be between 0 and 10');
    });

    it('should validate stress scale ranges', () => {
      const invalidStressPatient = { ...LOW_RISK_PATIENT, q24: 15 };

      expect(() => {
        engine.processComprehensiveAssessment(invalidStressPatient);
      }).toThrow('Stress scale must be between 1 and 10');
    });

    it('should reject invalid quick assessment descriptions', () => {
      expect(() => {
        engine.processQuickAssessment({
          q1: null,
          q2: null,
          q3: null,
          q4: null,
          q5: null,
          q6: null,
          q7: null
        });
      }).toThrow('Insufficient responses for quick assessment');

      expect(() => {
        engine.processQuickAssessment({
          q1: true,
          q2: null,
          q3: null,
          q4: null,
          q5: null,
          q6: null,
          q7: null
        });
      }).toThrow('Insufficient responses for quick assessment');
    });
  });

  // =====================================================
  // CONVENIENCE FUNCTION TESTS
  // =====================================================

  describe('Convenience Functions', () => {
    it('should process comprehensive assessment via convenience function', () => {
      const result = processComprehensiveAssessment(MODERATE_RISK_PATIENT);

      expect(result.riskLevel).toBe('moderate');
      expect(result.assessmentType).toBe('comprehensive');
    });

    it('should process quick assessment via convenience function', () => {
      const result = processQuickAssessment(QUICK_HIGH_RISK);

      expect(result.riskLevel).toBe('high');
      expect(result.assessmentType).toBe('quick');
    });

    it('should calculate risk level only via convenience function', () => {
      const comprehensiveRisk = calculateRiskLevel('comprehensive', MODERATE_RISK_PATIENT);
      const quickRisk = calculateRiskLevel('quick', QUICK_MODERATE_RISK);

      expect(comprehensiveRisk).toBe('moderate');
      expect(quickRisk).toBe('moderate');
    });
  });

  // =====================================================
  // PERFORMANCE TESTS
  // =====================================================

  describe('Performance', () => {
    it('should process comprehensive assessment within reasonable time', () => {
      const startTime = Date.now();
      const result = engine.processComprehensiveAssessment(HIGH_RISK_PATIENT);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should complete within 100ms for comprehensive assessment
      expect(processingTime).toBeLessThan(100);
      expect(result.processingTimeMs).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should process quick assessment efficiently', () => {
      const startTime = Date.now();
      const result = engine.processQuickAssessment(QUICK_HIGH_RISK);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should complete within 50ms for quick assessment
      expect(processingTime).toBeLessThan(50);
      expect(result.processingTimeMs).toBeDefined();
    });
  });

  // =====================================================
  // MEDICAL ACCURACY TESTS
  // =====================================================

  describe('Medical Accuracy', () => {
    it('should provide medically appropriate ICD-10 codes', () => {
      const result = engine.processComprehensiveAssessment(HIGH_RISK_PATIENT);

      expect(result.icd10Codes).toContain('M26.62');
      expect(result.dcTmdClassification).toContain('Temporomandibular joint disorder');
    });

    it('should generate evidence-based recommendations', () => {
      const lowRiskResult = engine.processComprehensiveAssessment(LOW_RISK_PATIENT);
      const highRiskResult = engine.processComprehensiveAssessment(HIGH_RISK_PATIENT);

      // Low risk should have conservative recommendations
      expect(lowRiskResult.recommendations).toContain('Continue current oral habits');

      // High risk should have urgent recommendations
      expect(highRiskResult.recommendations).toContain('Seek immediate professional evaluation');
      expect(highRiskResult.recommendations).toContain('Consider referral to TMD specialist');
    });
  });
});

/**
 * Helper function to create test patient with specific characteristics
 */
function createTestPatient(overrides: Partial<ComprehensiveAnswers>): ComprehensiveAnswers {
  return {
    ...LOW_RISK_PATIENT,
    ...overrides,
  };
}

/**
 * Helper function to validate assessment result structure
 */
function validateAssessmentResult(result: any): void {
  expect(result).toHaveProperty('riskLevel');
  expect(result).toHaveProperty('score');
  expect(result).toHaveProperty('confidence');
  expect(result).toHaveProperty('recommendations');
  expect(result).toHaveProperty('timestamp');
  expect(result).toHaveProperty('assessmentType');

  expect(['low', 'moderate', 'high']).toContain(result.riskLevel);
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.confidence).toBeGreaterThanOrEqual(0);
  expect(result.confidence).toBeLessThanOrEqual(100);
  expect(Array.isArray(result.recommendations)).toBe(true);
}
