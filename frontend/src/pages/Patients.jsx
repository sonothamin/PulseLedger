import { useEffect, useState } from 'react'
import axios from 'axios'
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
  People,
  Phone,
  Envelope,
  GeoAlt,
  GenderMale,
  GenderFemale,
  GenderTrans,
  Hash,
  ArrowUp,
  ArrowDown
} from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'
import Toast from '../components/Toast'


function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ 
    name: '', 
    age: '', 
    gender: '', 
    phone: '', 
    email: '', 
    address: '', 
    isActive: true 
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('info')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')
  const { t } = useTranslations()

  const fetchPatients = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/patients')
      setPatients(res.data)
    } catch (err) {
      console.error('Failed to fetch patients:', err)
      setError('Failed to load patients data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const openModal = (patient = null) => {
    setEditing(patient)
    setForm(patient ? { ...patient } : { 
      name: '', 
      age: '', 
      gender: '', 
      phone: '', 
      email: '', 
      address: '', 
      isActive: true 
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm({ 
      name: '', 
      age: '', 
      gender: '', 
      phone: '', 
      email: '', 
      address: '', 
      isActive: true 
    })
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ 
      ...f, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const showToast = (message, type = 'info') => {
    setToast(message)
    setToastType(type)
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`/api/patients/${editing.id}`, form)
        showToast('Patient updated successfully', 'success')
      } else {
        await axios.post('/api/patients', form)
        showToast('Patient added successfully', 'success')
      }
      closeModal()
      fetchPatients()
    } catch (err) {
      console.error('Save error:', err)
      showToast(err.response?.data?.message || 'Failed to save patient', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this patient?')) return
    try {
      await axios.delete(`/api/patients/${id}`)
      showToast('Patient deleted successfully', 'success')
      fetchPatients()
    } catch {
      showToast('Failed to delete patient', 'error')
    }
  }

  const getGenderIcon = (gender) => {
    return gender === 'male' ? <GenderMale className="text-primary" /> : <GenderFemale className="text-danger" />
  }

  // Sorting functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUp className="text-muted opacity-50" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="text-primary" /> : <ArrowDown className="text-primary" />
  }

  const sortPatients = (patients) => {
    return [...patients].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // Convert to string for comparison
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
  }

  // Filtering logic
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    let matchesGender = true;
    if (selectedGender === 'male' || selectedGender === 'female' || selectedGender === 'other') {
      matchesGender = patient.gender === selectedGender;
    }
    const matchesStatus = selectedStatus === '' || 
                         (selectedStatus === 'active' && patient.isActive) ||
                         (selectedStatus === 'inactive' && !patient.isActive)
    return matchesSearch && matchesGender && matchesStatus
  })

  // Apply sorting to filtered patients
  const sortedPatients = sortPatients(filteredPatients)

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
        <h2>{t('patientsTitle')}</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal()}>
          <Plus /> {t('newPatient')}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <Search />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-center justify-content-start" style={{ minWidth: 0 }}>
              <div className="btn-group" role="group" aria-label="Gender filter" style={{ minWidth: 0 }}>
                <input type="radio" className="btn-check" name="gender-filter" id="gender-all" autoComplete="off"
                  checked={selectedGender === ''}
                  onChange={() => setSelectedGender('')}
                />
                <label className={`btn btn-outline-secondary px-2 py-1${selectedGender === '' ? ' active' : ''}`} htmlFor="gender-all" title={t('allGenders')} style={{ fontSize: 18, minWidth: 32 }}>
                  <People />
                </label>
                <input type="radio" className="btn-check" name="gender-filter" id="gender-male" autoComplete="off"
                  checked={selectedGender === 'male'}
                  onChange={() => setSelectedGender('male')}
                />
                <label className={`btn btn-outline-secondary px-2 py-1${selectedGender === 'male' ? ' active' : ''}`} htmlFor="gender-male" title={t('male')} style={{ fontSize: 18, minWidth: 32 }}>
                  <GenderMale />
                </label>
                <input type="radio" className="btn-check" name="gender-filter" id="gender-female" autoComplete="off"
                  checked={selectedGender === 'female'}
                  onChange={() => setSelectedGender('female')}
                />
                <label className={`btn btn-outline-secondary px-2 py-1${selectedGender === 'female' ? ' active' : ''}`} htmlFor="gender-female" title={t('female')} style={{ fontSize: 18, minWidth: 32 }}>
                  <GenderFemale />
                </label>
                <input type="radio" className="btn-check" name="gender-filter" id="gender-other" autoComplete="off"
                  checked={selectedGender === 'other'}
                  onChange={() => setSelectedGender('other')}
                />
                <label className={`btn btn-outline-secondary px-2 py-1${selectedGender === 'other' ? ' active' : ''}`} htmlFor="gender-other" title={t('other')} style={{ fontSize: 18, minWidth: 32 }}>
                  <GenderTrans />
                </label>
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">{t('allStatuses')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <Filter /> {t('filter')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="card-body">
          {sortedPatients.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('noData')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th 
                      className="text-center cursor-pointer" 
                      onClick={() => handleSort('id')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        {t('patientId')}
                        {getSortIcon('id')}
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-1">
                        {t('patientName')}
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="text-center cursor-pointer" 
                      onClick={() => handleSort('age')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        {t('age')}
                        {getSortIcon('age')}
                      </div>
                    </th>
                    <th 
                      className="text-center cursor-pointer" 
                      onClick={() => handleSort('gender')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        {t('gender')}
                        {getSortIcon('gender')}
                      </div>
                    </th>
                    <th>{t('contact')}</th>
                    <th>{t('address')}</th>
                    <th 
                      className="text-center cursor-pointer" 
                      onClick={() => handleSort('isActive')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        {t('status')}
                        {getSortIcon('isActive')}
                      </div>
                    </th>
                    <th className="text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map(patient => (
                    <tr key={patient.id}>
                      <td className="text-center">
                        <span className="fw-semibold">{patient.id}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Person className="text-muted" />
                          {patient.name}
                        </div>
                      </td>
                      <td className="text-center">
                        {patient.age ? (
                          <span className="fw-semibold">{patient.age}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        {patient.gender ? (
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {getGenderIcon(patient.gender)}
                            <span className="text-capitalize">{patient.gender}</span>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {patient.phone && (
                            <div className="d-flex align-items-center gap-1">
                              <Phone className="text-muted" />
                              <small>{patient.phone}</small>
                            </div>
                          )}
                          {patient.email && (
                            <div className="d-flex align-items-center gap-1">
                              <Envelope className="text-muted" />
                              <small>{patient.email}</small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {patient.address ? (
                          <div className="d-flex align-items-center gap-1">
                            <GeoAlt className="text-muted" />
                            <small className="text-truncate" style={{ maxWidth: '150px' }} title={patient.address}>
                              {patient.address}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${patient.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {patient.isActive ? t('active') : t('inactive')}
                        </span>
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
                                onClick={() => openModal(patient)}
                              >
                                <Pencil /> {t('edit')}
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                                onClick={() => handleDelete(patient.id)}
                              >
                                <Trash /> {t('delete')}
                              </button>
                            </li>
                          </ul>
                        </div>
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
              <h4 className="text-primary mb-1">{sortedPatients.length}</h4>
              <p className="text-muted mb-0">{t('totalPatients')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-success mb-1">
                {sortedPatients.filter(p => p.isActive).length}
              </h4>
              <p className="text-muted mb-0">{t('activePatients')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-info mb-1">
                {sortedPatients.filter(p => p.gender === 'male').length}
              </h4>
              <p className="text-muted mb-0">{t('malePatients')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-warning mb-1">
                {sortedPatients.filter(p => p.gender === 'female').length}
              </h4>
              <p className="text-muted mb-0">{t('femalePatients')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Patient Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? t('edit') : t('add')} {t('patient')}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSave}>
                  <div className="mb-2 d-flex align-items-end gap-2">
                    <div style={{ flex: 1 }}>
                      <label className="form-label mb-1">{t('patientName')} *</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text"><Person /></span>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="name" 
                          required 
                          value={form.name} 
                          onChange={handleChange} 
                          placeholder={t('patientName')}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div style={{ width: 110 }}>
                      <label className="form-label mb-1">{t('age')} *</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text"><Hash /></span>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="age" 
                          required
                          min="0"
                          max="150"
                          value={form.age} 
                          onChange={handleChange} 
                          placeholder={t('age')}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">{t('gender')}</label>
                    <div className="input-group input-group-sm w-100" role="group" aria-label="Gender selection">
                      <input type="radio" className="btn-check" name="gender" id="gender-male" value="male" checked={form.gender === 'male'} onChange={handleChange} autoComplete="off" />
                      <label className={`btn btn-outline-secondary flex-fill${form.gender === 'male' ? ' active' : ''}`} htmlFor="gender-male" style={{ borderTopLeftRadius: '.25rem', borderBottomLeftRadius: '.25rem', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                        <GenderMale className="me-1" />{t('male')}
                      </label>
                      <input type="radio" className="btn-check" name="gender" id="gender-female" value="female" checked={form.gender === 'female'} onChange={handleChange} autoComplete="off" />
                      <label className={`btn btn-outline-secondary flex-fill${form.gender === 'female' ? ' active' : ''}`} htmlFor="gender-female" style={{ borderRadius: 0 }}>
                        <GenderFemale className="me-1" />{t('female')}
                      </label>
                      <input type="radio" className="btn-check" name="gender" id="gender-other" value="other" checked={form.gender === 'other'} onChange={handleChange} autoComplete="off" />
                      <label className={`btn btn-outline-secondary flex-fill${form.gender === 'other' ? ' active' : ''}`} htmlFor="gender-other" style={{ borderTopRightRadius: '.25rem', borderBottomRightRadius: '.25rem', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                        <GenderTrans className="me-1" />{t('other') || 'Other'}
                      </label>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">{t('phone')}</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text"><Phone /></span>
                      <input 
                        type="tel" 
                        className="form-control" 
                        name="phone" 
                        value={form.phone} 
                        onChange={handleChange} 
                        placeholder={t('phone')}
                      />
                      <div className="input-group-text bg-transparent border-0 ps-2">
                        <input className="form-check-input mt-0" type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="isActiveCheck" style={{ marginRight: 4 }} />
                        <label className="form-check-label small" htmlFor="isActiveCheck" style={{ marginLeft: 2, userSelect: 'none' }}>{t('active')}</label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">{t('email')}</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text"><Envelope /></span>
                      <input 
                        type="email" 
                        className="form-control" 
                        name="email" 
                        value={form.email} 
                        onChange={handleChange} 
                        placeholder={t('email')}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">{t('address')}</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text"><GeoAlt /></span>
                      <textarea
                        className="form-control"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder={t('address')}
                        rows={2}
                        style={{ resize: 'vertical', minHeight: 38 }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer py-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={closeModal}
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm" 
                      disabled={saving}
                    >
                      {saving ? t('saving') : t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast 
        message={toast} 
        type={toastType} 
        onClose={() => setToast('')}
      />
    </div>
  )
}

export default Patients 