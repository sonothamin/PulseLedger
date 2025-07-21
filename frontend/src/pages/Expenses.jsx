import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../hooks/useCurrency'
import useUsers from '../hooks/useUsers'

import { 
  Plus, 
  Search, 
  Filter, 
  ThreeDots, 
  Pencil, 
  Trash, 
  Eye,
  Calendar,
  Person,
  CurrencyDollar,
  Tag,
  ChatText,
  Printer
} from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'
import ExpenseVoucher from './ExpenseVoucher'
import Modal from '../components/Modal.jsx'
import ExpenseForm from '../components/UI/ExpenseForm'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ amount: '', categoryId: '', description: '', recipient: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const { user } = useAuth()
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [dateRange, setDateRange] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const recipientOptions = Array.from(new Set(expenses.map(e => e.recipient).filter(Boolean)))
  const [showVoucher, setShowVoucher] = useState(false)
  const [voucherExpenseId, setVoucherExpenseId] = useState(null)
  const [printAfterSave, setPrintAfterSave] = useState(false)
  const { users: allUsers } = useUsers()

  const fetchExpenses = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/expenses')
      setExpenses(res.data)
    } catch (err) {
      setError('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/expense-categories')
      setCategories(res.data)
    } catch (err) {}
  }

  useEffect(() => { fetchExpenses(); fetchCategories() }, [])

  const handlePrintVoucher = (expenseId) => {
    setVoucherExpenseId(expenseId)
    setShowVoucher(true)
  }

  const handlePrintVoucherPopup = async (expenseId) => {
    const popup = window.open('', '_blank', 'width=900,height=1200');
    if (!popup) return;
    popup.document.write('<html><head><title>Expense Voucher</title>');
    popup.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />');
    popup.document.write('</head><body><div id="voucher-root"></div></body></html>');
    popup.document.close();
    // Wait for popup DOM to be ready
    popup.onload = () => {
      import('react-dom/client').then(ReactDOM => {
        const root = ReactDOM.createRoot(popup.document.getElementById('voucher-root'));
        root.render(
          <ExpenseVoucher expenseId={expenseId} />
        );
        // Use MutationObserver to wait for content
        const observer = new popup.MutationObserver(() => {
          observer.disconnect();
          setTimeout(() => {
            popup.focus();
            popup.print();
          }, 1200);
        });
        observer.observe(popup.document.getElementById('voucher-root'), { childList: true, subtree: true });
      });
    };
  };

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      let savedExpenseId = editing?.id
      if (editing) {
        await axios.put(`/api/expenses/${editing.id}`, form)
        setToast('Expense updated')
        savedExpenseId = editing.id
      } else {
        const res = await axios.post('/api/expenses', { ...form, createdBy: user?.id })
        setToast('Expense added')
        savedExpenseId = res.data?.id
      }
      setShowModal(false)
      setEditing(null)
      setForm({ amount: '', categoryId: '', description: '', recipient: '' })
      setNewCategory('')
      setShowAddCategory(false)
      fetchExpenses()
      if (printAfterSave && savedExpenseId) {
        setTimeout(() => handlePrintVoucher(savedExpenseId), 300)
      }
    } catch {
      setToast('Failed to save expense')
    } finally {
      setSaving(false)
      setPrintAfterSave(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await axios.delete(`/api/expenses/${id}`)
      setToast('Expense deleted')
      fetchExpenses()
    } catch (err) {
      setToast('Failed to delete expense')
    }
  }

  // Filtering logic
  const filteredExpenses = expenses.filter(expense => {
    const search = searchTerm.toLowerCase()
    const matchesAmount = !isNaN(Number(searchTerm)) && (
      expense.amount?.toString().includes(searchTerm) ||
      (formatCurrency && formatCurrency(expense.amount).toLowerCase().includes(search))
    )
    const matchesSearch = expense.id.toString().includes(search) ||
                         (expense.description || '').toLowerCase().includes(search) ||
                         (expense.recipient || '').toLowerCase().includes(search) ||
                         matchesAmount
    const matchesCategory = !selectedCategory || expense.categoryId === parseInt(selectedCategory)
    const matchesRecipient = !selectedRecipient || expense.recipient === selectedRecipient
    let matches = matchesSearch && matchesCategory && matchesRecipient
    // Date filtering
    if (dateRange || (startDate && endDate)) {
      const expenseDate = new Date(expense.createdAt).toISOString().split('T')[0]
      let from = startDate, to = endDate
      if (dateRange && dateRange !== 'custom') {
        const now = new Date()
        const today = now.toISOString().split('T')[0]
        if (dateRange === 'this-week') {
          let startOfWeekDay = 0 // Sunday
          const temp = new Date(now)
          const day = temp.getDay()
          const diff = (day < startOfWeekDay ? 7 : 0) + day - startOfWeekDay
          temp.setDate(now.getDate() - diff)
          from = temp.toISOString().split('T')[0]
          to = today
        } else if (dateRange === 'this-month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          from = startOfMonth.toISOString().split('T')[0]
          to = today
        } else if (!isNaN(Number(dateRange))) {
          const days = parseInt(dateRange)
          from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          to = today
        } else if (dateRange === 'today') {
          from = to = now.toISOString().split('T')[0]
        }
      }
      if (from && to && (expenseDate < from || expenseDate > to)) matches = false
    }
    return matches
  })

  // When dateRange changes, update start/end unless custom
  useEffect(() => {
    if (dateRange && dateRange !== 'custom') {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      let s = '', e = ''
      if (dateRange === 'this-week') {
        let startOfWeekDay = 0
        const temp = new Date(now)
        const day = temp.getDay()
        const diff = (day < startOfWeekDay ? 7 : 0) + day - startOfWeekDay
        temp.setDate(now.getDate() - diff)
        s = temp.toISOString().split('T')[0]
        e = today
      } else if (dateRange === 'this-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        s = startOfMonth.toISOString().split('T')[0]
        e = today
      } else if (!isNaN(Number(dateRange))) {
        const days = parseInt(dateRange)
        s = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        e = today
      } else if (dateRange === 'today') {
        s = e = today
      }
      setStartDate(s)
      setEndDate(e)
    }
  }, [dateRange])

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case 'id':
        valA = a.id; valB = b.id; break;
      case 'amount':
        valA = a.amount; valB = b.amount; break;
      case 'category':
        valA = categories.find(c => c.id === a.categoryId)?.name || ''; valB = categories.find(c => c.id === b.categoryId)?.name || ''; break;
      case 'recipient':
        valA = a.recipient || ''; valB = b.recipient || ''; break;
      case 'date':
        valA = new Date(a.createdAt); valB = new Date(b.createdAt); break;
      default:
        valA = a[sortBy]; valB = b[sortBy];
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  // Add Escape key support for modal
  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  // When editing changes, populate the form with the selected expense's data
  useEffect(() => {
    if (editing) {
      setForm({
        amount: editing.amount || '',
        categoryId: editing.categoryId || '',
        description: editing.description || '',
        recipient: editing.recipient || ''
      })
    }
  }, [editing])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <p className="text-danger">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t('expensesTitle')}</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus /> {t('newExpense')}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 shadow-sm border bg-body rounded-3">
        <div className="card-header d-flex flex-wrap align-items-center gap-2 border-bottom-0 rounded-top-3">
          <div className="input-group input-group-sm w-auto flex-grow-1" style={{ maxWidth: 320 }}>
            <span className="input-group-text bg-transparent border-end-0"><Search /></span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: 0 }}
            />
          </div>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            type="button"
            onClick={() => setShowAdvancedFilters(f => !f)}
            aria-expanded={showAdvancedFilters}
            aria-controls="expenses-advanced-filters"
          >
            <Filter /> {t('filter')}
          </button>
        </div>
        <div className={`collapse${showAdvancedFilters ? ' show' : ''}`} id="expenses-advanced-filters">
          <div className="card-body pt-3 pb-2 bg-body-tertiary border-top rounded-bottom-3">
            <div className="row g-2 align-items-end w-100 m-0">
              {/* Date Range */}
              <div className="col-8 col-md-6">
                <label className="form-label mb-1">{t('expenseDate')}</label>
                <div className="input-group input-group-sm flex-nowrap">
                  <span className="input-group-text bg-transparent border-end-0"><Calendar size={18} /></span>
                  <select className="form-select form-select-sm border-start-0" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                    <option value="">{t('allDates') || 'All Dates'}</option>
                    <option value="this-week">{t('accountsThisWeek') || 'This Week'}</option>
                    <option value="this-month">{t('accountsThisMonth') || 'This Month'}</option>
                    <option value="7">{t('accountsLast7Days') || 'Last 7 Days'}</option>
                    <option value="30">{t('accountsLast30Days') || 'Last 30 Days'}</option>
                    <option value="90">{t('accountsLast90Days') || 'Last 90 Days'}</option>
                    <option value="365">{t('accountsLastYear') || 'Last Year'}</option>
                    <option value="custom">{t('accountsCustomRange') || 'Custom Range'}</option>
                    <option value="today">{t('accountsToday') || 'Today'}</option>
                  </select>
                  <span className="input-group-text">{t('accountsFrom') || 'From'}</span>
                  <input type="date" className="form-control form-control-sm" style={{ minWidth: 105, maxWidth: 105 }} value={startDate} onChange={e => { setStartDate(e.target.value); setDateRange('custom'); }} aria-label="Start date" disabled={dateRange !== 'custom'} />
                  <span className="input-group-text">{t('accountsTo') || 'To'}</span>
                  <input type="date" className="form-control form-control-sm" style={{ minWidth: 105, maxWidth: 105 }} value={endDate} onChange={e => { setEndDate(e.target.value); setDateRange('custom'); }} aria-label="End date" disabled={dateRange !== 'custom'} />
                </div>
              </div>
              {/* Category */}
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">{t('expenseCategory') || 'Category'}</label>
                <select className="form-select form-select-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="">{t('allCategories')}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              {/* Recipient */}
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">{t('recipient') || 'Recipient'}</label>
                <select className="form-select form-select-sm" value={selectedRecipient} onChange={e => setSelectedRecipient(e.target.value)}>
                  <option value="">{t('allRecipients') || 'All Recipients'}</option>
                  {recipientOptions.map(recipient => <option key={recipient} value={recipient}>{recipient}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div className="card-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
          {sortedExpenses.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('noData')}</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ flex: 1, overflow: 'auto' }}>
              <table className="table table-hover align-middle" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                      # {sortBy === 'id' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                      {t('amount')} {sortBy === 'amount' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>
                      {t('expenseCategory')} {sortBy === 'category' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('recipient')}>
                      {t('recipient')} {sortBy === 'recipient' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>{t('description')}</th>
                    <th>{t('cashier') || 'Cashier'}</th>
                    <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                      {t('expenseDate')} {sortBy === 'date' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="text-center">{t('actions')}</th>
                    <th className="text-center">Voucher</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td className="text-center">
                        <span className="fw-semibold">{expense.id}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <span className="fw-semibold">{formatCurrency(expense.amount)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Tag className="text-muted" />
                          {categories.find(c => c.id === expense.categoryId)?.name || ''}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Person className="text-muted" />
                          {expense.recipient}
                        </div>
                      </td>
                      <td>{expense.description && expense.description.length > 32 ? expense.description.slice(0, 32) + '…' : expense.description}</td>
                      <td>{allUsers.find(u => u.id === expense.createdBy)?.name || '-'}</td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <Calendar className="text-muted" />
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <ThreeDots />
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2">
                                <Eye /> {t('viewDetails')}
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => { setEditing(expense); setShowModal(true); }}
                              >
                                <Pencil /> {t('edit')}
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                                onClick={() => handleDelete(expense.id)}
                              >
                                <Trash /> {t('delete')}
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                      <td className="text-center d-flex gap-1 justify-content-center">
                        <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" title="Preview Voucher" onClick={() => handlePrintVoucher(expense.id)}>
                          <Eye size={16} /> Preview
                        </button>
                        <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" title="Print Voucher" onClick={() => handlePrintVoucherPopup(expense.id)}>
                          <Printer size={16} /> Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-4 mt-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-primary mb-1">{sortedExpenses.length}</h4>
              <p className="text-muted mb-0">{t('totalExpenses')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-danger mb-1">
                {formatCurrency(sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
              </h4>
              <p className="text-muted mb-0">{t('totalAmount')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-info mb-1">
                {new Set(sortedExpenses.map(e => e.categoryId)).size}
              </h4>
              <p className="text-muted mb-0">{t('categoriesUsed')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-warning mb-1">
                {sortedExpenses.length > 0 ? 
                  formatCurrency(sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0) / sortedExpenses.length) : 
                  formatCurrency(0)
                }
              </h4>
              <p className="text-muted mb-0">{t('averageAmount')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onClose={() => { setShowModal(false); setEditing(null); setForm({ amount: '', categoryId: '', description: '', recipient: '' }); setNewCategory(''); setShowAddCategory(false) }}
        title={editing ? t('editExpense') : t('addExpense')}
        size="lg"
        className="p-0"
        footer={
          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditing(null); setForm({ amount: '', categoryId: '', description: '', recipient: '' }); setNewCategory(''); setShowAddCategory(false) }}>{t('cancel')}</button>
            <button type="submit" form="expense-form" className="btn btn-secondary" disabled={saving} onClick={() => setPrintAfterSave(false)}>{saving ? t('saving') : t('save')}</button>
            <button type="submit" form="expense-form" className="btn btn-primary" style={{ fontWeight: 600 }} disabled={saving} onClick={() => setPrintAfterSave(true)}>{saving ? t('saving') : (<><Printer /> {t('printAndSave') || 'Print and Save'}</>)}</button>
          </div>
        }
      >
        <ExpenseForm
          id="expense-form"
          form={form}
          onChange={e => {
            const { name, value } = e.target
            setForm(f => ({ ...f, [name]: value }))
          }}
          onSubmit={handleSave}
          saving={saving}
          categories={categories}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          showAddCategory={showAddCategory}
          setShowAddCategory={setShowAddCategory}
          addCategory={async () => {
            if (newCategory.trim() && !categories.some(c => c.name === newCategory.trim())) {
              try {
                const res = await axios.post('/api/expense-categories', { name: newCategory.trim() })
                setCategories([...categories, res.data])
                setForm(f => ({ ...f, categoryId: res.data.id }))
                setNewCategory('')
                setShowAddCategory(false)
              } catch {}
            }
          }}
          t={t}
          hideSubmitButton
        />
      </Modal>
      {/* Voucher Print Dialog */}
      <Modal
        show={showVoucher && voucherExpenseId}
        onClose={() => { setShowVoucher(false); setVoucherExpenseId(null); }}
        title="Expense Voucher Preview"
        size="xl"
        footer={
          <>
            <button className="btn btn-outline-primary" onClick={() => handlePrintVoucherPopup(voucherExpenseId)}><Printer /> Print</button>
            <button className="btn btn-secondary" onClick={() => { setShowVoucher(false); setVoucherExpenseId(null); }}>Close</button>
          </>
        }
        className="p-0"
      >
        <div className="p-0">
          <ExpenseVoucher expenseId={voucherExpenseId} />
        </div>
      </Modal>
      {/* Toast */}
      {toast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className="toast-header"><strong className="me-auto">{t('expenses')}</strong><button type="button" className="btn-close" onClick={() => setToast('')}></button></div>
          <div className="toast-body">{toast}</div>
        </div>
      )}
    </div>
  )
}

export default Expenses 