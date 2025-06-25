import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { TMDAssessmentWizard, type TMDAssessmentProps } from './TMDAssessmentWizard';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/shared/hooks', () => ({
  useDebounce: (value: any) => value,
}));

jest.mock('@/hooks/usePerformance', () => ({
  usePerformance: () => ({
    trackPerformance: jest.fn(),
    measureTime: jest.fn(() => 100),
  }),
}));

jest.mock('@/hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: jest.fn(),
    focusElement: jest.fn(),
  }),
}));

jest.mock('@/services/SecurityService', () => ({
  SecurityService: {
    encryptSensitiveData: jest.fn((data: any) => Promise.resolve(data)),
  },
}));

jest.mock('@/services/ErrorLoggingService', () => ({
  ErrorLoggingService: {
    logError: jest.fn(),
  },
  ErrorSeverity: { MEDIUM: 'medium', HIGH: 'high' },
  ErrorCategory: { STORAGE: 'storage', ASSESSMENT: 'assessment' },
}));

jest.mock('@/services/AnalyticsService', () => ({
  AnalyticsService: {
    trackEvent: jest.fn(),
  },
}));

describe('TMDAssessmentWizard', () => {
  const defaultProps: TMDAssessmentProps = {
    onComplete: jest.fn(),
    onSave: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the assessment wizard', () => {
    render(<TMDAssessmentWizard {...defaultProps} />);

    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(screen.getByLabelText('TMD Assessment Wizard')).toBeInTheDocument();
  });

  it('should handle question responses', async () => {
    const user = userEvent.setup();
    render(<TMDAssessmentWizard {...defaultProps} />);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    await user.click(yesButton);

    expect(yesButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should validate required questions', async () => {
    const user = userEvent.setup();
    render(<TMDAssessmentWizard {...defaultProps} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should support accessibility features', () => {
    const accessibilityProps = {
      ...defaultProps,
      accessibility: {
        reducedMotion: false,
        highContrast: true,
        largeText: true,
        screenReader: false,
      },
    };

    render(<TMDAssessmentWizard {...accessibilityProps} />);

    const wizard = screen.getByTestId('tmd-assessment-wizard');
    expect(wizard).toHaveClass('high-contrast');
    expect(wizard).toHaveClass('large-text');
  });
});
