import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Search, ThreeDots, Pencil, Trash, Eye, Person, Envelope, Shield, Key } from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'
import useUsers from '../hooks/useUsers'
import { useAuth } from '../context/AuthHelpers'

const API_BASE = import.meta.env.VITE_API_BASE;

function Users() {
  const { t } = useTranslations();
  const { user, hasAnyPermission } = useAuth();
  const { users, loading } = useUsers();
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', roleId: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [roles, setRoles] = useState([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewUser, setViewUser] = useState(null)

  useEffect(() => {
    if (user) fetchRoles();
  }, [user]);

  useEffect(() => {
    if (!showModal && !showViewModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showModal) closeModal();
        if (showViewModal) setShowViewModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal, showViewModal]);

  // Block screen for lack of user:list
  if (!hasAnyPermission(['user:list'])) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <Shield className="text-muted mb-3" size={48} />
          <h4>Access Denied</h4>
          <p className="text-muted">You don't have permission to view users.</p>
        </div>
      </div>
    );
  }

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/roles`)
      setRoles(res.data)
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  const openModal = (user = null) => {
    setEditing(user)
    if (user) {
      setForm({
        username: user.username || '',
        password: '', // always blank for editing
        name: user.name || '',
        email: user.email || '',
        roleId: user.Role?.id || '',
        isActive: user.isActive !== false
      })
    } else {
      setForm({ username: '', password: '', name: '', email: '', roleId: '', isActive: true })
    }
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ username: '', password: '', name: '', email: '', roleId: '', isActive: true }) }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async e => {
    e.preventDefault()
    // Validate required fields
    if (!form.username || !form.name || !form.roleId) {
      setToast(t('pleaseFillInAllRequiredFields'))
      return
    }
    // Validate password for new users
    if (!editing && !form.password) {
      setToast(t('passwordRequiredForNewUsers'))
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`${API_BASE}/api/users/${editing.id}`, form)
        setToast(t('userUpdated'))
      } else {
        await axios.post(`${API_BASE}/api/users`, form)
        setToast(t('userAdded'))
      }
      closeModal()
    } catch (err) {
      console.error('Save error:', err)
      setToast(err.response?.data?.message || t('failedToSaveUser'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return
    try {
      await axios.delete(`${API_BASE}/api/users/${id}`)
      setToast(t('userDeleted'))
    } catch {
      setToast(t('failedToSaveUser'))
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !selectedRole || user.Role?.name === selectedRole
    return matchesSearch && matchesRole
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{t('usersTitle')}</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal()}>
          <Plus /> {t('newUser')}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-2">
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
            <div className="col-md-4">
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">{t('allRoles')}</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{t('noData')}</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ minHeight: '400px', maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="table table-hover align-middle" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th className="text-center">{t('username')}</th>
                    <th>{t('email')}</th>
                    <th>{t('role')}</th>
                    <th className="text-center">{t('userStatus')}</th>
                    <th className="text-center">{t('lastLogin')}</th>
                    <th className="text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="text-center">{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.Role?.name || t('noRole')}</td>
                      <td className="text-center">
                        <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {user.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="text-center">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('never')}
                      </td>
                      <td className="text-center">
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <ThreeDots />
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  setViewUser(user)
                                  setShowViewModal(true)
                                }}
                              >
                                <Eye /> {t('viewDetails')}
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => openModal(user)}
                              >
                                <Pencil /> {t('edit')}
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                                onClick={() => handleDelete(user.id)}
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

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? t('edit') : t('add')} {t('user')}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">{t('username')} *</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="username" 
                          required 
                          value={form.username} 
                          onChange={handleChange} 
                        />
                        <span className="input-group-text">
                          <Person />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">{t('fullName')} *</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="name" 
                          required 
                          value={form.name} 
                          onChange={handleChange} 
                        />
                        <span className="input-group-text">
                          <Person />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">{t('email')}</label>
                      <div className="input-group">
                        <input 
                          type="email" 
                          className="form-control" 
                          name="email" 
                          value={form.email} 
                          onChange={handleChange} 
                        />
                        <span className="input-group-text">
                          <Envelope />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">{t('role')} *</label>
                      <div className="input-group">
                        <select 
                          className="form-select" 
                          name="roleId" 
                          required 
                          value={form.roleId} 
                          onChange={handleChange}
                        >
                          <option value="">{t('selectRole')}</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                        <span className="input-group-text">
                          <Shield />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">{t('password')}{!editing && ' *'}</label>
                      <div className="input-group">
                        <input 
                          type="password" 
                          className="form-control" 
                          name="password" 
                          value={form.password} 
                          onChange={handleChange} 
                          {...(!editing ? { required: true } : {})}
                        />
                        <span className="input-group-text">
                          <Key />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          name="isActive" 
                          id="isActiveCheck" 
                          checked={form.isActive} 
                          onChange={handleChange} 
                        />
                        <label className="form-check-label" htmlFor="isActiveCheck">
                          {t('active')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View User Modal */}
      {showViewModal && viewUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('userDetails')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <dl className="row mb-0">
                  <dt className="col-sm-4">{t('username')}</dt>
                  <dd className="col-sm-8">{viewUser.username}</dd>
                  <dt className="col-sm-4">{t('fullName')}</dt>
                  <dd className="col-sm-8">{viewUser.name}</dd>
                  <dt className="col-sm-4">{t('email')}</dt>
                  <dd className="col-sm-8">{viewUser.email}</dd>
                  <dt className="col-sm-4">{t('role')}</dt>
                  <dd className="col-sm-8">{viewUser.Role?.name || t('noRole')}</dd>
                  <dt className="col-sm-4">{t('userStatus')}</dt>
                  <dd className="col-sm-8">
                    <span className={`badge ${viewUser.isActive ? 'bg-success' : 'bg-danger'}`}>{viewUser.isActive ? t('active') : t('inactive')}</span>
                  </dd>
                  <dt className="col-sm-4">{t('lastLogin')}</dt>
                  <dd className="col-sm-8">{viewUser.lastLoginAt ? new Date(viewUser.lastLoginAt).toLocaleString() : t('never')}</dd>
                </dl>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>{t('close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className="toast-header"><strong className="me-auto">{t('users')}</strong><button type="button" className="btn-close" onClick={() => setToast('')}></button></div>
          <div className="toast-body">{toast}</div>
        </div>
      )}
    </div>
  )
}

export default Users 