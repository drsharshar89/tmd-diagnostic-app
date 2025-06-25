import {
  calculateQuickAssessmentRisk,
  calculateComprehensiveAssessmentRisk,
  calculateRiskLevel,
  getRecommendationsByRisk,
  generateAssessmentCode,
  saveAssessment,
  getStoredAssessments,
  getAssessmentByCode,
  validateQuickAssessment,
  validateComprehensiveAssessment,
  formatDate,
  getRiskLevelColor,
  trackEvent,
  getSystemTheme,
  createAppError,
  debounce,
  setLocalStorage,
  getLocalStorage,
} from './index';
import { QuickAssessmentAnswers, ComprehensiveAnswers, AssessmentResult } from '../types';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Risk Calculation Utilities', () => {
  describe('calculateQuickAssessmentRisk', () => {
    test('should return high risk for severe symptoms', () => {
      const answers: QuickAssessmentAnswers = {
        q1: true, // Jaw pain
        q2: true, // Pain worsens with movement
        q3: true, // Joint sounds
        q4: true, // Jaw locking
        q5: true, // Referred symptoms
        q6: null, // History of trauma
        q7: true  // Stiffness or fatigue
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('high');
    });

    test('should return high risk for multiple positive answers', () => {
      const answers: QuickAssessmentAnswers = {
        q1: true,
        q2: true,
        q3: true,
        q4: true,
        q5: false,
        q6: false,
        q7: true
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('high');
    });

    test('should return moderate risk for moderate symptoms', () => {
      const answers: QuickAssessmentAnswers = {
        q1: true,  // Jaw pain
        q2: false, // Pain doesn't worsen
        q3: false, // No joint sounds
        q4: false, // No jaw locking
        q5: false, // No referred symptoms
        q6: false, // No history
        q7: true   // Morning stiffness
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('moderate');
    });

    test('should return moderate risk for some positive answers', () => {
      const answers: QuickAssessmentAnswers = {
        q1: true,
        q2: true,
        q3: false,
        q4: false,
        q5: false,
        q6: false,
        q7: false
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('moderate');
    });

    test('should return low risk for mild symptoms', () => {
      const answers: QuickAssessmentAnswers = {
        q1: true,  // Mild pain
        q2: false, // No worsening
        q3: false, // No sounds
        q4: false, // No locking
        q5: false, // No referred symptoms
        q6: false, // No history
        q7: false  // No stiffness
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('low');
    });

    test('should handle empty description', () => {
      const answers: QuickAssessmentAnswers = { description: '' };
      expect(calculateQuickAssessmentRisk(answers)).toBe('low');
    });

    test('should be case insensitive', () => {
      const answers: QuickAssessmentAnswers = {
        description: 'SEVERE PAIN AND LOCKED JAW',
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('high');
    });

    test('should detect multiple high-risk keywords', () => {
      const answers: QuickAssessmentAnswers = {
        description: 'constant clicking and grinding with unbearable pain',
      };
      expect(calculateQuickAssessmentRisk(answers)).toBe('high');
    });
  });

  describe('calculateComprehensiveAssessmentRisk', () => {
    test('should return high risk for 3 yes answers', () => {
      const answers: ComprehensiveAnswers = { q1: true, q2: true, q3: true };
      expect(calculateComprehensiveAssessmentRisk(answers)).toBe('high');
    });

    test('should return moderate risk for 1-2 yes answers', () => {
      const answers1: ComprehensiveAnswers = { q1: true, q2: false, q3: false };
      const answers2: ComprehensiveAnswers = { q1: true, q2: true, q3: false };
      expect(calculateComprehensiveAssessmentRisk(answers1)).toBe('moderate');
      expect(calculateComprehensiveAssessmentRisk(answers2)).toBe('moderate');
    });

    test('should return low risk for all no answers', () => {
      const answers: ComprehensiveAnswers = { q1: false, q2: false, q3: false };
      expect(calculateComprehensiveAssessmentRisk(answers)).toBe('low');
    });

    test('should handle null values as no answers', () => {
      const answers: ComprehensiveAnswers = { q1: null, q2: null, q3: null };
      expect(calculateComprehensiveAssessmentRisk(answers)).toBe('low');
    });

    test('should handle mixed null and boolean values', () => {
      const answers: ComprehensiveAnswers = { q1: true, q2: null, q3: false };
      expect(calculateComprehensiveAssessmentRisk(answers)).toBe('moderate');
    });
  });

  describe('calculateRiskLevel', () => {
    test('should calculate risk for quick assessment', () => {
      const quickAnswers: QuickAssessmentAnswers = { description: 'severe pain' };
      const result = calculateRiskLevel('quick', quickAnswers, undefined);
      expect(result).toBe('high');
    });

    test('should calculate risk for comprehensive assessment', () => {
      const comprehensiveAnswers: ComprehensiveAnswers = { q1: true, q2: true, q3: true };
      const result = calculateRiskLevel('comprehensive', undefined, comprehensiveAnswers);
      expect(result).toBe('high');
    });

    test('should return low risk for null assessment type', () => {
      const result = calculateRiskLevel(null, undefined, undefined);
      expect(result).toBe('low');
    });

    test('should return low risk for missing answers', () => {
      const result = calculateRiskLevel('quick', undefined, undefined);
      expect(result).toBe('low');
    });
  });
});

describe('Recommendation Utilities', () => {
  test('should return recommendations for low risk', () => {
    const recommendations = getRecommendationsByRisk('low', 'en');
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toContain('Self-care');
  });

  test('should return recommendations for moderate risk', () => {
    const recommendations = getRecommendationsByRisk('moderate', 'en');
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toContain('dentist');
  });

  test('should return recommendations for high risk', () => {
    const recommendations = getRecommendationsByRisk('high', 'en');
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toContain('immediately');
  });

  test('should return empty array for invalid risk level', () => {
    const recommendations = getRecommendationsByRisk('invalid' as any, 'en');
    expect(recommendations).toEqual([]);
  });
});

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  describe('generateAssessmentCode', () => {
    test('should generate unique codes', () => {
      const code1 = generateAssessmentCode();
      const code2 = generateAssessmentCode();
      expect(code1).not.toBe(code2);
      expect(code1).toHaveLength(6);
      expect(code1).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('saveAssessment', () => {
    test('should save assessment and return code', () => {
      const mockResult: AssessmentResult = {
        riskLevel: 'moderate',
        score: 75,
        recommendations: ['Test recommendation'],
        timestamp: new Date(),
        assessmentType: 'quick',
        answers: { description: 'test' },
      };

      mockLocalStorage.getItem.mockReturnValue('[]');

      const code = saveAssessment(mockResult);

      expect(code).toHaveLength(6);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tmd_assessments',
        expect.stringContaining(code)
      );
    });

    test('should handle existing assessments', () => {
      const existingAssessments = [
        {
          id: 'OLD123',
          result: { riskLevel: 'low' },
          expiresAt: new Date(Date.now() + 1000000).toISOString(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingAssessments));

      const mockResult: AssessmentResult = {
        riskLevel: 'high',
        score: 90,
        recommendations: ['Urgent care'],
        timestamp: new Date(),
        assessmentType: 'comprehensive',
        answers: { q1: true, q2: true, q3: true },
      };

      const code = saveAssessment(mockResult);
      expect(code).toBeDefined();
    });
  });

  describe('getStoredAssessments', () => {
    test('should return empty array when no stored assessments', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const result = getStoredAssessments();
      expect(result).toEqual([]);
    });

    test('should filter out expired assessments', () => {
      const expiredAssessment = {
        id: 'EXP123',
        result: { riskLevel: 'low' },
        expiresAt: new Date(Date.now() - 1000000).toISOString(),
      };

      const validAssessment = {
        id: 'VAL123',
        result: { riskLevel: 'high' },
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([expiredAssessment, validAssessment])
      );

      const result = getStoredAssessments();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('VAL123');
    });

    test('should handle corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const result = getStoredAssessments();
      expect(result).toEqual([]);
    });
  });

  describe('getAssessmentByCode', () => {
    test('should return assessment by code', () => {
      const assessment = {
        id: 'TEST123',
        result: { riskLevel: 'moderate' },
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([assessment]));

      const result = getAssessmentByCode('TEST123');
      expect(result).toEqual(assessment);
    });

    test('should return null for non-existent code', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      const result = getAssessmentByCode('NONEXISTENT');
      expect(result).toBeNull();
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateQuickAssessment', () => {
    test('should validate non-empty description', () => {
      const answers: QuickAssessmentAnswers = { description: 'test description' };
      expect(validateQuickAssessment(answers)).toBe(true);
    });

    test('should reject empty description', () => {
      const answers: QuickAssessmentAnswers = { description: '' };
      expect(validateQuickAssessment(answers)).toBe(false);
    });

    test('should reject whitespace-only description', () => {
      const answers: QuickAssessmentAnswers = { description: '   ' };
      expect(validateQuickAssessment(answers)).toBe(false);
    });
  });

  describe('validateComprehensiveAssessment', () => {
    test('should validate complete answers', () => {
      const answers: ComprehensiveAnswers = { q1: true, q2: false, q3: true };
      expect(validateComprehensiveAssessment(answers)).toBe(true);
    });

    test('should reject incomplete answers', () => {
      const answers: ComprehensiveAnswers = { q1: true, q2: null, q3: false };
      expect(validateComprehensiveAssessment(answers)).toBe(false);
    });

    test('should reject all null answers', () => {
      const answers: ComprehensiveAnswers = { q1: null, q2: null, q3: null };
      expect(validateComprehensiveAssessment(answers)).toBe(false);
    });
  });
});

describe('Formatting Utilities', () => {
  describe('formatDate', () => {
    test('should format date in English', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date, 'en');
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    test('should format date in Russian', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date, 'ru');
      // Should use Russian locale
      expect(formatted).toBeDefined();
    });

    test('should format date in Chinese', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date, 'zh');
      // Should use Chinese locale
      expect(formatted).toBeDefined();
    });
  });

  describe('getRiskLevelColor', () => {
    test('should return correct colors for risk levels', () => {
      expect(getRiskLevelColor('low')).toBe('#4CAF50');
      expect(getRiskLevelColor('moderate')).toBe('#FF9800');
      expect(getRiskLevelColor('high')).toBe('#f44336');
      expect(getRiskLevelColor('invalid' as any)).toBe('#666');
    });
  });
});

describe('Analytics Utilities', () => {
  describe('trackEvent', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    afterEach(() => {
      consoleSpy.mockClear();
    });

    test('should log analytics event', () => {
      trackEvent('test_event', 'test_category', 'test_label', 42);
      expect(consoleSpy).toHaveBeenCalledWith('Analytics Event:', {
        event: 'test_event',
        category: 'test_category',
        label: 'test_label',
        value: 42,
      });
    });

    test('should handle optional parameters', () => {
      trackEvent('simple_event', 'category');
      expect(consoleSpy).toHaveBeenCalledWith('Analytics Event:', {
        event: 'simple_event',
        category: 'category',
        label: undefined,
        value: undefined,
      });
    });
  });
});

