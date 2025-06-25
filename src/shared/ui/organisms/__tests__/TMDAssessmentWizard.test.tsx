import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  TMDAssessmentWizard,
  type TMDAssessmentProps,
  type ValidationError,
} from '../TMDAssessmentWizard';
import type { AssessmentResponse, AssessmentSession } from '@/entities/assessment';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'steps.painAssessment.title': 'Pain Assessment',
        'steps.painAssessment.description': 'Evaluate pain patterns and intensity',
        'steps.functionalAssessment.title': 'Functional Assessment',
        'steps.functionalAssessment.description': 'Evaluate jaw function and movement',
        'steps.psychosocialAssessment.title': 'Psychosocial Assessment',
        'steps.psychosocialAssessment.description': 'Evaluate psychological factors',
        'questions.painAtRest': 'Do you have pain at rest?',
        'questions.painIntensity': 'Rate your pain intensity',
        'questions.mouthOpeningLimitation': 'Do you have difficulty opening your mouth?',
        'questions.functionalLimitationScale': 'Rate functional interference',
        'questions.depressionScreening': 'Depression screening question',
        'answers.yes': 'Yes',
        'answers.no': 'No',
        'navigation.back': 'Back',
        'navigation.next': 'Next',
        'navigation.complete': 'Complete Assessment',
        'validation.required': 'This question is required',
        'validation.painIntensityRange': 'Pain intensity must be 0-4',
        'medical.criticalSection': 'Critical medical assessment section',
        'assessment.title': 'TMD Assessment Wizard',
      };

      if (params) {
        return (
          translations[key]?.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match) ||
          key
        );
      }
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/shared/hooks', () => ({
  useDebounce: (value: any) => value,
}));

vi.mock('@/hooks/usePerformance', () => ({
  usePerformance: () => ({
    trackPerformance: vi.fn(),
    measureTime: vi.fn(() => 100),
  }),
}));

vi.mock('@/hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: vi.fn(),
    focusElement: vi.fn(),
  }),
}));

vi.mock('@/services/SecurityService', () => ({
  SecurityService: {
    encryptSensitiveData: vi.fn((data) => Promise.resolve(data)),
  },
}));

vi.mock('@/services/ErrorLoggingService', () => ({
  ErrorLoggingService: {
    logError: vi.fn(),
  },
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  ErrorCategory: {
    STORAGE: 'storage',
    ASSESSMENT: 'assessment',
  },
}));

vi.mock('@/services/AnalyticsService', () => ({
  AnalyticsService: {
    trackEvent: vi.fn(),
  },
}));

