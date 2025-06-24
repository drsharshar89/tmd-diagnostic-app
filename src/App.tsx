import React, { useState, useEffect, useCallback, memo, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './shared/ui/organisms/ErrorBoundary';
import ThemeAndLangToggle from './components/ThemeAndLangToggle';
import { Language } from './i18n';
import {
  QuickAssessmentAnswers,
  ComprehensiveAnswers,
  AssessmentType,
  Theme,
} from './shared/types';
import { getSystemTheme } from './shared/utils';
import { securityService } from './services/SecurityService';

// =====================================================
// LAZY-LOADED COMPONENTS FOR CODE SPLITTING
// =====================================================

// Lazy load heavy views to reduce initial bundle size
const HomeView = React.lazy(() => import('./views/HomeView'));
const QuickAssessmentView = React.lazy(() => import('./views/QuickAssessmentView'));
const ComprehensiveView = React.lazy(() => import('./views/ComprehensiveView'));
const ResultView = React.lazy(() => import('./views/ResultView'));

// =====================================================
// LOADING COMPONENTS
// =====================================================

const RouteLoadingSpinner: React.FC = memo(() => (
  <div
    className="route-loading"
    role="status"
    aria-label="Loading page"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }}
      />
      <p>Loading...</p>
    </div>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
));

RouteLoadingSpinner.displayName = 'RouteLoadingSpinner';

// =====================================================
// MAIN APP COMPONENT
// =====================================================

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
          <Suspense fallback={<RouteLoadingSpinner />}>
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
          </Suspense>
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
