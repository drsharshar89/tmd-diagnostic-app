// Performance Utilities - FSD Shared Layer
// Functions for optimizing user interactions and performance

/**
 * Debounce function to limit the rate of function calls
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit the rate of function calls
 * @param func - Function to throttle
 * @param wait - Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
};

/**
 * Performance Monitoring and Web Vitals Tracking
 * Medical-grade performance monitoring for TMD diagnostic application
 */

import React from 'react';
import { onCLS, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// =====================================================
// PERFORMANCE METRICS TYPES
// =====================================================

export interface PerformanceMetrics {
  // Core Web Vitals
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  routeLoadTime: number | null;
  assessmentResponseTime: number | null;
  memoryUsage: number | null;

  // Timestamps
  timestamp: number;
  userAgent: string;
  url: string;
}

export interface RoutePerformance {
  route: string;
  loadTime: number;
  timestamp: number;
}

export interface AssessmentPerformance {
  assessmentType: 'quick' | 'comprehensive';
  responseTime: number;
  questionCount: number;
  timestamp: number;
}

// =====================================================
// PERFORMANCE MONITORING CLASS
// =====================================================

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private routeStartTime: number | null = null;
  private assessmentStartTime: number | null = null;
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeWebVitals();
    this.initializeCustomMetrics();
    this.setupPerformanceObservers();
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private initializeWebVitals(): void {
    try {
      // Cumulative Layout Shift
      onCLS((metric: Metric) => {
        this.metrics.cls = metric.value;
        this.reportMetric('CLS', metric.value, metric.rating);
      });

      // First Contentful Paint
      onFCP((metric: Metric) => {
        this.metrics.fcp = metric.value;
        this.reportMetric('FCP', metric.value, metric.rating);
      });

      // Largest Contentful Paint
      onLCP((metric: Metric) => {
        this.metrics.lcp = metric.value;
        this.reportMetric('LCP', metric.value, metric.rating);
      });

      // Time to First Byte
      onTTFB((metric: Metric) => {
        this.metrics.ttfb = metric.value;
        this.reportMetric('TTFB', metric.value, metric.rating);
      });
    } catch (error) {
      console.warn('Web Vitals not supported in this environment:', error);
    }
  }

  /**
   * Initialize custom performance metrics
   */
  private initializeCustomMetrics(): void {
    this.metrics = {
      ...this.metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Setup Performance Observers for detailed monitoring
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.analyzeNavigationTiming(navEntry);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.analyzeResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.reportLongTask(entry);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Error setting up performance observers:', error);
    }
  }

  /**
   * Start tracking route load time
   */
  startRouteTracking(route: string): void {
    this.routeStartTime = performance.now();
    console.log(`🚀 Starting route tracking for: ${route}`);
  }

  /**
   * End route tracking and record metrics
   */
  endRouteTracking(route: string): void {
    if (this.routeStartTime) {
      const loadTime = performance.now() - this.routeStartTime;
      this.metrics.routeLoadTime = loadTime;

      this.reportRoutePerformance({
        route,
        loadTime,
        timestamp: Date.now(),
      });

      this.routeStartTime = null;
    }
  }

  /**
   * Start tracking assessment response time
   */
  startAssessmentTracking(assessmentType: 'quick' | 'comprehensive'): void {
    this.assessmentStartTime = performance.now();
    console.log(`📊 Starting assessment tracking for: ${assessmentType}`);
  }

  /**
   * End assessment tracking
   */
  endAssessmentTracking(assessmentType: 'quick' | 'comprehensive', questionCount: number): void {
    if (this.assessmentStartTime) {
      const responseTime = performance.now() - this.assessmentStartTime;
      this.metrics.assessmentResponseTime = responseTime;

      this.reportAssessmentPerformance({
        assessmentType,
        responseTime,
        questionCount,
        timestamp: Date.now(),
      });

      this.assessmentStartTime = null;
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): number | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      return memory.usedJSHeapSize;
    }
    return null;
  }

  /**
   * Analyze navigation timing
   */
  private analyzeNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
      domComplete: entry.domComplete - entry.domContentLoadedEventStart,
    };

    console.log('📈 Navigation Timing:', metrics);
    this.reportNavigationMetrics(metrics);
  }

  /**
   * Analyze resource timing
   */
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const size = entry.transferSize || 0;

    // Flag slow resources
    if (duration > 1000) {
      // > 1 second
      console.warn(`🐌 Slow resource detected: ${entry.name} (${duration.toFixed(2)}ms)`);
    }

    // Flag large resources
    if (size > 500000) {
      // > 500KB
      console.warn(`📦 Large resource detected: ${entry.name} (${(size / 1024).toFixed(2)}KB)`);
    }
  }

  /**
   * Report long tasks that block the main thread
   */
  private reportLongTask(entry: PerformanceEntry): void {
    const duration = entry.duration;
    console.warn(`⏰ Long task detected: ${duration.toFixed(2)}ms`);

    // Report to analytics if task is significantly long
    if (duration > 100) {
      this.reportToAnalytics('long-task', {
        duration,
        startTime: entry.startTime,
        name: entry.name,
      });
    }
  }

  /**
   * Report metric to console and analytics
   */
  private reportMetric(name: string, value: number, rating: string): void {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${name}: ${value.toFixed(2)}ms (${rating})`);

    this.reportToAnalytics('web-vital', {
      name,
      value,
      rating,
      timestamp: Date.now(),
    });
  }

  /**
   * Report route performance
   */
  private reportRoutePerformance(data: RoutePerformance): void {
    console.log(`🎯 Route Performance: ${data.route} loaded in ${data.loadTime.toFixed(2)}ms`);

    this.reportToAnalytics('route-performance', data);
  }

  /**
   * Report assessment performance
   */
  private reportAssessmentPerformance(data: AssessmentPerformance): void {
    const avgTimePerQuestion = data.responseTime / data.questionCount;
    console.log(
      `🏥 Assessment Performance: ${data.assessmentType} completed in ${data.responseTime.toFixed(2)}ms ` +
        `(${avgTimePerQuestion.toFixed(2)}ms per question)`
    );

    this.reportToAnalytics('assessment-performance', data);
  }

  /**
   * Report navigation metrics
   */
  private reportNavigationMetrics(metrics: Record<string, number>): void {
    this.reportToAnalytics('navigation-timing', metrics);
  }

  /**
   * Report to analytics service
   */
  private reportToAnalytics(event: string, data: any): void {
    // In production, this would send to your analytics service
    // For now, we'll use a custom event for potential tracking
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tmd-performance', {
          detail: { event, data, timestamp: Date.now() },
        })
      );
    }
  }

  /**
   * Get all current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return {
      ...this.metrics,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const report = [
      '🏥 TMD Application Performance Report',
      '='.repeat(50),
      `📊 Core Web Vitals:`,
      `  • CLS (Cumulative Layout Shift): ${metrics.cls?.toFixed(4) || 'N/A'}`,
      `  • FCP (First Contentful Paint): ${metrics.fcp?.toFixed(2) || 'N/A'}ms`,
      `  • LCP (Largest Contentful Paint): ${metrics.lcp?.toFixed(2) || 'N/A'}ms`,
      `  • TTFB (Time to First Byte): ${metrics.ttfb?.toFixed(2) || 'N/A'}ms`,
      '',
      `🚀 Custom Metrics:`,
      `  • Route Load Time: ${metrics.routeLoadTime?.toFixed(2) || 'N/A'}ms`,
      `  • Assessment Response Time: ${metrics.assessmentResponseTime?.toFixed(2) || 'N/A'}ms`,
      `  • Memory Usage: ${metrics.memoryUsage ? (metrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`,
      '',
      `🌐 Environment:`,
      `  • URL: ${metrics.url}`,
      `  • User Agent: ${metrics.userAgent}`,
      `  • Timestamp: ${new Date(metrics.timestamp || Date.now()).toISOString()}`,
      '='.repeat(50),
    ];

    return report.join('\n');
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const performanceMonitor = new PerformanceMonitor();

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Measure function execution time
 */
export function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

/**
 * Measure async function execution time
 */
export async function measureAsyncPerformance<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

/**
 * Check if performance is acceptable for medical application
 */
export function validateMedicalPerformance(metrics: Partial<PerformanceMetrics>): {
  isAcceptable: boolean;
  warnings: string[];
  critical: string[];
} {
  const warnings: string[] = [];
  const critical: string[] = [];

  // Medical application performance thresholds
  const thresholds = {
    lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    fid: { good: 100, poor: 300 }, // First Input Delay
    cls: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
    routeLoad: { good: 1000, poor: 3000 }, // Route loading
    assessment: { good: 500, poor: 1000 }, // Assessment response
  };

  // Check LCP
  if (metrics.lcp) {
    if (metrics.lcp > thresholds.lcp.poor) {
      critical.push(
        `LCP too slow: ${metrics.lcp.toFixed(2)}ms (should be < ${thresholds.lcp.poor}ms)`
      );
    } else if (metrics.lcp > thresholds.lcp.good) {
      warnings.push(
        `LCP needs improvement: ${metrics.lcp.toFixed(2)}ms (should be < ${thresholds.lcp.good}ms)`
      );
    }
  }

  // FID (First Input Delay) removed due to package compatibility issues

  // Check CLS
  if (metrics.cls) {
    if (metrics.cls > thresholds.cls.poor) {
      critical.push(`CLS too high: ${metrics.cls.toFixed(4)} (should be < ${thresholds.cls.poor})`);
    } else if (metrics.cls > thresholds.cls.good) {
      warnings.push(
        `CLS needs improvement: ${metrics.cls.toFixed(4)} (should be < ${thresholds.cls.good})`
      );
    }
  }

  // Check route load time
  if (metrics.routeLoadTime) {
    if (metrics.routeLoadTime > thresholds.routeLoad.poor) {
      critical.push(`Route load too slow: ${metrics.routeLoadTime.toFixed(2)}ms`);
    } else if (metrics.routeLoadTime > thresholds.routeLoad.good) {
      warnings.push(`Route load needs improvement: ${metrics.routeLoadTime.toFixed(2)}ms`);
    }
  }

  // Check assessment response time
  if (metrics.assessmentResponseTime) {
    if (metrics.assessmentResponseTime > thresholds.assessment.poor) {
      critical.push(`Assessment response too slow: ${metrics.assessmentResponseTime.toFixed(2)}ms`);
    } else if (metrics.assessmentResponseTime > thresholds.assessment.good) {
      warnings.push(
        `Assessment response needs improvement: ${metrics.assessmentResponseTime.toFixed(2)}ms`
      );
    }
  }

  return {
    isAcceptable: critical.length === 0,
    warnings,
    critical,
  };
}

// =====================================================
// REACT HOOKS FOR PERFORMANCE MONITORING
// =====================================================

/**
 * Hook to track route performance
 */
export function useRoutePerformance(route: string) {
  React.useEffect(() => {
    performanceMonitor.startRouteTracking(route);

    return () => {
      performanceMonitor.endRouteTracking(route);
    };
  }, [route]);
}

/**
 * Hook to track assessment performance
 */
export function useAssessmentPerformance(assessmentType: 'quick' | 'comprehensive') {
  const startTracking = React.useCallback(() => {
    performanceMonitor.startAssessmentTracking(assessmentType);
  }, [assessmentType]);

  const endTracking = React.useCallback(
    (questionCount: number) => {
      performanceMonitor.endAssessmentTracking(assessmentType, questionCount);
    },
    [assessmentType]
  );

  return { startTracking, endTracking };
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}
