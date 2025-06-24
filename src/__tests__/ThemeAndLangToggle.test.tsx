import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeAndLangToggle from '../components/ThemeAndLangToggle';

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

describe('ThemeAndLangToggle', () => {
  const mockOnLanguageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('light');
  });

  it('renders theme toggle button and language selector', () => {
    render(<ThemeAndLangToggle currentLang="en" onLanguageChange={mockOnLanguageChange} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays moon icon for light theme', () => {
    render(<ThemeAndLangToggle currentLang="en" onLanguageChange={mockOnLanguageChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
  });

  it('toggles theme when button is clicked', () => {
    render(<ThemeAndLangToggle currentLang="en" onLanguageChange={mockOnLanguageChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('calls onLanguageChange when language is selected', () => {
    render(<ThemeAndLangToggle currentLang="en" onLanguageChange={mockOnLanguageChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ru' } });

    expect(mockOnLanguageChange).toHaveBeenCalledWith('ru');
  });

  it('shows correct language options', () => {
    render(<ThemeAndLangToggle currentLang="en" onLanguageChange={mockOnLanguageChange} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('en');
    expect(options[1]).toHaveValue('ru');
    expect(options[2]).toHaveValue('zh');
  });

  it('sets data-theme attribute on document', () => {
    render(<ThemeAndLangToggle currentLang="en" onLanguageChange={mockOnLanguageChange} />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
