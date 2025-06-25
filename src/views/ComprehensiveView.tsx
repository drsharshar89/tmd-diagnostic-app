import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { ComprehensiveAnswers } from '../types';
import { validateComprehensiveAssessment } from '../utils';

interface ComprehensiveViewProps {
  lang: Language;
  onComplete: (answers: ComprehensiveAnswers) => void;
}

type ExtendedAnswers = {
  readonly [key: string]: boolean | number | string | null;
};

// =====================================================
// MEMOIZED SUB-COMPONENTS FOR PERFORMANCE
// =====================================================

const QuestionCategory = memo(({ category }: { category: string }) => (
  <div className="question-category">
    <h3>{category}</h3>
  </div>
));
QuestionCategory.displayName = 'QuestionCategory';

const ProgressIndicator = memo(({ current, total }: { current: number; total: number }) => {
  const progressPercentage = useMemo(() => ((current + 1) / total) * 100, [current, total]);

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="progress-text">
        Question {current + 1} of {total}
      </span>
    </div>
  );
});
ProgressIndicator.displayName = 'ProgressIndicator';

const NavigationButtons = memo(
  ({
    currentQuestion,
    totalQuestions,
    onPrevious,
    onNext,
    canProceed,
  }: {
    currentQuestion: number;
    totalQuestions: number;
    onPrevious: () => void;
    onNext: () => void;
    canProceed: boolean;
  }) => (
    <div className="navigation-buttons">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentQuestion === 0}
        className="btn btn-secondary"
        aria-label="Previous question"
      >
        <ChevronLeft size={20} />
        Previous
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="btn btn-primary"
        aria-label={
          currentQuestion === totalQuestions - 1 ? 'Complete assessment' : 'Next question'
        }
      >
        {currentQuestion === totalQuestions - 1 ? 'Complete' : 'Next'}
        {currentQuestion < totalQuestions - 1 && <ChevronRight size={20} />}
      </button>
    </div>
  )
);
NavigationButtons.displayName = 'NavigationButtons';

// =====================================================
// MAIN COMPONENT
// =====================================================

