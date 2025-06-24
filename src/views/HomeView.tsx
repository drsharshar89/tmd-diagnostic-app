import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, Info } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { BaseViewProps } from '../types';

interface HomeViewProps extends BaseViewProps {}

const HomeView: React.FC<HomeViewProps> = ({ lang }) => {
  const navigate = useNavigate();
  const t = getTranslation(lang);

  return (
    <div className="view">
      <h1>{t.welcome}</h1>
      <p>{t.subtitle}</p>

      <div className="assessment-options">
        <div className="option-card" onClick={() => navigate('/quick-assessment')}>
          <Zap size={48} className="option-icon" />
          <h3>{t.quickAssessment}</h3>
          <p className="option-time">{t.quickAssessmentTime}</p>
          <button className="option-button primary-button">{t.beginAssessment}</button>
        </div>

        <div className="option-card" onClick={() => navigate('/comprehensive-assessment')}>
          <Activity size={48} className="option-icon" />
          <h3>{t.comprehensiveAssessment}</h3>
          <p className="option-time">{t.comprehensiveAssessmentTime}</p>
          <button className="option-button primary-button">{t.beginAssessment}</button>
        </div>
      </div>

      <div className="info-section">
        <Info size={24} />
        <p className="disclaimer">{t.disclaimer}</p>
      </div>
    </div>
  );
};

export default HomeView;
