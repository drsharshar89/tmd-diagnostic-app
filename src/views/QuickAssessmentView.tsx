import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { QuickAssessmentAnswers, AssessmentViewProps } from '../types';
import { validateQuickAssessment } from '../utils';

interface QuickAssessmentViewProps extends AssessmentViewProps {
  onComplete: (answers: QuickAssessmentAnswers) => void;
}

const QuickAssessmentView: React.FC<QuickAssessmentViewProps> = ({ lang, onComplete }) => {
  const navigate = useNavigate();
  const t = getTranslation(lang);
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    const answers: QuickAssessmentAnswers = { description: answer };
    if (validateQuickAssessment(answers)) {
      onComplete(answers);
      navigate('/results');
    }
  };

  return (
    <div className="view">
      <div className="question-container">
        <h2>{t.quickAssessment}</h2>

        <label className="question-label">{t.quickQuestion}</label>
        <textarea
          className="answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
        />

        <div className="button-container">
          <button className="secondary-button" onClick={() => navigate('/')}>
            <ChevronLeft size={20} />
            {t.back}
          </button>

          <button
            className="primary-button"
            onClick={handleSubmit}
            disabled={!validateQuickAssessment({ description: answer })}
          >
            {t.next}
          </button>
        </div>

        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '100%' }} />
          </div>
          <span>1 / 1</span>
        </div>
      </div>
    </div>
  );
};

export default QuickAssessmentView;
