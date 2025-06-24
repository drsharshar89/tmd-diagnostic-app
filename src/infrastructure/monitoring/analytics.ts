import { SecurityService } from '@/services/SecurityService';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';

// Analytics configuration
interface AnalyticsConfig {
  enableTracking: boolean;
  enableLocalStorage: boolean;
  enableRemoteTracking: boolean;
  phiSafeMode: boolean;
  dataRetentionDays: number;
  batchSize: number;
  flushInterval: number;
  endpoint?: string;
  apiKey?: string;
}

// Default configuration - HIPAA compliant by default
const DEFAULT_CONFIG: AnalyticsConfig = {
  enableTracking: true,
  enableLocalStorage: true,
  enableRemoteTracking: false, // Disabled by default for privacy
  phiSafeMode: true, // Always enabled for medical applications
  dataRetentionDays: 30, // Short retention for analytics
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  endpoint: process.env.VITE_ANALYTICS_ENDPOINT,
  apiKey: process.env.VITE_ANALYTICS_API_KEY,
};

// Diagnostic event types
export enum DiagnosticEventType {
  ASSESSMENT_STARTED = 'assessment_started',
  ASSESSMENT_COMPLETED = 'assessment_completed',
  ASSESSMENT_ABANDONED = 'assessment_abandoned',
  QUESTION_ANSWERED = 'question_answered',
  RESULT_VIEWED = 'result_viewed',
  RECOMMENDATION_CLICKED = 'recommendation_clicked',
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_METRIC = 'performance_metric',
  USER_INTERACTION = 'user_interaction',
  SYSTEM_EVENT = 'system_event',
}

// Base diagnostic event interface
export interface DiagnosticEvent {
  id: string;
  type: DiagnosticEventType;
  timestamp: Date;
  sessionId: string;

  // PHI-safe metadata only
  metadata?: {
    assessmentType?: 'quick' | 'comprehensive';
    questionNumber?: number;
    riskLevel?: 'low' | 'moderate' | 'high';
    duration?: number;
    errorCode?: string;
    userAgent?: string;
    screenResolution?: string;
    language?: string;
    darkMode?: boolean;

    // Performance metrics
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;

    // User interaction metrics
    clickCount?: number;
    scrollDepth?: number;
    timeOnPage?: number;
  };

  // Never store actual assessment answers or patient data
  // All data must be anonymized and aggregated
}

// Analytics batch for efficient transmission
interface AnalyticsBatch {
  id: string;
  events: DiagnosticEvent[];
  timestamp: Date;
  sessionId: string;
  metadata: {
    batchSize: number;
    version: string;
    environment: string;
  };
}

// Analytics statistics
interface AnalyticsStats {
  totalEvents: number;
  eventsByType: Record<DiagnosticEventType, number>;
  sessionsCount: number;
  averageSessionDuration: number;
  errorRate: number;
  completionRate: number;
  mostCommonErrors: string[];
  performanceMetrics: {
    averageLoadTime: number;
    averageRenderTime: number;
    averageMemoryUsage: number;
  };
}

/**
 * PHI-safe medical analytics service for TMD diagnostic application
 * Tracks diagnostic events while maintaining HIPAA compliance and patient privacy
 */
export class MedicalAnalytics {
  private config: AnalyticsConfig;
  private securityService: SecurityService;
  private errorLogger: ErrorLoggingService;
  private sessionId: string;
  private eventQueue: DiagnosticEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private storageKey = 'tmd_analytics';
  private sessionStartTime: Date;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.securityService = new SecurityService();
    this.errorLogger = new ErrorLoggingService();
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();

