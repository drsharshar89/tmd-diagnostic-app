import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.print
Object.defineProperty(window, 'print', {
  value: jest.fn(),
});

describe('TMD Assessment App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Reset URL to home
    window.history.pushState({}, '', '/');
  });

  describe('Complete Quick Assessment Flow', () => {
    it('completes a full quick assessment workflow', async () => {
      renderWithRouter(<App />);

      // Start on home page
      expect(screen.getByText('Intelligent TMD Assessment')).toBeInTheDocument();

      // Click Quick Assessment
      const quickAssessmentCard = screen.getByText('Quick Assessment').closest('.option-card');
      fireEvent.click(quickAssessmentCard!);

      // Should navigate to quick assessment
      await waitFor(() => {
        expect(
          screen.getByText(/describe your main jaw or facial pain concern/)
        ).toBeInTheDocument();
      });

      // Fill in the assessment
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: 'I have severe jaw pain and clicking sounds when I open my mouth' },
      });

      // Submit the assessment
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);

      // Should show results
      await waitFor(() => {
        expect(screen.getByText('Assessment Complete')).toBeInTheDocument();
        expect(screen.getByText(/Risk Level.*High Risk/)).toBeInTheDocument(); // Should be high risk due to severe symptoms
      });

      // Test result actions
      expect(screen.getByText('Download PDF Report')).toBeInTheDocument();
      expect(screen.getByText('Print Report')).toBeInTheDocument();
      expect(screen.getByText('Save Assessment Code')).toBeInTheDocument();

      // Test save assessment code
      const saveButton = screen.getByText('Save Assessment Code');
      fireEvent.click(saveButton);

      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tmd_assessments',
        expect.stringContaining('"riskLevel":"high"')
      );
    });
  });

  describe('Complete Comprehensive Assessment Flow', () => {
    it('completes a full comprehensive assessment workflow', async () => {
      renderWithRouter(<App />);

      // Click Comprehensive Assessment
      const comprehensiveCard = screen
        .getByText('Comprehensive Assessment')
        .closest('.option-card');
      fireEvent.click(comprehensiveCard!);

      // Should navigate to comprehensive assessment
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });

      // Answer first question (Yes)
      const yesButton = screen.getByText('Yes');
      fireEvent.click(yesButton);

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);

      // Second question
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      });

      // Answer second question (Yes)
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByText('Next'));

      // Third question
      await waitFor(() => {
        expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
      });

      // Answer third question (Yes)
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByText('Next'));

      // Should show results with high risk (3 yes answers)
      await waitFor(() => {
        expect(screen.getByText('Assessment Complete')).toBeInTheDocument();
        expect(screen.getByText(/Risk Level.*High Risk/)).toBeInTheDocument();
      });

      // Should show recommendations
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/professional evaluation/)).toBeInTheDocument();
    });
  });

  describe('Navigation and Language Features', () => {
    it('allows navigation between pages and language switching', async () => {
      renderWithRouter(<App />);

      // Test language switching
      const languageSelect = screen.getByRole('combobox');
      fireEvent.change(languageSelect, { target: { value: 'ru' } });

      // Should update to Russian
      await waitFor(() => {
        expect(screen.getByText('Интеллектуальная оценка ВНЧС')).toBeInTheDocument();
      });

      // Navigate to quick assessment
      const quickCard = screen.getByText('Быстрая оценка').closest('.option-card');
      fireEvent.click(quickCard!);

      // Should be in Russian
      await waitFor(() => {
        expect(screen.getByText('Быстрая оценка')).toBeInTheDocument();
      });

      // Navigate back
      const backButton = screen.getByText('Назад');
      fireEvent.click(backButton);

      // Should be back home
      await waitFor(() => {
        expect(screen.getByText('Интеллектуальная оценка ВНЧС')).toBeInTheDocument();
      });
    });

    it('preserves theme and language preferences', () => {
      renderWithRouter(<App />);

      // Should save language preference
      const languageSelect = screen.getByRole('combobox');
      fireEvent.change(languageSelect, { target: { value: 'zh' } });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('language', 'zh');

      // Should save theme preference
      const themeButton = screen.getByRole('button', { name: /Switch to dark theme/ });
      fireEvent.click(themeButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('Error Handling', () => {
    it('prevents navigation without completing assessment', async () => {
      renderWithRouter(<App />);

      // Go to quick assessment
      const quickCard = screen.getByText('Quick Assessment').closest('.option-card');
      fireEvent.click(quickCard!);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Try to submit without filling
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();

      // Add partial text (should still be disabled for empty)
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } }); // Just spaces
      expect(nextButton).toBeDisabled();

      // Add real content
      fireEvent.change(textarea, { target: { value: 'Real symptom description' } });
      expect(nextButton).not.toBeDisabled();
    });

    it('handles comprehensive assessment validation', async () => {
      renderWithRouter(<App />);

      // Go to comprehensive assessment
      const comprehensiveCard = screen
        .getByText('Comprehensive Assessment')
        .closest('.option-card');
      fireEvent.click(comprehensiveCard!);

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });

      // Next button should be disabled without answer
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();

      // Answer and proceed
      fireEvent.click(screen.getByText('No'));
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      renderWithRouter(<App />);

      // Check for proper roles
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer

      // Check theme button has aria-label
      const themeButton = screen.getByRole('button', { name: /Switch to/ });
      expect(themeButton).toHaveAttribute('aria-label');

      // Check language select has aria-label
      const languageSelect = screen.getByRole('combobox');
      expect(languageSelect).toHaveAttribute('aria-label');
    });
  });
});
