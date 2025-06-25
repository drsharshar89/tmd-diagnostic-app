import React, { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { QuickAssessmentAnswers } from '@/shared/types';
import { useQuickAssessment } from '../features/assessment/hooks/useQuickAssessment';

interface QuickAssessmentViewProps {
  lang: Language;
  onComplete: (answers: QuickAssessmentAnswers) => void;
}

/**
 * Progress indicator component for the assessment
 */
const ProgressIndicator = memo(
  ({ current, total, percentage }: { current: number; total: number; percentage: number }) => (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} aria-hidden="true" />
      </div>
      <span className="progress-text" aria-live="polite">
        Question {current} of {total} ({percentage}%)
      </span>
    </div>
  )
);
ProgressIndicator.displayName = 'ProgressIndicator';

/**
 * Risk indicator component showing current assessment risk level
 */
const RiskIndicator = memo(({ level, score }: { level: string; score: number }) => {
  const getRiskConfig = () => {
    switch (level) {
      case 'low':
        return { color: '#10B981', label: '🟢 Low Risk', bgColor: '#D1FAE5' };
      case 'moderate':
        return { color: '#F59E0B', label: '🟡 Moderate Risk', bgColor: '#FEF3C7' };
      case 'high':
        return { color: '#EF4444', label: '🔴 High Risk', bgColor: '#FEE2E2' };
      default:
        return { color: '#6B7280', label: '⚪ Not Assessed', bgColor: '#F3F4F6' };
    }
  };

  const config = getRiskConfig();

  return (
    <div
      className="risk-indicator"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      role="status"
      aria-label={`Current risk level: ${config.label}, Score: ${score}`}
    >
      <span>{config.label}</span>
      <span style={{ fontSize: '12px', opacity: 0.8 }}>Score: {score}/11</span>
    </div>
  );
});
RiskIndicator.displayName = 'RiskIndicator';

/**
 * Question component with yes/no buttons
 */
const QuestionCard = memo(
  ({
    question,
    onAnswer,
    disabled = false,
  }: {
    question: string;
    onAnswer: (answer: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="question-card">
      <p className="question-text" role="heading" aria-level={3}>
        {question}
      </p>
      <div className="answer-buttons" role="radiogroup" aria-label="Answer options">
        <button
          type="button"
          className="answer-button yes-button"
          onClick={() => onAnswer(true)}
          disabled={disabled}
          aria-label="Yes"
        >
          <CheckCircle size={20} />
          Yes
        </button>
        <button
          type="button"
          className="answer-button no-button"
          onClick={() => onAnswer(false)}
          disabled={disabled}
          aria-label="No"
        >
          No
        </button>
      </div>
    </div>
  )
);
QuestionCard.displayName = 'QuestionCard';

/**
 * TMD Quick Assessment Component
 * Implements 7-question RDC/TMD-based screening with branching logic
 */
const QuickAssessmentView: React.FC<QuickAssessmentViewProps> = memo(({ lang, onComplete }) => {
  const navigate = useNavigate();
  const t = getTranslation(lang);

  // Assessment logic hook
  const {
    currentQuestion,
    state,
    answerQuestion,
    goToPreviousQuestion,
    resetAssessment,
    getAssessmentResult,
    getProgress,
    canGoBack,
  } = useQuickAssessment();

  // Local state for UI
  const [isAnswering, setIsAnswering] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);

  // Show risk warning for high-risk scores
  useEffect(() => {
    if (state.riskLevel === 'high' && state.score >= 6) {
      setShowRiskWarning(true);
    } else {
      setShowRiskWarning(false);
    }
  }, [state.riskLevel, state.score]);

  // Handle answer selection
  const handleAnswer = useCallback(
    async (answer: boolean) => {
      if (isAnswering || !currentQuestion) return;

      setIsAnswering(true);

      try {
        // Answer the question
        answerQuestion(answer);

        // Small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Error answering question:', error);
      } finally {
        setIsAnswering(false);
      }
    },
    [currentQuestion, answerQuestion, isAnswering]
  );

  // Handle assessment completion
  const handleComplete = useCallback(() => {
    if (!state.isComplete) return;

    try {
      const result = getAssessmentResult();

      onComplete(state.answers);
      navigate('/results');
    } catch (error) {
      console.error('Error completing assessment:', error);
    }
  }, [state.isComplete, state.answers, getAssessmentResult, onComplete, navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (canGoBack) {
      goToPreviousQuestion();
    } else {
      navigate('/');
    }
  }, [canGoBack, goToPreviousQuestion, navigate]);

  // Get progress information
  const progress = getProgress();

  // Auto-complete when done
  useEffect(() => {
    if (state.isComplete) {
      handleComplete();
    }
  }, [state.isComplete, handleComplete]);

  // Loading state
  if (!currentQuestion) {
    return (
      <div className="view">
        <div className="loading-container">
          <Clock size={32} />
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view" role="main" aria-labelledby="assessment-title">
      <div className="question-container">
        <div className="assessment-header">
          <h2 id="assessment-title">{t.quickAssessment}</h2>
          <p className="assessment-description">
            TMD Quick Screening • 7 Questions • RDC/TMD Protocol
          </p>
        </div>

        <ProgressIndicator
          current={progress.current + 1}
          total={progress.total}
          percentage={progress.percentage}
        />

        <div className="assessment-status">
          <RiskIndicator level={state.riskLevel} score={state.score} />

          {showRiskWarning && (
            <div className="risk-warning" role="alert">
              <AlertTriangle size={20} />
              <span>High risk indicators detected. Professional evaluation recommended.</span>
            </div>
          )}
        </div>

        <QuestionCard
          question={currentQuestion.text}
          onAnswer={handleAnswer}
          disabled={isAnswering}
        />

        <div className="button-container">
          <button
            type="button"
            className="secondary-button"
            onClick={handleBack}
            disabled={isAnswering}
            aria-label={canGoBack ? 'Previous question' : 'Back to home'}
          >
            <ChevronLeft size={20} />
            {canGoBack ? 'Previous' : t.back}
          </button>

          <button
            type="button"
            className="info-button"
            onClick={resetAssessment}
            disabled={isAnswering}
            aria-label="Restart assessment"
          >
            Reset
          </button>
        </div>

        <div className="medical-disclaimer">
          <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
            This assessment is for screening purposes only and does not replace professional medical
            evaluation.
          </p>
        </div>
      </div>
    </div>
  );
});

QuickAssessmentView.displayName = 'QuickAssessmentView';

export default QuickAssessmentView;
