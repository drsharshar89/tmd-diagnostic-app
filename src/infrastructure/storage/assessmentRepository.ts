import { SecurityService } from '@/services/SecurityService';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';
import type { AssessmentResult, StoredAssessment } from '@/shared/types';

// Repository configuration
interface RepositoryConfig {
  encryptionEnabled: boolean;
  auditLoggingEnabled: boolean;
  dataRetentionDays: number;
  maxStoredAssessments: number;
  backupEnabled: boolean;
  compressionEnabled: boolean;
}

// Default configuration following HIPAA guidelines
const DEFAULT_CONFIG: RepositoryConfig = {
  encryptionEnabled: true,
  auditLoggingEnabled: true,
  dataRetentionDays: 365, // 1 year retention for medical data
  maxStoredAssessments: 1000,
  backupEnabled: true,
  compressionEnabled: true,
};

// Audit log entry interface
interface AuditLogEntry {
  id: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'CLEANUP';
  assessmentId?: string;
  patientId?: string;
  timestamp: Date;
  userAgent: string;
  sessionId: string;
  success: boolean;
  errorMessage?: string;
  dataSize?: number;
  ipAddress?: string;
}

// Storage statistics interface
interface StorageStats {
  totalAssessments: number;
  totalSize: number;
  oldestAssessment?: Date;
  newestAssessment?: Date;
  encryptedCount: number;
  compressionRatio?: number;
}

/**
 * HIPAA-compliant assessment repository with encryption and audit trails
 * Handles secure storage, retrieval, and management of medical assessment data
 */
export class AssessmentRepository {
  private config: RepositoryConfig;
  private securityService: SecurityService;
  private errorLogger: ErrorLoggingService;
  private sessionId: string;
  private storageKey = 'tmd_assessments';
  private auditKey = 'tmd_audit_log';
  private metadataKey = 'tmd_storage_metadata';

  constructor(config: Partial<RepositoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.securityService = new SecurityService();
    this.errorLogger = new ErrorLoggingService();
    this.sessionId = this.generateSessionId();

    // Initialize repository
    this.initializeRepository();
  }

