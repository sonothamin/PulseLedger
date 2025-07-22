import { useState, useEffect } from 'react'
import { useTranslations } from '../hooks/useTranslations'
import { Sun, Moon, Laptop, Person, Key } from 'react-bootstrap-icons'

const THEMES = [
  { value: 'system', label:'', icon: <Laptop /> },
  { value: 'light', label:'', icon: <Sun /> },
  { value: 'dark', label:'', icon: <Moon /> },
]

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')

  useEffect(() => {
    const applyTheme = t => {
      if (t === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        document.documentElement.setAttribute('data-bs-theme', mq.matches ? 'dark' : 'light')
      } else {
        document.documentElement.setAttribute('data-bs-theme', t)
      }
    }
    applyTheme(theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  const setAndStoreTheme = t => {
    setTheme(t)
    localStorage.setItem('theme', t)
  }
  return [theme, setAndStoreTheme]
}

function loadBengaliFont(currentLanguage) {
  useEffect(() => {
    if (currentLanguage === 'bn') {
      const fontId = 'hind-siliguri-font';
      if (!document.getElementById(fontId)) {
        const style = document.createElement('style');
        style.id = fontId;
        style.innerHTML = `@font-face { font-family: 'Hind Siliguri'; src: url('/HindSiliguri-Regular.ttf') format('truetype'); font-weight: normal; font-style: normal; }
        body, input, button, .card, .form-control, .form-label { font-family: 'Hind Siliguri', system-ui, Arial, sans-serif !important; }`;
        document.head.appendChild(style);
      }
    }
  }, [currentLanguage]);
}

function useBrandingFromLocalStorage() {
  const [branding, setBranding] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('branding')) || null
    } catch {
      return null
    }
  })
  useEffect(() => {
    const handleStorage = () => {
      try {
        setBranding(JSON.parse(localStorage.getItem('branding')) || null)
      } catch {
        setBranding(null)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  return branding
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t, setPageTitle, currentLanguage, availableLanguages, changeLanguage } = useTranslations()
  const [theme, setTheme] = useTheme()
  loadBengaliFont(currentLanguage)
  const branding = useBrandingFromLocalStorage()

  useEffect(() => {
    setPageTitle('pageLogin')
  }, [setPageTitle])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    console.log('[LOGIN FORM] Submitting login for', username)
    try {
      await onLogin(username, password)
      console.log('[LOGIN FORM] Login success')
    } catch (err) {
      // Show backend error message if available, else fallback
      console.log('[LOGIN FORM] Login error:', err, err?.response?.data)
      setError(err.response?.data?.message || t('loginError'))
    } finally {
      setLoading(false)
    }
  }

  const handleThemeToggle = () => {
    const currentIndex = THEMES.findIndex(t => t.value === theme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex].value)
  }

  const currentTheme = THEMES.find(t => t.value === theme)

  // Theming colors
  const getCardBg = () => {
    if (theme === 'dark') return { background: 'var(--bs-card-bg, #212529)', color: '#eaeaea', border: '1px solid rgba(120,120,180,0.13)' }
    if (theme === 'light') return { background: 'var(--bs-card-bg, #fff)', color: '#232946', border: '1px solid rgba(60,60,90,0.10)' }
    return { background: 'var(--bs-card-bg, #f8fafc)', color: '#232946', border: '1px solid rgba(60,60,90,0.10)' }
  }

  // Theming for left branding column
  const getBrandingBg = () => {
    if (theme === 'dark') return { background: '#181f2a', color: '#eaeaea', borderRight: '1px solid rgba(120,120,180,0.10)' }
    if (theme === 'light') return { background: '#f8fafc', color: '#232946', borderRight: '1px solid rgba(60,60,90,0.06)' }
    return { background: '#e0e7ff', color: '#232946', borderRight: '1px solid rgba(60,60,90,0.06)' }
  }

  // Remove animated background gradient, use solid color
  const bgStyle = {
    minHeight: '100vh',
    minWidth: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 0,
    background: theme === 'dark' ? '#181f2a' : theme === 'light' ? '#f8fafc' : '#e0e7ff',
    transition: 'background 0.3s',
  }

  // Language toggle button (cycles languages)
  const langCodes = availableLanguages.map(l => l.code)
  const currentLangIdx = langCodes.indexOf(currentLanguage)
  const nextLang = langCodes[(currentLangIdx + 1) % langCodes.length]
  const handleLangToggle = () => changeLanguage(nextLang)
  const langBtn = (
    <button
      className="btn btn-sm btn-outline-secondary ms-2"
      style={{ fontWeight: 600, fontSize: 14, padding: '2px 10px', minWidth: 36 }}
      onClick={handleLangToggle}
      type="button"
      aria-label={availableLanguages.find(l => l.code === nextLang)?.display || nextLang}
      title={availableLanguages.find(l => l.code === nextLang)?.display || nextLang}
    >
      {availableLanguages.find(l => l.code === currentLanguage)?.display || currentLanguage}
    </button>
  )

  // Branding left column
  const leftBranding = (
    <div className="d-flex flex-column justify-content-center align-items-center h-100 w-100 px-4 px-md-5" style={{ minHeight: 400, ...getBrandingBg(), borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }}>
      <div className="text-center mb-4">
        <img
          src={branding?.logoUrl || '/logo.svg'}
          alt={branding?.hospitalName || 'PulseLedger'}
          style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16, borderRadius: 16, background: '#fff', boxShadow: '0 2px 16px rgba(44,62,80,0.08)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <h2 className="fw-bold mb-1" style={{ color: theme === 'dark' ? '#8ab4f8' : '#2563eb', letterSpacing: 1, fontSize: 28 }}>{branding?.hospitalName || 'PulseLedger'}</h2>
        {branding?.motto && <div className="fst-italic text-muted mb-2" style={{ fontSize: 16 }}>{branding.motto}</div>}
        {branding?.tagline && <div className="text-secondary mb-2" style={{ fontSize: 15 }}>{branding.tagline}</div>}
        {branding?.address && <div className="text-muted mb-2" style={{ fontSize: 14 }}>{branding.address}</div>}
      </div>
      {branding?.details && <div className="text-muted small" style={{ maxWidth: 320 }}>{branding.details}</div>}
    </div>
  )

  // Login form right column
  const rightLogin = (
    <div className="d-flex flex-column justify-content-center align-items-center h-100 w-100 px-4 px-md-5">
      <div className="card shadow-sm border-0" style={{ borderRadius: 20, ...getCardBg(), minWidth: 320, maxWidth: 400 }}>
        <div className="card-body p-5">
          <h3 className="fw-bold mb-3 text-center" style={{ color: theme === 'dark' ? '#8ab4f8' : '#2563eb', letterSpacing: 1 }}>{t('loginTitle')}</h3>
          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text" id="username-addon">
                  <Person size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('username')}
                  aria-label={t('username')}
                  aria-describedby="username-addon"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text" id="password-addon">
                  <Key size={18} />
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder={t('password')}
                  aria-label={t('password')}
                  aria-describedby="password-addon"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="alert alert-danger fade-in" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 mt-2"
              disabled={loading}
              style={{ fontWeight: 600, fontSize: 18 }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  {t('loading')}
                </>
              ) : (
                t('login')
              )}
            </button>
          </form>
          <div className="d-flex justify-content-end align-items-center mt-4">
            <a href="#" className="text-decoration-none text-primary small" tabIndex={-1} style={{ opacity: 0.8 }}>
              {t('forgotPassword')}
            </a>
          </div>
          <div className="text-center mt-4">
            <small className="text-muted">&copy; {new Date().getFullYear()} Sonoth Amin</small>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div style={bgStyle} />
      <div className="min-vh-100 vw-100 d-flex align-items-stretch justify-content-center position-relative" style={{ zIndex: 1, minHeight: '100vh', width: '100vw' }}>
        {/* Theme & Language Toggle Top Right */}
        <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 10, display: 'flex', alignItems: 'center' }}>
          <button 
            className="btn btn-outline-secondary" 
            type="button" 
            onClick={handleThemeToggle}
            title={`Current: ${currentTheme?.value}. Click to cycle themes.`}
            aria-label={t('themeMode')}
          >
            {currentTheme?.icon}
          </button>
          {langBtn}
        </div>
        <div className="container-fluid h-100" style={{ minHeight: '100vh' }}>
          <div className="row h-100 flex-nowrap" style={{ minHeight: '100vh' }}>
            <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center p-0" style={{ ...getBrandingBg(), borderTopLeftRadius: 24, borderBottomLeftRadius: 24, minHeight: '100vh' }}>
              {leftBranding}
            </div>
            <div className="col-lg-6 d-flex align-items-center justify-content-center p-0" style={{ background: 'transparent', borderTopRightRadius: 24, borderBottomRightRadius: 24, minHeight: '100vh' }}>
              {rightLogin}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login 