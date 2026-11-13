import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bnTranslations from './bn.json';
import enTranslations from './en.json';

const savedLanguage = localStorage.getItem('cou_seat_lang') || 'bn';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      bn: { translation: bnTranslations },
      en: { translation: enTranslations },
    },
    lng: savedLanguage,
    fallbackLng: 'bn',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('cou_seat_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;

