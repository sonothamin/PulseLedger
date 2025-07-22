import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { Dashboard, POS, Sales, Expenses, Products, Users, Roles, Patients, Settings, SalesAgents, Invoice as InvoicePage, Accounts, AuditLogs } from './pages'
import { House, CashStack, Receipt as Invoice, CreditCard, BoxSeam, People, ShieldLock, Gear, List, SunFill, MoonFill, LaptopFill, PersonHeart, PersonBadge, PersonCircle, Key, BarChart, JournalText, Envelope, BoxArrowRight } from 'react-bootstrap-icons'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import axios from 'axios'
import { useTranslations } from './hooks/useTranslations'
import PageTitle from './components/PageTitle'
import useBranding from './hooks/useBranding'

const API_BASE = import.meta.env.VITE_API_BASE;

function getThemeOptions(t) {
  return [
    { value: 'system', label: t('themeSystem'), icon: <LaptopFill /> },
    { value: 'light', label: t('themeLight'), icon: <SunFill /> },
    { value: 'dark', label: t('themeDark'), icon: <MoonFill /> },
  ];
}

// Create context for theme
const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

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
      const handler = e => applyTheme('system')
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

function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { t } = useTranslations()
  const { user, hasAnyPermission } = useAuth()
  
  const navItems = [
    { to: '/', label: t('dashboard'), icon: <House />, permission: 'dashboard:view' },
    { to: '/pos', label: t('pos'), icon: <CashStack />, permission: 'pos:view' },
    { to: '/sales', label: t('sales'), icon: <Invoice />, permission: 'sales:view' },
    { to: '/expenses', label: t('expenses'), icon: <CreditCard />, permission: 'expenses:view' },
    { to: '/products', label: t('products'), icon: <BoxSeam />, permission: 'products:view' },
    { to: '/accounts', label: t('accounts'), icon: <BarChart />, permission: 'accounts:view' },
    { to: '/audit-logs', label: t('auditLogs'), icon: <JournalText />, permission: 'audit:view' },
    { to: '/sales-agents', label: t('salesAgentsTitle') || 'Sales Agents', icon: <PersonBadge />, permission: 'sales_agents:view' },
    { to: '/patients', label: t('patients'), icon: <PersonHeart />, permission: 'patients:view' },
    { to: '/users', label: t('userManagement'), icon: <People />, permission: 'users:view' },
    { to: '/roles', label: t('roleManagement'), icon: <ShieldLock />, permission: 'roles:view' },
    { to: '/settings', label: t('settings'), icon: <Gear />, permissions: ['settings:view', 'settings:read'] },
  ]
  
  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(item => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true; // Super admin sees all
    
    // Handle both single permission strings and arrays of permissions
    const requiredPermissions = item.permissions || [item.permission];
    return hasAnyPermission(requiredPermissions);
  });
  return (
    <nav className={`bg-body border-end d-flex flex-column p-2 position-relative ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ width: collapsed ? 64 : 220, minHeight: '100vh', transition: 'width 0.2s' }} role="navigation" aria-label="Main sidebar navigation">
      <div className="d-flex align-items-center mb-3 justify-content-between" style={{ flexDirection: 'row', gap: 12 }}>
        <Link to="/" className={`mb-0 fw-bold flex-grow-1 ${collapsed ? 'd-none' : ''} text-decoration-none text-reset`} style={{ transition: 'opacity 0.2s', paddingLeft: 12, fontSize: 24 }} aria-label="Go to Dashboard">
          PulseLedger
        </Link>
        <button className="btn btn-link text-secondary align-self-center" onClick={onToggle} title={collapsed ? t('expandSidebar') : t('collapseSidebar')} aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')} aria-pressed={!collapsed} style={{ fontSize: 24 }}>
          <List />
        </button>
      </div>
      <ul className="nav flex-column gap-1">
        {visibleNavItems.map(({ to, label, icon }) => (
          <li className="nav-item" key={to}>
            <Link className={`nav-link d-flex align-items-center gap-2 rounded ${location.pathname === to ? 'active bg-primary text-white' : 'text-body'}`} to={to} style={{ minHeight: 40 }}
              aria-current={location.pathname === to ? 'page' : undefined}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span className={collapsed ? 'd-none' : ''}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto pb-2">
        <div className="small text-center text-secondary" style={{ fontSize: collapsed ? 10 : 12 }}>
          {collapsed ? 'v1.0' : 'PulseLedger v1.0'}
        </div>
      </div>
    </nav>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const [theme, setTheme] = useTheme()
  const { branding, loading: brandingLoading } = useBranding()
  const { t, currentLanguage } = useTranslations()
  const navigate = useNavigate()
  const THEMES = getThemeOptions(t);
  useEffect(() => {
    document.documentElement.lang = currentLanguage || 'en';
  }, [currentLanguage]);
  
  return (
    <AppContext.Provider value={{ theme, setTheme }}>
      <PageTitle />
      <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar */}
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1040, width: sidebarCollapsed ? 64 : 220, transition: 'width 0.2s', background: 'var(--bs-body-bg, #f8fafc)' }}>
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
        </div>
        {/* Header */}
        <header className="navbar navbar-expand-lg navbar-light bg-body border-bottom shadow-sm" style={{ 
          position: 'fixed', 
          left: sidebarCollapsed ? 64 : 220, 
          right: 0, 
          top: 0, 
          height: 64, 
          zIndex: 1020,
          padding: '0 1.5rem'
        }}>
          <div className="container-fluid p-0">
            {/* Brand/Title */}
            <span className="navbar-brand mb-0 h1 fw-bold text-primary">
              {brandingLoading ? (
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : null}
              {brandingLoading ? 'Loading...' : (branding.hospitalName || t('hospitalAccounts'))}
            </span>

            {/* Theme Selector */}
            <div className="d-flex align-items-center ms-auto gap-3">
              <div className="dropdown">
                <button className="btn btn-outline-primary btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" id="themeDropdown" data-bs-toggle="dropdown" aria-expanded="false" aria-haspopup="listbox" style={{ marginRight: 5 }}>
                  {THEMES.find(opt => opt.value === theme)?.icon}
                  <span className="d-none d-md-inline">{THEMES.find(opt => opt.value === theme)?.label}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown" role="menu">
                  {THEMES.map(opt => (
                    <li key={opt.value}>
                      <button className={`dropdown-item d-flex align-items-center gap-2${theme === opt.value ? ' active' : ''}`} type="button" onClick={() => setTheme(opt.value)} role="menuitem">
                        {opt.icon} {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* User Menu */}
            <div className="navbar-nav">
              <div className="nav-item dropdown">
                <button
                  className="btn btn-link nav-link dropdown-toggle d-flex align-items-center gap-2 text-decoration-none p-2 rounded-3"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                  aria-expanded="false"
                  aria-haspopup="true"
                  style={{ minHeight: 48 }}
                >
                  {/* Avatar */}
                  <div className="position-relative">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                         style={{ width: 40, height: 40, fontSize: 16, fontWeight: 600 }}>
                      {user?.username?.[0]?.toUpperCase() || <PersonCircle size={20} />}
                    </div>
                    {/* Online indicator */}
                    <div className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                         style={{ width: 12, height: 12 }}></div>
                  </div>
                  
                  {/* Username - hidden on small screens */}
                  <div className="d-none d-md-block text-start">
                    <div className="fw-semibold text-body" style={{ fontSize: 14, lineHeight: 1.2 }}>
                      {user?.name || user?.username}
                    </div>
                    <div className="text-muted small" style={{ fontSize: 12, lineHeight: 1.2 }}>
                      {user?.role || 'User'}
                    </div>
                  </div>
                </button>

                {/* User Card Dropdown */}
                <div className="dropdown-menu dropdown-menu-end shadow-lg border-0" 
                     style={{ 
                       minWidth: 280, 
                       maxWidth: 320, 
                       marginTop: 8,
                       borderRadius: 12,
                       border: '1px solid rgba(0,0,0,0.08)'
                     }}
                     aria-labelledby="userDropdown">
                  
                  {/* User Info Header */}
                  <div className="px-3 pt-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <div className="position-relative">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                             style={{ width: 56, height: 56, fontSize: 24, fontWeight: 700 }}>
                          {user?.username?.[0]?.toUpperCase() || <PersonCircle size={28} />}
                        </div>
                        <div className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                             style={{ width: 16, height: 16 }}></div>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-bold text-body mb-1" style={{ fontSize: 18 }}>
                          {user?.name || user?.username}
                        </div>
                        <div className="text-muted small mb-1">@{user?.username}</div>
                        <div className="d-flex align-items-center gap-1">
                          <ShieldLock className="text-primary" size={14} />
                          <span className="fw-semibold text-primary small">{user?.role || 'User'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="px-3 py-2">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="text-muted">
                        <Key size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{t('permissions')}</div>
                        <div className="text-muted small">
                          {user?.permissions?.includes('*')
                            ? t('allPermissions')
                            : `${user?.permissions?.length || 0} ${t('permissions')}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="text-muted">
                        <People size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{t('userId')}</div>
                        <div className="text-muted small">#{user?.id}</div>
                      </div>
                    </div>

                    {user?.email && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="text-muted">
                          <Envelope size={16} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold small">{t('email')}</div>
                          <div className="text-muted small text-truncate">{user.email}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-3 pb-3">
                    <div className="d-grid gap-2">
                                             <button 
                         className="btn btn-outline-primary btn-sm" 
                         onClick={() => {
                           // Close dropdown
                           const dropdown = document.getElementById('userDropdown');
                           if (dropdown) {
                             const bsDropdown = window.bootstrap?.Dropdown?.getInstance(dropdown);
                             if (bsDropdown) bsDropdown.hide();
                           }
                           // Navigate to settings
                           navigate('/settings');
                         }}
                       >
                        <Gear size={16} className="me-2" />
                        {t('settings')}
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={logout}
                      >
                        <BoxArrowRight size={16} className="me-2" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Main content area */}
        <div style={{ position: 'absolute', left: sidebarCollapsed ? 64 : 220, top: 64, right: 0, bottom: 0, overflow: 'auto', background: 'var(--bs-body-bg, #f8fafc)' }}>
          <main style={{ minHeight: 0, height: '100%', padding: '2rem', boxSizing: 'border-box' }}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
              <Route path="/sales-agents" element={<ProtectedRoute><SalesAgents /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
              <Route path="/invoice/:id" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  )
}

function Root() {
  const { user, login, loading } = useAuth()

  // Enhanced login: after login, fetch branding and store in localStorage
  const loginWithBranding = async (username, password) => {
    try {
      await login(username, password)
    } catch (err) {
      throw err
    }
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const res = await axios.get(`${API_BASE}/api/settings`)
      const brandingSetting = res.data.find(s => s.key === 'branding')
      if (brandingSetting?.value) {
        localStorage.setItem('branding', JSON.stringify(brandingSetting.value))
      }
    } catch (err) {
      // fallback: clear branding if fetch fails
      localStorage.removeItem('branding')
    }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border" /></div>
  return user ? <AppShell /> : <Login onLogin={loginWithBranding} />
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Root />
        <style>{`
          .sidebar-collapsed .nav-link span:last-child { display: none !important; }
          .sidebar-collapsed h4 { display: none !important; }
          .sidebar-collapsed { width: 64px !important; }
          .nav-link.active { font-weight: 600; }
          
          /* Header and User Menu Styles */
          .navbar-brand {
            font-size: 1.25rem;
            font-weight: 700;
          }
          
          .dropdown-menu {
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.08);
          }
          
          .btn-link.nav-link:hover {
            background-color: rgba(0,0,0,0.05);
          }
          
          [data-bs-theme="dark"] .btn-link.nav-link:hover {
            background-color: rgba(255,255,255,0.1);
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .sidebar-collapsed, nav.bg-light { width: 0 !important; min-width: 0 !important; overflow: hidden; }
            .navbar-brand { font-size: 1.1rem; }
          }
          
          @media (max-width: 576px) {
            .navbar-brand { font-size: 1rem; }
          }
        `}</style>
      </Router>
    </AuthProvider>
  )
}

export default App