const ComprehensiveView: React.FC<ComprehensiveViewProps> = memo(({ lang, onComplete }) => {
  const navigate = useNavigate();
  const t = getTranslation(lang);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState<ComprehensiveAnswers>({
    // Pain Assessment Questions
    q1: null, // Jaw pain at rest
    q2: null, // Pain when opening mouth wide
    q3: null, // Pain when chewing
    q4: null, // Temple pain
    q5: null, // Ear pain
    q6: null, // Morning jaw stiffness
          q7: null, // Pain severity (0-4 DC/TMD standard)

    // Joint Sounds
    q8: null, // Clicking sounds
    q9: null, // Popping sounds
    q10: null, // Grinding/crepitus
    q11: null, // Sound location

    // Jaw Function
    q12: null, // Limited mouth opening
    q13: null, // Jaw locking closed
    q14: null, // Jaw locking open
    q15: null, // Deviation when opening
    q16: null, // Difficulty chewing hard foods
    q17: null, // Fatigue when chewing

    // Associated Symptoms
    q18: null, // Headaches
    q19: null, // Neck pain
    q20: null, // Tinnitus
    q21: null, // Dizziness

    // History and Triggers
    q22: null, // Recent dental work
    q23: null, // Trauma to jaw/face
    q24: null, // Stress levels
    q25: null, // Sleep bruxism
    q26: null, // Daytime clenching
  });

  // Memoized questions array to prevent recreation on every render
  const questions = useMemo(
    () => [
      // Pain Assessment (Q1-Q7)
      {
        text: 'Do you have pain in your jaw, temple, in the ear, or in front of the ear on either side at rest?',
        type: 'yesno',
        category: 'Pain Assessment',
      },
      {
        text: 'Do you have pain when you open your mouth wide?',
        type: 'yesno',
        category: 'Pain Assessment',
      },
      {
        text: 'Do you have pain when chewing food or gum?',
        type: 'yesno',
        category: 'Pain Assessment',
      },
      {
        text: 'Do you have pain in your temples?',
        type: 'yesno',
        category: 'Pain Assessment',
      },
      {
        text: 'Do you have pain in or around your ears?',
        type: 'yesno',
        category: 'Pain Assessment',
      },
      {
        text: 'Do you wake up with a stiff or sore jaw in the morning?',
        type: 'yesno',
        category: 'Pain Assessment',
      },
      {
        text: 'On a scale of 0-4, what is your average jaw pain level over the past week? (0 = no pain, 4 = very severe pain) - DC/TMD standard',
        type: 'scale',
        category: 'Pain Assessment',
      },

      // Joint Sounds (Q8-Q11)
      {
        text: 'Does your jaw make clicking sounds when you open or close your mouth?',
        type: 'yesno',
        category: 'Joint Sounds',
      },
      {
        text: 'Does your jaw make popping sounds when you open or close your mouth?',
        type: 'yesno',
        category: 'Joint Sounds',
      },
      {
        text: 'Does your jaw make grinding or grating sounds when you move it?',
        type: 'yesno',
        category: 'Joint Sounds',
      },
      {
        text: 'If you hear sounds, are they on the right side, left side, or both sides?',
        type: 'choice',
        options: ['Right side', 'Left side', 'Both sides', 'No sounds'],
        category: 'Joint Sounds',
      },

      // Jaw Function (Q12-Q17)
      {
        text: 'Do you have difficulty opening your mouth wide?',
        type: 'yesno',
        category: 'Jaw Function',
      },
      {
        text: 'Has your jaw ever locked in the closed position?',
        type: 'yesno',
        category: 'Jaw Function',
      },
      {
        text: 'Has your jaw ever locked in the open position?',
        type: 'yesno',
        category: 'Jaw Function',
      },
      {
        text: 'Does your jaw deviate (move to one side) when you open your mouth?',
        type: 'yesno',
        category: 'Jaw Function',
      },
      {
        text: 'Do you have difficulty chewing hard or tough foods?',
        type: 'yesno',
        category: 'Jaw Function',
      },
      {
        text: 'Do your jaw muscles get tired easily when chewing?',
        type: 'yesno',
        category: 'Jaw Function',
      },

      // Associated Symptoms (Q18-Q21)
      {
        text: 'Do you frequently have headaches?',
        type: 'yesno',
        category: 'Associated Symptoms',
      },
      {
        text: 'Do you have neck pain or stiffness?',
        type: 'yesno',
        category: 'Associated Symptoms',
      },
      {
        text: 'Do you have ringing in your ears (tinnitus)?',
        type: 'yesno',
        category: 'Associated Symptoms',
      },
      {
        text: 'Do you experience dizziness or balance problems?',
        type: 'yesno',
        category: 'Associated Symptoms',
      },

      // History and Triggers (Q22-Q26)
      {
        text: 'Have you had recent dental work or oral surgery?',
        type: 'yesno',
        category: 'History & Triggers',
      },
      {
        text: 'Have you had any injury or trauma to your jaw, face, or head?',
        type: 'yesno',
        category: 'History & Triggers',
      },
      {
        text: 'How would you rate your current stress level? (1 = very low, 10 = very high)',
        type: 'scale',
        category: 'History & Triggers',
      },
      {
        text: 'Do you grind or clench your teeth while sleeping?',
        type: 'choice',
        options: ['Yes, definitely', 'I think so', "I don't think so", 'No, definitely not'],
        category: 'History & Triggers',
      },
      {
        text: 'Do you clench your teeth during the day when concentrating or stressed?',
        type: 'yesno',
        category: 'History & Triggers',
      },
    ],
    []
  );

  // Memoized current question data
  const currentQuestionData = useMemo(
    () => questions[currentQuestion],
    [questions, currentQuestion]
  );

  // Memoized current answer
  const currentAnswer = useMemo(() => {
    const questionKey = `q${currentQuestion + 1}` as keyof ComprehensiveAnswers;
    return answers[questionKey];
  }, [answers, currentQuestion]);

  // Memoized validation check
  const canProceed = useMemo(() => {
    return currentAnswer !== null && currentAnswer !== undefined;
  }, [currentAnswer]);

  // Memoized completion validation
  const isComplete = useMemo(() => {
    return validateComprehensiveAssessment(answers);
  }, [answers]);

  // Stable callback references
  const handleAnswerChange = useCallback(
    (value: boolean | number | string) => {
      const questionKey = `q${currentQuestion + 1}` as keyof ComprehensiveAnswers;
      setAnswers((prev) => ({
        ...prev,
        [questionKey]: value,
      }));
    },
    [currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else if (isComplete) {
      onComplete(answers);
      navigate('/results');
    }
  }, [currentQuestion, questions.length, isComplete, answers, onComplete, navigate]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const renderAnswerOptions = () => {
    switch (currentQuestionData.type) {
      case 'yesno':
        return (
          <div className="answer-buttons">
            <button
              className={`answer-button yes-button ${currentAnswer === true ? 'selected' : ''}`}
              onClick={() => handleAnswerChange(true)}
            >
              {t.yes}
            </button>
            <button
              className={`answer-button no-button ${currentAnswer === false ? 'selected' : ''}`}
              onClick={() => handleAnswerChange(false)}
            >
              {t.no}
            </button>
          </div>
        );

      case 'scale':
        return (
          <div className="scale-container">
            <div className="scale-buttons">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  className={`scale-button ${currentAnswer === num ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(num)}
                  style={{
                    margin: '2px',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: currentAnswer === num ? '#007bff' : 'white',
                    color: currentAnswer === num ? 'white' : 'black',
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div
              className="scale-labels"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '12px',
                color: '#666',
              }}
            >
              <span>No pain/stress</span>
              <span>Worst possible</span>
            </div>
          </div>
        );

      case 'choice':
        return (
          <div className="choice-buttons">
            {currentQuestionData.options?.map((option, index) => (
              <button
                key={index}
                className={`choice-button ${currentAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(option)}
                style={{
                  display: 'block',
                  width: '100%',
                  margin: '4px 0',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: currentAnswer === option ? '#007bff' : 'white',
                  color: currentAnswer === option ? 'white' : 'black',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="view">
      <div className="question-container">
        <h2>{t.comprehensiveAssessment}</h2>

        <div className="question-header">
          <div className="question-label">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div
            className="question-category"
            style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}
          >
            {currentQuestionData.category}
          </div>
        </div>

        <p className="question-text">{currentQuestionData.text}</p>

        {renderAnswerOptions()}

        <div className="button-container">
          <button className="secondary-button" onClick={handleBack}>
            <ChevronLeft size={20} />
            {t.back}
          </button>

          <button
            className="primary-button"
            onClick={handleNext}
            disabled={currentAnswer === null || currentAnswer === undefined}
          >
            {currentQuestion === questions.length - 1 ? 'Complete Assessment' : t.next}
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="progress-indicator">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span>
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
      </div>
    </div>
  );
});

ComprehensiveView.displayName = 'ComprehensiveView';

export default ComprehensiveView;