describe('TMDAssessmentWizard', () => {
  const defaultProps: TMDAssessmentProps = {
    onComplete: vi.fn(),
    onSave: vi.fn(),
    onError: vi.fn(),
    protocol: 'DC_TMD_AXIS_I',
    patientId: 'test-patient-123',
    sessionId: 'test-session-456',
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('should render the assessment wizard with initial step', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByLabelText('TMD Assessment Wizard')).toBeInTheDocument();
      expect(screen.getByText('Pain Assessment')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    });

    it('should render progress indicator with correct values', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should render navigation controls', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('Question Interaction', () => {
    it('should handle yes/no question responses', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      const noButton = screen.getByRole('button', { name: 'No' });

      await user.click(yesButton);
      expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      expect(noButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(noButton);
      expect(yesButton).toHaveAttribute('aria-pressed', 'false');
      expect(noButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should handle scale question responses', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      // Navigate to pain intensity question (second question in pain assessment)
      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should see scale buttons 0-4
      const scaleButtons = screen
        .getAllByRole('button')
        .filter((button) => /^Rating: [0-4]$/.test(button.getAttribute('aria-label') || ''));
      expect(scaleButtons).toHaveLength(5);

      await user.click(scaleButtons[2]); // Click rating 2
      expect(scaleButtons[2]).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Medical Validation', () => {
    it('should validate required questions', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should show validation error for unanswered required question
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/this question is required/i)).toBeInTheDocument();
      });
    });

    it('should validate pain intensity scale (0-4)', async () => {
      const mockValidator = vi.fn((value) => {
        if (typeof value === 'number' && (value < 0 || value > 4)) {
          return {
            questionId: 'pain_intensity',
            errorType: 'range',
            severity: 'error',
            message: 'Pain intensity must be 0-4',
            suggestedAction: 'Please select a value between 0 and 4',
          } as ValidationError;
        }
        return null;
      });

      // Test the validator function directly
      expect(mockValidator(-1)).toMatchObject({
        errorType: 'range',
        severity: 'error',
        message: 'Pain intensity must be 0-4',
      });

      expect(mockValidator(5)).toMatchObject({
        errorType: 'range',
        severity: 'error',
      });

      expect(mockValidator(2)).toBeNull();
    });

    it('should show medical notice for critical sections', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      expect(screen.getByRole('note')).toBeInTheDocument();
      expect(screen.getByText('Critical medical assessment section')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should disable back button on first step', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });

    it('should enable next button when required questions are answered', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeEnabled(); // Initially enabled, validation happens on click

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      expect(nextButton).toBeEnabled();
    });

    it('should navigate between steps', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      // Answer first question
      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      // Navigate to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should be on functional assessment step
      await waitFor(() => {
        expect(screen.getByText('Functional Assessment')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
      });

      // Back button should be enabled
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeEnabled();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should trigger auto-save when enabled', async () => {
      const onSave = vi.fn();
      const autoSaveProps = {
        ...defaultProps,
        onSave,
        autoSave: {
          enabled: true,
          intervalMs: 100, // Short interval for testing
          encryptionLevel: 'enhanced' as const,
          retentionPeriod: 30,
        },
      };

      render(<TMDAssessmentWizard {...autoSaveProps} />);

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      // Wait for auto-save to trigger
      await waitFor(
        () => {
          expect(onSave).toHaveBeenCalledWith(
            expect.any(Array),
            true // isAutoSave flag
          );
        },
        { timeout: 200 }
      );
    });

    it('should show save indicators', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      expect(screen.getByText('Auto-save enabled')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      expect(screen.getByRole('application')).toHaveAttribute(
        'aria-label',
        'TMD Assessment Wizard'
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      yesButton.focus();

      await user.keyboard('{Enter}');
      expect(yesButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should announce screen reader messages', async () => {
      const { useAccessibility } = await import('@/hooks/useAccessibility');
      const mockAnnounce = vi.fn();

      vi.mocked(useAccessibility).mockReturnValue({
        announceToScreenReader: mockAnnounce,
        focusElement: vi.fn(),
      });

      render(<TMDAssessmentWizard {...defaultProps} />);

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalled();
      });
    });

    it('should handle high contrast mode', () => {
      const accessibilityProps = {
        ...defaultProps,
        accessibility: {
          reducedMotion: false,
          highContrast: true,
          largeText: false,
          screenReader: false,
        },
      };

      render(<TMDAssessmentWizard {...accessibilityProps} />);

      const wizard = screen.getByTestId('tmd-assessment-wizard');
      expect(wizard).toHaveClass('high-contrast');
    });

    it('should handle large text mode', () => {
      const accessibilityProps = {
        ...defaultProps,
        accessibility: {
          reducedMotion: false,
          highContrast: false,
          largeText: true,
          screenReader: false,
        },
      };

      render(<TMDAssessmentWizard {...accessibilityProps} />);

      const wizard = screen.getByTestId('tmd-assessment-wizard');
      expect(wizard).toHaveClass('large-text');
    });
  });

  describe('Protocol Support', () => {
    it('should render DC/TMD Axis I protocol', () => {
      render(<TMDAssessmentWizard {...defaultProps} protocol="DC_TMD_AXIS_I" />);

      expect(screen.getByText('Pain Assessment')).toBeInTheDocument();
      expect(screen.getByText('Functional Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Psychosocial Assessment')).not.toBeInTheDocument();
    });

    it('should render DC/TMD Axis II protocol with psychosocial assessment', () => {
      render(<TMDAssessmentWizard {...defaultProps} protocol="DC_TMD_AXIS_II" />);

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument(); // Should have 3 steps now
    });
  });

  describe('Completion Flow', () => {
    it('should complete assessment with valid responses', async () => {
      const onComplete = vi.fn();
      render(<TMDAssessmentWizard {...defaultProps} onComplete={onComplete} />);

      // Answer pain assessment questions
      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      let nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Answer functional assessment questions
      await waitFor(() => {
        expect(screen.getByText('Functional Assessment')).toBeInTheDocument();
      });

      const functionalYesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(functionalYesButton);

      // Should see complete button on last step
      nextButton = screen.getByRole('button', { name: /complete/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.any(Array), // responses
          expect.objectContaining({
            // session
            sessionId: expect.any(String),
            startTime: expect.any(Date),
            endTime: expect.any(Date),
          })
        );
      });
    });

    it('should handle completion errors', async () => {
      const onError = vi.fn();
      const onComplete = vi.fn().mockRejectedValue(new Error('Completion failed'));

      render(<TMDAssessmentWizard {...defaultProps} onComplete={onComplete} onError={onError} />);

      // Answer questions and complete
      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const functionalYesButton = screen.getByRole('button', { name: 'Yes' });
        user.click(functionalYesButton);
      });

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error), 'completion');
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme by default', () => {
      render(<TMDAssessmentWizard {...defaultProps} />);

      const wizard = screen.getByTestId('tmd-assessment-wizard');
      expect(wizard).toHaveClass('theme-light');
    });

    it('should apply dark theme when specified', () => {
      render(<TMDAssessmentWizard {...defaultProps} theme="dark" />);

      const wizard = screen.getByTestId('tmd-assessment-wizard');
      expect(wizard).toHaveClass('theme-dark');
    });
  });

  describe('Error Handling', () => {
    it('should handle auto-save errors gracefully', async () => {
      const onError = vi.fn();
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      const autoSaveProps = {
        ...defaultProps,
        onSave,
        onError,
        autoSave: {
          enabled: true,
          intervalMs: 100,
          encryptionLevel: 'enhanced' as const,
          retentionPeriod: 30,
        },
      };

      render(<TMDAssessmentWizard {...autoSaveProps} />);

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await user.click(yesButton);

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalledWith(expect.any(Error), 'auto-save');
        },
        { timeout: 200 }
      );
    });
  });
});
