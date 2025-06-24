// Analytics and Monitoring Service for TMD Application
interface AnalyticsEvent {
  event: string;
  category: 'medical' | 'performance' | 'user_interaction' | 'error' | 'conversion';
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string | number>;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  timeToInteractive: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
  connectionType?: string;
}

interface MedicalAnalytics {
  assessmentType: 'quick' | 'comprehensive';
  riskLevel: 'low' | 'moderate' | 'high';
  completionTime: number;
  questionAnswered: number;
  totalQuestions: number;
  dropoffPoint?: string;
  symptoms: string[];
  recommendations: string[];
}

interface UserJourney {
  sessionId: string;
  startTime: number;
  pages: Array<{
    path: string;
    timestamp: number;
    timeSpent: number;
    interactions: number;
  }>;
  completed: boolean;
  assessmentCompleted: boolean;
  exitPoint?: string;
}

interface AnalyticsConfig {
  enableTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableMedicalAnalytics: boolean;
  enableUserJourneyTracking: boolean;
  enableErrorTracking: boolean;
  samplingRate: number;
  apiEndpoint?: string;
  anonymizeData: boolean;
  retentionDays: number;
}

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enableTracking: true,
  enablePerformanceMonitoring: true,
  enableMedicalAnalytics: true,
  enableUserJourneyTracking: true,
  enableErrorTracking: true,
  samplingRate: 1.0, // 100% sampling
  anonymizeData: true,
  retentionDays: 30,
};

export class AnalyticsService {
  private config: AnalyticsConfig;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private userJourney: UserJourney;
  private startTime: number;
  private currentPage: string = '';
  private pageStartTime: number = 0;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.userJourney = this.initializeUserJourney();

