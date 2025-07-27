import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { Dashboard, POS, Sales, Expenses, Products, Users, Roles, Patients, Settings, SalesAgents, Invoice as InvoicePage, Accounts, AuditLogs } from './pages'
import { House, CashStack, Receipt as Invoice, CreditCard, BoxSeam, People, ShieldLock, Gear, List, SunFill, MoonFill, LaptopFill, PersonHeart, PersonBadge, BarChart, JournalText, Key, Envelope, BoxArrowRight, ExclamationTriangle } from 'react-bootstrap-icons'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthHelpers'
import Login from './pages/Login'
import axios from 'axios'
import { useTranslations } from './hooks/useTranslations'
import PageTitle from './components/PageTitle'
import useTheme from './hooks/useTheme';
import getThemeOptions from './hooks/useThemeOptions';
import logo from './assets/logo.png';
import NoAccess from './pages/NoAccess';
import Toast from './components/Toast';
import { GlobalNavigateSetter } from './main';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import useBranding from './hooks/useBranding';
import Report from './pages/Report';

// Update defaultRoutes to match canonical keys
const defaultRoutes = [
  { path: '/dashboard', permission: 'dashboard:view' },
  { path: '/pos', permission: 'pos:view' },
  { path: '/sales', permission: 'sale:read' },
  { path: '/expenses', permission: 'expense:read' },
  { path: '/products', permission: 'product:read' },
  { path: '/accounts', permission: 'account:read' },
  { path: '/patients', permission: 'patient:read' },
  { path: '/users', permission: 'user:read' },
  { path: '/roles', permission: 'role:read' },
  { path: '/settings', permission: 'settings:read' },
];

function getFirstAllowedRoute(user, hasAnyPermission) {
  if (!user || !user.permissions) return '/login';
  if (user.permissions.includes('*')) return '/dashboard';
  const found = defaultRoutes.find(route => hasAnyPermission([route.permission]));
  return found ? found.path : '/no-access';
}

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout, hasAnyPermission, error, resetError } = useAuth()
  const [theme, setTheme] = useTheme()
  const { branding, loading: brandingLoading } = useBranding()
  const { t, currentLanguage } = useTranslations()
  const navigate = useNavigate()
  const THEMES = getThemeOptions(t);
  useEffect(() => {
    document.documentElement.lang = currentLanguage || 'en';
  }, [currentLanguage]);
  useEffect(() => {
    if (user) {
      console.log('[AppShell] User permissions:', user?.permissions);
      const firstRoute = getFirstAllowedRoute(user, hasAnyPermission);
      console.log('[AppShell] First allowed route:', firstRoute);
      // If on root or forbidden page, redirect to first allowed
      if (window.location.pathname === '/' || window.location.pathname === '/dashboard' || window.location.pathname === '/no-access') {
        navigate(firstRoute, { replace: true });
      }
    }
  }, [user, hasAnyPermission, navigate]);
  return (
    <>
      <PageTitle />
      {/* Global error toast */}
      {error && (
        <Toast message={error} type="error" onClose={resetError} />
      )}
      {/* Set global navigate for toast-based redirects */}
      <GlobalNavigateSetter navigate={navigate} />
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
                  {(() => { const Icon = THEMES.find(opt => opt.value === theme)?.icon; return Icon ? <Icon /> : null; })()}
                  <span className="d-none d-md-inline">{THEMES.find(opt => opt.value === theme)?.label}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown" role="menu">
                  {THEMES.map(opt => (
                    <li key={opt.value}>
                      <button className={`dropdown-item d-flex align-items-center gap-2${theme === opt.value ? ' active' : ''}`} type="button" onClick={() => setTheme(opt.value)} role="menuitem">
                        <opt.icon /> {opt.label}
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
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute permission="dashboard:view"><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute permission="dashboard:view"><Dashboard /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute permission="pos:view"><POS /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute permission="sale:read"><Sales /></ProtectedRoute>} />
              <Route path="/sales-agents" element={<ProtectedRoute permission="salesAgent:read"><SalesAgents /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute permission="expense:read"><Expenses /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute permission="product:read"><Products /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute permission="patient:read"><Patients /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute permission="account:manage"><Accounts /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute permission="role:read"><Roles /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute permission="settings:read"><Settings /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute permission="auditLog:read"><AuditLogs /></ProtectedRoute>} />
              <Route path="/invoice/:id" element={<ProtectedRoute permission="sale:read"><InvoicePage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute permission="report:read"><Report /></ProtectedRoute>} />
              <Route path="/no-access" element={<NoAccess />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  )
}

function Root() {
  const { user, login, loading, refreshFailed } = useAuth();

  // Enhanced login: after login, fetch branding and store in localStorage
  const loginWithBranding = async (username, password) => {
    await login(username, password)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const res = await axios.get(`${API_BASE}/api/settings`)
      let brandingSetting = null;
      if (Array.isArray(res.data)) {
        brandingSetting = res.data.find(s => s.key === 'branding');
      } else {
        console.warn('[Root] /api/settings did not return an array:', res.data);
      }
      if (brandingSetting?.value) {
        localStorage.setItem('branding', JSON.stringify(brandingSetting.value))
      }
    } catch {
      // fallback: clear branding if fetch fails
      localStorage.removeItem('branding')
    }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border" /></div>;
  // If refreshFailed and not logged in, just show login form (no redirect)
  if (refreshFailed && !user) return <Login onLogin={loginWithBranding} />;
  return user ? <AppShell /> : <Login onLogin={loginWithBranding} />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Root />
      </Router>
    </AuthProvider>
  )
}

export default App

// Add NotFound component
function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center bg-body-tertiary">
      <div className="mb-4">
        <ExclamationTriangle size={64} className="text-warning mb-3" />
        <h1 className="display-4 fw-bold">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="lead text-muted mb-4">Sorry, the page you are looking for does not exist or has been moved.</p>
        <a href="/" className="btn btn-primary btn-lg px-4">Go to Dashboard</a>
      </div>
    </div>
  );
}
