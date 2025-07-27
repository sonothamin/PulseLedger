import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from '../context/AuthHelpers';
import { List, House, CashStack, Receipt as Invoice, CreditCard, BoxSeam, People, ShieldLock, Gear, BarChart, JournalText, PersonBadge, PersonHeart, FileEarmarkBarGraph } from 'react-bootstrap-icons';
import logo from '../assets/logo.png';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { t } = useTranslations();
  const { user, hasAnyPermission } = useAuth();

  // Debug: Log user permissions in Sidebar
  console.log('[Sidebar] User permissions:', user?.permissions);

  // Define all nav items with canonical permission keys
  const navItems = [
    { to: '/', label: t('dashboard'), icon: <House />, permission: 'dashboard:view', alwaysShow: true },
    { to: '/pos', label: t('pos'), icon: <CashStack />, permission: 'pos:view', alwaysShow: true },
    { to: '/sales', label: t('sales'), icon: <Invoice />, permission: 'sale:read', alwaysShow: true },
    { to: '/expenses', label: t('expenses'), icon: <CreditCard />, permission: 'expense:read' },
    { to: '/products', label: t('products'), icon: <BoxSeam />, permission: 'product:read' },
    { to: '/accounts', label: t('accounts'), icon: <BarChart />, permission: 'account:manage' },
    { to: '/reports', label: t('reports'), icon: <FileEarmarkBarGraph />, permission: 'report:read' },
    { to: '/audit-logs', label: t('auditLogs'), icon: <JournalText />, permission: 'auditLog:read' },
    { to: '/sales-agents', label: t('salesAgentsTitle') || 'Sales Agents', icon: <PersonBadge />, permission: 'salesAgent:read' },
    { to: '/patients', label: t('patients'), icon: <PersonHeart />, permission: 'patient:read' },
    { to: '/users', label: t('userManagement'), icon: <People />, permission: 'user:list' },
    { to: '/roles', label: t('roleManagement'), icon: <ShieldLock />, permission: 'role:read' },
    { to: '/settings', label: t('settings'), icon: <Gear />, permissions: ['settings:read'], alwaysShow: true },
  ];

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(item => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true; // Super admin sees all
    const requiredPermissions = item.permissions || [item.permission];
    return hasAnyPermission(requiredPermissions);
  });

  // When collapsed, only show alwaysShow items
  const navItemsToShow = collapsed
    ? visibleNavItems.filter(item => item.alwaysShow)
    : visibleNavItems;

  return (
    <nav
      className={`sidebar bg-body border-end d-flex flex-column align-items-stretch position-relative ${collapsed ? 'sidebar-collapsed' : ''}`}
      style={{ width: collapsed ? 64 : 220, minHeight: '100vh', transition: 'width 0.2s' }}
      aria-label="Main sidebar navigation"
    >
      {/* Brand/logo area */}
      <div className="sidebar-brand d-flex flex-column align-items-center justify-content-center py-3 border-bottom" style={{ minHeight: 64 }}>
        <Link to="/" className="d-flex align-items-center w-100 justify-content-center text-decoration-none text-reset" aria-label="Go to Dashboard">
          <img
            src={logo}
            alt="PulseLedger Logo"
            style={{ height: 36, width: 36, objectFit: 'contain', filter: 'var(--logo-filter, none)' }}
            className="sidebar-logo"
          />
          {!collapsed && (
            <span className="ms-2 fw-bold fs-4 text-reset" style={{ whiteSpace: 'nowrap' }}>
              PulseLedger
            </span>
          )}
        </Link>
        <button
          className="btn btn-link text-secondary p-0 mt-2"
          onClick={onToggle}
          title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
          aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
          aria-pressed={!collapsed}
          style={{ fontSize: 22 }}
        >
          <List />
        </button>
      </div>
      {/* Navigation links (scrollable) */}
      <div className="sidebar-nav-scroll">
        <ul className="nav flex-column gap-1 px-1 mt-2" role="list">
          {navItemsToShow.map(({ to, label, icon }) => {
            // Custom active logic for dashboard
            const isDashboard = to === '/';
            const isActive = isDashboard
              ? (location.pathname === '/' || location.pathname === '/dashboard')
              : location.pathname === to;
            return (
              <li className="nav-item" key={to} role="listitem">
                <Link
                  className={`nav-link d-flex align-items-center gap-2 rounded ${isActive ? 'active bg-primary text-white' : 'text-body'}`}
                  to={to}
                  style={{ minHeight: 40 }}
                  aria-current={isActive ? 'page' : undefined}
                  tabIndex={0}
                >
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span className={collapsed ? 'd-none' : ''}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Version at the bottom */}
      <div className="sidebar-version mt-auto pb-2">
        <div className="small text-center text-secondary" style={{ fontSize: collapsed ? 10 : 12 }}>
          {collapsed ? 'v1.0' : 'PulseLedger v1.0'}
        </div>
      </div>
    </nav>
  );
} 