  /**
   * Save assessment with HIPAA-compliant encryption and audit logging
   */
  async saveAssessment(assessment: AssessmentResult, patientId?: string): Promise<string> {
    const startTime = Date.now();
    const assessmentId = this.generateAssessmentId();

    try {
      // Validate assessment data
      this.validateAssessment(assessment);

      // Create stored assessment object
      const storedAssessment: StoredAssessment = {
        id: assessmentId,
        result: assessment,
        expiresAt: new Date(Date.now() + this.config.dataRetentionDays * 24 * 60 * 60 * 1000),
        encrypted: this.config.encryptionEnabled,
        version: '1.0.0',
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date(),
        },
      };

      // Encrypt if enabled
      let dataToStore: string;
      if (this.config.encryptionEnabled) {
        const serialized = JSON.stringify(storedAssessment);
        dataToStore = await this.securityService.encryptData(serialized);
      } else {
        dataToStore = JSON.stringify(storedAssessment);
      }

      // Compress if enabled
      if (this.config.compressionEnabled) {
        dataToStore = this.compressData(dataToStore);
      }

      // Store in localStorage with error handling
      this.secureSetItem(`${this.storageKey}_${assessmentId}`, dataToStore);

      // Update metadata
      await this.updateStorageMetadata(assessmentId, dataToStore.length);

      // Log audit entry
      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'CREATE',
          assessmentId,
          patientId,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: true,
          dataSize: dataToStore.length,
        });
      }

      // Cleanup old assessments if needed
      await this.cleanupExpiredAssessments();

      return assessmentId;
    } catch (error) {
      // Log error and audit failure
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.STORAGE, {
        additionalData: {
          assessmentId,
          patientId,
          duration: Date.now() - startTime,
        },
      });

      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'CREATE',
          assessmentId,
          patientId,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: false,
          errorMessage: (error as Error).message,
        });
      }

      throw new Error(`Failed to save assessment: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieve assessments for a patient with audit logging
   */
  async getAssessments(patientId: string): Promise<AssessmentResult[]> {
    const startTime = Date.now();

    try {
      // Validate patient ID
      if (!patientId || typeof patientId !== 'string') {
        throw new Error('Valid patient ID is required');
      }

      const assessments: AssessmentResult[] = [];
      const allKeys = this.getAllStorageKeys();

      for (const key of allKeys) {
        if (key.startsWith(this.storageKey)) {
          try {
            const storedAssessment = await this.retrieveStoredAssessment(key);

            // Check if assessment belongs to patient (if patient ID tracking is implemented)
            // For now, return all assessments as we don't have patient ID in the current structure
            assessments.push(storedAssessment.result);
          } catch (error) {
            // Log individual retrieval errors but continue processing
            this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.STORAGE, {
              additionalData: { key, patientId },
            });
          }
        }
      }

      // Log audit entry
      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'READ',
          patientId,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: true,
          dataSize: assessments.length,
        });
      }

      return assessments;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.STORAGE, {
        additionalData: {
          patientId,
          duration: Date.now() - startTime,
        },
      });

      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'READ',
          patientId,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: false,
          errorMessage: (error as Error).message,
        });
      }

      throw new Error(`Failed to retrieve assessments: ${(error as Error).message}`);
    }
  }

  /**
   * Get single assessment by ID
   */
  async getAssessmentById(assessmentId: string): Promise<AssessmentResult | null> {
    try {
      const key = `${this.storageKey}_${assessmentId}`;
      const storedAssessment = await this.retrieveStoredAssessment(key);
      return storedAssessment ? storedAssessment.result : null;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.STORAGE, {
        additionalData: { assessmentId },
      });
      return null;
    }
  }

  /**
   * Delete assessment with audit logging
   */
  async deleteAssessment(assessmentId: string): Promise<boolean> {
    try {
      const key = `${this.storageKey}_${assessmentId}`;

      // Check if assessment exists
      const exists = localStorage.getItem(key) !== null;
      if (!exists) {
        return false;
      }

      // Remove from storage
      localStorage.removeItem(key);

      // Update metadata
      await this.updateStorageMetadata(assessmentId, 0, true);

      // Log audit entry
      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'DELETE',
          assessmentId,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: true,
        });
      }

      return true;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.STORAGE, {
        additionalData: { assessmentId },
      });

      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'DELETE',
          assessmentId,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: false,
          errorMessage: (error as Error).message,
        });
      }

      return false;
    }
  }

  /**
   * Export assessments for backup or transfer
   */
  async exportAssessments(): Promise<string> {
    try {
      const allAssessments = await this.getAllAssessments();
      const exportData = {
        assessments: allAssessments,
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          count: allAssessments.length,
        },
      };

      // Log audit entry
      if (this.config.auditLoggingEnabled) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'EXPORT',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: true,
          dataSize: allAssessments.length,
        });
      }

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.STORAGE);
      throw new Error(`Failed to export assessments: ${(error as Error).message}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const allKeys = this.getAllStorageKeys().filter((key) => key.startsWith(this.storageKey));
      const assessments: StoredAssessment[] = [];
      let totalSize = 0;
      let encryptedCount = 0;

      for (const key of allKeys) {
        try {
          const storedAssessment = await this.retrieveStoredAssessment(key);
          assessments.push(storedAssessment);

          const data = localStorage.getItem(key);
          if (data) {
            totalSize += data.length;
          }

          if (storedAssessment.encrypted) {
            encryptedCount++;
          }
        } catch (error) {
          // Skip corrupted entries
          continue;
        }
      }

      const timestamps = assessments.map((a) => a.result.timestamp).sort();

      return {
        totalAssessments: assessments.length,
        totalSize,
        oldestAssessment: timestamps.length > 0 ? new Date(timestamps[0]) : undefined,
        newestAssessment:
          timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]) : undefined,
        encryptedCount,
      };
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.STORAGE);
      throw new Error(`Failed to get storage stats: ${(error as Error).message}`);
    }
  }

  /**
   * Cleanup expired assessments
   */
  async cleanupExpiredAssessments(): Promise<number> {
    let cleanedCount = 0;

    try {
      const allKeys = this.getAllStorageKeys().filter((key) => key.startsWith(this.storageKey));
      const now = new Date();

      for (const key of allKeys) {
        try {
          const storedAssessment = await this.retrieveStoredAssessment(key);

          if (storedAssessment.expiresAt && storedAssessment.expiresAt < now) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }

      // Log cleanup audit entry
      if (this.config.auditLoggingEnabled && cleanedCount > 0) {
        await this.logAuditEntry({
          id: this.generateAuditId(),
          action: 'CLEANUP',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          success: true,
          dataSize: cleanedCount,
        });
      }

      return cleanedCount;
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.STORAGE);
      return cleanedCount;
    }
  }

  /**
   * Private helper methods
   */
  private initializeRepository(): void {
    try {
      // Initialize metadata if not exists
      if (!localStorage.getItem(this.metadataKey)) {
        const metadata = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          assessmentCount: 0,
          totalSize: 0,
        };
        localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
      }

      // Run initial cleanup
      this.cleanupExpiredAssessments().catch((error) => {
        this.errorLogger.logError(error as Error, ErrorSeverity.LOW, ErrorCategory.STORAGE);
      });
    } catch (error) {
      this.errorLogger.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.STORAGE);
    }
  }

  private validateAssessment(assessment: AssessmentResult): void {
    if (!assessment) {
      throw new Error('Assessment data is required');
    }

    if (!assessment.riskLevel || !['low', 'moderate', 'high'].includes(assessment.riskLevel)) {
      throw new Error('Valid risk level is required');
    }

    if (typeof assessment.score !== 'number' || assessment.score < 0) {
      throw new Error('Valid score is required');
    }

    if (!assessment.timestamp) {
      throw new Error('Assessment timestamp is required');
    }
  }

  private async retrieveStoredAssessment(key: string): Promise<StoredAssessment> {
    let data = localStorage.getItem(key);
    if (!data) {
      throw new Error('Assessment not found');
    }

    // Decompress if needed
    if (this.config.compressionEnabled) {
      data = this.decompressData(data);
    }

    // Decrypt if needed
    if (this.config.encryptionEnabled) {
      data = await this.securityService.decryptData(data);
    }

    const storedAssessment: StoredAssessment = JSON.parse(data);

    // Check expiration
    if (storedAssessment.expiresAt && new Date(storedAssessment.expiresAt) < new Date()) {
      localStorage.removeItem(key);
      throw new Error('Assessment has expired');
    }

    return storedAssessment;
  }

  private async getAllAssessments(): Promise<StoredAssessment[]> {
    const assessments: StoredAssessment[] = [];
    const allKeys = this.getAllStorageKeys().filter((key) => key.startsWith(this.storageKey));

    for (const key of allKeys) {
      try {
        const storedAssessment = await this.retrieveStoredAssessment(key);
        assessments.push(storedAssessment);
      } catch (error) {
        // Skip corrupted or expired entries
        continue;
      }
    }

    return assessments;
  }

  private getAllStorageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }

  private secureSetItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Storage quota exceeded - cleanup and retry
        this.cleanupExpiredAssessments().then(() => {
          try {
            localStorage.setItem(key, value);
          } catch (retryError) {
            throw new Error('Storage quota exceeded and cleanup failed');
          }
        });
      } else {
        throw error;
      }
    }
  }

  private async updateStorageMetadata(
    assessmentId: string,
    dataSize: number,
    isDelete = false
  ): Promise<void> {
    try {
      const metadataStr = localStorage.getItem(this.metadataKey);
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      if (isDelete) {
        metadata.assessmentCount = Math.max(0, (metadata.assessmentCount || 0) - 1);
        metadata.totalSize = Math.max(0, (metadata.totalSize || 0) - dataSize);
      } else {
        metadata.assessmentCount = (metadata.assessmentCount || 0) + 1;
        metadata.totalSize = (metadata.totalSize || 0) + dataSize;
      }

      metadata.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      // Metadata update failure is not critical
      this.errorLogger.logError(error as Error, ErrorSeverity.LOW, ErrorCategory.STORAGE);
    }
  }

  private async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog = JSON.parse(localStorage.getItem(this.auditKey) || '[]');
      auditLog.push(entry);

      // Keep only recent audit entries (last 1000)
      if (auditLog.length > 1000) {
        auditLog.splice(0, auditLog.length - 1000);
      }

      localStorage.setItem(this.auditKey, JSON.stringify(auditLog));
    } catch (error) {
      // Audit logging failure should not break the main operation
      this.errorLogger.logError(error as Error, ErrorSeverity.LOW, ErrorCategory.STORAGE);
    }
  }

  private compressData(data: string): string {
    // Simple compression using base64 encoding
    // In a real implementation, use proper compression libraries
    try {
      return btoa(data);
    } catch (error) {
      return data; // Return original if compression fails
    }
  }

  private decompressData(data: string): string {
    // Simple decompression
    try {
      return atob(data);
    } catch (error) {
      return data; // Return original if decompression fails
    }
  }

  private generateAssessmentId(): string {
    return `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance factory
export const createAssessmentRepository = (
  config?: Partial<RepositoryConfig>
): AssessmentRepository => {
  return new AssessmentRepository(config);
};

// Default repository instance
export const assessmentRepository = new AssessmentRepository();
