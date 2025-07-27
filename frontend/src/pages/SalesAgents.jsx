import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Plus, Search, Filter, Pencil, Trash, BarChart, Person, Envelope, Phone, CheckCircle, XCircle } from 'react-bootstrap-icons'
import Chart from 'chart.js/auto'
import { useTranslations } from '../hooks/useTranslations'
import { useCurrency } from '../hooks/useCurrency'




function SalesAgents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [summary, setSummary] = useState({ total: 0, active: 0, totalSales: 0 })
  const [performance, setPerformance] = useState({ byAgent: {}, sales: [] })
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  // Fetch agents
  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sales-agents')
      setAgents(res.data)
      // Summary
      setSummary({
        total: res.data.length,
        active: res.data.filter(a => a.isActive).length,
        totalSales: null // will be set after fetching performance
      })
    } catch {
      setToast('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  // Fetch agent performance
  const fetchPerformance = async () => {
    try {
      const res = await axios.get('/api/reports/agent-performance')
      setPerformance(res.data)
      // Set total sales by agents
      const totalSales = Object.values(res.data.byAgent || {}).reduce((a, b) => a + b, 0)
      setSummary(s => ({ ...s, totalSales }))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchAgents()
    fetchPerformance()
  }, [])

  // Chart.js bar graph
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()
    const labels = Object.keys(performance.byAgent || {})
    const data = Object.values(performance.byAgent || {})
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: t('totalSales'),
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
  }, [performance, t])

  const openModal = (agent = null) => {
    setEditing(agent)
    setForm(agent ? { ...agent } : { name: '', phone: '', email: '', isActive: true })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ name: '', phone: '', email: '', isActive: true }) }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name) { setToast('Name is required'); return }
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`/api/sales-agents/${editing.id}`, form)
        setToast('Agent updated')
      } else {
        await axios.post('/api/sales-agents', form)
        setToast('Agent added')
      }
      closeModal()
      fetchAgents()
      fetchPerformance()
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this agent?')) return
    try {
      await axios.delete(`/api/sales-agents/${id}`)
      setToast('Agent deleted')
      fetchAgents()
      fetchPerformance()
    } catch {
      setToast('Failed to delete agent')
    }
  }

  // Sorting logic
  const handleSort = col => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  // Sorting and filtering
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (agent.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let v1, v2
    switch (sortBy) {
      case 'name':
        v1 = a.name.toLowerCase(); v2 = b.name.toLowerCase(); break
      case 'sales': {
        const salesA = (performance.sales || []).filter(s => s.salesAgentId === a.id).length
        const salesB = (performance.sales || []).filter(s => s.salesAgentId === b.id).length
        v1 = salesA; v2 = salesB; break
      }
      case 'total': {
        const totalA = (performance.sales || []).filter(s => s.salesAgentId === a.id).reduce((sum, s) => sum + (s.total || 0), 0)
        const totalB = (performance.sales || []).filter(s => s.salesAgentId === b.id).reduce((sum, s) => sum + (s.total || 0), 0)
        v1 = totalA; v2 = totalB; break
      }
      case 'performance': {
        // Sort by position (rank)
        const agentTotals = agents.map(ag => ({
          id: ag.id,
          total: (performance.sales || []).filter(s => s.salesAgentId === ag.id).reduce((sum, s) => sum + (s.total || 0), 0)
        })).sort((a, b) => b.total - a.total).map(ag => ag.id)
        v1 = agentTotals.indexOf(a.id); v2 = agentTotals.indexOf(b.id); break
      }
      case 'status':
        v1 = a.isActive ? 1 : 0; v2 = b.isActive ? 1 : 0; break
      default:
        v1 = a[sortBy]; v2 = b[sortBy]
    }
    if (v1 < v2) return sortDir === 'asc' ? -1 : 1
    if (v1 > v2) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" />
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t('salesAgentsTitle') || 'Sales Agents'}</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal()}>
          <Plus /> {t('newAgent') || 'New Agent'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-md-6">
          <div className="row g-3">
            <div className="col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                    <Person className="text-primary" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">{t('totalAgents') || 'Total Agents'}</h6>
                    <h4 className="mb-0">{summary.total}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                    <CheckCircle className="text-success" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">{t('activeAgents') || 'Active Agents'}</h6>
                    <h4 className="mb-0">{summary.active}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                    <BarChart className="text-info" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">{t('total') || 'Total'}</h6>
                    <h4 className="mb-0">{formatCurrency(summary.totalSales !== null ? summary.totalSales : 0)}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-secondary bg-opacity-10 p-3 rounded me-3">
                    <Person className="text-secondary" size={24} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">{t('inactiveAgents') || 'Inactive Agents'}</h6>
                    <h4 className="mb-0">{summary.total - summary.active}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 d-flex flex-column justify-content-between">
          <div className="card h-100 mb-0">
            <div className="card-header bg-transparent">
              <h5 className="mb-0">{t('agentPerformance') || 'Agent Performance'}</h5>
            </div>
            <div className="card-body">
              <canvas ref={chartRef} height={80} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <Search />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('search') || 'Search'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <Filter /> {t('filter') || 'Filter'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="card">
        <div className="card-body">
          {sortedAgents.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('noData') || 'No data'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                      {t('name') || 'Name'} {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sales')}>
                      {t('sales') || 'Sales'} {sortBy === 'sales' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total')}>
                      {t('total') || 'Total'} {sortBy === 'total' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('performance')}>
                      {t('performance') || 'Performance'} {sortBy === 'performance' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                      {t('status') || 'Status'} {sortBy === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="text-end">{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.map(agent => {
                    // Get sales and total for this agent
                    const salesCount = (performance.sales || []).filter(s => s.salesAgentId === agent.id).length
                    const totalAmount = (performance.sales || []).filter(s => s.salesAgentId === agent.id).reduce((sum, s) => sum + (s.total || 0), 0)
                    // Get sorted agent IDs by total sales
                    const agentTotals = agents.map(a => ({
                      id: a.id,
                      total: (performance.sales || []).filter(s => s.salesAgentId === a.id).reduce((sum, s) => sum + (s.total || 0), 0)
                    }))
                    .sort((a, b) => b.total - a.total)
                    .map(a => a.id)
                    const position = agentTotals.indexOf(agent.id) + 1
                    const ordinal = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th'
                    return (
                      <tr key={agent.id}>
                        <td>{agent.name}</td>
                        <td>{salesCount}</td>
                        <td>{formatCurrency(totalAmount)}</td>
                        <td>{salesCount > 0 ? ordinal(position) : '-'}</td>
                        <td>{agent.isActive ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openModal(agent)}><Pencil /></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(agent.id)}><Trash /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog" role="document">
            <form className="modal-content" onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit Agent' : 'Add Agent'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label mb-1">Name</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Person /></span>
                    <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required placeholder="Full name" autoFocus />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Email</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Envelope /></span>
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="Email address" />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Phone</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Phone /></span>
                    <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                    <div className="input-group-text bg-transparent border-0 ps-2">
                      <input className="form-check-input mt-0" type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="isActiveCheck" style={{ marginRight: 4 }} />
                      <label className="form-check-label small" htmlFor="isActiveCheck" style={{ marginLeft: 2, userSelect: 'none' }}>Active</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast show position-fixed bottom-0 end-0 m-3" style={{ zIndex: 9999 }}>
          <div className="toast-header">
            <strong className="me-auto">Info</strong>
            <button type="button" className="btn-close" onClick={() => setToast('')}></button>
          </div>
          <div className="toast-body">{toast}</div>
        </div>
      )}
    </div>
  )
}

export default SalesAgents 