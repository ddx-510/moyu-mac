import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import zh from './locales/zh.json'

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    })

// Sync language changes to main process for tray menu
i18n.on('languageChanged', (lng) => {
    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.invoke('set-language', lng)
    }
})

// Sync initial language to main process
if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.invoke('set-language', i18n.language)

    // Listen for language changes from other windows (e.g. Settings changes updating Dashboard)
    window.electron.ipcRenderer.on('language-changed', (_event, lang) => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang)
        }
    })
}

export default i18n

