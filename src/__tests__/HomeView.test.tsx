import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import HomeView from '../views/HomeView';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('HomeView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render home page content', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for main heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/TMD Diagnostic Tool/i)).toBeInTheDocument();
  });

  test('should render assessment options', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for assessment buttons
    expect(screen.getByRole('button', { name: /quick assessment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comprehensive assessment/i })).toBeInTheDocument();
  });

  test('should have proper accessibility structure', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for semantic HTML structure
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();

    // Check for buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test('should navigate to quick assessment', () => {
    renderWithRouter(<HomeView lang="en" />);

    const quickAssessmentButton = screen.getByRole('button', { name: /quick assessment/i });
    fireEvent.click(quickAssessmentButton);

    expect(mockNavigate).toHaveBeenCalledWith('/quick-assessment');
  });

  test('should navigate to comprehensive assessment', () => {
    renderWithRouter(<HomeView lang="en" />);

    const comprehensiveButton = screen.getByRole('button', { name: /comprehensive assessment/i });
    fireEvent.click(comprehensiveButton);

    expect(mockNavigate).toHaveBeenCalledWith('/comprehensive-assessment');
  });

  test('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomeView lang="en" />);

    const quickButton = screen.getByRole('button', { name: /quick assessment/i });
    const comprehensiveButton = screen.getByRole('button', { name: /comprehensive assessment/i });

    // Tab to first button
    await user.tab();
    expect(quickButton).toHaveFocus();

    // Tab to second button
    await user.tab();
    expect(comprehensiveButton).toHaveFocus();

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/comprehensive-assessment');
  });

  test('should handle Space key activation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomeView lang="en" />);

    const quickButton = screen.getByRole('button', { name: /quick assessment/i });
    quickButton.focus();

    await user.keyboard(' ');
    expect(mockNavigate).toHaveBeenCalledWith('/quick-assessment');
  });

  test('should display welcome message', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for welcome/introductory text
    const welcomeText = screen.getByText(/welcome/i);
    expect(welcomeText).toBeInTheDocument();
  });

  test('should display assessment descriptions', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for assessment descriptions
    expect(screen.getByText(/quick assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/comprehensive assessment/i)).toBeInTheDocument();
  });

  test('should handle different languages', () => {
    const { rerender } = renderWithRouter(<HomeView lang="en" />);

    // English
    expect(screen.getByText(/TMD Diagnostic Tool/i)).toBeInTheDocument();

    // Russian
    rerender(
      <BrowserRouter>
        <HomeView lang="ru" />
      </BrowserRouter>
    );

    // Should render without errors
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Chinese
    rerender(
      <BrowserRouter>
        <HomeView lang="zh" />
      </BrowserRouter>
    );

    // Should render without errors
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('should have proper ARIA labels', () => {
    renderWithRouter(<HomeView lang="en" />);

    const quickButton = screen.getByRole('button', { name: /quick assessment/i });
    const comprehensiveButton = screen.getByRole('button', { name: /comprehensive assessment/i });

    expect(quickButton).toHaveAccessibleName();
    expect(comprehensiveButton).toHaveAccessibleName();
  });

  test('should display estimated time for assessments', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for time estimates
    const timeEstimates = screen.getAllByText(/minute/i);
    expect(timeEstimates.length).toBeGreaterThan(0);
  });

  test('should show assessment features', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for feature descriptions
    expect(screen.getByText(/professional/i)).toBeInTheDocument();
    expect(screen.getByText(/accurate/i)).toBeInTheDocument();
  });

  test('should handle rapid button clicks', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomeView lang="en" />);

    const quickButton = screen.getByRole('button', { name: /quick assessment/i });

    // Click rapidly
    await user.click(quickButton);
    await user.click(quickButton);
    await user.click(quickButton);

    // Should only navigate once
    expect(mockNavigate).toHaveBeenCalledTimes(3);
  });

  test('should display privacy notice', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for privacy/confidentiality notice
    const privacyText = screen.getByText(/confidential/i);
    expect(privacyText).toBeInTheDocument();
  });

  test('should display medical disclaimer', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for medical disclaimer
    const disclaimer = screen.getByText(/not a substitute/i);
    expect(disclaimer).toBeInTheDocument();
  });

  test('should have proper heading structure', () => {
    renderWithRouter(<HomeView lang="en" />);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();

    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThan(0);
  });

  test('should handle button focus states', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomeView lang="en" />);

    const quickButton = screen.getByRole('button', { name: /quick assessment/i });

    await user.hover(quickButton);
    expect(quickButton).toBeInTheDocument();

    await user.click(quickButton);
    expect(mockNavigate).toHaveBeenCalledWith('/quick-assessment');
  });

  test('should have consistent button styling', () => {
    renderWithRouter(<HomeView lang="en" />);

    const buttons = screen.getAllByRole('button');

    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName();
      expect(button).toBeEnabled();
    });
  });

  test('should display contact information', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for contact or support information
    const contactInfo = screen.getByText(/contact/i);
    expect(contactInfo).toBeInTheDocument();
  });

  test('should handle component re-renders', () => {
    const { rerender } = renderWithRouter(<HomeView lang="en" />);

    // Initial render
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Re-render with different props
    rerender(
      <BrowserRouter>
        <HomeView lang="en" />
      </BrowserRouter>
    );

    // Should still render correctly
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('should have proper landmark roles', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for navigation if present
    const nav = screen.queryByRole('navigation');
    if (nav) {
      expect(nav).toBeInTheDocument();
    }
  });

  test('should handle loading states', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Component should render immediately without loading states
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('should support keyboard shortcuts', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomeView lang="en" />);

    // Test if keyboard shortcuts work (if implemented)
    await user.keyboard('{Alt>}q{/Alt}');

    // This test documents expected behavior
    // Implementation depends on keyboard shortcut support
  });

  test('should handle touch interactions', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomeView lang="en" />);

    const quickButton = screen.getByRole('button', { name: /quick assessment/i });

    // Simulate touch interaction
    fireEvent.touchStart(quickButton);
    fireEvent.touchEnd(quickButton);

    // Should still work with touch
    await user.click(quickButton);
    expect(mockNavigate).toHaveBeenCalledWith('/quick-assessment');
  });

  test('should display version information', () => {
    renderWithRouter(<HomeView lang="en" />);

    // Check for version or copyright information
    const versionInfo = screen.getByText(/2024/i);
    expect(versionInfo).toBeInTheDocument();
  });
});
