import { useState, useEffect, useCallback } from 'react'
import { loadLanguage, getAvailableLanguages } from '../utils/languageLoader'

// Dynamically determine available languages from lang files (module scope)
const langFiles = import.meta.glob('../lang/*.lang', { eager: true });
const availableLanguages = Object.entries(langFiles)
  .map(([path, mod]) => {
    const code = path.match(/([a-zA-Z]+)\.lang$/)?.[1];
    // Try to extract the display name from the first line (lang=...)
    let display = code;
    if (mod && typeof mod === 'object') {
      // Vite eager import returns an object with a default export (the file as a string)
      const fileContent = mod.default || '';
      const match = fileContent.match(/^lang=(.*)$/m);
      if (match) display = match[1].trim();
    }
    return code ? { code, display } : null;
  })
  .filter(Boolean);

export function useTranslations() {
  const [translations, setTranslations] = useState({})
  const [currentLanguage, setCurrentLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [loading, setLoading] = useState(true)

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true)
      try {
        const trans = await loadLanguage(currentLanguage)
        setTranslations(trans)
      } catch (error) {
        console.error('Failed to load translations:', error)
        setTranslations({})
      } finally {
        setLoading(false)
      }
    }
    loadTranslations()
  }, [currentLanguage])

  // Change language
  const changeLanguage = useCallback((languageCode) => {
    setCurrentLanguage(languageCode)
    localStorage.setItem('language', languageCode)
  }, [])

  // Translation function
  const t = useCallback((key, fallback = key) => {
    return translations[key] || fallback
  }, [translations])

  // Set dynamic page title
  const setPageTitle = useCallback((titleKey) => {
    const title = t(titleKey, titleKey)
    document.title = title
  }, [t])

  return {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages,
    loading,
    setPageTitle
  }
}

export { availableLanguages }; 