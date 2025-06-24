import React from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { Theme } from '../types';

interface ThemeAndLangToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const ThemeAndLangToggle: React.FC<ThemeAndLangToggleProps> = ({
  currentLang,
  onLanguageChange,
  theme,
  onThemeToggle,
}) => {
  const t = getTranslation(currentLang);

  return (
    <div className="settings-toggle">
      <button
        className="theme-button"
        onClick={onThemeToggle}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="lang-select-wrapper">
        <Globe size={20} className="globe-icon" />
        <select
          className="lang-select"
          value={currentLang}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          aria-label={t.selectLanguage}
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="zh">中文</option>
        </select>
      </div>
    </div>
  );
};

export default ThemeAndLangToggle;
