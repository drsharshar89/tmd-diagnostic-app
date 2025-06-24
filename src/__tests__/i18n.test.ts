import { getTranslation, translations, Language } from '../i18n';

describe('i18n', () => {
  it('returns English translations for "en" language', () => {
    const t = getTranslation('en');
    expect(t.welcome).toBe('Intelligent TMD Assessment');
    expect(t.quickAssessment).toBe('Quick Assessment');
    expect(t.yes).toBe('Yes');
    expect(t.no).toBe('No');
  });

  it('returns Russian translations for "ru" language', () => {
    const t = getTranslation('ru');
    expect(t.welcome).toBe('Интеллектуальная оценка ВНЧС');
    expect(t.quickAssessment).toBe('Быстрая оценка');
    expect(t.yes).toBe('Да');
    expect(t.no).toBe('Нет');
  });

  it('returns Chinese translations for "zh" language', () => {
    const t = getTranslation('zh');
    expect(t.welcome).toBe('智能TMD评估');
    expect(t.quickAssessment).toBe('快速评估');
    expect(t.yes).toBe('是');
    expect(t.no).toBe('否');
  });

  it('has all required translation keys for each language', () => {
    const languages: Language[] = ['en', 'ru', 'zh'];
    const requiredKeys = [
      'welcome',
      'subtitle',
      'selectLanguage',
      'home',
      'quickAssessment',
      'comprehensiveAssessment',
      'results',
      'back',
      'next',
      'beginAssessment',
      'yes',
      'no',
      'assessmentComplete',
      'riskLevel',
      'recommendations',
      'downloadPDF',
      'printReport',
      'saveCode',
      'disclaimer',
    ];

    languages.forEach((lang) => {
      const t = getTranslation(lang);
      requiredKeys.forEach((key) => {
        expect(t).toHaveProperty(key);
        expect(t[key as keyof typeof t]).toBeTruthy();
      });
    });
  });
});