    this.initializeAnalytics();
  }

  /**
   * Track diagnostic event with PHI protection
   */
  trackDiagnosticEvent(event: Omit<DiagnosticEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    if (!this.config.enableTracking) {
      return;
    }

    try {
      // Create complete event with generated fields
      const completeEvent: DiagnosticEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        sessionId: this.sessionId,
        ...event,
      };

      // Validate and sanitize event data
      const sanitizedEvent = this.sanitizeEvent(completeEvent);

      // Add to queue
      this.eventQueue.push(sanitizedEvent);

      // Store locally if enabled
      if (this.config.enableLocalStorage) {
        this.storeEventLocally(sanitizedEvent);
      }

      // Flush if batch size reached
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flushEvents();
      }
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.UNKNOWN, {
        additionalData: { eventType: event.type },
      });
    }
  }

  /**
   * Track assessment start
   */
  trackAssessmentStarted(assessmentType: 'quick' | 'comprehensive'): void {
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.ASSESSMENT_STARTED,
      metadata: {
        assessmentType,
        userAgent: this.getAnonymizedUserAgent(),
        screenResolution: this.getScreenResolution(),
        language: navigator.language,
        darkMode: this.isDarkMode(),
      },
    });
  }

  /**
   * Track assessment completion
   */
  trackAssessmentCompleted(
    assessmentType: 'quick' | 'comprehensive',
    riskLevel: 'low' | 'moderate' | 'high',
    duration: number
  ): void {
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.ASSESSMENT_COMPLETED,
      metadata: {
        assessmentType,
        riskLevel,
        duration,
        userAgent: this.getAnonymizedUserAgent(),
      },
    });
  }

  /**
   * Track question interaction (PHI-safe)
   */
  trackQuestionAnswered(questionNumber: number, duration: number): void {
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.QUESTION_ANSWERED,
      metadata: {
        questionNumber,
        duration,
        // Never track actual answers - only interaction metrics
      },
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetric(loadTime?: number, renderTime?: number, memoryUsage?: number): void {
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.PERFORMANCE_METRIC,
      metadata: {
        loadTime,
        renderTime,
        memoryUsage,
        userAgent: this.getAnonymizedUserAgent(),
      },
    });
  }

  /**
   * Track error occurrence
   */
  trackError(errorCode: string, errorMessage?: string): void {
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.ERROR_OCCURRED,
      metadata: {
        errorCode,
        // Never include full error messages that might contain PHI
        userAgent: this.getAnonymizedUserAgent(),
      },
    });
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(interactionType: string, duration?: number, clickCount?: number): void {
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.USER_INTERACTION,
      metadata: {
        duration,
        clickCount,
        timeOnPage: Date.now() - this.sessionStartTime.getTime(),
      },
    });
  }

  /**
   * Get analytics statistics
   */
  getAnalyticsStats(): AnalyticsStats {
    try {
      const storedEvents = this.getStoredEvents();
      const stats: AnalyticsStats = {
        totalEvents: storedEvents.length,
        eventsByType: {} as Record<DiagnosticEventType, number>,
        sessionsCount: new Set(storedEvents.map((e) => e.sessionId)).size,
        averageSessionDuration: 0,
        errorRate: 0,
        completionRate: 0,
        mostCommonErrors: [],
        performanceMetrics: {
          averageLoadTime: 0,
          averageRenderTime: 0,
          averageMemoryUsage: 0,
        },
      };

      // Calculate event type distribution
      Object.values(DiagnosticEventType).forEach((type) => {
        stats.eventsByType[type] = storedEvents.filter((e) => e.type === type).length;
      });

      // Calculate error rate
      const errorEvents = storedEvents.filter((e) => e.type === DiagnosticEventType.ERROR_OCCURRED);
      stats.errorRate =
        storedEvents.length > 0 ? (errorEvents.length / storedEvents.length) * 100 : 0;

      // Calculate completion rate
      const startedEvents = storedEvents.filter(
        (e) => e.type === DiagnosticEventType.ASSESSMENT_STARTED
      );
      const completedEvents = storedEvents.filter(
        (e) => e.type === DiagnosticEventType.ASSESSMENT_COMPLETED
      );
      stats.completionRate =
        startedEvents.length > 0 ? (completedEvents.length / startedEvents.length) * 100 : 0;

      // Calculate performance metrics
      const performanceEvents = storedEvents.filter(
        (e) => e.type === DiagnosticEventType.PERFORMANCE_METRIC
      );
      if (performanceEvents.length > 0) {
        const loadTimes = performanceEvents
          .map((e) => e.metadata?.loadTime)
          .filter(Boolean) as number[];
        const renderTimes = performanceEvents
          .map((e) => e.metadata?.renderTime)
          .filter(Boolean) as number[];
        const memoryUsages = performanceEvents
          .map((e) => e.metadata?.memoryUsage)
          .filter(Boolean) as number[];

        stats.performanceMetrics.averageLoadTime =
          loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
        stats.performanceMetrics.averageRenderTime =
          renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;
        stats.performanceMetrics.averageMemoryUsage =
          memoryUsages.length > 0
            ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
            : 0;
      }

      // Get most common errors
      const errorCodes = errorEvents.map((e) => e.metadata?.errorCode).filter(Boolean) as string[];
      const errorCounts = errorCodes.reduce(
        (acc, code) => {
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      stats.mostCommonErrors = Object.entries(errorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([code]) => code);

      return stats;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.UNKNOWN);

      // Return empty stats on error
      return {
        totalEvents: 0,
        eventsByType: {} as Record<DiagnosticEventType, number>,
        sessionsCount: 0,
        averageSessionDuration: 0,
        errorRate: 0,
        completionRate: 0,
        mostCommonErrors: [],
        performanceMetrics: {
          averageLoadTime: 0,
          averageRenderTime: 0,
          averageMemoryUsage: 0,
        },
      };
    }
  }

  /**
   * Export analytics data for analysis
   */
  exportAnalyticsData(): string {
    try {
      const events = this.getStoredEvents();
      const stats = this.getAnalyticsStats();

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          phiSafeMode: this.config.phiSafeMode,
          eventCount: events.length,
        },
        statistics: stats,
        events: events.map((event) => ({
          ...event,
          // Remove any potentially sensitive data
          sessionId: 'anonymized',
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.UNKNOWN);
      throw new Error(`Failed to export analytics data: ${(error as Error).message}`);
    }
  }

  /**
   * Clear analytics data
   */
  clearAnalyticsData(): void {
    try {
      localStorage.removeItem(this.storageKey);
      this.eventQueue = [];

      this.trackDiagnosticEvent({
        type: DiagnosticEventType.SYSTEM_EVENT,
        metadata: {
          userAgent: this.getAnonymizedUserAgent(),
        },
      });
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.UNKNOWN);
    }
  }

  /**
   * Cleanup expired analytics data
   */
  cleanupExpiredData(): number {
    try {
      const events = this.getStoredEvents();
      const cutoffDate = new Date(Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

      const validEvents = events.filter((event) => new Date(event.timestamp) > cutoffDate);
      const cleanedCount = events.length - validEvents.length;

      if (cleanedCount > 0) {
        localStorage.setItem(this.storageKey, JSON.stringify(validEvents));
      }

      return cleanedCount;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.LOW, ErrorCategory.UNKNOWN);
      return 0;
    }
  }

  /**
   * Flush events to remote endpoint
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.config.enableRemoteTracking) {
      return;
    }

    try {
      const batch: AnalyticsBatch = {
        id: this.generateBatchId(),
        events: [...this.eventQueue],
        timestamp: new Date(),
        sessionId: this.sessionId,
        metadata: {
          batchSize: this.eventQueue.length,
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'production',
        },
      };

      // Clear queue immediately to prevent duplicate sends
      this.eventQueue = [];

      // Send to remote endpoint if configured
      if (this.config.endpoint && this.config.apiKey) {
        await this.sendBatchToRemote(batch);
      }
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.NETWORK);
    }
  }

  /**
   * Private helper methods
   */
  private initializeAnalytics(): void {
    // Set up periodic flush
    if (this.config.enableRemoteTracking && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushEvents();
      }, this.config.flushInterval);
    }

    // Cleanup expired data on initialization
    setTimeout(() => {
      this.cleanupExpiredData();
    }, 1000);

    // Track session start
    this.trackDiagnosticEvent({
      type: DiagnosticEventType.SYSTEM_EVENT,
      metadata: {
        userAgent: this.getAnonymizedUserAgent(),
        screenResolution: this.getScreenResolution(),
        language: navigator.language,
      },
    });
  }

  private sanitizeEvent(event: DiagnosticEvent): DiagnosticEvent {
    // Ensure PHI safety by removing any potentially sensitive data
    const sanitized = { ...event };

    // Remove or anonymize sensitive metadata
    if (sanitized.metadata) {
      // Keep only safe metadata fields
      const safeMetadata: typeof sanitized.metadata = {};

      const safeFields = [
        'assessmentType',
        'questionNumber',
        'riskLevel',
        'duration',
        'errorCode',
        'loadTime',
        'renderTime',
        'memoryUsage',
        'clickCount',
        'scrollDepth',
        'timeOnPage',
        'language',
        'darkMode',
      ];

      safeFields.forEach((field) => {
        if (field in sanitized.metadata!) {
          safeMetadata[field as keyof typeof safeMetadata] =
            sanitized.metadata![field as keyof typeof sanitized.metadata];
        }
      });

      // Anonymize user agent
      if (sanitized.metadata.userAgent) {
        safeMetadata.userAgent = this.getAnonymizedUserAgent();
      }

      sanitized.metadata = safeMetadata;
    }

    return sanitized;
  }

  private storeEventLocally(event: DiagnosticEvent): void {
    try {
      const events = this.getStoredEvents();
      events.push(event);

      // Keep only recent events to prevent storage bloat
      const maxEvents = 1000;
      if (events.length > maxEvents) {
        events.splice(0, events.length - maxEvents);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (error) {
      // Storage failure is not critical for analytics
      this.errorLogger.logError(error as Error, ErrorSeverity.LOW, ErrorCategory.STORAGE);
    }
  }

  private getStoredEvents(): DiagnosticEvent[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private async sendBatchToRemote(batch: AnalyticsBatch): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) {
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'X-PHI-Safe': 'true',
          'X-HIPAA-Compliant': 'true',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...batch.events);
      throw error;
    }
  }

  private getAnonymizedUserAgent(): string {
    // Return only browser family, not full user agent string
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getScreenResolution(): string {
    return `${screen.width}x${screen.height}`;
  }

  private isDarkMode(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush remaining events
    this.flushEvents();
  }
}

// Export singleton instance factory
export const createMedicalAnalytics = (config?: Partial<AnalyticsConfig>): MedicalAnalytics => {
  return new MedicalAnalytics(config);
};

// Default analytics instance
export const medicalAnalytics = new MedicalAnalytics();

// Convenience functions for common tracking scenarios
export const trackAssessmentStarted = (assessmentType: 'quick' | 'comprehensive') => {
  medicalAnalytics.trackAssessmentStarted(assessmentType);
};

export const trackAssessmentCompleted = (
  assessmentType: 'quick' | 'comprehensive',
  riskLevel: 'low' | 'moderate' | 'high',
  duration: number
) => {
  medicalAnalytics.trackAssessmentCompleted(assessmentType, riskLevel, duration);
};

export const trackQuestionAnswered = (questionNumber: number, duration: number) => {
  medicalAnalytics.trackQuestionAnswered(questionNumber, duration);
};

export const trackPerformanceMetric = (
  loadTime?: number,
  renderTime?: number,
  memoryUsage?: number
) => {
  medicalAnalytics.trackPerformanceMetric(loadTime, renderTime, memoryUsage);
};

export const trackError = (errorCode: string, errorMessage?: string) => {
  medicalAnalytics.trackError(errorCode, errorMessage);
};
