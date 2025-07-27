import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Search, Filter, ThreeDots, Pencil, Trash, Eye, Shield, ChatText, ChevronDown, ChevronRight, CheckSquare, Square, ExclamationTriangle } from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'
import { useAuth } from '../context/AuthHelpers'
import Toast from '../components/Toast'

const API_BASE = import.meta.env.VITE_API_BASE;

// Remove hardcoded PERMISSION_TREE


function PermissionTree({ permissions, selectedPermissions, onPermissionChange, expandedModules, onToggleModule }) {
  // Only show real modules/permissions (no 'all', no '*')
  const filteredModules = Object.entries(permissions).filter(
    ([moduleKey, moduleData]) =>
      moduleKey !== 'all' &&
      Object.keys(moduleData.permissions).some(p => p !== '*')
  );

  // Handler for super admin checkbox
  const handleSuperAdminChange = (e) => {
    onPermissionChange('*', e.target.checked);
  };

  // If '*' is selected, show a super admin message and disable the rest
  const isSuperAdmin = selectedPermissions.includes('*');

  return (
    <div className="permission-tree">
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="perm-superadmin"
          checked={isSuperAdmin}
          onChange={handleSuperAdminChange}
        />
        <label className="form-check-label fw-bold text-danger" htmlFor="perm-superadmin">
          All Permissions (Super Admin)
        </label>
      </div>
      {isSuperAdmin && (
        <div className="alert alert-success mb-3">
          <b>Super Admin:</b> This role has all permissions in the system.
        </div>
      )}
      <fieldset disabled={isSuperAdmin} style={{ opacity: isSuperAdmin ? 0.5 : 1 }}>
        {filteredModules.map(([moduleKey, moduleData]) => (
          <div key={moduleKey} className="permission-module mb-3">
            <div className="module-header d-flex align-items-center p-2 border rounded">
              <button
                type="button"
                className="btn btn-link btn-sm p-0 me-2"
                onClick={() => onToggleModule(moduleKey)}
              >
                {expandedModules.includes(moduleKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 me-2"
                onClick={() => {
                  const modulePermissions = Object.keys(moduleData.permissions).filter(p => p !== '*');
                  const allSelected = modulePermissions.every(permission => selectedPermissions.includes(permission));
                  modulePermissions.forEach(permission => {
                    onPermissionChange(permission, !allSelected);
                  });
                }}
              >
                {(() => {
                  const modulePermissions = Object.keys(moduleData.permissions).filter(p => p !== '*');
                  const allSelected = modulePermissions.every(permission => selectedPermissions.includes(permission));
                  const someSelected = modulePermissions.some(permission => selectedPermissions.includes(permission));
                  if (allSelected) return <CheckSquare size={16} className="text-primary" />;
                  if (someSelected) return (
                    <div className="position-relative">
                      <Square size={16} className="text-primary" />
                      <div className="position-absolute top-0 start-0" style={{ width: '8px', height: '2px', backgroundColor: 'var(--bs-primary)' }}></div>
                    </div>
                  );
                  return <Square size={16} />;
                })()}
              </button>
              <span className="fw-semibold">{moduleData.label}</span>
              <span className="badge bg-secondary ms-auto">{Object.keys(moduleData.permissions).filter(p => p !== '*').length}</span>
            </div>
            {expandedModules.includes(moduleKey) && (
              <div className="module-permissions ms-4 mt-2">
                {Object.entries(moduleData.permissions).filter(([permission]) => permission !== '*').map(([permission, permissionData]) => (
                  <div key={permission} className="permission-item d-flex align-items-center py-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`perm-${permission}`}
                        checked={selectedPermissions.includes(permission)}
                        onChange={(e) => onPermissionChange(permission, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`perm-${permission}`}>
                        <span className="d-flex align-items-center">
                          <span className="me-2">
                            {permissionData.type === 'page' ? (
                              <Eye size={14} className="text-info" />
                            ) : (
                              <Shield size={14} className="text-warning" />
                            )}
                          </span>
                          {permissionData.label}
                          <span className="badge bg-light text-dark ms-2" style={{ fontSize: '0.7em' }}>
                            {permissionData.type}
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function Roles() {
  const { t } = useTranslations();
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    permissions: []
  })
  const [expandedModules, setExpandedModules] = useState([])
  const [permissionTree, setPermissionTree] = useState({})
  const { hasAnyPermission, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('info');
  const [saving, setSaving] = useState(false);
  const [showSuperAdminWarning, setShowSuperAdminWarning] = useState(false);

  // Check permissions
  const canViewRoles = hasAnyPermission(['roles:view', 'roles:list']);
  const canCreateRoles = hasAnyPermission(['roles:create']);
  const canEditRoles = hasAnyPermission(['roles:edit']);
  const canDeleteRoles = hasAnyPermission(['roles:delete']);

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/roles`)
      setRoles(res.data)
    } catch {
      showToast('Failed to load roles', 'error')
    } finally {
      setLoading(false)
    }
  }, []);

  useEffect(() => {
    if (user) fetchRoles();
  }, [user, fetchRoles]);

  useEffect(() => {
    // Fetch permission tree from backend
    axios.get(`${API_BASE}/api/roles/permissions`).then(res => {
      setPermissionTree(res.data)
    })
  }, []);

  const showToast = (message, type = 'info') => {
    setToast(message)
    setToastType(type)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      if (name === 'permissions') {
        setForm(prev => ({
          ...prev,
          permissions: checked 
            ? [...prev.permissions, value]
            : prev.permissions.filter(p => p !== value)
        }))
      }
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handlePermissionChange = (permission, checked) => {
    setForm(prev => {
      // If * is checked, show warning and set only *
      if (permission === '*' && checked) {
        setShowSuperAdminWarning(true);
        return { ...prev, permissions: ['*'] };
      }
      // If * is unchecked, remove it
      if (permission === '*' && !checked) {
        return { ...prev, permissions: [] };
      }
      // If * is already selected, ignore other changes
      if (prev.permissions.includes('*')) {
        return prev;
      }
      // Normal add/remove
      return {
        ...prev,
        permissions: checked 
          ? [...prev.permissions, permission]
          : prev.permissions.filter(p => p !== permission)
      };
    });
  };

  const handleModuleToggle = (moduleKey) => {
    setExpandedModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(m => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (editing) {
        // Update existing role
        await axios.put(`${API_BASE}/api/roles/${editing.id}`, form)
        showToast('Role updated successfully', 'success')
      } else {
        // Create new role
        await axios.post(`${API_BASE}/api/roles`, form)
        showToast('Role created successfully', 'success')
      }
      
      setShowAddModal(false)
      setEditing(null)
      setForm({
        name: '',
        description: '',
        permissions: []
      })
      setExpandedModules([])
      fetchRoles()
    } catch {
      showToast('Failed to save role', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this role?')) return
    try {
      await axios.delete(`${API_BASE}/api/roles/${id}`)
      showToast('Role deleted successfully', 'success')
      fetchRoles()
    } catch {
      showToast('Failed to delete role', 'error')
    }
  }

  const handleEdit = (role) => {
    setEditing(role)
    setForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions || []
    })
    // Expand all modules that have selected permissions
    const modulesWithPermissions = Object.keys(permissionTree).filter(moduleKey => {
      const modulePermissions = Object.keys(permissionTree[moduleKey].permissions);
      return modulePermissions.some(permission => role.permissions.includes(permission));
    });
    setExpandedModules(modulesWithPermissions)
    setShowAddModal(true)
  }

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const renderPermissionsBadge = (role) => {
    const permissions = role.permissions || []
    
    // Check if role has '*' permission (all permissions)
    if (permissions.includes('*')) {
      return (
        <span className="badge bg-success">
          {t('allPermissions')}
        </span>
      )
    }
    
    // Show count for regular permissions
    return (
      <span className="badge bg-primary">
        {permissions.length} {t('permissions')}
      </span>
    )
  }

  if (!canViewRoles) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <Shield className="text-muted mb-3" size={48} />
          <h4>Access Denied</h4>
          <p className="text-muted">You don't have permission to view roles.</p>
        </div>
      </div>
    )
  }

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
        <h2>{t('rolesTitle')}</h2>
        {canCreateRoles && (
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => {
            setEditing(null)
            setForm({
              name: '',
              description: '',
              permissions: []
            })
            setExpandedModules([])
            setShowAddModal(true)
          }}>
          <Plus /> {t('newRole')}
        </button>
        )}
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
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <Filter /> {t('filter')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="card">
        <div className="card-body">
            <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                  <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map(role => (
                    <tr key={role.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <Shield className="me-2 text-primary" />
                        <strong>{role.name}</strong>
                      </div>
                    </td>
                      <td>{role.description}</td>
                    <td>{renderPermissionsBadge(role)}</td>
                    <td>
                      <div className="btn-group" role="group">
                              <button 
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(role)}
                          disabled={!canEditRoles}
                          title="Edit role"
                              >
                          <Pencil size={14} />
                              </button>
                              <button 
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(role.id)}
                          disabled={!canDeleteRoles}
                          title="Delete role"
                              >
                          <Trash size={14} />
                              </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? t('editRole') : t('newRole')}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowAddModal(false)
                    setEditing(null)
                  }}
                />
              </div>
              <form onSubmit={handleSave}>
              <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">{t('roleName')}</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            name="name" 
                            value={form.name} 
                            onChange={handleChange} 
                          required
                          />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">{t('description')}</label>
                          <textarea 
                            className="form-control" 
                            name="description" 
                            value={form.description} 
                            onChange={handleChange}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">{t('permissions')}</label>
                        <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <PermissionTree
                            permissions={permissionTree}
                            selectedPermissions={form.permissions}
                            onPermissionChange={handlePermissionChange}
                            expandedModules={expandedModules}
                            onToggleModule={handleModuleToggle}
                                    />
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowAddModal(false)
                        setEditing(null)
                      }}
                    >
                      {t('cancel')}
                    </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? t('saving') : t('save')}
                  </button>
                  </div>
                </form>
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
      {showSuperAdminWarning && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <ExclamationTriangle className="me-2" />
          <div>
            <strong>Warning:</strong> Granting <code>*</code> gives this role ALL permissions, including destructive actions. Only assign to trusted super admins.
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={() => setShowSuperAdminWarning(false)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

export default Roles 