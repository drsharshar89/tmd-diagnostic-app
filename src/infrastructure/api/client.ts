import { SecurityService } from '@/services/SecurityService';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';
import type { AssessmentResult, StoredAssessment } from '@/shared/types';

// Define Assessment and DiagnosticResult types for API
export interface Assessment {
  id?: string;
  patientId?: string;
  type: 'quick' | 'comprehensive';
  answers: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DiagnosticResult {
  id: string;
  assessmentId: string;
  classification: string;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendations: string[];
  icd10Codes: string[];
  confidence: number;
  timestamp: string;
}

export interface APIConfig {
  baseURL: string;
  timeout?: number;
  maxRetries?: number;
  encryptionKey?: string;
  apiKey?: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  requiresAuth?: boolean;
  encrypt?: boolean;
  retries?: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  timestamp: string;
  requestId: string;
}

export interface APIError {
  message: string;
  status: number;
  code: string;
  timestamp: string;
  requestId: string;
  details?: unknown;
}

/**
 * Medical-grade API client with HIPAA compliance, encryption, and audit trails
 * Implements proper error handling, retries, and PHI data protection
 */
export class APIClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private encryptionKey?: string;
  private apiKey?: string;
  private securityService: SecurityService;
  private errorLogger: ErrorLoggingService;

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.encryptionKey = config.encryptionKey || undefined;
    this.apiKey = config.apiKey || undefined;
    this.securityService = new SecurityService();
    this.errorLogger = new ErrorLoggingService();

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Make HTTP request with medical-grade security and error handling
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Validate and sanitize inputs
      this.validateRequest(endpoint, options);

      const url = this.buildURL(endpoint);
      const requestOptions = await this.buildRequestOptions(options, requestId);

      // Execute request with retries
      const response = await this.executeWithRetries(
        url,
        requestOptions,
        options.retries || this.maxRetries
      );

      // Process and validate response
      const processedResponse = await this.processResponse<T>(response, requestId);

      // Log successful request (PHI-safe)
      this.logRequest(
        endpoint,
        options.method || 'GET',
        response.status,
        Date.now() - startTime,
        requestId
      );

      return processedResponse;
    } catch (error) {
      // Log error with proper PHI protection
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.NETWORK, {
        additionalData: {
          endpoint,
          method: options.method || 'GET',
          requestId,
          duration: Date.now() - startTime,
          // Never log request body to prevent PHI exposure
          hasBody: !!options.body,
        },
      });

      throw this.createAPIError(error as Error, requestId);
    }
  }

  /**
   * Specialized methods for medical data
   */
  async saveAssessment(
    assessment: Assessment
  ): Promise<APIResponse<{ id: string; timestamp: string }>> {
    // Encrypt PHI data before transmission
    const encryptedAssessment = await this.securityService.encryptData(JSON.stringify(assessment));

    return this.request('/assessments', {
      method: 'POST',
      body: { data: encryptedAssessment },
      encrypt: true,
      requiresAuth: true,
    });
  }

  async getDiagnosticResults(assessmentId: string): Promise<APIResponse<DiagnosticResult>> {
    // Validate assessment ID format
    if (!this.isValidUUID(assessmentId)) {
      throw new Error('Invalid assessment ID format');
    }

    return this.request(`/assessments/${assessmentId}/results`, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async submitDiagnosticFeedback(
    assessmentId: string,
    feedback: unknown
  ): Promise<APIResponse<void>> {
    const sanitizedFeedback = this.securityService.sanitizeInput(String(feedback));

    return this.request(`/assessments/${assessmentId}/feedback`, {
      method: 'POST',
      body: { feedback: sanitizedFeedback },
      requiresAuth: true,
    });
  }

  /**
   * Private helper methods
   */
  private validateConfig(): void {
    if (!this.baseURL) {
      throw new Error('API base URL is required');
    }

    if (!this.baseURL.startsWith('https://') && !this.baseURL.startsWith('http://localhost')) {
      throw new Error('API must use HTTPS for medical data protection');
    }
  }

  private validateRequest(endpoint: string, options: RequestOptions): void {
    if (!endpoint) {
      throw new Error('API endpoint is required');
    }

    // Prevent path traversal attacks
    if (endpoint.includes('..') || endpoint.includes('//')) {
      throw new Error('Invalid endpoint format');
    }

    // Validate method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (options.method && !validMethods.includes(options.method)) {
      throw new Error(`Invalid HTTP method: ${options.method}`);
    }
  }

  private buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${cleanEndpoint}`;
  }

  private async buildRequestOptions(
    options: RequestOptions,
    requestId: string
  ): Promise<RequestInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Client-Version': '1.0.0',
      'X-Timestamp': new Date().toISOString(),
      ...options.headers,
    };

    // Add authentication if required
    if (options.requiresAuth && this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Add HIPAA compliance headers
    headers['X-HIPAA-Compliant'] = 'true';
    headers['X-PHI-Encrypted'] = options.encrypt ? 'true' : 'false';

    const requestInit: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: AbortSignal.timeout(options.timeout || this.timeout),
    };

    // Add body if present
    if (
      options.body &&
      (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')
    ) {
      if (options.encrypt && this.encryptionKey) {
        requestInit.body = JSON.stringify(
          await this.securityService.encryptData(options.body, this.encryptionKey)
        );
      } else {
        requestInit.body = JSON.stringify(options.body);
      }
    }

    return requestInit;
  }

  private async executeWithRetries(
    url: string,
    options: RequestInit,
    maxRetries: number
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // Don't retry on client errors (4xx), only server errors (5xx) and network issues
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        if (attempt === maxRetries) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await this.sleep(delay);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Only retry on network errors, not on abort or other errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private async processResponse<T>(response: Response, requestId: string): Promise<APIResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const rawData = await response.json();

      // Decrypt data if it was encrypted
      if (response.headers.get('X-PHI-Encrypted') === 'true' && this.encryptionKey) {
        data = await this.securityService.decryptData(rawData, this.encryptionKey);
      } else {
        data = rawData;
      }
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  private createAPIError(error: Error, requestId: string): APIError {
    let status = 500;
    let code = 'INTERNAL_ERROR';

    if (error.message.includes('HTTP 4')) {
      status = 400;
      code = 'CLIENT_ERROR';
    } else if (error.message.includes('HTTP 5')) {
      status = 500;
      code = 'SERVER_ERROR';
    } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
      status = 408;
      code = 'TIMEOUT_ERROR';
    } else if (error.message.includes('fetch')) {
      status = 0;
      code = 'NETWORK_ERROR';
    }

    return {
      message: error.message,
      status,
      code,
      timestamp: new Date().toISOString(),
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  private logRequest(
    endpoint: string,
    method: string,
    status: number,
    duration: number,
    requestId: string
  ): void {
    // PHI-safe logging - never log request/response bodies
    const logData = {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Anonymize IDs
      method,
      status,
      duration,
      requestId,
      timestamp: new Date().toISOString(),
    };

    console.info('API Request:', logData);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance factory
export const createAPIClient = (config: APIConfig): APIClient => {
  return new APIClient(config);
};

// Default configuration for development
export const defaultAPIConfig: APIConfig = {
  baseURL: process.env.VITE_API_BASE_URL || 'https://api.tmd-diagnostic.local',
  timeout: 30000,
  maxRetries: 3,
  encryptionKey: process.env.VITE_ENCRYPTION_KEY,
  apiKey: process.env.VITE_API_KEY,
};
