// Formatting Utilities - FSD Shared Layer
// Functions for formatting data for display

type Language = 'en' | 'ru' | 'zh';

/**
 * Formats a date for display based on language
 * @param date - Date to format
 * @param lang - Language code
 * @returns Formatted date string
 */
export const formatDate = (date: Date, lang: Language = 'en'): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const locale = lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'zh-CN';
  return date.toLocaleDateString(locale, options);
};

/**
 * Formats a time for display
 * @param date - Date to extract time from
 * @param lang - Language code
 * @returns Formatted time string
 */
export const formatTime = (date: Date, lang: Language = 'en'): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  const locale = lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'zh-CN';
  return date.toLocaleTimeString(locale, options);
};
