import { AppError } from '../types';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better organization
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  SECURITY = 'security',
  ASSESSMENT = 'assessment',
  STORAGE = 'storage',
  RENDERING = 'rendering',
  NAVIGATION = 'navigation',
  UNKNOWN = 'unknown',
}

// Configuration for error logging
interface ErrorLoggingConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  enableLocalStorage: boolean;
  maxStoredErrors: number;
  sentryDsn?: string;
  environment?: string;
}

// Default configuration
const DEFAULT_CONFIG: ErrorLoggingConfig = {
  enableConsoleLogging: true,
  enableRemoteLogging: false,
  enableLocalStorage: true,
  maxStoredErrors: 100,
  environment: 'production',
};

// Error context for additional debugging information
interface ErrorContext {
  userId?: string;
  sessionId?: string;
  assessmentType?: string;
  currentRoute?: string;
  additionalData?: Record<string, any>;
}

export class ErrorLoggingService {
  private config: ErrorLoggingConfig;
  private errorQueue: AppError[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor(config: Partial<ErrorLoggingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  // Initialize the error logging service
  private initializeService(): void {
    // Set up online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Initialize Sentry if DSN provided
    if (this.config.sentryDsn && this.config.enableRemoteLogging) {
      this.initializeSentry();
    }
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(
        {
          code: 'UNHANDLED_ERROR',
          message: event.message,
          details: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
          },
          timestamp: new Date(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        {
          code: 'UNHANDLED_REJECTION',
          message: 'Unhandled promise rejection',
          details: {
            reason: event.reason,
          },
          timestamp: new Date(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN
      );
    });
  }

  // Initialize Sentry (placeholder - would require actual Sentry SDK)
  private initializeSentry(): void {
    // In a real implementation, initialize Sentry SDK here
    console.info('Sentry integration would be initialized here');
  }

  // Log an error with severity and category
  public logError(
    error: AppError | Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: ErrorContext
  ): void {
    // Convert to AppError format
    const appError: AppError = this.normalizeError(error);

    // Add metadata
    appError.timestamp = new Date();
    appError.url = window.location.href;
    appError.userAgent = navigator.userAgent;

    // Add context if provided
    if (context) {
      appError.details = { ...appError.details, context };
    }

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(appError, severity);
    }

    // Store locally if enabled
    if (this.config.enableLocalStorage) {
      this.storeError(appError, severity, category);
    }

    // Send to remote if enabled and online
    if (this.config.enableRemoteLogging) {
      if (this.isOnline) {
        this.sendToRemote(appError, severity, category);
      } else {
        this.errorQueue.push(appError);
      }
    }
  }

  // Normalize different error types to AppError
  private normalizeError(error: AppError | Error | string): AppError {
    if (typeof error === 'string') {
      return {
        code: 'STRING_ERROR',
        message: error,
        timestamp: new Date(),
      };
    }

    if (error instanceof Error) {
      return {
        code: error.name || 'JAVASCRIPT_ERROR',
        message: error.message,
        details: {
          stack: error.stack,
        },
        timestamp: new Date(),
      };
    }

    return error;
  }

  // Log to console with appropriate method
  private logToConsole(error: AppError, severity: ErrorSeverity): void {
    const prefix = `[${severity.toUpperCase()}] [${new Date().toISOString()}]`;

    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(prefix, error.message, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(prefix, error.message, error);
        break;
      case ErrorSeverity.LOW:
        console.info(prefix, error.message, error);
        break;
    }
  }

  // Store error in localStorage
  private storeError(error: AppError, severity: ErrorSeverity, category: ErrorCategory): void {
    try {
      const storedErrors = this.getStoredErrors();

      storedErrors.push({
        ...error,
        severity,
        category,
        id: this.generateErrorId(),
      });

      // Keep only the most recent errors
      if (storedErrors.length > this.config.maxStoredErrors) {
        storedErrors.shift();
      }

      localStorage.setItem('tmd_error_logs', JSON.stringify(storedErrors));
    } catch (e) {
      console.error('Failed to store error:', e);
    }
  }

  // Get stored errors from localStorage
  public getStoredErrors(): any[] {
    try {
      const stored = localStorage.getItem('tmd_error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Send error to remote logging service
  private async sendToRemote(
    error: AppError,
    severity: ErrorSeverity,
    category: ErrorCategory
  ): Promise<void> {
    // In a real implementation, send to logging service
    // This is a placeholder implementation
    const logData = {
      ...error,
      severity,
      category,
      environment: this.config.environment,
      sessionId: sessionStorage.getItem('sessionId'),
      timestamp: new Date().toISOString(),
    };

    // Simulate sending to remote service
    console.info('Would send to remote logging service:', logData);
  }

  // Flush error queue when coming back online
  private flushErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift();
      if (error) {
        this.sendToRemote(error, ErrorSeverity.MEDIUM, ErrorCategory.UNKNOWN);
      }
    }
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear stored errors
  public clearStoredErrors(): void {
    localStorage.removeItem('tmd_error_logs');
  }

  // Get errors by severity
  public getErrorsBySeverity(severity: ErrorSeverity): any[] {
    return this.getStoredErrors().filter((error) => error.severity === severity);
  }

  // Get errors by category
  public getErrorsByCategory(category: ErrorCategory): any[] {
    return this.getStoredErrors().filter((error) => error.category === category);
  }

  // Get recent errors
  public getRecentErrors(count: number = 10): any[] {
    const errors = this.getStoredErrors();
    return errors.slice(-count);
  }

  // Export errors for debugging
  public exportErrors(): string {
    const errors = this.getStoredErrors();
    return JSON.stringify(errors, null, 2);
  }

  // Health check for error logging service
  public healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const storedErrors = this.getStoredErrors();
    const criticalErrors = this.getErrorsBySeverity(ErrorSeverity.CRITICAL);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (criticalErrors.length > 10) {
      status = 'unhealthy';
    } else if (storedErrors.length > this.config.maxStoredErrors * 0.8) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalErrors: storedErrors.length,
        criticalErrors: criticalErrors.length,
        queuedErrors: this.errorQueue.length,
        isOnline: this.isOnline,
        config: this.config,
      },
    };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLoggingService({
  environment: process.env.NODE_ENV || 'production',
});

// Convenience functions
export const logError = (
  error: AppError | Error | string,
  severity?: ErrorSeverity,
  category?: ErrorCategory,
  context?: ErrorContext
) => errorLogger.logError(error, severity, category, context);

export const logCriticalError = (error: AppError | Error | string, context?: ErrorContext) =>
  errorLogger.logError(error, ErrorSeverity.CRITICAL, ErrorCategory.UNKNOWN, context);

export const logSecurityError = (error: AppError | Error | string, context?: ErrorContext) =>
  errorLogger.logError(error, ErrorSeverity.HIGH, ErrorCategory.SECURITY, context);

export const logValidationError = (error: AppError | Error | string, context?: ErrorContext) =>
  errorLogger.logError(error, ErrorSeverity.LOW, ErrorCategory.VALIDATION, context);
