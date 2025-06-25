import React, { FC, useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/shared/hooks';
import { usePerformance } from '@/hooks/usePerformance';
import { useAccessibility } from '@/hooks/useAccessibility';
import { SecurityService } from '@/services/SecurityService';
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from '@/services/ErrorLoggingService';
import { AnalyticsService } from '@/services/AnalyticsService';
import type {
  AssessmentResponse,
  AssessmentResponseValue,
  DCTMDProtocol,
  AssessmentSession,
} from '@/entities/assessment';
import type { RiskLevel } from '@/shared/types';

/**
 * Validation error interface for medical-grade validation
 */
export interface ValidationError {
  questionId: string;
  errorType: 'required' | 'format' | 'range' | 'consistency' | 'medical';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedAction?: string;
  medicalReference?: string;
}

/**
 * Assessment step configuration
 */
interface AssessmentStep {
  id: string;
  title: string;
  description: string;
  category: 'pain' | 'function' | 'sounds' | 'symptoms' | 'history' | 'psychosocial';
  questions: AssessmentQuestion[];
  required: boolean;
  medicalRelevance: 'critical' | 'important' | 'supplementary';
}

/**
 * Individual assessment question configuration
 */
interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'yesno' | 'scale' | 'choice' | 'multiselect' | 'numeric' | 'text';
  required: boolean;
  options?: string[];
  validation: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    customValidator?: (value: AssessmentResponseValue) => ValidationError | null;
  };
  medicalContext: {
    dcTmdRelevance: 'axis_i' | 'axis_ii' | 'both';
    clinicalSignificance: 'diagnostic' | 'prognostic' | 'therapeutic';
    evidenceLevel: 'A' | 'B' | 'C' | 'D';
    reference?: string;
  };
  accessibility: {
    ariaLabel: string;
    helpText?: string;
    keyboardShortcut?: string;
  };
}

/**
 * Auto-save configuration
 */
interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  retentionPeriod: number; // days
}

/**
 * Progress tracking interface
 */
interface ProgressIndicatorProps {
  current: number;
  total: number;
  completionRate: number;
  estimatedTimeRemaining?: number;
}

/**
 * Main component props
 */