describe('Theme Utilities', () => {
  describe('getSystemTheme', () => {
    test('should return light theme by default', () => {
      expect(getSystemTheme()).toBe('light');
    });

    test('should detect dark theme preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: true,
        })),
      });

      expect(getSystemTheme()).toBe('dark');
    });
  });
});

describe('Error Handling Utilities', () => {
  describe('createAppError', () => {
    test('should create error object', () => {
      const error = createAppError('TEST_ERROR', 'Test message', { detail: 'value' });
      expect(error).toEqual({
        code: 'TEST_ERROR',
        message: 'Test message',
        details: { detail: 'value' },
      });
    });

    test('should handle error without details', () => {
      const error = createAppError('SIMPLE_ERROR', 'Simple message');
      expect(error.details).toBeUndefined();
    });
  });
});

describe('Debounce Utility', () => {
  test('should debounce function calls', (done) => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');

    expect(mockFn).not.toHaveBeenCalled();

    setTimeout(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
      done();
    }, 150);
  });
});

describe('Local Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setLocalStorage', () => {
    test('should set item in localStorage', () => {
      setLocalStorage('test_key', { value: 'test' });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify({ value: 'test' })
      );
    });

    test('should handle localStorage errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      setLocalStorage('test_key', { value: 'test' });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save to localStorage:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getLocalStorage', () => {
    test('should get item from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('{"value":"test"}');
      const result = getLocalStorage('test_key', { default: 'value' });
      expect(result).toEqual({ value: 'test' });
    });

    test('should return default value when item not found', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const result = getLocalStorage('missing_key', { default: 'value' });
      expect(result).toEqual({ default: 'value' });
    });

    test('should handle localStorage errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getLocalStorage('error_key', { default: 'value' });
      expect(result).toEqual({ default: 'value' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to read from localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should handle invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = getLocalStorage('invalid_key', { default: 'value' });
      expect(result).toEqual({ default: 'value' });

      consoleSpy.mockRestore();
    });
  });
});
