import { useEffect, useState } from 'react'
import { useTranslations } from '../hooks/useTranslations'
import { useAuth, usePermission } from '../context/AuthHelpers'
import useBranding from '../hooks/useBranding';
import { useCurrency } from '../hooks/useCurrency'
import axios from 'axios'
import { 
  CurrencyDollar, 
  CreditCard, 
  ArrowUp, 
  ArrowDown,
  Receipt,
  BoxSeam,
  Clock,
  BarChart,
  CashStack,
  People,
  ShieldLock
} from 'react-bootstrap-icons'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import ExpenseForm from '../components/UI/ExpenseForm'
import Modal from '../components/Modal.jsx'
import ExpenseVoucher from './ExpenseVoucher';
import React from 'react';
import ReactDOM from 'react-dom/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    todaySales: 0,
    todayExpenses: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { t } = useTranslations()
  const { user } = useAuth()
  const { branding } = useBranding();
  const { formatCurrency } = useCurrency()
  const [salesReport, setSalesReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const navigate = useNavigate()
  // Permission helpers
  const hasPOS = usePermission('pos:view');
  const hasExpense = usePermission('expense:create');
  const hasAccounts = usePermission('account:manage');
  const hasAudit = usePermission('auditLog:read');
  const hasUsers = usePermission('user:list');
  const hasRoles = usePermission('role:read');
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ amount: '', categoryId: '', description: '', recipient: '' })
  const [expenseSaving, setExpenseSaving] = useState(false)
  const [expenseCategories, setExpenseCategories] = useState([])
  const [expenseNewCategory, setExpenseNewCategory] = useState('')
  const [expenseShowAddCategory, setExpenseShowAddCategory] = useState(false)
  const [expenseToast, setExpenseToast] = useState('')

  console.log('[Dashboard] Initial render', { stats, salesReport, expenses, loading, error, user });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError('')
        console.log('[Dashboard] Fetching /api/sales/stats...');
        // Fetch dashboard statistics from API
        const res = await axios.get(`${API_BASE}/api/sales/stats`)
        console.log('[Dashboard] /api/sales/stats response:', res.data);
        setStats({
          totalSales: res.data.totalSales || 0,
          totalExpenses: res.data.totalExpenses || 0,
          todaySales: res.data.todaySales || 0,
          todayExpenses: res.data.todayExpenses || 0
        })
      } catch (err) {
        console.error('[Dashboard] Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
        console.log('[Dashboard] Done loading stats', { stats });
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    setReportLoading(true)
    console.log('[Dashboard] Fetching /api/reports/sales...');
    axios.get(`${API_BASE}/api/reports/sales`)
      .then(res => {
        setSalesReport(res.data)
        console.log('[Dashboard] /api/reports/sales response:', res.data);
      })
      .catch((err) => {
        setSalesReport(null)
        console.error('[Dashboard] /api/reports/sales error:', err);
      })
      .finally(() => {
        setReportLoading(false)
        console.log('[Dashboard] Done loading sales report', { salesReport });
      })
  }, [stats]);

  useEffect(() => {
    console.log('[Dashboard] Fetching /api/expenses?limit=5&sort=desc...');
    axios.get(`${API_BASE}/api/expenses?limit=5&sort=desc`)
      .then(res => {
        setExpenses(res.data || [])
        console.log('[Dashboard] /api/expenses response:', res.data);
      })
      .catch((err) => {
        setExpenses([])
        console.error('[Dashboard] /api/expenses error:', err);
      })
  }, [salesReport]);

  useEffect(() => {
    if (!showExpenseModal) return
    axios.get(`${API_BASE}/api/expense-categories`).then(res => setExpenseCategories(res.data)).catch(() => setExpenseCategories([]))
  }, [showExpenseModal])

  const netProfit = stats.totalSales - stats.totalExpenses

  // Prepare chart data
  let chartData = null
  let chartOptions = null
  if (salesReport && salesReport.byDate) {
    const labels = Object.keys(salesReport.byDate)
    const data = Object.values(salesReport.byDate)
    chartData = {
      labels,
      datasets: [
        {
          label: t('sales'),
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.3,
          pointRadius: 3,
          fill: true
        }
      ]
    }
    chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      }
    }
  }
  // Prepare recent transactions (sales + expenses)
  const recentSales = salesReport?.sales?.slice(-5).reverse() || []
  const recentExpenses = expenses.slice(0, 5)
  const recentTransactions = [
    ...recentSales.map(sale => ({
      type: 'sale',
      id: `sale-${sale.id}`,
      date: sale.createdAt,
      amount: sale.total,
      party: sale.Patient ? sale.Patient.name : 'Walk-in',
      cashier: sale.Cashier?.name || '',
    })),
    ...recentExpenses.map(exp => ({
      type: 'expense',
      id: `expense-${exp.id}`,
      date: exp.createdAt,
      amount: exp.amount,
      party: exp.recipient || exp.description || 'Expense',
      agent: exp.Creator?.name || '',
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Add category handler
  const handleExpenseAddCategory = async () => {
    if (expenseNewCategory.trim() && !expenseCategories.some(c => c.name === expenseNewCategory.trim())) {
      try {
        const res = await axios.post(`${API_BASE}/api/expense-categories`, { name: expenseNewCategory.trim() })
        setExpenseCategories([...expenseCategories, res.data])
        setExpenseForm(f => ({ ...f, categoryId: res.data.id }))
        setExpenseNewCategory('')
        setExpenseShowAddCategory(false)
      } catch {
        // ignore
      }
    }
  }
  // Expense form change
  const handleExpenseChange = e => {
    const { name, value } = e.target
    setExpenseForm(f => ({ ...f, [name]: value }))
  }
  // Expense form submit
  const handleExpenseSubmit = async e => {
    e.preventDefault()
    setExpenseSaving(true)
    try {
      await axios.post(`${API_BASE}/api/expenses`, { ...expenseForm })
      setExpenseToast(t('expenseAdded') || 'Expense added')
      setShowExpenseModal(false)
      setExpenseForm({ amount: '', categoryId: '', description: '', recipient: '' })
    } catch {
      setExpenseToast(t('failedToSaveExpense') || 'Failed to save expense')
    } finally {
      setExpenseSaving(false)
    }
  }

  // Add this handler for Save and Print
  const handleExpenseSaveAndPrint = async () => {
    setExpenseSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/api/expenses`, { ...expenseForm });
      setExpenseToast(t('expenseAdded') || 'Expense added');
      setShowExpenseModal(false);
      setExpenseForm({ amount: '', categoryId: '', description: '', recipient: '' });
      // Fetch all required data for the voucher
      const expenseId = res.data.id;
      const [expenseRes, catRes] = await Promise.all([
        axios.get(`${API_BASE}/api/expenses/${expenseId}`),
        axios.get(`${API_BASE}/api/expense-categories`)
      ]);
      const expense = expenseRes.data;
      const categories = catRes.data;
      const category = categories.find(c => c.id === expense.categoryId);
      const cashier = expense.Creator || expense.cashier || null;
      const currentDate = expense.createdAt ? new Date(expense.createdAt).toLocaleString() : new Date().toLocaleString();
      const voucherNumber = expense.id || 'Draft';
      const logoSrc = branding.logo?.startsWith('/uploads/')
        ? API_BASE + branding.logo
        : branding.logo;
      // Print voucher in popup (robust, context-free)
      const popup = window.open('', '_blank', 'width=900,height=1200');
      if (!popup) return;
      popup.document.write('<html><head><title>Expense Voucher</title>');
      popup.document.write('<link rel="preload" href="/HindSiliguri-Regular.ttf" as="font" type="font/ttf" crossorigin="anonymous">');
      popup.document.write('<link rel="stylesheet" href="/index.css" />');
      popup.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />');
      popup.document.write('</head><body><div id="voucher-root"></div></body></html>');
      popup.document.close();
      popup.onload = () => {
        const root = ReactDOM.createRoot(popup.document.getElementById('voucher-root'));
        root.render(
          React.createElement(ExpenseVoucher, {
            expense,
            category,
            branding,
            formatCurrency,
            cashier,
            currentDate,
            voucherNumber,
            logoSrc
          })
        );
        // Wait for content, then print
        const observer = new popup.MutationObserver(() => {
          observer.disconnect();
          setTimeout(() => {
            popup.focus();
            popup.print();
            popup.close();
          }, 1200);
        });
        observer.observe(popup.document.getElementById('voucher-root'), { childList: true, subtree: true });
      };
    } catch {
      setExpenseToast(t('failedToSaveExpense') || 'Failed to save expense');
    } finally {
      setExpenseSaving(false);
    }
  };

  if (loading || reportLoading) {
    console.log('[Dashboard] Loading spinner shown (loading or reportLoading)');
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" />
      </div>
    );
  }

  if (!salesReport) {
    console.log('[Dashboard] No sales report data available.');
    return <div className="alert alert-warning">No sales report data available.</div>;
  }

  console.log('[Dashboard] Render main UI', { stats, salesReport, expenses, loading, error });

  // Calculate today's expenses from the expenses array
  const today = new Date().toISOString().split('T')[0];
  const todaysExpenses = expenses
    .filter(exp => exp.createdAt && exp.createdAt.split('T')[0] === today)
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div>
      <h2 className="mb-4">
        {user ? `Hi, ${user.name}!` : t('dashboardTitle')}
      </h2>
      
      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="dashboard-summary-card card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-warning bg-opacity-10 p-3 rounded">
                    <ArrowDown className="text-warning" size={24} />
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">{t('todaySales')}</h6>
                  <h4 className="mb-0">{formatCurrency(stats.todaySales)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dashboard-summary-card card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-danger bg-opacity-10 p-3 rounded">
                    <CreditCard className="text-danger" size={24} />
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">{t('todayExpenses') || 'Today\'s Expenses'}</h6>
                  <h4 className="mb-0">{formatCurrency(todaysExpenses)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dashboard-summary-card card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-success bg-opacity-10 p-3 rounded">
                    <ArrowUp className="text-success" size={24} />
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">{t('todayProfit') || 'Today\'s Profit'}</h6>
                  <h4 className="mb-0">{formatCurrency(stats.todaySales - todaysExpenses)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts, Quick Access, and Recent Activity */}
      <div className="row g-4">
        <div className="col-md-6 d-flex flex-column" style={{ minHeight: 370 }}>
          <div className="dashboard-chart-card card border-0 shadow-sm flex-fill d-flex flex-column" style={{ minHeight: 370 }}>
            <div className="card-header bg-transparent">
              <h5 className="mb-0">{t('salesChart')}</h5>
            </div>
            <div className="card-body flex-fill d-flex flex-column justify-content-center">
              {reportLoading ? (
                <div className="d-flex align-items-center justify-content-center" style={{ height: 320, width: '100%' }}>
                  <div className="text-center text-muted">
                    <BarChart size={48} className="mb-3" />
                    <p>{t('loading')}</p>
                  </div>
                </div>
              ) : chartData ? (
                <div style={{ height: 320, width: '100%' }}>
                  <Line data={chartData} options={chartOptions} height={320} />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center" style={{ height: 320, width: '100%' }}>
                  <div className="text-center text-muted">
                    <BarChart size={48} className="mb-3" />
                    <p>{t('noData')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-3 d-flex flex-column" style={{ minHeight: 370 }}>
          <div className="dashboard-quickaccess-card card border-0 shadow-sm flex-fill d-flex flex-column align-items-stretch justify-content-center" style={{ minHeight: 370 }}>
            <div className="card-header bg-transparent">
              <h5 className="mb-0">{t('quickAccess')}</h5>
            </div>
            <div className="card-body d-flex flex-column gap-3 align-items-stretch justify-content-center">
              {hasPOS && (
                <button className="btn btn-outline-success d-flex align-items-center gap-2" onClick={() => navigate('/pos')}><CashStack /> {t('pos')}</button>
              )}
              {hasExpense && (
                <button className="btn btn-outline-danger d-flex align-items-center gap-2" onClick={() => setShowExpenseModal(true)}><CreditCard /> {t('addExpense')}</button>
              )}
              {hasAccounts && (
                <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => navigate('/accounts')}><BarChart /> {t('accounts')}</button>
              )}
              {hasAudit && (
                <button className="btn btn-outline-info d-flex align-items-center gap-2" onClick={() => navigate('/audit-logs')}><Clock /> {t('auditLogs')}</button>
              )}
              {hasUsers && (
                <button className="btn btn-outline-info d-flex align-items-center gap-2" onClick={() => navigate('/users')}><People /> {t('userManagement')}</button>
              )}
              {hasRoles && (
                <button className="btn btn-outline-warning d-flex align-items-center gap-2" onClick={() => navigate('/roles')}><ShieldLock /> {t('roleManagement')}</button>
              )}
              {!(hasPOS || hasExpense || hasAccounts || hasAudit || hasUsers || hasRoles) && (
                <div className="text-muted text-center">{t('noQuickActions')}</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-3 d-flex flex-column" style={{ minHeight: 370 }}>
          <div className="dashboard-activity-card card border-0 shadow-sm flex-fill d-flex flex-column" style={{ minHeight: 370 }}>
            <div className="card-header bg-transparent">
              <h5 className="mb-0">{t('recentTransactions')}</h5>
            </div>
            <div className="card-body flex-fill d-flex flex-column justify-content-center">
              {reportLoading ? (
                <div className="text-center text-muted">
                  <Clock size={48} className="mb-3" />
                  <p>{t('loading')}</p>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center text-muted">
                  <Clock size={48} className="mb-3" />
                  <p>{t('noRecentTransactions')}</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {recentTransactions.map(tx => (
                    <li key={tx.id} className="list-group-item d-flex justify-content-between align-items-center" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex align-items-center gap-2">
                          {tx.type === 'sale' ? (
                            <Receipt className="text-primary" title="Sale" />
                          ) : (
                            <CreditCard className="text-danger" title="Expense" />
                          )}
                          <span className="fw-semibold text-truncate" style={{ maxWidth: 220 }}>{tx.party}</span>
                        </div>
                        {tx.type === 'sale' && tx.cashier && (
                          <div className="text-muted ms-4" style={{ fontSize: '0.80em', marginTop: 2 }}>
                            By: {tx.cashier}
                          </div>
                        )}
                        {tx.type === 'expense' && tx.agent && (
                          <div className="text-muted ms-4" style={{ fontSize: '0.80em', marginTop: 2 }}>
                            By: {tx.agent}
                          </div>
                        )}
                      </div>
                      <span className={`fw-semibold ${tx.type === 'expense' ? 'text-danger' : 'text-success'}`} style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>{formatCurrency(tx.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Expense Modal */}
      <Modal
        show={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title={t('addExpense') || 'Add Expense'}
      >
        <ExpenseForm
          form={expenseForm}
          onChange={handleExpenseChange}
          onSubmit={handleExpenseSubmit}
          saving={expenseSaving}
          categories={expenseCategories}
          newCategory={expenseNewCategory}
          setNewCategory={setExpenseNewCategory}
          showAddCategory={expenseShowAddCategory}
          setShowAddCategory={setExpenseShowAddCategory}
          addCategory={handleExpenseAddCategory}
          t={t}
          onCancel={() => setShowExpenseModal(false)}
          onPrint={handleExpenseSaveAndPrint}
        />
      </Modal>
      {/* Expense Toast */}
      {expenseToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className="toast-header"><strong className="me-auto">{t('expenses')}</strong><button type="button" className="btn-close" onClick={() => setExpenseToast('')}></button></div>
          <div className="toast-body">{expenseToast}</div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 