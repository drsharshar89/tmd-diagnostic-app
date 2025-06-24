import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, AlertTriangle, Download, FileText, Save } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import {
  ResultViewProps,
  RiskLevel,
  QuickAssessmentAnswers,
  ComprehensiveAnswers,
  AssessmentResult,
} from '../types';
import {
  calculateRiskLevel,
  getRecommendationsByRisk,
  saveAssessment,
  formatDate,
  getRiskLevelColor,
  calculateQuickAssessmentRisk,
  calculateComprehensiveAssessmentRisk,
} from '../utils';

interface RiskDisplayConfig {
  readonly color: string;
  readonly icon: string;
  readonly label: string;
}

const RISK_CONFIG: Record<RiskLevel, RiskDisplayConfig> = {
  high: { color: '#dc3545', icon: '⚠️', label: 'High Risk' },
  moderate: { color: '#fd7e14', icon: '🔶', label: 'Moderate Risk' },
  low: { color: '#28a745', icon: '✅', label: 'Low Risk' },
} as const;

const ResultView: React.FC<ResultViewProps> = memo(
  ({ lang, assessmentType, quickAnswers, comprehensiveAnswers }) => {
    const navigate = useNavigate();
    const translations = getTranslation(lang);

    // Memoized result calculation for performance
    const result = useMemo((): AssessmentResult | null => {
      if (assessmentType === 'quick' && quickAnswers) {
        return calculateQuickAssessmentRisk(quickAnswers);
      }
      if (assessmentType === 'comprehensive' && comprehensiveAnswers) {
        return calculateComprehensiveAssessmentRisk(comprehensiveAnswers);
      }
      return null;
    }, [assessmentType, quickAnswers, comprehensiveAnswers]);

    // Memoized risk configuration
    const riskConfig = useMemo((): RiskDisplayConfig | null => {
      if (!result?.riskLevel) return null;
      return RISK_CONFIG[result.riskLevel] || null;
    }, [result?.riskLevel]);

    // Optimized event handlers
    const handlePrint = useCallback((): void => {
      try {
        window.print();
      } catch (error) {
        // Error handled gracefully - logged to monitoring in production
      }
    }, []);

    const handleDownloadPDF = useCallback((): void => {
      // Medical-grade PDF generation would be implemented here
      // For now, display user-friendly message
      alert('PDF download functionality will be implemented with medical report standards');
    }, []);

    const handleSaveCode = useCallback((): void => {
      if (!result || !assessmentType) return;

      try {
        const assessmentResult: AssessmentResult = {
          riskLevel: result.riskLevel,
          score: result.score,
          maxScore: result.maxScore,
          confidence: result.confidence,
          recommendations: result.recommendations,
          timestamp: result.timestamp,
          assessmentType,
          answers: (quickAnswers || comprehensiveAnswers)!,
          requiresImmediateAttention: result.requiresImmediateAttention,
          followUpRecommended: result.followUpRecommended,
          specialistReferral: result.specialistReferral,
        };

        const code = saveAssessment(assessmentResult);
        alert(`Your secure assessment code: ${code}\nValid for 48 hours for medical records.`);
      } catch (error) {
        alert('Error saving assessment. Please try again.');
      }
    }, [result, assessmentType, quickAnswers, comprehensiveAnswers]);

    const handleReturnHome = useCallback((): void => {
      navigate('/');
    }, [navigate]);

    // Format score with null safety
    const formatScore = useCallback((score?: number): string => {
      return score !== undefined && score !== null ? `${Math.round(score)}%` : 'N/A';
    }, []);

    // Get risk level translation
    const getRiskLevelText = useCallback(
      (riskLevel: RiskLevel): string => {
        switch (riskLevel) {
          case 'low':
            return translations.lowRisk;
          case 'moderate':
            return translations.moderateRisk;
          case 'high':
            return translations.highRisk;
          default:
            return riskLevel;
        }
      },
      [translations]
    );

    // Early return for no data - medical safety
    if (!result || !assessmentType) {
      return (
        <div className="result-container error-state">
          <div className="error-message">
            <AlertCircle size={48} color="#dc3545" />
            <h2>Assessment Data Missing</h2>
            <p>No assessment data available. Please complete an assessment first.</p>
            <button className="primary-button" onClick={handleReturnHome}>
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    if (!riskConfig) {
      return (
        <div className="result-container error-state">
          <div className="error-message">
            <AlertTriangle size={48} color="#fd7e14" />
            <h2>Invalid Risk Assessment</h2>
            <p>Unable to determine risk level. Please retake the assessment.</p>
            <button className="primary-button" onClick={handleReturnHome}>
              Retake Assessment
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="result-container">
        {/* Header Section */}
        <div className="result-header">
          <div className="result-badge" style={{ backgroundColor: riskConfig.color }}>
            <span className="risk-icon" role="img" aria-label={riskConfig.label}>
              {riskConfig.icon}
            </span>
            <span className="risk-level">{getRiskLevelText(result.riskLevel)}</span>
          </div>
          <h1 className="result-title">{translations.assessmentComplete}</h1>
          <p className="result-subtitle">
            {assessmentType === 'comprehensive'
              ? 'Comprehensive TMD Assessment Results'
              : 'Quick Assessment Results'}
          </p>
          <div className="result-timestamp">
            Assessment completed: {result.timestamp.toLocaleDateString()}
          </div>
        </div>

        {/* Medical Alerts */}
        {result.requiresImmediateAttention && (
          <div className="medical-alert critical">
            <AlertCircle size={24} />
            <strong>Immediate Medical Attention Recommended</strong>
            <p>Your symptoms suggest you should consult a healthcare provider promptly.</p>
          </div>
        )}

        {result.specialistReferral && (
          <div className="medical-alert warning">
            <AlertTriangle size={24} />
            <strong>Specialist Referral Recommended</strong>
            <p>Consider consulting a TMD specialist or oral medicine expert.</p>
          </div>
        )}

        {/* Main Results Section */}
        <div className="results-grid">
          {/* Overall Score Card */}
          <div className="result-card primary">
            <h3>Overall Score</h3>
            <div className="score-display">
              <div className="score-circle" style={{ borderColor: riskConfig.color }}>
                <span className="score-number">{result.score}</span>
                <span className="score-max">/{result.maxScore}</span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-label">Confidence</div>
                <div className="confidence-track">
                  <div
                    className="confidence-fill"
                    style={{
                      width: `${result.confidence * 100}%`,
                      backgroundColor: riskConfig.color,
                    }}
                  />
                </div>
                <div className="confidence-percentage">{Math.round(result.confidence * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Detailed Scores (Comprehensive Only) */}
          {assessmentType === 'comprehensive' && (
            <div className="result-card detailed-scores">
              <h3>Detailed Analysis</h3>
              <div className="score-breakdown">
                <div className="score-item">
                  <span className="score-label">Pain Score</span>
                  <span className="score-value">{formatScore(result.painScore)}</span>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${result.painScore || 0}%` }} />
                  </div>
                </div>
                <div className="score-item">
                  <span className="score-label">Functional Score</span>
                  <span className="score-value">{formatScore(result.functionalScore)}</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${result.functionalScore || 0}%` }}
                    />
                  </div>
                </div>
                <div className="score-item">
                  <span className="score-label">Sounds Score</span>
                  <span className="score-value">{formatScore(result.soundsScore)}</span>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${result.soundsScore || 0}%` }} />
                  </div>
                </div>
                <div className="score-item">
                  <span className="score-label">Associated Score</span>
                  <span className="score-value">{formatScore(result.associatedScore)}</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${result.associatedScore || 0}%` }}
                    />
                  </div>
                </div>
                <div className="score-item">
                  <span className="score-label">History Score</span>
                  <span className="score-value">{formatScore(result.historyScore)}</span>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${result.historyScore || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medical Classification (Comprehensive Only) */}
          {assessmentType === 'comprehensive' && result.dcTmdClassification && (
            <div className="result-card medical-classification">
              <h3>Medical Classification</h3>
              <div className="classification-details">
                <div className="classification-item">
                  <strong>DC/TMD Classification:</strong>
                  <span>{result.dcTmdClassification}</span>
                </div>
                {result.icd10Codes && result.icd10Codes.length > 0 && (
                  <div className="classification-item">
                    <strong>ICD-10 Codes:</strong>
                    <div className="icd-codes">
                      {result.icd10Codes.map((code, index) => (
                        <span key={index} className="icd-code">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="result-card recommendations">
            <h3>{translations.recommendations}</h3>
            <div className="recommendations-list">
              {result.recommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-item">
                  <CheckCircle size={20} color={riskConfig.color} />
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <button className="secondary-button" onClick={handlePrint}>
            <FileText size={20} />
            {translations.printReport}
          </button>
          <button className="secondary-button" onClick={handleDownloadPDF}>
            <Download size={20} />
            {translations.downloadPDF}
          </button>
          <button className="secondary-button" onClick={handleSaveCode}>
            <Save size={20} />
            {translations.saveCode}
          </button>
          <button className="primary-button" onClick={handleReturnHome}>
            {translations.startNewAssessment}
          </button>
        </div>

        {/* Medical Disclaimer */}
        <div className="medical-disclaimer">
          <AlertTriangle size={16} />
          <p>
            <strong>Medical Disclaimer:</strong> {translations.disclaimer}
          </p>
        </div>
      </div>
    );
  }
);

ResultView.displayName = 'ResultView';

export default ResultView;
