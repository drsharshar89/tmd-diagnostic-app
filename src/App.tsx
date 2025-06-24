import React, { useState, useEffect, useCallback, memo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './shared/ui/organisms/ErrorBoundary';
import ThemeAndLangToggle from './components/ThemeAndLangToggle';
import HomeView from './views/HomeView';
import QuickAssessmentView from './views/QuickAssessmentView';
import ComprehensiveView from './views/ComprehensiveView';
import ResultView from './views/ResultView';
import { Language } from './i18n';
import {
  QuickAssessmentAnswers,
  ComprehensiveAnswers,
  AssessmentType,
  Theme,
} from './shared/types';
import { getSystemTheme } from './shared/utils';
import { securityService } from './services/SecurityService';

const App: React.FC = memo(() => {
  // Language state management
  const [lang, setLang] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang as Language) || 'en';
  });

  // Theme state management - Enhanced with FSD utilities
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || getSystemTheme();
  });

  // Assessment state management
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(null);
  const [quickAnswers, setQuickAnswers] = useState<QuickAssessmentAnswers>();
  const [comprehensiveAnswers, setComprehensiveAnswers] = useState<ComprehensiveAnswers>();

  // Loading state management
  const [loadError, setLoadError] = useState(false);

  // Initialize security and generate CSRF token
  useEffect(() => {
    securityService.generateCSRFToken();

    // Clean up on unmount
    return () => {
      securityService.cleanup();
    };
  }, []);

  // Persist language changes
  useEffect(() => {
    localStorage.setItem('language', lang);
  }, [lang]);

  // Persist theme changes and apply to DOM
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle assessment completions with validation
  const handleQuickComplete = useCallback((answers: QuickAssessmentAnswers): void => {
    try {
      setAssessmentType('quick');
      setQuickAnswers(answers);
    } catch (error) {
      throw error; // Re-throw for proper error boundary handling
    }
  }, []);

  const handleComprehensiveComplete = useCallback((answers: ComprehensiveAnswers): void => {
    try {
      setAssessmentType('comprehensive');
      setComprehensiveAnswers(answers);
    } catch (error) {
      throw error; // Re-throw for proper error boundary handling
    }
  }, []);

  const handleThemeToggle = useCallback((): void => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  if (loadError) {
    return (
      <div style={{ color: 'red', padding: 32 }}>
        Error: App failed to load. Please check the console for details and try clearing your
        browser cache.
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app" data-theme={theme}>
        <header className="header" role="banner">
          <nav className="nav" role="navigation" aria-label="Main navigation">
            <Link to="/" className="nav-link" aria-label="Home - TMD Assessment Tool">
              TMD Assessment Tool
            </Link>
          </nav>
          <ThemeAndLangToggle
            currentLang={lang}
            onLanguageChange={setLang}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />
        </header>

        <main className="main" role="main" id="main-content">
          <Routes>
            <Route path="/" element={<HomeView lang={lang} />} />
            <Route
              path="/quick-assessment"
              element={<QuickAssessmentView lang={lang} onComplete={handleQuickComplete} />}
            />
            <Route
              path="/comprehensive-assessment"
              element={<ComprehensiveView lang={lang} onComplete={handleComprehensiveComplete} />}
            />
            <Route
              path="/results"
              element={
                <ResultView
                  lang={lang}
                  assessmentType={assessmentType}
                  quickAnswers={quickAnswers}
                  comprehensiveAnswers={comprehensiveAnswers}
                />
              }
            />
          </Routes>
        </main>

        <footer className="footer" role="contentinfo">
          <p>© 2024 TMD Diagnostic Tool. Professional Medical Assessment.</p>
          <p className="footer-disclaimer">
            <small>
              This tool is for educational purposes only. Always consult a healthcare professional.
            </small>
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
