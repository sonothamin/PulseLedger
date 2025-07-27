import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from '../hooks/useTranslations'
import { useCurrency } from '../hooks/useCurrency'
import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

import { 
  Plus, 
  Search, 
  Filter, 
  ThreeDots, 
  Eye, 
  Pencil, 
  Trash,
  Calendar,
  Person,
  Receipt as Invoice,
  CalendarRange
} from 'react-bootstrap-icons'
import InvoicePage from './Invoice'
import { createRoot } from 'react-dom/client'
import POS from './POS'
import { Modal } from 'react-bootstrap'
import Toast from '../components/Toast';

function Sales() {
  // All hooks are already at the top of the component, before any early returns or conditional logic.
  // No further changes needed for hook placement.
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedCashier, setSelectedCashier] = useState('')
  const [settings, setSettings] = useState({})
  const [toast, setToast] = useState({ message: '', type: 'error' });
  const [dateRange, setDateRange] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingSale, setViewingSale] = useState(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await axios.get(`${API_BASE}/api/sales`)
        setSales(res.data)
      } catch (err) {
        console.error('Failed to fetch sales:', err)
        setError('Failed to load sales data')
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/settings`)
        const settingsMap = {}
        res.data.forEach(setting => {
          settingsMap[setting.key] = setting
        })
        setSettings(settingsMap)
      } catch {
        // ignore
      }
    }
    fetchSettings()
  }, [])

  const agentOptions = Array.from(new Set(sales.map(s => s.SalesAgent?.name).filter(Boolean)))
  const cashierOptions = Array.from(new Set(sales.map(s => s.Cashier?.name).filter(Boolean)))

  const filteredSales = sales.filter(sale => {
    const search = searchTerm.toLowerCase()
    const matchesAmount = !isNaN(Number(searchTerm)) && (
      sale.total?.toString().includes(searchTerm) ||
      (formatCurrency && formatCurrency(sale.total).toLowerCase().includes(search))
    )
    const matchesSearch = sale.id.toString().includes(search) ||
                         (sale.Patient?.name || '').toLowerCase().includes(search) ||
                         (sale.Cashier?.name || '').toLowerCase().includes(search) ||
                         (sale.SalesAgent?.name || '').toLowerCase().includes(search) ||
                         matchesAmount
    let matches = matchesSearch
    if (dateRange || (startDate && endDate)) {
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
      let from = startDate, to = endDate
      if (dateRange && dateRange !== 'custom') {
        const now = new Date()
        const today = now.toISOString().split('T')[0]
        if (dateRange === 'this-week') {
          let startOfWeekDay = 0 // Sunday
          const sow = settings.localization?.value?.startOfWeek
          if (sow === 'monday') startOfWeekDay = 1
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
        }
      }
      if (from && to && (saleDate < from || saleDate > to)) matches = false
    }
    if (selectedAgent && sale.SalesAgent?.name !== selectedAgent) matches = false
    if (selectedCashier && sale.Cashier?.name !== selectedCashier) matches = false
    return matches
  })

  const sortedSales = [...filteredSales].sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case 'id':
        valA = a.id; valB = b.id; break;
      case 'customer':
        valA = a.Patient?.name || ''; valB = b.Patient?.name || ''; break;
      case 'cashier':
        valA = a.Cashier?.name || ''; valB = b.Cashier?.name || ''; break;
      case 'amount':
        valA = a.total; valB = b.total; break;
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

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { class: 'bg-success', text: t('paid') },
      pending: { class: 'bg-warning', text: t('pending') },
      refunded: { class: 'bg-danger', text: t('refunded') }
    }
    const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status }
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>
  }

  function openInvoicePopup(invoiceData) {
    const popup = window.open('', '', 'width=900,height=1200')
    popup.document.write('<div id="invoice-root"></div>')
    popup.document.close()
    popup.onload = () => {
      const root = createRoot(popup.document.getElementById('invoice-root'))
      root.render(<InvoicePage {...invoiceData} />)
    }
  }

  const handleEditSale = (sale) => {
    setEditingSale(sale)
    setShowEditModal(true)
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
    setEditingSale(null)
  }

  const handleEditModalSave = async (updatedSale) => {
    try {
      await axios.put(`${API_BASE}/api/sales/${updatedSale.id}`, updatedSale)
      try {
        await axios.post(`${API_BASE}/api/sales/${updatedSale.id}/recalculate`)
      } catch {
        setToast({ message: 'Failed to recalculate sale total. Please check the invoice carefully.', type: 'error' });
      }
      const fresh = await axios.get(`${API_BASE}/api/sales/${updatedSale.id}`)
      setSales(sales => sales.map(s => s.id === updatedSale.id ? fresh.data : s))
      setShowEditModal(false)
      setEditingSale(null)
    } catch {
      setToast({ message: 'Failed to update sale', type: 'error' });
    }
  }

  const handleViewSale = (sale) => {
    setViewingSale(sale)
    setShowViewModal(true)
  }

  const handleViewModalClose = () => {
    setShowViewModal(false)
    setViewingSale(null)
  }

  const handleDeleteSale = async (sale) => {
    if (!window.confirm(t('deleteConfirm') || 'Delete this sale?')) return;
    try {
      await axios.delete(`${API_BASE}/api/sales/${sale.id}`);
      setSales(sales => sales.filter(s => s.id !== sale.id));
    } catch {
      setToast({ message: t('deleteFailed') || 'Failed to delete sale.', type: 'error' });
    }
  }

  // Helper to get date range for a preset
  const getDateRangeForRange = useCallback((range) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (range === 'this-week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: today
      }
    } else if (range === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today
      }
    } else if (range === 'today') {
      return { startDate: today, endDate: today }
    } else if (!isNaN(Number(range)) && range) {
      const days = parseInt(range)
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      return { startDate: fromDate, endDate: today }
    }
    return { startDate, endDate }
  }, [startDate, endDate])

  // When dateRange changes, update start/end unless custom
  useEffect(() => {
    if (dateRange && dateRange !== 'custom') {
      const { startDate: s, endDate: e } = getDateRangeForRange(dateRange)
      setStartDate(s)
      setEndDate(e)
    }
  }, [dateRange, getDateRangeForRange])

  // Helper to format date as dd/mm/yyyy
  function formatDateDMY(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
      )}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ flex: '0 0 auto' }}>
        <h2>{t('salesTitle')}</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2">
          <Plus /> {t('newSale')}
        </button>
      </div>

      {/* Filters & Summary */}
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
          <span className="badge bg-primary text-light fs-6 ms-2">{t('total')}: {formatCurrency(sortedSales.reduce((sum, sale) => sum + (sale.total || 0), 0))}</span>
          <span className="badge bg-secondary text-light fs-6 ms-1">{t('count')}: {sortedSales.length}</span>
          <span className="badge bg-warning text-dark fs-6 ms-1">{t('totalDiscounts')}: {formatCurrency(sortedSales.reduce((sum, sale) => sum + (sale.discountType === 'percent' ? (sale.total * (sale.discount || 0) / 100) : (sale.discount || 0)), 0))}</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="text-muted small ms-2">
              {t('showing') || 'Showing'}: {(() => {
                switch (dateRange) {
                  case 'today': return t('accountsToday') || 'Today';
                  case 'this-week': return t('accountsThisWeek') || 'This Week';
                  case 'this-month': return t('accountsThisMonth') || 'This Month';
                  case 'all':
                  case '':
                    return t('allDates') || 'All Dates';
                  case 'custom': return `${startDate && formatDateDMY(startDate)} - ${endDate && formatDateDMY(endDate)}`;
                  default: return dateRange;
                }
              })()}
            </span>
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              type="button"
              onClick={() => setShowAdvancedFilters(f => !f)}
              aria-expanded={showAdvancedFilters}
              aria-controls="sales-advanced-filters"
            >
              <Filter /> {t('filter')}
            </button>
          </div>
        </div>
        <div className={`collapse${showAdvancedFilters ? ' show' : ''}`} id="sales-advanced-filters">
          <div className="card-body pt-3 pb-2 bg-body-tertiary border-top rounded-bottom-3">
            <div className="row g-2 align-items-end w-100 m-0">
              {/* Date Range */}
              <div className="col-8 col-md-6">
                <label className="form-label mb-1">{t('saleDate')}</label>
                <div className="input-group input-group-sm flex-nowrap">
                  <span className="input-group-text bg-transparent border-end-0"><CalendarRange size={18} /></span>
                  <select className="form-select form-select-sm border-start-0" value={dateRange} onChange={e => {
                    const val = e.target.value;
                    setDateRange(val);
                    if (val === 'all' || val === '') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}>
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
              {/* Agent */}
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">{t('salesAgent') || 'Agent'}</label>
                <select className="form-select form-select-sm" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                  <option value="">{t('allAgents') || 'All Agents'}</option>
                  {agentOptions.map(agent => <option key={agent} value={agent}>{agent}</option>)}
                </select>
              </div>
              {/* Cashier */}
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">{t('cashier') || 'Cashier'}</label>
                <select className="form-select form-select-sm" value={selectedCashier} onChange={e => setSelectedCashier(e.target.value)}>
                  <option value="">{t('allCashiers') || 'All Cashiers'}</option>
                  {cashierOptions.map(cashier => <option key={cashier} value={cashier}>{cashier}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card" style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
        <div className="card-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
          {sortedSales.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('noData')}</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ flex: 1, overflow: 'auto' }}>
              <table className="table table-hover mb-0" style={{ minWidth: 900 }}>
                <thead className="table-light">
                  <tr>
                    <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                      {t('saleNumber')} {sortBy === 'id' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer')}>
                      {t('customer')} {sortBy === 'customer' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="text-center">{t('items') || 'Items'}</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cashier')}>
                      {t('cashier')} {sortBy === 'cashier' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                      {t('amount')} {sortBy === 'amount' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="text-end">{t('discount')}</th>
                    <th className="text-center">{t('paymentStatus')}</th>
                    <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                      {t('saleDate')} {sortBy === 'date' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="text-center">{t('actions')}</th>
                    <th className="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="text-center">
                        <span className="fw-semibold">{sale.id}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Person className="text-muted" />
                          {sale.Patient?.name || ''}
                        </div>
                      </td>
                      <td className="text-center">{Array.isArray(sale.SaleItems) ? sale.SaleItems.length : 0}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Person className="text-muted" />
                          {sale.Cashier?.name || ''}
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <span className="fw-semibold">{formatCurrency(sale.total)}</span>
                        </div>
                      </td>
                      <td className="text-end">
                        {formatCurrency(sale.discountType === 'percent' ? (sale.total * (sale.discount || 0) / 100) : (sale.discount || 0))}
                      </td>
                      <td className="text-center">
                        {getStatusBadge('paid')}
                      </td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <Calendar className="text-muted" />
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <ThreeDots />
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleViewSale(sale)}>
                                <Eye /> {t('viewDetails')}
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleEditSale(sale)}>
                                <Pencil /> {t('edit')}
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={() => handleDeleteSale(sale)}>
                                <Trash /> {t('delete')}
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          title={t('invoice')}
                          onClick={() => openInvoicePopup({ saleId: sale.id })}
                        >
                          <Invoice />
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

      {/* Edit Sale Modal */}
      {showEditModal && editingSale && (
        <EditSaleModal
          sale={editingSale}
          onClose={handleEditModalClose}
          onSave={handleEditModalSave}
        />
      )}

      {/* View Sale Modal */}
      {showViewModal && viewingSale && (
        <ViewSaleModal
          sale={viewingSale}
          onClose={handleViewModalClose}
        />
      )}
    </div>
  )
}

function EditSaleModal({ sale, onClose, onSave }) {
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()
  const [form, setForm] = useState({
    id: sale.id,
    patient: sale.Patient,
    agent: sale.SalesAgent,
    items: sale.SaleItems ? sale.SaleItems.map(i => ({ ...i })) : [],
    discount: sale.discount || 0,
    discountType: sale.discountType || 'fixed',
    total: sale.total,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }
  const handleItemChange = (idx, field, value) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }))
  }
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        id: form.id,
        patientId: form.patient?.id,
        salesAgentId: form.agent?.id,
        items: form.items,
        discount: form.discount,
        discountType: form.discountType,
        total: form.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) - (form.discountType === 'percent' ? (form.discount/100) * form.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) : form.discount),
      })
    } finally {
      setSaving(false)
    }
  }
  const handleDeleteItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }
  return (
    <Modal show onHide={onClose} size="lg" centered>
      <form onSubmit={handleSave}>
        <Modal.Header closeButton>
          <Modal.Title>{t('editSale')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">{t('customer')}</label>
              <input className="form-control" value={form.patient?.name || ''} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('salesAgent')}</label>
              <input className="form-control" value={form.agent?.name || ''} disabled />
            </div>
            <div className="col-12">
              <label className="form-label">{t('items')}</label>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>{t('product')}</th>
                      <th style={{ width: '18%' }}>{t('price')}</th>
                      <th style={{ width: '14%' }}>{t('quantity')}</th>
                      <th style={{ width: '18%' }}>{t('total')}</th>
                      <th style={{ width: '10%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => {
                      const name = item.Product?.name || item.productName || item.name || '—';
                      const isSupp = !!item.parentId;
                      return (
                        <tr key={item.id} style={isSupp ? { background: 'var(--bs-light)', color: '#666' } : {}}>
                          <td style={{ paddingLeft: isSupp ? 32 : 8 }}>
                            {isSupp ? <span className="text-muted small">↳ </span> : null}
                            {name}
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            <input type="number" className="form-control form-control-sm" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} style={{ maxWidth: 70 }} />
                          </td>
                          <td>{formatCurrency(item.price * item.quantity)}</td>
                          <td className="text-center">
                            <button type="button" className="btn btn-sm btn-outline-danger" title={t('delete')} onClick={() => handleDeleteItem(idx)}>
                              <Trash />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('discount')}</label>
              <div className="input-group">
                <input type="number" className="form-control" value={form.discount} min="0" onChange={e => handleChange('discount', Number(e.target.value))} />
                <select className="form-select" value={form.discountType} onChange={e => handleChange('discountType', e.target.value)}>
                  <option value="fixed">{t('fixed')}</option>
                  <option value="percent">{t('percent')}</option>
                </select>
              </div>
            </div>
            <div className="col-md-6 d-flex align-items-end justify-content-end">
              <div>
                <div className="fw-bold">{t('totalAmount')}: {formatCurrency(form.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) - (form.discountType === 'percent' ? (form.discount/100) * form.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) : form.discount))}</div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') : t('saveChanges') || 'Save Changes'}</button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

function ViewSaleModal({ sale, onClose }) {
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()
  if (!sale) return null;
  // Group items: parentId = null are parents, others are supplementary
  const parents = Array.isArray(sale.SaleItems) ? sale.SaleItems.filter(i => !i.supplementaryParentId) : [];
  const getSupps = (parentId) => Array.isArray(sale.SaleItems) ? sale.SaleItems.filter(i => i.supplementaryParentId === parentId) : [];
  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('saleDetails')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div><strong>{t('customer')}:</strong> {sale.Patient?.name || '—'}</div>
            <div><strong>{t('salesAgent')}:</strong> {sale.SalesAgent?.name || '—'}</div>
          </div>
          <div className="col-md-6">
            <div><strong>{t('cashier')}:</strong> {sale.Cashier?.name || '—'}</div>
            <div><strong>{t('saleDate')}:</strong> {new Date(sale.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>{t('productBundle')}</th>
                <th style={{ width: '15%' }}>{t('price')}</th>
                <th style={{ width: '15%' }}>{t('quantity')}</th>
                <th style={{ width: '20%' }}>{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {parents.map(parent => {
                const supplements = getSupps(parent.id);
                // Calculate combined price and total for parent + supplements
                const combinedPrice = parent.price + supplements.reduce((sum, supp) => sum + supp.price, 0);
                const combinedTotal = (parent.price * parent.quantity) + supplements.reduce((sum, supp) => sum + (supp.price * supp.quantity), 0);
                return (
                  <React.Fragment key={parent.id || parent.productName || parent.name}>
                    <tr>
                      <td className="fw-semibold">{parent.Product?.name || parent.productName || parent.name || '—'}</td>
                      <td>{formatCurrency(combinedPrice)}</td>
                      <td>{parent.quantity}</td>
                      <td>{formatCurrency(combinedTotal)}</td>
                    </tr>
                    {supplements.map(supp => (
                      <tr key={supp.id || supp.productName || supp.name} style={{ paddingTop: 0, paddingBottom: 0 }}>
                        <td style={{ paddingLeft: 32, paddingTop: 2, paddingBottom: 2 }}><span className="text-muted small">↳ </span>{supp.Product?.name || supp.productName || supp.name || '—'}</td>
                        <td style={{ paddingTop: 2, paddingBottom: 2 }}>{formatCurrency(supp.price)}</td>
                        <td style={{ paddingTop: 2, paddingBottom: 2 }}>{supp.quantity}</td>
                        <td style={{ paddingTop: 2, paddingBottom: 2 }}>{formatCurrency(supp.price * supp.quantity)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <div><strong>{t('discount')}:</strong> {sale.discount} {sale.discountType === 'percent' ? '%' : formatCurrency(sale.discount)}</div>
          </div>
          <div className="col-md-6 text-end">
            <div className="fw-bold">{t('totalAmount')}: {formatCurrency(sale.total)}</div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
      </Modal.Footer>
    </Modal>
  )
}

export default Sales 