    if (this.config.enableTracking) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupUserJourneyTracking();
    this.setupVisibilityTracking();
    this.startBatchProcessing();
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private initializeUserJourney(): UserJourney {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      pages: [],
      completed: false,
      assessmentCompleted: false,
    };
  }

  // Performance monitoring
  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Web Vitals monitoring
    this.observeWebVitals();

    // Resource timing monitoring
    this.observeResourceTiming();

    // Navigation timing
    this.trackNavigationTiming();
  }

  private observeWebVitals(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.trackPerformanceMetric('LCP', lastEntry.startTime);
    });

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        this.trackPerformanceMetric('FID', fid);
      });
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    this.observeMetric('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.trackPerformanceMetric('CLS', clsValue);
        }
      });
    });
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntryList) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [type] });
    } catch (e) {
      console.warn(`Performance observer for ${type} not supported`);
    }
  }

  private observeResourceTiming(): void {
    this.observeMetric('resource', (entries) => {
      entries.forEach((entry: any) => {
        if (entry.duration > 1000) {
          // Resources taking longer than 1s
          this.trackEvent({
            event: 'slow_resource',
            category: 'performance',
            action: 'resource_timing',
            label: entry.name,
            value: Math.round(entry.duration),
          });
        }
      });
    });
  }

  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const navigation = performance.navigation;

        const metrics: PerformanceMetrics = {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          renderTime: timing.domContentLoadedEventEnd - timing.navigationStart,
          timeToInteractive: timing.loadEventEnd - timing.fetchStart,
          largestContentfulPaint: 0, // Will be set by observer
          firstInputDelay: 0, // Will be set by observer
          cumulativeLayoutShift: 0, // Will be set by observer
        };

        // Add connection info if available
        const connection = (navigator as any).connection;
        if (connection) {
          metrics.connectionType = connection.effectiveType;
        }

        this.trackPerformanceMetrics(metrics);
      }, 0);
    });
  }

  // Error tracking
  private setupErrorTracking(): void {
    if (!this.config.enableErrorTracking) return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandled_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
      });
    });

    // Network errors
    this.setupNetworkErrorTracking();
  }

  private setupNetworkErrorTracking(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        if (!response.ok) {
          this.trackError({
            type: 'network_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0]?.toString(),
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        this.trackError({
          type: 'network_error',
          message: error instanceof Error ? error.message : 'Network request failed',
          url: args[0]?.toString(),
        });
        throw error;
      }
    };
  }

  // User journey tracking
  private setupUserJourneyTracking(): void {
    if (!this.config.enableUserJourneyTracking) return;

    this.trackPageView(window.location.pathname);

    // Listen for page changes (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView(window.location.pathname);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView(window.location.pathname);
    };

    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });
  }

  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent({
          event: 'page_hidden',
          category: 'user_interaction',
          action: 'visibility_change',
          label: this.currentPage,
        });
      } else {
        this.trackEvent({
          event: 'page_visible',
          category: 'user_interaction',
          action: 'visibility_change',
          label: this.currentPage,
        });
      }
    });
  }

  // Public tracking methods
  public trackEvent(event: Partial<AnalyticsEvent>): void {
    if (!this.config.enableTracking || Math.random() > this.config.samplingRate) {
      return;
    }

    const fullEvent: AnalyticsEvent = {
      event: event.event || 'unknown',
      category: event.category || 'user_interaction',
      action: event.action || 'unknown',
      label: event.label,
      value: event.value,
      customDimensions: event.customDimensions,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...event,
    };

    if (this.config.anonymizeData) {
      this.anonymizeEvent(fullEvent);
    }

    this.eventQueue.push(fullEvent);
    console.log('📊 Analytics Event:', fullEvent);
  }

  public trackMedicalAssessment(data: MedicalAnalytics): void {
    if (!this.config.enableMedicalAnalytics) return;

    this.trackEvent({
      event: 'assessment_completed',
      category: 'medical',
      action: 'assessment_submission',
      label: data.assessmentType,
      value: data.completionTime,
      customDimensions: {
        riskLevel: data.riskLevel,
        questionsAnswered: data.questionAnswered,
        totalQuestions: data.totalQuestions,
        completionRate: (data.questionAnswered / data.totalQuestions) * 100,
        symptomsCount: data.symptoms.length,
        recommendationsCount: data.recommendations.length,
      },
    });

    // Track completion funnel
    this.userJourney.assessmentCompleted = true;
    this.trackConversionFunnel('assessment_completed');
  }

  public trackPerformanceMetric(metric: string, value: number): void {
    this.trackEvent({
      event: 'performance_metric',
      category: 'performance',
      action: metric.toLowerCase(),
      value: Math.round(value),
      customDimensions: {
        page: this.currentPage,
        sessionAge: Date.now() - this.startTime,
      },
    });
  }

  public trackPerformanceMetrics(metrics: PerformanceMetrics): void {
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0) {
        this.trackPerformanceMetric(key, value);
      }
    });
  }

  public trackError(error: {
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    url?: string;
    status?: number;
  }): void {
    this.trackEvent({
      event: 'error',
      category: 'error',
      action: error.type,
      label: error.message,
      customDimensions: {
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        stack: error.stack?.substring(0, 1000), // Truncate stack traces
        url: error.url,
        status: error.status,
        page: this.currentPage,
      },
    });
  }

  public trackPageView(path: string): void {
    // End timing for previous page
    if (this.currentPage && this.pageStartTime) {
      const timeSpent = Date.now() - this.pageStartTime;
      this.updateUserJourney(this.currentPage, timeSpent);
    }

    // Start timing for new page
    this.currentPage = path;
    this.pageStartTime = Date.now();

    this.trackEvent({
      event: 'page_view',
      category: 'user_interaction',
      action: 'navigation',
      label: path,
      customDimensions: {
        referrer: document.referrer,
        sessionAge: Date.now() - this.startTime,
      },
    });
  }

  public trackUserInteraction(
    element: string,
    action: string,
    details?: Record<string, any>
  ): void {
    this.trackEvent({
      event: 'user_interaction',
      category: 'user_interaction',
      action,
      label: element,
      customDimensions: {
        page: this.currentPage,
        ...details,
      },
    });
  }

  public trackConversion(goal: string, value?: number): void {
    this.trackEvent({
      event: 'conversion',
      category: 'conversion',
      action: goal,
      value,
      customDimensions: {
        sessionAge: Date.now() - this.startTime,
        pagesVisited: this.userJourney.pages.length,
      },
    });
  }

  // Private helper methods
  private updateUserJourney(path: string, timeSpent: number): void {
    const pageEntry = this.userJourney.pages.find((p) => p.path === path);

    if (pageEntry) {
      pageEntry.timeSpent += timeSpent;
      pageEntry.interactions += 1;
    } else {
      this.userJourney.pages.push({
        path,
        timestamp: this.pageStartTime,
        timeSpent,
        interactions: 1,
      });
    }
  }

  private trackConversionFunnel(step: string): void {
    const funnelSteps = [
      'page_load',
      'assessment_started',
      'assessment_completed',
      'results_viewed',
    ];

    const currentStepIndex = funnelSteps.indexOf(step);
    if (currentStepIndex > -1) {
      this.trackEvent({
        event: 'funnel_step',
        category: 'conversion',
        action: 'funnel_progression',
        label: step,
        value: currentStepIndex + 1,
        customDimensions: {
          totalSteps: funnelSteps.length,
          stepIndex: currentStepIndex,
        },
      });
    }
  }

  private anonymizeEvent(event: AnalyticsEvent): void {
    // Remove or hash sensitive data
    if (event.userId) {
      event.userId = this.hashData(event.userId);
    }

    // Remove potential PII from custom dimensions
    if (event.customDimensions) {
      Object.keys(event.customDimensions).forEach((key) => {
        const value = event.customDimensions![key];
        if (typeof value === 'string' && this.containsPII(value)) {
          event.customDimensions![key] = '[REDACTED]';
        }
      });
    }
  }

  private hashData(data: string): string {
    // Simple hash for anonymization (use proper hashing in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private containsPII(data: string): boolean {
    // Simple PII detection patterns
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
    ];

    return piiPatterns.some((pattern) => pattern.test(data));
  }

  // Batch processing
  private startBatchProcessing(): void {
    setInterval(() => {
      this.processBatch();
    }, 30000); // Process every 30 seconds

    // Process on page unload
    window.addEventListener('beforeunload', () => {
      this.processBatch();
    });
  }

  private processBatch(): void {
    if (this.eventQueue.length === 0) return;

    const batch = [...this.eventQueue];
    this.eventQueue = [];

    this.sendBatch(batch);
  }

  private async sendBatch(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.apiEndpoint) {
      // Store locally if no endpoint configured
      this.storeLocally(events);
      return;
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          sessionId: this.sessionId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      console.log(`📊 Sent ${events.length} analytics events`);
    } catch (error) {
      console.error('❌ Failed to send analytics:', error);
      // Store failed events locally for retry
      this.storeLocally(events);
    }
  }

  private storeLocally(events: AnalyticsEvent[]): void {
    try {
      const stored = localStorage.getItem('analytics_events') || '[]';
      const existingEvents = JSON.parse(stored);
      const allEvents = [...existingEvents, ...events];

      // Keep only recent events to prevent storage bloat
      const maxEvents = 1000;
      const recentEvents = allEvents.slice(-maxEvents);

      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('❌ Failed to store analytics locally:', error);
    }
  }

  // Public utility methods
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getUserJourney(): UserJourney {
    return { ...this.userJourney };
  }

  public flushEvents(): void {
    this.processBatch();
  }

  public clearLocalData(): void {
    localStorage.removeItem('analytics_events');
  }

  public getQueueSize(): number {
    return this.eventQueue.length;
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Utility functions for easy access
export const trackEvent = (event: Partial<AnalyticsEvent>) => analyticsService.trackEvent(event);
export const trackPageView = (path: string) => analyticsService.trackPageView(path);
export const trackError = (error: any) => analyticsService.trackError(error);
export const trackConversion = (goal: string, value?: number) =>
  analyticsService.trackConversion(goal, value);
export const trackMedicalAssessment = (data: MedicalAnalytics) =>
  analyticsService.trackMedicalAssessment(data);
