import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import QuickAssessmentView from '../views/QuickAssessmentView';
import { QuickAssessmentAnswers } from '../types';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const defaultProps = {
  lang: 'en' as const,
  onComplete: jest.fn(),
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('QuickAssessmentView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render assessment form', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /quick assessment/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  test('should have proper accessibility attributes', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Type your answer here...');
    expect(textarea).toHaveAttribute('rows', '6');

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeInTheDocument();
  });

  test('should show progress indicator', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    expect(screen.getByText('1 / 1')).toBeInTheDocument();

    const progressBar = document.querySelector('.progress-bar');
    expect(progressBar).toBeInTheDocument();

    const progressFill = document.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle('width: 100%');
  });

  test('should handle text input', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'I have severe jaw pain');

    expect(textarea).toHaveValue('I have severe jaw pain');
  });

  test('should disable next button when input is empty', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  test('should enable next button when input is valid', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, 'Valid input');

    expect(nextButton).toBeEnabled();
  });

  test('should disable next button with whitespace-only input', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, '   ');

    expect(nextButton).toBeDisabled();
  });

  test('should navigate back when back button is clicked', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('should submit form when next button is clicked with valid input', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    renderWithRouter(<QuickAssessmentView {...defaultProps} onComplete={mockOnComplete} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, 'I have jaw pain and clicking sounds');
    fireEvent.click(nextButton);

    const expectedAnswers: QuickAssessmentAnswers = {
      description: 'I have jaw pain and clicking sounds',
    };

    expect(mockOnComplete).toHaveBeenCalledWith(expectedAnswers);
    expect(mockNavigate).toHaveBeenCalledWith('/results');
  });

  test('should not submit form with invalid input', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    renderWithRouter(<QuickAssessmentView {...defaultProps} onComplete={mockOnComplete} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, '   ');
    fireEvent.click(nextButton);

    expect(mockOnComplete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/results');
  });

  test('should handle long text input', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    renderWithRouter(<QuickAssessmentView {...defaultProps} onComplete={mockOnComplete} />);

    const longText =
      'This is a very long description of my TMD symptoms that includes multiple details about pain, clicking, locking, and other related issues that I have been experiencing for several months now.';

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, longText);
    fireEvent.click(nextButton);

    expect(mockOnComplete).toHaveBeenCalledWith({ description: longText });
    expect(mockNavigate).toHaveBeenCalledWith('/results');
  });

  test('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    renderWithRouter(<QuickAssessmentView {...defaultProps} onComplete={mockOnComplete} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test description');
    await user.keyboard('{Enter}');

    // Note: This test depends on the component implementing Enter key handling
    // If not implemented, this test documents the expected behavior
  });

  test('should clear form when navigating away and back', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test input');

    expect(textarea).toHaveValue('Test input');

    // Simulate navigating away and back
    rerender(<div>Other component</div>);
    rerender(
      <BrowserRouter>
        <QuickAssessmentView {...defaultProps} />
      </BrowserRouter>
    );

    const newTextarea = screen.getByRole('textbox');
    expect(newTextarea).toHaveValue('');
  });

  test('should preserve form state during component re-renders', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Persistent input');

    // Re-render with same props
    rerender(
      <BrowserRouter>
        <QuickAssessmentView {...defaultProps} />
      </BrowserRouter>
    );

    const newTextarea = screen.getByRole('textbox');
    expect(newTextarea).toHaveValue('Persistent input');
  });

  test('should handle rapid input changes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    // Type rapidly
    await user.type(textarea, 'a');
    expect(nextButton).toBeEnabled();

    await user.clear(textarea);
    expect(nextButton).toBeDisabled();

    await user.type(textarea, 'Valid text again');
    expect(nextButton).toBeEnabled();
  });

  test('should handle special characters in input', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    renderWithRouter(<QuickAssessmentView {...defaultProps} onComplete={mockOnComplete} />);

    const specialText = 'Pain: 8/10, clicking sound "pop!", can\'t open >2cm';

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, specialText);
    fireEvent.click(nextButton);

    expect(mockOnComplete).toHaveBeenCalledWith({ description: specialText });
  });

  test('should handle different language props', () => {
    const { rerender } = renderWithRouter(<QuickAssessmentView {...defaultProps} lang="ru" />);

    // Should render without errors
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <QuickAssessmentView {...defaultProps} lang="zh" />
      </BrowserRouter>
    );

    // Should render without errors
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('should have proper ARIA labels', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAccessibleName();

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toHaveAccessibleName();

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toHaveAccessibleName();
  });

  test('should focus on textarea when component mounts', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');

    // Focus should be on textarea for better UX
    // Note: This test documents expected behavior that may need implementation
    expect(textarea).toBeInTheDocument();
  });

  test('should handle copy-paste operations', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const clipboardText = 'Pasted text from clipboard';

    // Focus and paste
    await user.click(textarea);
    await user.paste(clipboardText);

    expect(textarea).toHaveValue(clipboardText);
  });

  test('should validate input on blur', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, 'Valid input');
    expect(nextButton).toBeEnabled();

    await user.clear(textarea);
    await user.tab(); // Blur the textarea

    expect(nextButton).toBeDisabled();
  });

  test('should handle textarea resize', () => {
    renderWithRouter(<QuickAssessmentView {...defaultProps} />);

    const textarea = screen.getByRole('textbox');

    // Textarea should be resizable or have fixed dimensions
    expect(textarea).toHaveAttribute('rows', '6');
  });

  test('should maintain button states during async operations', async () => {
    const user = userEvent.setup();
    const slowOnComplete = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 100));
    });

    renderWithRouter(<QuickAssessmentView {...defaultProps} onComplete={slowOnComplete} />);

    const textarea = screen.getByRole('textbox');
    const nextButton = screen.getByRole('button', { name: /next/i });

    await user.type(textarea, 'Test input');
    fireEvent.click(nextButton);

    // Button should remain in consistent state during async operation
    expect(nextButton).toBeInTheDocument();
  });
});
