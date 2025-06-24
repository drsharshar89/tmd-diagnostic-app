import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TMDAssessmentWizard, type TMDAssessmentProps } from './TMDAssessmentWizard';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
  ErrorSeverity: { MEDIUM: 'medium', HIGH: 'high' },
  ErrorCategory: { STORAGE: 'storage', ASSESSMENT: 'assessment' },
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
