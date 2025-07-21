// Language loader utility
const languageCache = new Map()

/**
 * Parse a .lang file content into a key-value object
 * @param {string} content - The content of the .lang file
 * @returns {Object} - Parsed key-value pairs
 */
function parseLangFile(content) {
  const translations = {}
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }
    
    // Parse key=value format
    const equalIndex = trimmedLine.indexOf('=')
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim()
      const value = trimmedLine.substring(equalIndex + 1).trim()
      translations[key] = value
    }
  }
  
  return translations
}

/**
 * Load a language file dynamically
 * @param {string} languageCode - The language code (e.g., 'en', 'bn', 'es')
 * @returns {Promise<Object>} - Promise that resolves to the translations object
 */
export async function loadLanguage(languageCode) {
  // Check cache first
  if (languageCache.has(languageCode)) {
    return languageCache.get(languageCode)
  }
  
  try {
    // Dynamic import of the language file
    const module = await import(`../lang/${languageCode}.lang?raw`)
    const content = module.default
    
    // Parse the content
    const translations = parseLangFile(content)
    
    // Cache the result
    languageCache.set(languageCode, translations)
    
    return translations
  } catch (error) {
    console.error(`Failed to load language file for ${languageCode}:`, error)
    
    // Fallback to English if the requested language fails to load
    if (languageCode !== 'en') {
      console.log('Falling back to English...')
      return loadLanguage('en')
    }
    
    // If even English fails, return empty object
    return {}
  }
}

/**
 * Get available languages by scanning the lang folder
 * @returns {Promise<Array>} - Promise that resolves to array of available language codes
 */
export async function getAvailableLanguages() {
  try {
    // In a real implementation, you might want to scan the directory
    // For now, we'll return the languages we know exist
    return ['en', 'bn', 'es']
  } catch (error) {
    console.error('Failed to get available languages:', error)
    return ['en'] // Fallback to English only
  }
}

/**
 * Preload all available languages
 */
export async function preloadLanguages() {
  const languages = await getAvailableLanguages()
  const promises = languages.map(lang => loadLanguage(lang))
  await Promise.all(promises)
} 