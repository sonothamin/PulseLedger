import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Search, Filter, Calendar, Person, Activity, Eye, Download, ArrowClockwise, Clock, PersonCircle, FileText, ArrowUp, ArrowDown, Trash } from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'




function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterOptions, setFilterOptions] = useState({ actions: [], contexts: [], users: [] })
  const [filterOptionsError, setFilterOptionsError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    context: '',
    userId: '',
    startDate: '',
    endDate: ''
  })
  const [sorting, setSorting] = useState({
    field: 'createdAt',
    direction: 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [toast, setToast] = useState('')

  const { t } = useTranslations();

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        sortBy: sorting.field,
        sortOrder: sorting.direction,
        ...filters
      })
      
      const res = await axios.get(`/api/audit-logs?${params}`)
      let logs = Array.isArray(res.data.logs) ? res.data.logs : [];
      if (!Array.isArray(res.data.logs)) {
        console.warn('[AuditLogs] API returned logs as', res.data.logs, 'defaulting to empty array.');
      }
      
      // Apply frontend search filter for details since backend JSON search is limited
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        logs = logs.filter(log => {
          // Search in action
          if (log.action.toLowerCase().includes(searchTerm)) return true
          
          // Search in details description
          if (log.details?.description?.toLowerCase().includes(searchTerm)) return true
          
          // Search in details for expense-specific fields
          if (log.details?.amount?.toString().includes(searchTerm)) return true
          if (log.details?.recipient?.toLowerCase().includes(searchTerm)) return true
          if (log.details?.name?.toLowerCase().includes(searchTerm)) return true
          
          // Search in user name
          if (log.User?.name?.toLowerCase().includes(searchTerm)) return true
          if (log.User?.username?.toLowerCase().includes(searchTerm)) return true
          
          return false
        })
      }
      
      setLogs(logs)
      if (res.data && res.data.pagination && typeof res.data.pagination.limit !== 'undefined') {
        setPagination(res.data.pagination)
      } else {
        setPagination({ page: 1, limit: 50, total: 0, pages: 0 })
        setError('Malformed pagination data from server.')
      }
    } catch (err) {
      setError('Failed to load audit logs')
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit, sorting.direction, sorting.field]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get('/api/audit-logs/filter-options')
      setFilterOptions(res.data)
    } catch (err) {
      console.error('Failed to fetch filter options:', err)
      // Set empty defaults to prevent further errors
      setFilterOptions({ actions: [], contexts: [], users: [] })
      setFilterOptionsError('Failed to load filter options. Some filtering options may not be available.')
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchFilterOptions()
  }, [fetchLogs])

  useEffect(() => {
    fetchLogs(1)
  }, [filters, sorting, fetchLogs])

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getSortIcon = (field) => {
    if (sorting.field !== field) {
      return <ArrowUp className="text-muted" />
    }
    return sorting.direction === 'asc' ? <ArrowUp /> : <ArrowDown />
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
    fetchLogs(page)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      context: '',
      userId: '',
      startDate: '',
      endDate: ''
    })
  }

  const viewLogDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionColor = (action) => {
    if (action.includes('create')) return 'success'
    if (action.includes('update')) return 'primary'
    if (action.includes('delete')) return 'danger'
    if (action.includes('login')) return 'info'
    if (action.includes('logout')) return 'secondary'
    return 'warning'
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        sortBy: sorting.field,
        sortOrder: sorting.direction,
        limit: 10000 // Export all filtered results
      })
      
      const res = await axios.get(`/api/audit-logs?${params}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Failed to export logs:', err)
    }
  }

  const deleteAllLogs = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL audit logs? This action cannot be undone and will permanently remove all audit history.'
    )
    
    if (!confirmed) return
    
    try {
      await axios.delete('/api/audit-logs/delete-all')
      setToast('All audit logs deleted successfully')
      fetchLogs(1) // Refresh the list
    } catch (err) {
      console.error('Failed to delete all logs:', err)
      setToast(err.response?.data?.message || 'Failed to delete all audit logs')
    }
  }

  // Defensive: ensure logs is always an array
  const safeLogs = Array.isArray(logs) ? logs : (console.warn('[AuditLogs] logs is not an array:', logs), []);
  // Defensive: ensure pagination is an object with required fields
  const safePagination = pagination && typeof pagination === 'object' && typeof pagination.page !== 'undefined' && typeof pagination.limit !== 'undefined' && typeof pagination.total !== 'undefined' ? pagination : { page: 1, limit: 50, total: 0, pages: 0 };

  if (loading && safeLogs.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" />
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {toast}
          <button type="button" className="btn-close" onClick={() => setToast('')}></button>
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Audit Logs</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2" 
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
          >
            <ArrowClockwise className={loading ? 'spinner-border spinner-border-sm' : ''} />
            Refresh
          </button>
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2" 
            onClick={exportLogs}
          >
            <Download />
            Export
          </button>
                      <button 
              className="btn btn-outline-danger d-flex align-items-center gap-2" 
              onClick={deleteAllLogs}
            >
              <Trash />
              Delete All
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <Search />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search actions or details..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                {filterOptions.actions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.context}
                onChange={(e) => handleFilterChange('context', e.target.value)}
              >
                <option value="">All Contexts</option>
                {filterOptions.contexts.map(context => (
                  <option key={context.value} value={context.value}>
                    {context.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <option value="">All Users</option>
                {filterOptions.users.map(user => (
                  <option key={user.value} value={user.value}>
                    {user.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="col-md-1">
              <button 
                className="btn btn-outline-secondary w-100" 
                onClick={clearFilters}
                title="Clear all filters"
              >
                <Filter />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {filterOptionsError && (
            <div className="alert alert-danger" role="alert">
              {filterOptionsError}
            </div>
          )}
          
          {safeLogs.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <p className="text-muted">{t('noAuditLogsFound')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th 
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => handleSort('action')}
                      className="sortable-header"
                    >
                      Action
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                        {getSortIcon('action')}
                      </span>
                    </th>
                    <th 
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => handleSort('userId')}
                      className="sortable-header"
                    >
                      User
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                        {getSortIcon('userId')}
                      </span>
                    </th>
                    <th 
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => handleSort('context')}
                      className="sortable-header"
                    >
                      Context
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                        {getSortIcon('context')}
                      </span>
                    </th>
                    <th>Details</th>
                    <th 
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => handleSort('createdAt')}
                      className="sortable-header"
                    >
                      Date
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                        {getSortIcon('createdAt')}
                      </span>
                    </th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge bg-${getActionColor(log.action)}`}>
                          {log.details?.friendlyAction || log.action}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <PersonCircle className="text-secondary" />
                          <span>{log.User?.name || log.User?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">
                          {log.details?.friendlyContext || log.details?.context || 'System'}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: 200 }}>
                          {(() => {
                            // Show specific details for expense actions
                            if (log.action.startsWith('expense:') && log.details) {
                              const details = log.details;
                              if (details.amount && details.recipient) {
                                return `$${details.amount} - ${details.recipient}`;
                              } else if (details.amount) {
                                return `$${details.amount}`;
                              } else if (details.recipient) {
                                return details.recipient;
                              }
                            }
                            // Show specific details for expense category actions
                            if (log.action.startsWith('expense_category:') && log.details) {
                              const details = log.details;
                              if (details.name) {
                                return details.name;
                              }
                            }
                            // Default fallback
                            return log.details?.description || 'No additional details';
                          })()}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Clock className="text-secondary" />
                          <span className="small">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => viewLogDetails(log)}
                          title="View details"
                        >
                          <Eye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {safePagination.pages > 1 && (
            <nav aria-label="Audit logs pagination" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${safePagination.page === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(safePagination.page - 1)}
                    disabled={safePagination.page === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: Math.min(5, safePagination.pages) }, (_, i) => {
                  const page = Math.max(1, Math.min(safePagination.pages - 4, safePagination.page - 2)) + i
                  return (
                    <li key={page} className={`page-item ${page === safePagination.page ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  )
                })}
                
                <li className={`page-item ${safePagination.page === safePagination.pages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(safePagination.page + 1)}
                    disabled={safePagination.page === safePagination.pages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Results summary */}
          <div className="text-center text-muted small mt-3">
            {safePagination && typeof safePagination.limit !== 'undefined' && typeof safePagination.page !== 'undefined' && typeof safePagination.total !== 'undefined' ? (
              t('showingAuditLogs', {
                from: ((safePagination.page - 1) * safePagination.limit) + 1,
                to: Math.min(safePagination.page * safePagination.limit, safePagination.total),
                total: safePagination.total
              })
            ) : (
              'Pagination info unavailable.'
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Audit Log Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailsModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Basic Information</h6>
                    <dl className="row">
                      <dt className="col-sm-4">Action:</dt>
                      <dd className="col-sm-8">
                        <span className={`badge bg-${getActionColor(selectedLog.action)}`}>
                          {selectedLog.details?.friendlyAction || selectedLog.action}
                        </span>
                      </dd>
                      
                      <dt className="col-sm-4">User:</dt>
                      <dd className="col-sm-8">{selectedLog.User?.name || selectedLog.User?.username || 'Unknown'}</dd>
                      
                      <dt className="col-sm-4">Context:</dt>
                      <dd className="col-sm-8">{selectedLog.details?.friendlyContext || selectedLog.details?.context || 'System'}</dd>
                      
                      <dt className="col-sm-4">Date:</dt>
                      <dd className="col-sm-8">{formatDate(selectedLog.createdAt)}</dd>
                    </dl>
                  </div>
                  <div className="col-md-6">
                    <h6>Resource Information</h6>
                    <dl className="row">
                      <dt className="col-sm-4">Resource Type:</dt>
                      <dd className="col-sm-8">{selectedLog.details?.resourceType || 'N/A'}</dd>
                      
                      <dt className="col-sm-4">Resource ID:</dt>
                      <dd className="col-sm-8">{selectedLog.details?.resourceId || 'N/A'}</dd>
                      
                      <dt className="col-sm-4">IP Address:</dt>
                      <dd className="col-sm-8">{selectedLog.details?.ipAddress || 'N/A'}</dd>
                      
                      <dt className="col-sm-4">User Agent:</dt>
                      <dd className="col-sm-8">
                        <small className="text-muted">
                          {selectedLog.details?.userAgent || 'N/A'}
                        </small>
                      </dd>
                    </dl>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="accordion" id="auditLogDetailsAccordion">
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="detailsHeading">
                        <button 
                          className="accordion-button collapsed" 
                          type="button" 
                          data-bs-toggle="collapse" 
                          data-bs-target="#detailsCollapse" 
                          aria-expanded="false" 
                          aria-controls="detailsCollapse"
                        >
                          Additional Details
                        </button>
                      </h2>
                      <div 
                        id="detailsCollapse" 
                        className="accordion-collapse collapse" 
                        aria-labelledby="detailsHeading" 
                        data-bs-parent="#auditLogDetailsAccordion"
                      >
                        <div className="accordion-body">
                          <pre className="bg-body-secondary p-3 rounded border" style={{ fontSize: '0.875rem' }}>
                            {JSON.stringify(selectedLog.details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .sortable-header {
          transition: background-color 0.2s ease;
          padding-right: 30px !important;
        }
        .sortable-header:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        .sortable-header:active {
          background-color: rgba(0, 0, 0, 0.1) !important;
        }
        [data-bs-theme="dark"] .sortable-header:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        [data-bs-theme="dark"] .sortable-header:active {
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
        .table th {
          vertical-align: middle;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

export default AuditLogs 