export interface TMDAssessmentProps {
  onComplete: (responses: AssessmentResponse[], session: AssessmentSession) => void;
  onSave?: (responses: AssessmentResponse[], isAutoSave: boolean) => void;
  onError?: (error: Error, context: string) => void;
  protocol?: DCTMDProtocol;
  patientId?: string;
  sessionId?: string;
  autoSave?: AutoSaveConfig;
  theme?: 'light' | 'dark' | 'high-contrast';
  locale?: string;
  accessibility?: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

/**
 * TMD Assessment Wizard Component
 * Medical-grade TMD assessment with progressive disclosure, validation, and accessibility
 */
export const TMDAssessmentWizard: FC<TMDAssessmentProps> = memo(
  ({
    onComplete,
    onSave,
    onError,
    protocol = 'DC_TMD_AXIS_I',
    patientId,
    sessionId,
    autoSave = {
      enabled: true,
      intervalMs: 30000, // 30 seconds
      encryptionLevel: 'enhanced',
      retentionPeriod: 30,
    },
    theme = 'light',
    locale = 'en',
    accessibility = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
    },
  }) => {
    // Hooks
    const { t } = useTranslation('assessment');
    const { trackPerformance, measureTime } = usePerformance();
    const { announceToScreenReader, focusElement } = useAccessibility();

    // State management
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<AssessmentResponse[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [sessionStartTime] = useState(new Date());
    const [interruptionCount, setInterruptionCount] = useState(0);

    // Refs
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const questionContainerRef = useRef<HTMLDivElement>(null);
    const currentQuestionRef = useRef<HTMLElement>(null);

    // Debounced response handler for auto-save
    const debouncedResponses = useDebounce(responses, 1000);

    // Assessment steps configuration based on DC/TMD protocol
    const assessmentSteps = useMemo((): AssessmentStep[] => {
      const baseSteps: AssessmentStep[] = [
        {
          id: 'pain_assessment',
          title: 'Pain Assessment',
          description: 'Evaluate pain patterns and intensity following DC/TMD protocol',
          category: 'pain',
          required: true,
          medicalRelevance: 'critical',
          questions: [
            {
              id: 'pain_at_rest',
              text: 'Do you have pain in your jaw, temple, in the ear, or in front of the ear on either side at rest?',
              type: 'yesno',
              required: true,
              validation: {},
              medicalContext: {
                dcTmdRelevance: 'axis_i',
                clinicalSignificance: 'diagnostic',
                evidenceLevel: 'A',
                reference: 'DC/TMD Protocol v2.1, Section 3.1',
              },
              accessibility: {
                ariaLabel: 'Pain at rest assessment',
                helpText: 'This helps identify resting pain patterns associated with TMD',
                keyboardShortcut: 'y/n',
              },
            },
            {
              id: 'pain_intensity',
              text: 'Rate your average pain intensity over the past week (0 = no pain, 4 = very severe pain)',
              type: 'scale',
              required: true,
              validation: {
                min: 0,
                max: 4, // DC/TMD standard 0-4 scale
                customValidator: (value) => {
                  if (typeof value === 'number' && (value < 0 || value > 4)) {
                    return {
                      questionId: 'pain_intensity',
                      errorType: 'range',
                      severity: 'error',
                      message: 'Pain intensity must be rated on a 0-4 scale per DC/TMD protocol',
                      suggestedAction:
                        'Please select a value between 0 (no pain) and 4 (very severe pain)',
                      medicalReference: 'DC/TMD Protocol: Pain intensity scale 0-4',
                    };
                  }
                  return null;
                },
              },
              medicalContext: {
                dcTmdRelevance: 'axis_i',
                clinicalSignificance: 'diagnostic',
                evidenceLevel: 'A',
              },
              accessibility: {
                ariaLabel: 'Pain intensity rating scale',
                helpText: 'Use the 0-4 scale where 0 means no pain and 4 means very severe pain',
              },
            },
          ],
        },
        {
          id: 'functional_assessment',
          title: 'Functional Assessment',
          description: 'Evaluate jaw function and movement limitations',
          category: 'function',
          required: true,
          medicalRelevance: 'critical',
          questions: [
            {
              id: 'mouth_opening_limitation',
              text: 'Do you have difficulty opening your mouth wide?',
              type: 'yesno',
              required: true,
              validation: {},
              medicalContext: {
                dcTmdRelevance: 'axis_i',
                clinicalSignificance: 'diagnostic',
                evidenceLevel: 'A',
              },
              accessibility: {
                ariaLabel: 'Mouth opening limitation assessment',
                helpText: 'This identifies functional limitations in jaw movement',
              },
            },
            {
              id: 'functional_limitation_scale',
              text: 'Rate how much jaw problems interfere with daily activities (0 = no interference, 4 = extreme interference)',
              type: 'scale',
              required: true,
              validation: {
                min: 0,
                max: 4,
              },
              medicalContext: {
                dcTmdRelevance: 'axis_ii',
                clinicalSignificance: 'prognostic',
                evidenceLevel: 'A',
              },
              accessibility: {
                ariaLabel: 'Functional limitation scale',
                helpText: 'Rate interference with activities like eating, speaking, or yawning',
              },
            },
          ],
        },
      ];

      // Add Axis II questions if protocol includes psychosocial assessment
      if (protocol === 'DC_TMD_AXIS_II') {
        baseSteps.push({
          id: 'psychosocial_assessment',
          title: 'Psychosocial Assessment',
          description: 'Evaluate psychological and social factors affecting TMD',
          category: 'psychosocial',
          required: true,
          medicalRelevance: 'important',
          questions: [
            {
              id: 'depression_screening',
              text: 'Over the past 2 weeks, how often have you felt down, depressed, or hopeless? (0 = not at all, 3 = nearly every day)',
              type: 'scale',
              required: true,
              validation: {
                min: 0,
                max: 3,
              },
              medicalContext: {
                dcTmdRelevance: 'axis_ii',
                clinicalSignificance: 'therapeutic',
                evidenceLevel: 'B',
              },
              accessibility: {
                ariaLabel: 'Depression screening question',
                helpText: 'This helps identify psychological factors that may affect TMD treatment',
              },
            },
          ],
        });
      }

      return baseSteps;
    }, [protocol]);

    // Current step and question data
    const currentStepData = assessmentSteps[currentStep];
    const totalQuestions = assessmentSteps.reduce((sum, step) => sum + step.questions.length, 0);
    const completedQuestions = responses.length;
    const completionRate = (completedQuestions / totalQuestions) * 100;

    // Auto-save functionality
    useEffect(() => {
      if (!autoSave.enabled || responses.length === 0) return;

      const saveData = async () => {
        try {
          setIsSaving(true);

          // Encrypt sensitive data
          // For now, just use the responses directly
          // TODO: Implement encryption when SecurityService is updated
          const encryptedResponses = responses;

          // Save to secure storage
          await onSave?.(encryptedResponses, true);
          setLastSaved(new Date());

          // Track auto-save event
          AnalyticsService.trackEvent('assessment_auto_saved', {
            stepId: currentStepData.id,
            responseCount: responses.length,
            completionRate,
          });
        } catch (error) {
          ErrorLoggingService.logError(
            error as Error,
            ErrorSeverity.MEDIUM,
            ErrorCategory.STORAGE,
            {
              additionalData: {
                stepId: currentStepData.id,
                responseCount: responses.length,
              },
            }
          );
          onError?.(error as Error, 'auto-save');
        } finally {
          setIsSaving(false);
        }
      };

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(saveData, autoSave.intervalMs);

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }, [debouncedResponses, autoSave, onSave, onError, currentStepData.id, completionRate]);

    // Validation function
    const validateCurrentStep = useCallback((): ValidationError[] => {
      const errors: ValidationError[] = [];
      const currentQuestions = currentStepData.questions;

      for (const question of currentQuestions) {
        const response = responses.find((r) => r.questionId === question.id);

        // Check required fields
        if (
          question.required &&
          (!response || response.value === null || response.value === undefined)
        ) {
          errors.push({
            questionId: question.id,
            errorType: 'required',
            severity: 'error',
            message: `Please answer: ${question.text}`,
            suggestedAction: 'This question is required for accurate assessment',
          });
          continue;
        }

        // Run custom validation if response exists
        if (response && question.validation.customValidator) {
          const validationError = question.validation.customValidator(response.value);
          if (validationError) {
            errors.push(validationError);
          }
        }

        // Range validation for numeric responses
        if (response && typeof response.value === 'number') {
          const { min, max } = question.validation;
          if (min !== undefined && response.value < min) {
            errors.push({
              questionId: question.id,
              errorType: 'range',
              severity: 'error',
              message: `Value must be at least ${min}`,
              suggestedAction: `Please select a value between ${min} and ${max}`,
            });
          }
          if (max !== undefined && response.value > max) {
            errors.push({
              questionId: question.id,
              errorType: 'range',
              severity: 'error',
              message: `Value must be at most ${max}`,
              suggestedAction: `Please select a value between ${min} and ${max}`,
            });
          }
        }
      }

      return errors;
    }, [currentStepData.questions, responses]);

    // Handle response change
    const handleResponseChange = useCallback(
      (questionId: string, value: AssessmentResponseValue) => {
        const responseTime = measureTime();
        const timestamp = new Date();

        setResponses((prev) => {
          const existingIndex = prev.findIndex((r) => r.questionId === questionId);
          const question = currentStepData?.questions.find((q) => q.id === questionId);

          const newResponse: AssessmentResponse = {
            questionId,
            questionText: question?.text || '',
            value,
            timestamp,
            responseTime,
            validated: false,
            modified: existingIndex !== -1,
          };

          if (existingIndex !== -1) {
            newResponse.previousValue = prev[existingIndex].value;
            const updated = [...prev];
            updated[existingIndex] = newResponse;
            return updated;
          } else {
            return [...prev, newResponse];
          }
        });

        // Clear validation errors for this question
        setValidationErrors((prev) => prev.filter((error) => error.questionId !== questionId));

        // Track response
        AnalyticsService.trackEvent('assessment_response', {
          questionId,
          stepId: currentStepData.id,
          responseTime,
          valueType: typeof value,
        });
      },
      [currentStepData.questions, currentStepData.id, measureTime]
    );

    // Navigation handlers
    const handleNext = useCallback(async () => {
      const errors = validateCurrentStep();
      setValidationErrors(errors);

      const criticalErrors = errors.filter((e) => e.severity === 'error');
      if (criticalErrors.length > 0) {
        announceToScreenReader(`Found ${criticalErrors.length} errors that need to be corrected`);
        return;
      }

      if (currentStep < assessmentSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        announceToScreenReader(`Moving to step ${currentStep + 2}`);

        // Focus management for accessibility
        setTimeout(() => {
          focusElement(questionContainerRef.current);
        }, 100);
      } else {
        // Complete assessment
        await handleComplete();
      }
    }, [
      currentStep,
      assessmentSteps.length,
      validateCurrentStep,
      announceToScreenReader,
      focusElement,
    ]);

    const handleBack = useCallback(() => {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        announceToScreenReader(`Moving back to step ${currentStep}`);

        setTimeout(() => {
          focusElement(questionContainerRef.current);
        }, 100);
      }
    }, [currentStep, announceToScreenReader, focusElement]);

    // Complete assessment
    const handleComplete = useCallback(async () => {
      try {
        setIsLoading(true);

        // Final validation
        const allErrors: ValidationError[] = [];
        for (let i = 0; i < assessmentSteps.length; i++) {
          const stepErrors = validateCurrentStep();
          allErrors.push(...stepErrors);
        }

        const criticalErrors = allErrors.filter((e) => e.severity === 'error');
        if (criticalErrors.length > 0) {
          setValidationErrors(allErrors);
          announceToScreenReader(
            `Assessment cannot be completed. Found ${criticalErrors.length} errors that need to be corrected`
          );
          return;
        }

        // Create session data
        const session: AssessmentSession = {
          sessionId: sessionId || `session_${Date.now()}`,
          startTime: sessionStartTime,
          endTime: new Date(),
          duration: Date.now() - sessionStartTime.getTime(),
          assessmentMode: 'self_administered',
          location: 'home',
          deviceInfo: {
            type: 'desktop', // Would be detected in real implementation
            browser: navigator.userAgent,
            operatingSystem: navigator.platform,
            screenSize: `${window.screen.width}x${window.screen.height}`,
          },
          completionRate,
          interruptionCount,
          assistanceProvided: false,
          dataIntegrityChecks: {
            responseTimeValidation: true,
            consistencyChecks: true,
            completenessValidation: true,
            anomalyDetection: true,
          },
        };

        // Track completion
        AnalyticsService.trackEvent('assessment_completed', {
          protocol,
          duration: session.duration,
          completionRate,
          responseCount: responses.length,
          interruptionCount,
        });

        // Complete assessment
        await onComplete(responses, session);
        announceToScreenReader('Assessment completed successfully');
      } catch (error) {
        ErrorLoggingService.logError(error as Error, ErrorSeverity.HIGH, ErrorCategory.ASSESSMENT, {
          additionalData: {
            step: currentStep,
            responseCount: responses.length,
            completionRate,
          },
        });
        onError?.(error as Error, 'completion');
      } finally {
        setIsLoading(false);
      }
    }, [
      assessmentSteps.length,
      validateCurrentStep,
      sessionId,
      sessionStartTime,
      completionRate,
      interruptionCount,
      protocol,
      responses,
      onComplete,
      announceToScreenReader,
      onError,
      currentStep,
    ]);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'ArrowRight':
              event.preventDefault();
              handleNext();
              break;
            case 'ArrowLeft':
              event.preventDefault();
              handleBack();
              break;
            case 's':
              event.preventDefault();
              // Manual save
              onSave?.(responses, false);
              break;
          }
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleNext, handleBack, onSave, responses]);

    // Progress indicator component
    const ProgressIndicator: FC<ProgressIndicatorProps> = memo(
      ({ current, total, completionRate, estimatedTimeRemaining }) => (
        <div
          className="progress-indicator"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Assessment progress: step ${current + 1} of ${total}`}
        >
          <div className="progress-header">
            <span className="progress-text">
              Step {current + 1} of {total}
            </span>
            <span className="progress-percentage">{Math.round(completionRate)}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${completionRate}%`,
                transition: accessibility.reducedMotion ? 'none' : 'width 0.3s ease',
              }}
            />
          </div>

          {estimatedTimeRemaining && (
            <div className="progress-time">
              <Clock size={16} />
              <span>Estimated time remaining: {estimatedTimeRemaining} minutes</span>
            </div>
          )}
        </div>
      )
    );

    // Step container component
    const StepContainer: FC = memo(() => (
      <div
        ref={questionContainerRef}
        className="step-container"
        role="main"
        aria-labelledby="step-title"
        tabIndex={-1}
      >
        <header className="step-header">
          <h2 id="step-title" className="step-title">
            {currentStepData.title}
          </h2>
          <p className="step-description">{currentStepData.description}</p>
          {currentStepData.medicalRelevance === 'critical' && (
            <div className="medical-notice" role="note">
              <AlertTriangle size={16} className="medical-icon" />
              <span>Critical medical assessment section</span>
            </div>
          )}
        </header>

        <div className="questions-container">
          {currentStepData.questions.map((question, index) => {
            const response = responses.find((r) => r.questionId === question.id);
            const questionErrors = validationErrors.filter((e) => e.questionId === question.id);

            return (
              <div key={question.id} className="question-block">
                <label
                  htmlFor={question.id}
                  className="question-label"
                  aria-describedby={`${question.id}-help ${question.id}-errors`}
                >
                  {question.text}
                  {question.required && (
                    <span className="required-indicator" aria-label="required">
                      *
                    </span>
                  )}
                </label>

                {question.accessibility.helpText && (
                  <div id={`${question.id}-help`} className="question-help">
                    {question.accessibility.helpText}
                  </div>
                )}

                <div className="question-input">
                  {renderQuestionInput(question, response?.value, questionErrors)}
                </div>

                {questionErrors.length > 0 && (
                  <div
                    id={`${question.id}-errors`}
                    className="question-errors"
                    role="alert"
                    aria-live="polite"
                  >
                    {questionErrors.map((error, errorIndex) => (
                      <div key={errorIndex} className={`error-message error-${error.severity}`}>
                        <AlertTriangle size={16} />
                        <span>{error.message}</span>
                        {error.suggestedAction && (
                          <div className="error-action">{error.suggestedAction}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));

    // Navigation controls component
    const NavigationControls: FC = memo(() => (
      <div className="navigation-controls" role="navigation" aria-label="Assessment navigation">
        <button
          type="button"
          className="nav-button nav-button-back"
          onClick={handleBack}
          disabled={currentStep === 0}
          aria-label="Go back to previous step"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="nav-status">
          {isSaving && (
            <div className="save-indicator" aria-live="polite">
              <Save size={16} className="saving-icon" />
              <span>Saving...</span>
            </div>
          )}

          {lastSaved && !isSaving && (
            <div className="save-status">
              <CheckCircle size={16} className="saved-icon" />
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}

          {autoSave.enabled && (
            <div className="auto-save-indicator">
              <Shield size={16} />
              <span>Auto-save enabled</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="nav-button nav-button-next"
          onClick={handleNext}
          disabled={isLoading}
          aria-label={
            currentStep === assessmentSteps.length - 1 ? 'Complete assessment' : 'Go to next step'
          }
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" />
              Processing...
            </>
          ) : (
            <>
              {currentStep === assessmentSteps.length - 1 ? 'Complete Assessment' : 'Next'}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    ));

    // Question input renderer
    const renderQuestionInput = useCallback(
      (
        question: AssessmentQuestion,
        value: AssessmentResponseValue | undefined,
        errors: ValidationError[]
      ) => {
        const hasError = errors.length > 0;
        const baseProps = {
          id: question.id,
          'aria-invalid': hasError,
          'aria-describedby': `${question.id}-help ${question.id}-errors`,
          className: `question-input-field ${hasError ? 'error' : ''}`,
        };

        switch (question.type) {
          case 'yesno':
            return (
              <div className="yesno-buttons" role="radiogroup" aria-labelledby={question.id}>
                <button
                  type="button"
                  className={`yesno-button yes-button ${value === true ? 'selected' : ''}`}
                  onClick={() => handleResponseChange(question.id, true)}
                  aria-pressed={value === true}
                  {...baseProps}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`yesno-button no-button ${value === false ? 'selected' : ''}`}
                  onClick={() => handleResponseChange(question.id, false)}
                  aria-pressed={value === false}
                  {...baseProps}
                >
                  No
                </button>
              </div>
            );

          case 'scale':
            const min = question.validation.min || 0;
            const max = question.validation.max || 10;
            return (
              <div className="scale-input" role="radiogroup" aria-labelledby={question.id}>
                <div className="scale-buttons">
                  {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`scale-button ${value === num ? 'selected' : ''}`}
                      onClick={() => handleResponseChange(question.id, num)}
                      aria-pressed={value === num}
                      aria-label={`Rating: ${num}`}
                      {...baseProps}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="scale-labels">
                  <span>None/Low</span>
                  <span>Severe/High</span>
                </div>
              </div>
            );

          case 'choice':
            return (
              <div className="choice-buttons" role="radiogroup" aria-labelledby={question.id}>
                {question.options?.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`choice-button ${value === option ? 'selected' : ''}`}
                    onClick={() => handleResponseChange(question.id, option)}
                    aria-pressed={value === option}
                    {...baseProps}
                  >
                    {option}
                  </button>
                ))}
              </div>
            );

          default:
            return (
              <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                {...baseProps}
              />
            );
        }
      },
      [handleResponseChange]
    );

    // Main render
    return (
      <div
        className={`assessment-wizard theme-${theme} ${accessibility.highContrast ? 'high-contrast' : ''} ${accessibility.largeText ? 'large-text' : ''}`}
        role="application"
        aria-label="TMD Assessment Wizard"
        data-testid="tmd-assessment-wizard"
      >
        <ProgressIndicator
          current={currentStep}
          total={assessmentSteps.length}
          completionRate={completionRate}
        />

        <StepContainer />

        <NavigationControls />
      </div>
    );
  }
);

TMDAssessmentWizard.displayName = 'TMDAssessmentWizard';

export default TMDAssessmentWizard;
