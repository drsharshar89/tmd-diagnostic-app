import { useEffect, useRef, useState, useCallback } from 'react';

// Accessibility configuration
interface AccessibilityConfig {
  announcePageChanges: boolean;
  enableKeyboardTraps: boolean;
  enforceFocusOrder: boolean;
  provideLiveRegions: boolean;
  checkColorContrast: boolean;
}

// Focus management interface
interface FocusManager {
  trapFocus: (element: HTMLElement) => () => void;
  restoreFocus: () => void;
  announceLiveMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  checkTabOrder: () => void;
}

// Default accessibility configuration
const DEFAULT_A11Y_CONFIG: AccessibilityConfig = {
  announcePageChanges: true,
  enableKeyboardTraps: true,
  enforceFocusOrder: true,
  provideLiveRegions: true,
  checkColorContrast: true,
};

export const useAccessibility = (config: Partial<AccessibilityConfig> = {}) => {
  const fullConfig = { ...DEFAULT_A11Y_CONFIG, ...config };
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);

  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  // Detect if screen reader is active
  const detectScreenReader = useCallback(() => {
    // Check for screen reader indicators
    const hasScreenReaderClass = document.documentElement.classList.contains('sr-only');
    const hasAriaHidden = document.querySelector('[aria-hidden="true"]') !== null;
    const hasAriaLive = document.querySelector('[aria-live]') !== null;

    // Check for reduced motion preference (often indicates assistive technology)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check for high contrast mode
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;

    const screenReaderLikely = hasAriaLive || prefersReducedMotion || highContrast;
    setIsScreenReaderActive(screenReaderLikely);

    return screenReaderLikely;
  }, []);

  // Detect keyboard navigation
  const detectKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      setKeyboardNavigation(true);
      document.body.classList.add('keyboard-navigation');
    }
  }, []);

  const detectMouseNavigation = useCallback(() => {
    setKeyboardNavigation(false);
    document.body.classList.remove('keyboard-navigation');
  }, []);

  // Create live regions for announcements
  const createLiveRegions = useCallback(() => {
    if (!fullConfig.provideLiveRegions) return;

    // Polite live region
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.setAttribute('class', 'sr-only');
    politeRegion.setAttribute('id', 'polite-live-region');
    politeRegion.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `;

    // Assertive live region
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.setAttribute('class', 'sr-only');
    assertiveRegion.setAttribute('id', 'assertive-live-region');
    assertiveRegion.style.cssText = politeRegion.style.cssText;

    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);

    liveRegionRef.current = politeRegion;
  }, [fullConfig.provideLiveRegions]);

  // Announce messages to screen readers
  const announceLiveMessage = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const regionId = priority === 'assertive' ? 'assertive-live-region' : 'polite-live-region';
      const region = document.getElementById(regionId);

      if (region) {
        // Clear the region first
        region.textContent = '';

        // Add the message after a brief delay to ensure screen readers pick it up
        setTimeout(() => {
          region.textContent = message;
        }, 100);

        // Clear the message after it's been announced
        setTimeout(() => {
          region.textContent = '';
        }, 3000);
      }
    },
    []
  );

  // Get all focusable elements
  const getFocusableElements = useCallback((): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(document.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  // Trap focus within a container
  const trapFocus = useCallback(
    (container: HTMLElement): (() => void) => {
      if (!fullConfig.enableKeyboardTraps) return () => {};

      const focusableEls = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }

        if (e.key === 'Escape') {
          // Allow escape to exit focus trap
          container.removeEventListener('keydown', handleKeyDown);
          if (lastFocusedElement.current) {
            lastFocusedElement.current.focus();
          }
        }
      };

      // Store the currently focused element
      lastFocusedElement.current = document.activeElement as HTMLElement;

      // Focus the first element
      if (firstEl) {
        firstEl.focus();
      }

      container.addEventListener('keydown', handleKeyDown);

      // Return cleanup function
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    },
    [fullConfig.enableKeyboardTraps]
  );

  // Restore focus to previously focused element
  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, []);

  // Check tab order
  const checkTabOrder = useCallback(() => {
    if (!fullConfig.enforceFocusOrder) return;

    const focusableEls = getFocusableElements();
    focusableElements.current = focusableEls;

    // Check for logical tab order
    focusableEls.forEach((el, index) => {
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        console.warn(
          `Element at index ${index} has positive tabindex (${tabIndex}). Consider using tabindex="0" or removing tabindex for natural order.`,
          el
        );
      }
    });
  }, [fullConfig.enforceFocusOrder, getFocusableElements]);

  // Check color contrast
  const checkColorContrast = useCallback(() => {
    if (!fullConfig.checkColorContrast) return;

    // This would typically integrate with axe-core or similar library
    // For now, we'll add CSS classes to help with contrast checking
    document.documentElement.classList.add('a11y-contrast-check');
  }, [fullConfig.checkColorContrast]);

  // Skip to content functionality
  const createSkipLinks = useCallback(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }, []);

  // Keyboard shortcuts
  const setupKeyboardShortcuts = useCallback(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Alt + R for main region
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        const main = document.querySelector('main, [role="main"]') as HTMLElement;
        if (main) {
          main.focus();
          announceLiveMessage('Navigated to main content region');
        }
      }

      // Alt + N for navigation
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const nav = document.querySelector('nav, [role="navigation"]') as HTMLElement;
        if (nav) {
          const firstLink = nav.querySelector('a, button') as HTMLElement;
          if (firstLink) {
            firstLink.focus();
            announceLiveMessage('Navigated to main navigation');
          }
        }
      }

      // Alt + S for search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const search = document.querySelector(
          'input[type="search"], [role="search"] input'
        ) as HTMLElement;
        if (search) {
          search.focus();
          announceLiveMessage('Navigated to search');
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [announceLiveMessage]);

  // Initialize accessibility features
  useEffect(() => {
    detectScreenReader();
    createLiveRegions();
    createSkipLinks();
    checkTabOrder();
    checkColorContrast();

    // Set up event listeners
    document.addEventListener('keydown', detectKeyboardNavigation);
    document.addEventListener('mousedown', detectMouseNavigation);
    const shortcutCleanup = setupKeyboardShortcuts();

    // Announce page load
    if (fullConfig.announcePageChanges) {
      setTimeout(() => {
        announceLiveMessage(
          'Page loaded successfully. Use Tab to navigate, Alt+R for main content.'
        );
      }, 1000);
    }

    return () => {
      document.removeEventListener('keydown', detectKeyboardNavigation);
      document.removeEventListener('mousedown', detectMouseNavigation);
      shortcutCleanup();
    };
  }, [
    detectScreenReader,
    createLiveRegions,
    createSkipLinks,
    checkTabOrder,
    checkColorContrast,
    detectKeyboardNavigation,
    detectMouseNavigation,
    setupKeyboardShortcuts,
    announceLiveMessage,
    fullConfig.announcePageChanges,
  ]);

  // Focus management object
  const focusManager: FocusManager = {
    trapFocus,
    restoreFocus,
    announceLiveMessage,
    checkTabOrder,
  };

  // Add missing methods
  const announceToScreenReader = (message: string): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const focusElement = (element: HTMLElement | null): void => {
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return {
    isScreenReaderActive,
    keyboardNavigation,
    currentFocusIndex,
    focusManager,
    detectScreenReader,
    getFocusableElements,
    checkColorContrast,
    announceToScreenReader,
    focusElement
  };
};

// Hook for specific WCAG compliance checks
export const useWCAGCompliance = () => {
  const [complianceScore, setComplianceScore] = useState(0);
  const [violations, setViolations] = useState<string[]>([]);

  const runComplianceCheck = useCallback(async () => {
    const issues: string[] = [];
    let score = 100;

    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
      score -= 10;
    }

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter((input) => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });

    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs missing labels`);
      score -= 15;
    }

    // Check for missing headings
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push('Page missing main heading (h1)');
      score -= 10;
    }

    // Check for color contrast (simplified)
    const elements = document.querySelectorAll('*');
    let contrastIssues = 0;
    elements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const background = styles.backgroundColor;

      // Simplified contrast check (would use more sophisticated algorithm in production)
      if (
        color &&
        background &&
        color !== 'rgba(0, 0, 0, 0)' &&
        background !== 'rgba(0, 0, 0, 0)'
      ) {
        // This is a simplified check - real implementation would calculate actual contrast ratio
        contrastIssues++;
      }
    });

    setViolations(issues);
    setComplianceScore(Math.max(0, score));
  }, []);

  useEffect(() => {
    // Run initial compliance check
    setTimeout(runComplianceCheck, 1000);
  }, [runComplianceCheck]);

  return {
    complianceScore,
    violations,
    runComplianceCheck,
  };
};

// Hook for focus management
export const useFocusManagement = () => {
  const [focusVisible, setFocusVisible] = useState(false);
  const focusHistory = useRef<HTMLElement[]>([]);

  const manageFocus = useCallback((element: HTMLElement) => {
    if (element && element.focus) {
      focusHistory.current.push(document.activeElement as HTMLElement);
      element.focus();
      setFocusVisible(true);
    }
  }, []);

  const restorePreviousFocus = useCallback(() => {
    const previousElement = focusHistory.current.pop();
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }, []);

  useEffect(() => {
    const handleFocusIn = () => setFocusVisible(true);
    const handleFocusOut = () => setFocusVisible(false);

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return {
    focusVisible,
    manageFocus,
    restorePreviousFocus,
    focusHistory: focusHistory.current,
  };
};
