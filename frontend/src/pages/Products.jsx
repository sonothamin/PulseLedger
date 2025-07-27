import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useCurrency } from '../hooks/useCurrency'
import { Plus, Search, Pencil, Trash, Tag, CurrencyDollar, Check2, Square, ChevronDown, ChevronRight, QuestionCircle } from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'
import { useAuth } from '../context/AuthHelpers'

const API_BASE = import.meta.env.VITE_API_BASE;

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', category: '', isSupplementary: false, supplementaryIds: [], isActive: true, canSellStandalone: true })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [filter, setFilter] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [expandedRows, setExpandedRows] = useState([])
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()
  const [csvImporting, setCsvImporting] = useState(false)
  const [showCsvInfo, setShowCsvInfo] = useState(false)
  const [hideInactive, setHideInactive] = useState(false)
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_BASE}/api/products`)
      setProducts(res.data)
      // Extract unique categories
      const uniqueCategories = [...new Set(res.data.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch {
      setError(t('failedToLoadProducts'))
    } finally {
      setLoading(false)
    }
  }, [t]);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, fetchProducts]);

  const openModal = (product = null) => {
    setEditing(product)
    setForm(product ? {
      ...product,
      supplementaryIds: (product.supplementaryIds || []).map(Number),
      isSupplementary: !!product.isSupplementary,
      isActive: product.isActive !== false,
      canSellStandalone: !!product.canSellStandalone
    } : { name: '', price: '', category: '', isSupplementary: false, supplementaryIds: [], isActive: true, canSellStandalone: false })
    setShowModal(true)
    setShowAddCategory(false)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ name: '', price: '', category: '', isSupplementary: false, supplementaryIds: [], isActive: true, canSellStandalone: false }); setNewCategory(''); setShowAddCategory(false) }

  const handleChange = e => {
    const { name, value, type, checked, options } = e.target
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }))
    } else if (type === 'select-multiple') {
      const vals = Array.from(options).filter(o => o.selected).map(o => o.value)
      setForm(f => ({ ...f, [name]: vals }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setForm(f => ({ ...f, category: newCategory.trim() }))
      setNewCategory('')
      setShowAddCategory(false)
    }
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, supplementaryIds: form.supplementaryIds.map(Number) }
      if (payload.isSupplementary) payload.supplementaryIds = []
      payload.canSellStandalone = !!form.canSellStandalone
      if (editing) {
        await axios.put(`${API_BASE}/api/products/${editing.id}`, payload)
        setToast(t('productUpdated'))
      } else {
        await axios.post(`${API_BASE}/api/products`, payload)
        setToast(t('productAdded'))
      }
      closeModal()
      fetchProducts()
    } catch {
      setToast(t('failedToSaveUser'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return
    try {
      await axios.delete(`${API_BASE}/api/products/${id}`)
      setToast(t('productDeleted'))
      fetchProducts()
    } catch {
      setToast(t('failedToSaveUser'))
    }
  }

  // Sorting and filtering logic
  const filteredProducts = products.filter(p =>
    (!hideInactive || p.isActive !== false) && (
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.category.toLowerCase().includes(filter.toLowerCase())
    )
  )
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let v1 = a[sortBy], v2 = b[sortBy]
    if (sortBy === 'price') { v1 = Number(v1); v2 = Number(v2) }
    if (sortBy === 'isSupplementary') { v1 = !!v1; v2 = !!v2 }
    if (sortBy === 'isActive') { v1 = a.isActive !== false; v2 = b.isActive !== false; }
    if (v1 < v2) return sortDir === 'asc' ? -1 : 1
    if (v1 > v2) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  const handleSort = col => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const toggleRow = (id) => {
    setExpandedRows(rows => rows.includes(id) ? rows.filter(r => r !== id) : [...rows, id])
  }

  // CSV Export
  const handleExportCSV = () => {
    if (!products.length) return
    const header = ['name', 'price', 'category', 'isSupplementary', 'supplementaryIds', 'canSellStandalone']
    const rows = products.map(p => [
      '"' + (p.name || '').replace(/"/g, '""') + '"',
      p.price,
      '"' + (p.category || '').replace(/"/g, '""') + '"',
      p.isSupplementary ? '1' : '0',
      (p.supplementaryIds || []).join(','),
      p.canSellStandalone ? '1' : '0'
    ])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSV Import
  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvImporting(true)
    setToast(t('importingProducts'))
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (!lines.length) throw new Error('Empty CSV')
      const [header, ...rows] = lines
      const cols = header.split(',')
      const nameIdx = cols.indexOf('name')
      const priceIdx = cols.indexOf('price')
      const categoryIdx = cols.indexOf('category')
      const isSuppIdx = cols.indexOf('isSupplementary')
      const suppIdsIdx = cols.indexOf('supplementaryIds')
      const canSellIdx = cols.indexOf('canSellStandalone')
      if (nameIdx < 0 || priceIdx < 0) throw new Error('Missing required columns')
      let importedCount = 0
      // First pass: create/update all products without supplementaryIds
      const productMap = {} // name -> id
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const vals = row.split(',')
        const product = {
          name: vals[nameIdx]?.replace(/^"|"$/g, ''),
          price: Number(vals[priceIdx]),
          category: vals[categoryIdx]?.replace(/^"|"$/g, '') || '',
          isSupplementary: vals[isSuppIdx] === '1',
          canSellStandalone: canSellIdx >= 0 ? vals[canSellIdx] === '1' : false
        }
        // Try to find if product with same name exists
        const existing = products.find(p => p.name === product.name)
        try {
          let res
          if (existing) {
            res = await axios.put(`${API_BASE}/api/products/${existing.id}`, product)
            productMap[product.name] = existing.id
          } else {
            res = await axios.post(`${API_BASE}/api/products`, product)
            productMap[product.name] = res.data.id
          }
          importedCount++
          setToast(t('importedProductsProgress', { count: importedCount, total: rows.length }))
        } catch (err) {
          setToast(t('errorImportingProduct', { product: product.name, error: err.response?.data?.message || err.message || err }))
        }
      }
      // Second pass: update supplementaryIds for all products
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const vals = row.split(',')
        const name = vals[nameIdx]?.replace(/^"|"$/g, '')
        const supplementaryIds = (vals[suppIdsIdx] || '').split(',').filter(Boolean).map(Number)
        if (supplementaryIds.length > 0) {
          const id = productMap[name]
          // Map supplementaryIds by name if possible
          // (Assume supplementaryIds in CSV are product names, not IDs, if needed)
          // If they are IDs, use as is
          await axios.put(`${API_BASE}/api/products/${id}`, { supplementaryIds })
        }
      }
      setToast(t('importedProducts', { count: importedCount, total: rows.length }))
      fetchProducts()
    } catch {
      setToast(t('failedToImportCSV'))
    } finally {
      setCsvImporting(false)
      e.target.value = ''
    }
  }

  // Helper for supplementary product filtering
  function getSupplementaryProducts(products, editingId) {
    return products.filter(p => p.isSupplementary && (!editingId || p.id !== editingId));
  }

  // Add Escape key support for modals
  useEffect(() => {
    if (!showModal && !showCsvInfo) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showModal) closeModal();
        if (showCsvInfo) setShowCsvInfo(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal, showCsvInfo]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{t('productsTitle')}</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal()}>
          <Plus /> {t('newProduct')}
        </button>
      </div>
      {/* CSV Import/Export Group */}
      <div className="mb-3">
        <div className="input-group" style={{ maxWidth: 500 }}>
          {/* Import CSV as button-like label */}
          <label className="btn btn-outline-secondary mb-0" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
            {t('import')}
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} disabled={csvImporting} />
          </label>
          {/* Export CSV */}
          <button className="btn btn-outline-secondary" type="button" onClick={handleExportCSV} disabled={!products.length} style={{ borderRadius: 0 }}>
            {t('export')}
          </button>
          {/* Info button */}
          <button className="btn btn-outline-secondary" type="button" title={t('csvInfo')} onClick={() => setShowCsvInfo(true)} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
            <QuestionCircle size={20} />
          </button>
        </div>
      </div>
      {/* CSV Info Modal */}
      {showCsvInfo && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('csvImportExportInfo')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCsvInfo(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>{t('thisFeatureAllowsYouToImportOrExportProductsInCSVFormat')}</p>
                <h6>{t('csvFormat')}</h6>
                <pre className="bg-body-secondary p-3 rounded border">
name,price,category,isSupplementary,supplementaryIds,canSellStandalone
"Paracetamol",10,Medicine,0,,0
"IV Set",50,Consumable,1,,1
"IV Drip",100,Consumable,0,2,0
                </pre>
                <ul>
                  <li>{t('supplementaryIDsMustReferToExistingProductIDs')}</li>
                  <li>{t('allFieldsAreCaseSensitive')}</li>
                  <li>{t('importingWillAddNewProductsDuplicatesMayOccurIfNamesIDsOverlap')}</li>
                </ul>
                <h6>{t('howToImport')}</h6>
                <ul>
                  <li>Click the file input and select a CSV file matching the above format.</li>
                  <li>Products will be imported and added to the list.</li>
                </ul>
                <h6>{t('howToExport')}</h6>
                <ul>
                  <li>Click the Export CSV button to download all products as a CSV file.</li>
                </ul>
                <h6>{t('notes')}</h6>
                <ul>
                  <li>Supplementary IDs must refer to existing product IDs.</li>
                  <li>All fields are case-sensitive.</li>
                  <li>Importing will add new products; duplicates may occur if names/IDs overlap.</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCsvInfo(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mb-3 d-flex align-items-center gap-3">
        <div className="input-group" style={{ maxWidth: 350 }}>
          <span className="input-group-text">
            <Search />
          </span>
          <input 
            className="form-control" 
            placeholder={t('search')} 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
          />
        </div>
        <button
          className={`btn btn-sm ${hideInactive ? 'btn-primary' : 'btn-outline-secondary'}`}
          type="button"
          onClick={() => setHideInactive(v => !v)}
          style={{ minWidth: 120 }}
        >
          {hideInactive ? t('showInactive') || 'Show Inactive' : t('hideInactive') || 'Hide Inactive'}
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        sortedProducts.length === 0 ? <div className="alert alert-info">{t('noData')}</div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle" role="table">
              <thead>
                <tr role="row">
                  <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('name')} role="columnheader" scope="col">
                    {t('productName')} {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('price')} role="columnheader" scope="col">
                    {t('productPrice')} {sortBy === 'price' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('category')} role="columnheader" scope="col">
                    {t('productCategory')} {sortBy === 'category' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('isSupplementary')} title={t('supplementary')} role="columnheader" scope="col">
                    <span role="img" aria-label={t('supplementary')}>🧩</span> {sortBy === 'isSupplementary' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="text-center" style={{ width: 90, cursor: 'pointer' }} onClick={() => handleSort('isActive')} role="columnheader" scope="col">
                    {t('status') || 'Status'} {sortBy === 'isActive' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="text-center" style={{ width: 120 }} role="columnheader" scope="col">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map(p => {
                  const hasSupps = p.supplementaryIds && p.supplementaryIds.length > 0
                  return [
                  <tr key={p.id} role="row">
                      <td scope="row" role="cell">
                        {hasSupps && (
                          <button className="btn btn-sm btn-link p-0 me-2" onClick={() => toggleRow(p.id)} aria-label={expandedRows.includes(p.id) ? t('collapse') : t('expand')} aria-expanded={expandedRows.includes(p.id)}>
                            {expandedRows.includes(p.id) ? <ChevronDown /> : <ChevronRight />}
                          </button>
                        )}
                        {p.name}
                      </td>
                    <td role="cell">{formatCurrency(p.price)}</td>
                    <td role="cell">{p.category}</td>
                    <td className="text-center" role="cell">{p.isSupplementary ? <Check2 className="text-success" /> : <Square className="text-secondary" />}</td>
                    <td className="text-center" role="cell">
                      <span className={`badge ${p.isActive !== false ? 'bg-success' : 'bg-danger'}`}>{p.isActive !== false ? t('active') : t('inactive')}</span>
                    </td>
                    <td role="cell">
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id={`productActions${p.id}`} data-bs-toggle="dropdown" aria-expanded="false" aria-label={t('actions')}>
                          {t('actions')}
                        </button>
                        <ul className="dropdown-menu" aria-labelledby={`productActions${p.id}`} role="menu">
                          <li><button className="dropdown-item" type="button" onClick={() => openModal(p)} role="menuitem">{t('edit')}</button></li>
                          <li><button className="dropdown-item text-danger" type="button" onClick={() => handleDelete(p.id)} role="menuitem">{t('delete')}</button></li>
                        </ul>
                      </div>
                      </td>
                    </tr>,
                    hasSupps && expandedRows.includes(p.id) && (
                      <tr key={`supps-${p.id}`} role="row">
                        <td colSpan={5} style={{ fontSize: '0.95em', paddingLeft: '2.5rem', background: 'var(--bs-table-bg)', color: 'var(--bs-table-color)' }} role="cell">
                          <div className="fw-semibold mb-2" style={{ fontSize: '1em' }}>{t('supplementary')}</div>
                          <ul className="mb-0 ps-3" style={{ fontSize: '0.95em' }}>
                            {p.supplementaryIds.map(sid => {
                              const supp = products.find(prod => prod.id === sid)
                              return supp ? (
                                <li key={sid} style={{ marginBottom: 2 }}>{supp.name} <span className="text-muted small">({formatCurrency(supp.price)})</span></li>
                              ) : null
                            })}
                          </ul>
                    </td>
                  </tr>
                    )
                  ]
                })}
              </tbody>
            </table>
          </div>
        )
      )}
      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="productModalTitle" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title" id="productModalTitle">{t(editing ? 'edit' : 'add')} {t('product')}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="productNameInput">{t('productName')}</label>
                      <div className="input-group">
                        <input className="form-control" id="productNameInput" name="name" required value={form.name} onChange={handleChange} />
                        <span className="input-group-text">
                          <Tag />
                        </span>
                      </div>
                      <div className="form-check mt-2">
                        <input className="form-check-input" type="checkbox" id="productActiveCheck" name="isActive" checked={form.isActive !== false} onChange={handleChange} />
                        <label className="form-check-label small" htmlFor="productActiveCheck">{t('active')}</label>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="productPriceInput">{t('productPrice')}</label>
                      <div className="input-group">
                        <input className="form-control" id="productPriceInput" name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} />
                        <span className="input-group-text">
                          <CurrencyDollar />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="productCategoryInput">{t('productCategory')}</label>
                      <div className="d-flex gap-2">
                        <select className="form-select" id="productCategoryInput" name="category" value={form.category} onChange={handleChange}>
                          <option value="">{t('selectCategory')}</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddCategory(v => !v)}>{t('addCategory')}</button>
                      </div>
                      {showAddCategory && (
                        <div className="mt-2">
                          <div className="input-group">
                            <input
                              id="newCategoryInput"
                              className="form-control"
                              placeholder={t('enterCategoryName')}
                              value={newCategory}
                              onChange={e => setNewCategory(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                            />
                            <button type="button" className="btn btn-outline-primary" onClick={addCategory}>{t('add')}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <hr />
                <div className="mb-3 form-check">
                  <input className="form-check-input" type="checkbox" name="isSupplementary" id="isSupplementaryCheck" checked={form.isSupplementary} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="isSupplementaryCheck">{t('thisIsASupplementaryProduct')}</label>
                </div>
                {form.isSupplementary && (
                  <div className="mb-3 form-check ms-3">
                    <input className="form-check-input" type="checkbox" name="canSellStandalone" id="canSellStandaloneCheck" checked={form.canSellStandalone} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="canSellStandaloneCheck">Allow this supplementary product to be sold standalone</label>
                  </div>
                )}
                <div className={`mb-3 ${form.isSupplementary ? 'collapse' : ''}`} style={{ transition: 'all 0.3s ease' }}>
                  <label className="form-label">{t('bundleSupplementaryProducts')}</label>
                  <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {getSupplementaryProducts(products, editing?.id).length === 0 ? (
                      <p className="text-muted mb-0">{t('noSupplementaryProductsAvailable')}</p>
                    ) : (
                      getSupplementaryProducts(products, editing?.id).map(p => (
                        <div key={p.id} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`supplementary-${p.id}`}
                            value={p.id}
                            checked={form.supplementaryIds.includes(p.id)}
                            onChange={(e) => {
                              const value = Number(e.target.value)
                              const checked = e.target.checked
                              setForm(prev => ({
                                ...prev,
                                supplementaryIds: checked
                                  ? [...prev.supplementaryIds, value]
                                  : prev.supplementaryIds.filter(id => id !== value)
                              }))
                            }}
                          />
                          <label className="form-check-label" htmlFor={`supplementary-${p.id}`}>
                            {p.name} - {formatCurrency(p.price)}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="form-text">{t('selectSupplementaryProducts')}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className="toast-header"><strong className="me-auto">{t('products')}</strong><button type="button" className="btn-close" onClick={() => setToast('')}></button></div>
          <div className="toast-body">{toast}</div>
        </div>
      )}
    </div>
  )
}

export default Products 