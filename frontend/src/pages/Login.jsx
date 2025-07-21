import { useState, useEffect } from 'react'
import { useTranslations } from '../hooks/useTranslations'
import { Sun, Moon, Laptop } from 'react-bootstrap-icons'

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

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslations()
  const [theme, setTheme] = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(t('loginError'))
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

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative">
      {/* Theme Toggle Top Right */}
      <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 10 }}>
        <button 
          className="btn btn-outline-secondary" 
          type="button" 
          onClick={handleThemeToggle}
          title={`Current: ${currentTheme?.value}. Click to cycle themes.`}
        >
          {currentTheme?.icon}
        </button>
      </div>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary mb-2">PulseLedger</h2>
                  <p className="text-muted">{t('loginTitle')}</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">{t('username')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">{t('password')}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" />
                        {t('loading')}
                      </>
                    ) : (
                      t('login')
                    )}
                  </button>
                </form>
                
                <div className="text-center mt-3">
                  <small className="text-muted">
                    {t('rememberMe')} • {t('forgotPassword')}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 