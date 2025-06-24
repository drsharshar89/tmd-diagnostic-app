import { useState, useCallback, useMemo } from 'react';
import { QuickAssessmentAnswers, RiskLevel, AssessmentResult } from '@/types';
import assessmentConfig from '../config/quick-assessment.json';

export interface QuestionData {
  id: string;
  text: string;
  type: 'yesno' | 'multiple-choice' | 'numeric';
  tags: string[];
  riskWeight: number;
  required: boolean;
  medicalContext: {
    rdcTmdRelevance: string;
    clinicalSignificance: string;
    evidenceLevel: string;
  };
  next: {
    yes: string;
    no: string;
  };
}

// Type the imported JSON data
const typedAssessmentConfig = assessmentConfig as {
  assessment: {
    questions: QuestionData[];
    resultLogic: {
      scoreRanges: Array<{
        min: number;
        max: number;
        level: string;
        output: {
          title: string;
          recommendations: string[];
        };
      }>;
      medicalCodes: {
        [key: string]: string[];
      };
      flags: {
        [key: string]: {
          condition: string;
          message: string;
        };
      };
    };
  };
};

export interface AssessmentState {
  currentQuestionId: string;
  answers: QuickAssessmentAnswers;
  questionPath: string[];
  isComplete: boolean;
  score: number;
  riskLevel: RiskLevel;
}

/**
 * Custom hook for managing TMD Quick Assessment
 * Implements branching logic and real-time scoring based on RDC/TMD protocol
 */
export const useQuickAssessment = () => {
  const [state, setState] = useState<AssessmentState>({
    currentQuestionId: 'q1',
    answers: {
      q1: null,
      q2: null,
      q3: null,
      q4: null,
      q5: null,
      q6: null,
      q7: null,
    },
    questionPath: ['q1'],
    isComplete: false,
    score: 0,
    riskLevel: 'low' as RiskLevel,
  });

  // Get current question data
  const currentQuestion = useMemo((): QuestionData | null => {
    return (
      typedAssessmentConfig.assessment.questions.find((q) => q.id === state.currentQuestionId) ||
      null
    );
  }, [state.currentQuestionId]);

  // Calculate score based on current answers
  const calculateScore = useCallback((answers: QuickAssessmentAnswers): number => {
    let totalScore = 0;

    typedAssessmentConfig.assessment.questions.forEach((question) => {
      const answer = answers[question.id as keyof QuickAssessmentAnswers];
      if (answer === true) {
        totalScore += question.riskWeight;
      }
    });

    return totalScore;
  }, []);

  // Determine risk level based on score
  const getRiskLevel = useCallback((score: number): RiskLevel => {
    const ranges = typedAssessmentConfig.assessment.resultLogic.scoreRanges;

    for (const range of ranges) {
      if (score >= range.min && score <= range.max) {
        return range.level as RiskLevel;
      }
    }

    return 'low';
  }, []);

  // Get next question based on branching logic
  const getNextQuestionId = useCallback((questionId: string, answer: boolean): string => {
    const question = typedAssessmentConfig.assessment.questions.find((q) => q.id === questionId);

    if (!question) return 'result';

    return answer ? question.next.yes : question.next.no;
  }, []);

  // Answer current question and progress
  const answerQuestion = useCallback(
    (answer: boolean) => {
      const newAnswers = {
        ...state.answers,
        [state.currentQuestionId]: answer,
      };

      const newScore = calculateScore(newAnswers);
      const newRiskLevel = getRiskLevel(newScore);
      const nextQuestionId = getNextQuestionId(state.currentQuestionId, answer);

      const isComplete = nextQuestionId === 'result';

      setState((prev) => ({
        ...prev,
        answers: newAnswers,
        currentQuestionId: isComplete ? prev.currentQuestionId : nextQuestionId,
        questionPath: isComplete ? prev.questionPath : [...prev.questionPath, nextQuestionId],
        isComplete,
        score: newScore,
        riskLevel: newRiskLevel,
      }));
    },
    [state, calculateScore, getRiskLevel, getNextQuestionId]
  );

  // Go back to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (state.questionPath.length <= 1) return;

    const newPath = [...state.questionPath];
    newPath.pop(); // Remove current question
    const previousQuestionId = newPath[newPath.length - 1];

    // Reset the answer for the current question
    const newAnswers = {
      ...state.answers,
      [state.currentQuestionId]: null,
    };

    const newScore = calculateScore(newAnswers);
    const newRiskLevel = getRiskLevel(newScore);

    setState((prev) => ({
      ...prev,
      currentQuestionId: previousQuestionId,
      answers: newAnswers,
      questionPath: newPath,
      isComplete: false,
      score: newScore,
      riskLevel: newRiskLevel,
    }));
  }, [state, calculateScore, getRiskLevel]);

  // Reset assessment
  const resetAssessment = useCallback(() => {
    setState({
      currentQuestionId: 'q1',
      answers: {
        q1: null,
        q2: null,
        q3: null,
        q4: null,
        q5: null,
        q6: null,
        q7: null,
      },
      questionPath: ['q1'],
      isComplete: false,
      score: 0,
      riskLevel: 'low',
    });
  }, []);

  // Generate assessment result
  const getAssessmentResult = useCallback((): AssessmentResult => {
    const resultData = typedAssessmentConfig.assessment.resultLogic.scoreRanges.find(
      (range) => state.score >= range.min && state.score <= range.max
    );

    const flags = typedAssessmentConfig.assessment.resultLogic.flags;
    const medicalCodes = typedAssessmentConfig.assessment.resultLogic.medicalCodes[state.riskLevel];

    // Check for immediate attention flags
    const requiresImmediateAttention =
      state.score >= 8 || (state.answers.q4 === true && state.answers.q1 === true);

    const specialistReferral = state.score >= 6;

    return {
      riskLevel: state.riskLevel,
      score: state.score,
      maxScore: 11, // Sum of all risk weights
      confidence: Math.min(0.95, 0.6 + (state.score / 11) * 0.35), // Higher scores = higher confidence
      recommendations: resultData?.output.recommendations || [],
      timestamp: new Date(),
      assessmentType: 'quick',
      answers: state.answers,
      icd10Codes: medicalCodes || [],
      dcTmdClassification: resultData?.output.title || 'TMD Assessment Complete',
      requiresImmediateAttention,
      followUpRecommended: state.riskLevel !== 'low',
      specialistReferral,
    };
  }, [state]);

  // Get progress information
  const getProgress = useCallback(() => {
    const totalQuestions = typedAssessmentConfig.assessment.questions.length;
    const answeredQuestions = Object.values(state.answers).filter(
      (answer) => answer !== null
    ).length;

    return {
      current: answeredQuestions,
      total: totalQuestions,
      percentage: Math.round((answeredQuestions / totalQuestions) * 100),
    };
  }, [state.answers]);

  return {
    currentQuestion,
    state,
    answerQuestion,
    goToPreviousQuestion,
    resetAssessment,
    getAssessmentResult,
    getProgress,
    canGoBack: state.questionPath.length > 1,
  };
};
