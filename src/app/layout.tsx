import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/ui/organisms';
import { Header } from '@/shared/ui/organisms';
import { Footer } from '@/shared/ui/organisms';
import { useTheme } from '@/shared/hooks';
import { Theme } from '@/shared/types';

interface LayoutProps {
  theme: Theme;
  onThemeToggle: () => void;
  lang: string;
  onLanguageChange: (lang: string) => void;
}

/**
 * Root application layout component
 * Provides consistent header, footer, and theme management
 */
export const Layout: React.FC<LayoutProps> = memo(
  ({ theme, onThemeToggle, lang, onLanguageChange }) => {
    return (
      <ErrorBoundary>
        <div className="app" data-theme={theme}>
          <Header
            lang={lang}
            onLanguageChange={onLanguageChange}
            theme={theme}
            onThemeToggle={onThemeToggle}
          />

          <main className="main" role="main" id="main-content">
            <Outlet />
          </main>

          <Footer />
        </div>
      </ErrorBoundary>
    );
  }
);

Layout.displayName = 'Layout';
