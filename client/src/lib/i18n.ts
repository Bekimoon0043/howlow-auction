import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import am from '@/locales/am.json'
import en from '@/locales/en.json'

i18n.use(initReactI18next).init({
  resources: {
    am: { translation: am },
    en: { translation: en }
  },
  lng: localStorage.getItem('locale') || 'am',
  fallbackLng: 'am',
  interpolation: { escapeValue: false }
})

export default i18n
