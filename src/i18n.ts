export type Language = 'en' | 'ru' | 'zh';

export const translations = {
  en: {
    // General
    welcome: 'Intelligent TMD Assessment',
    subtitle: 'Advanced DC/TMD diagnostic protocol with dynamic analysis',
    selectLanguage: 'Select Language',

    // Navigation
    home: 'Home',
    quickAssessment: 'Quick Assessment',
    comprehensiveAssessment: 'Comprehensive Assessment',
    results: 'Results',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    notApplicable: 'Not Applicable',
    beginAssessment: 'Begin Assessment',

    // Assessment types
    quickAssessmentTime: '1 minute',
    comprehensiveAssessmentTime: '3 questions',

    // Quick Assessment
    quickQuestion: 'In your own words, describe your main jaw or facial pain concern:',

    // Comprehensive Assessment
    comprehensiveQ1:
      'Do you have pain in your jaw, temple, in the ear, or in front of the ear on either side?',
    comprehensiveQ2: 'Do you have pain when you open your mouth wide or chew?',
    comprehensiveQ3: 'Does your jaw click, pop, or make noise when you open or close your mouth?',
    yes: 'Yes',
    no: 'No',

    // Results
    assessmentComplete: 'Assessment Complete',
    riskLevel: 'Risk Level',
    lowRisk: 'Low Risk',
    moderateRisk: 'Moderate Risk',
    highRisk: 'High Risk',
    recommendations: 'Recommendations',

    // Risk descriptions
    lowRiskDesc: 'Your responses suggest minimal TMD symptoms. Continue to monitor your condition.',
    moderateRiskDesc:
      'Your responses indicate some TMD symptoms. Consider scheduling a full evaluation.',
    highRiskDesc:
      'Your responses suggest significant TMD symptoms. We strongly recommend consulting a specialist.',

    // Recommendations
    lowRiskRec1: 'Maintain good oral hygiene',
    lowRiskRec2: 'Practice stress management techniques',
    lowRiskRec3: 'Avoid excessive jaw movements',
    moderateRiskRec1: 'Schedule a dental consultation',
    moderateRiskRec2: 'Apply warm compresses to affected areas',
    moderateRiskRec3: 'Avoid hard or chewy foods',
    highRiskRec1: 'Seek immediate professional evaluation',
    highRiskRec2: 'Document your symptoms and triggers',
    highRiskRec3: 'Consider pain management strategies',

    // Actions
    downloadPDF: 'Download PDF Report',
    printReport: 'Print Report',
    saveCode: 'Save Assessment Code',
    startNewAssessment: 'Start New Assessment',

    // Footer
    disclaimer:
      'This assessment tool is for informational purposes only and does not replace professional medical advice.',
  },

  ru: {
    // General
    welcome: 'Интеллектуальная оценка ВНЧС',
    subtitle: 'Расширенный протокол диагностики DC/TMD с динамическим анализом',
    selectLanguage: 'Выбрать язык',

    // Navigation
    home: 'Главная',
    quickAssessment: 'Быстрая оценка',
    comprehensiveAssessment: 'Комплексная оценка',
    results: 'Результаты',
    back: 'Назад',
    next: 'Далее',
    skip: 'Пропустить',
    notApplicable: 'Не применимо',
    beginAssessment: 'Начать оценку',

    // Assessment types
    quickAssessmentTime: '1 минута',
    comprehensiveAssessmentTime: '3 вопроса',

    // Quick Assessment
    quickQuestion: 'Опишите своими словами основную проблему с челюстью или лицевой болью:',

    // Comprehensive Assessment
    comprehensiveQ1: 'У вас есть боль в челюсти, виске, в ухе или перед ухом с любой стороны?',
    comprehensiveQ2: 'У вас есть боль, когда вы широко открываете рот или жуете?',
    comprehensiveQ3: 'Ваша челюсть щелкает или издает шум при открытии или закрытии рта?',
    yes: 'Да',
    no: 'Нет',

    // Results
    assessmentComplete: 'Оценка завершена',
    riskLevel: 'Уровень риска',
    lowRisk: 'Низкий риск',
    moderateRisk: 'Умеренный риск',
    highRisk: 'Высокий риск',
    recommendations: 'Рекомендации',

    // Risk descriptions
    lowRiskDesc:
      'Ваши ответы предполагают минимальные симптомы ВНЧС. Продолжайте наблюдать за своим состоянием.',
    moderateRiskDesc:
      'Ваши ответы указывают на некоторые симптомы ВНЧС. Рассмотрите возможность полной оценки.',
    highRiskDesc:
      'Ваши ответы предполагают значительные симптомы ВНЧС. Настоятельно рекомендуем консультацию специалиста.',

    // Recommendations
    lowRiskRec1: 'Поддерживайте хорошую гигиену полости рта',
    lowRiskRec2: 'Практикуйте методы управления стрессом',
    lowRiskRec3: 'Избегайте чрезмерных движений челюстью',
    moderateRiskRec1: 'Запишитесь на консультацию к стоматологу',
    moderateRiskRec2: 'Применяйте теплые компрессы к пораженным участкам',
    moderateRiskRec3: 'Избегайте твердой или жевательной пищи',
    highRiskRec1: 'Немедленно обратитесь за профессиональной оценкой',
    highRiskRec2: 'Документируйте свои симптомы и триггеры',
    highRiskRec3: 'Рассмотрите стратегии управления болью',

    // Actions
    downloadPDF: 'Скачать PDF отчет',
    printReport: 'Распечатать отчет',
    saveCode: 'Сохранить код оценки',
    startNewAssessment: 'Начать новую оценку',

    // Footer
    disclaimer:
      'Этот инструмент оценки предназначен только для информационных целей и не заменяет профессиональную медицинскую консультацию.',
  },

  zh: {
    // General
    welcome: '智能TMD评估',
    subtitle: '先进的DC/TMD诊断协议与动态分析',
    selectLanguage: '选择语言',

    // Navigation
    home: '主页',
    quickAssessment: '快速评估',
    comprehensiveAssessment: '综合评估',
    results: '结果',
    back: '返回',
    next: '下一步',
    skip: '跳过',
    notApplicable: '不适用',
    beginAssessment: '开始评估',

    // Assessment types
    quickAssessmentTime: '1分钟',
    comprehensiveAssessmentTime: '3个问题',

    // Quick Assessment
    quickQuestion: '用您自己的话描述您的主要下颌或面部疼痛问题：',

    // Comprehensive Assessment
    comprehensiveQ1: '您的下颌、太阳穴、耳内或耳前任一侧有疼痛吗？',
    comprehensiveQ2: '当您张大嘴或咀嚼时有疼痛吗？',
    comprehensiveQ3: '当您张开或闭合嘴巴时，下颌会发出咔哒声或噪音吗？',
    yes: '是',
    no: '否',

    // Results
    assessmentComplete: '评估完成',
    riskLevel: '风险等级',
    lowRisk: '低风险',
    moderateRisk: '中等风险',
    highRisk: '高风险',
    recommendations: '建议',

    // Risk descriptions
    lowRiskDesc: '您的回答表明TMD症状很少。请继续监测您的状况。',
    moderateRiskDesc: '您的回答表明有一些TMD症状。考虑安排全面评估。',
    highRiskDesc: '您的回答表明TMD症状明显。我们强烈建议咨询专家。',

    // Recommendations
    lowRiskRec1: '保持良好的口腔卫生',
    lowRiskRec2: '练习压力管理技巧',
    lowRiskRec3: '避免过度的下颌运动',
    moderateRiskRec1: '预约牙科咨询',
    moderateRiskRec2: '对患处进行热敷',
    moderateRiskRec3: '避免硬的或有嚼劲的食物',
    highRiskRec1: '立即寻求专业评估',
    highRiskRec2: '记录您的症状和触发因素',
    highRiskRec3: '考虑疼痛管理策略',

    // Actions
    downloadPDF: '下载PDF报告',
    printReport: '打印报告',
    saveCode: '保存评估代码',
    startNewAssessment: '开始新评估',

    // Footer
    disclaimer: '此评估工具仅供参考，不能替代专业医疗建议。',
  },
};

export const getTranslation = (lang: Language) => translations[lang];
