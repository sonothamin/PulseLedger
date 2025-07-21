import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Search, Filter, ThreeDots, Pencil, Trash, Eye, Shield, ChatText, ChevronDown, ChevronRight, CheckSquare, Square } from 'react-bootstrap-icons'
import { useTranslations } from '../hooks/useTranslations'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'


// Import the permission tree
const PERMISSION_TREE = {
  dashboard: {
    label: 'Dashboard',
    icon: 'House',
    permissions: {
      'dashboard:view': { label: 'View Dashboard', type: 'page' },
      'dashboard:export': { label: 'Export Dashboard Data', type: 'action' }
    }
  },
  pos: {
    label: 'Point of Sale (POS)',
    icon: 'CashStack',
    permissions: {
      'pos:view': { label: 'View POS Page', type: 'page' },
      'pos:create_sale': { label: 'Create Sale', type: 'action' },
      'pos:edit_sale': { label: 'Edit Sale', type: 'action' },
      'pos:delete_sale': { label: 'Delete Sale', type: 'action' },
      'pos:void_sale': { label: 'Void Sale', type: 'action' },
      'pos:refund': { label: 'Process Refunds', type: 'action' }
    }
  },
  sales: {
    label: 'Sales Management',
    icon: 'Receipt',
    permissions: {
      'sales:view': { label: 'View Sales Page', type: 'page' },
      'sales:list': { label: 'List Sales', type: 'action' },
      'sales:view_details': { label: 'View Sale Details', type: 'action' },
      'sales:create': { label: 'Create Sale', type: 'action' },
      'sales:edit': { label: 'Edit Sale', type: 'action' },
      'sales:delete': { label: 'Delete Sale', type: 'action' },
      'sales:export': { label: 'Export Sales', type: 'action' },
      'sales:print_invoice': { label: 'Print Invoice', type: 'action' }
    }
  },
  sales_agents: {
    label: 'Sales Agents',
    icon: 'PersonBadge',
    permissions: {
      'sales_agents:view': { label: 'View Sales Agents Page', type: 'page' },
      'sales_agents:list': { label: 'List Sales Agents', type: 'action' },
      'sales_agents:view_details': { label: 'View Agent Details', type: 'action' },
      'sales_agents:create': { label: 'Create Sales Agent', type: 'action' },
      'sales_agents:edit': { label: 'Edit Sales Agent', type: 'action' },
      'sales_agents:delete': { label: 'Delete Sales Agent', type: 'action' },
      'sales_agents:view_performance': { label: 'View Agent Performance', type: 'action' }
    }
  },
  expenses: {
    label: 'Expenses',
    icon: 'CreditCard',
    permissions: {
      'expenses:view': { label: 'View Expenses Page', type: 'page' },
      'expenses:list': { label: 'List Expenses', type: 'action' },
      'expenses:view_details': { label: 'View Expense Details', type: 'action' },
      'expenses:create': { label: 'Create Expense', type: 'action' },
      'expenses:edit': { label: 'Edit Expense', type: 'action' },
      'expenses:delete': { label: 'Delete Expense', type: 'action' },
      'expenses:export': { label: 'Export Expenses', type: 'action' },
      'expenses:approve': { label: 'Approve Expenses', type: 'action' }
    }
  },
  products: {
    label: 'Products',
    icon: 'BoxSeam',
    permissions: {
      'products:view': { label: 'View Products Page', type: 'page' },
      'products:list': { label: 'List Products', type: 'action' },
      'products:view_details': { label: 'View Product Details', type: 'action' },
      'products:create': { label: 'Create Product', type: 'action' },
      'products:edit': { label: 'Edit Product', type: 'action' },
      'products:delete': { label: 'Delete Product', type: 'action' },
      'products:manage_categories': { label: 'Manage Categories', type: 'action' },
      'products:manage_supplementary': { label: 'Manage Supplementary Products', type: 'action' }
    }
  },
  patients: {
    label: 'Patients',
    icon: 'PersonHeart',
    permissions: {
      'patients:view': { label: 'View Patients Page', type: 'page' },
      'patients:list': { label: 'List Patients', type: 'action' },
      'patients:view_details': { label: 'View Patient Details', type: 'action' },
      'patients:create': { label: 'Create Patient', type: 'action' },
      'patients:edit': { label: 'Edit Patient', type: 'action' },
      'patients:delete': { label: 'Delete Patient', type: 'action' },
      'patients:view_history': { label: 'View Patient History', type: 'action' }
    }
  },
  accounts: {
    label: 'Accounts',
    icon: 'BarChart',
    permissions: {
      'accounts:view': { label: 'View Accounts Page', type: 'page' },
      'accounts:view_reports': { label: 'View Financial Reports', type: 'action' },
      'accounts:export_reports': { label: 'Export Financial Reports', type: 'action' },
      'accounts:view_ledger': { label: 'View Daily Ledger', type: 'action' },
      'accounts:reconcile': { label: 'Reconcile Accounts', type: 'action' }
    }
  },
  users: {
    label: 'Users',
    icon: 'People',
    permissions: {
      'users:view': { label: 'View Users Page', type: 'page' },
      'users:list': { label: 'List Users', type: 'action' },
      'users:view_details': { label: 'View User Details', type: 'action' },
      'users:create': { label: 'Create User', type: 'action' },
      'users:edit': { label: 'Edit User', type: 'action' },
      'users:delete': { label: 'Delete User', type: 'action' },
      'users:change_password': { label: 'Change User Password', type: 'action' },
      'users:activate_deactivate': { label: 'Activate/Deactivate Users', type: 'action' }
    }
  },
  roles: {
    label: 'Roles',
    icon: 'ShieldLock',
    permissions: {
      'roles:view': { label: 'View Roles Page', type: 'page' },
      'roles:list': { label: 'List Roles', type: 'action' },
      'roles:view_details': { label: 'View Role Details', type: 'action' },
      'roles:create': { label: 'Create Role', type: 'action' },
      'roles:edit': { label: 'Edit Role', type: 'action' },
      'roles:delete': { label: 'Delete Role', type: 'action' },
      'roles:assign': { label: 'Assign Roles', type: 'action' }
    }
  },
  reports: {
    label: 'Reports',
    icon: 'FileText',
    permissions: {
      'reports:view': { label: 'View Reports Page', type: 'page' },
      'reports:sales': { label: 'Sales Reports', type: 'action' },
      'reports:expenses': { label: 'Expense Reports', type: 'action' },
      'reports:performance': { label: 'Performance Reports', type: 'action' },
      'reports:financial': { label: 'Financial Reports', type: 'action' },
      'reports:export': { label: 'Export Reports', type: 'action' },
      'reports:schedule': { label: 'Schedule Reports', type: 'action' }
    }
  },
  settings: {
    label: 'Settings',
    icon: 'Gear',
    permissions: {
      'settings:view': { label: 'View Settings Page', type: 'page' },
      'settings:general': { label: 'General Settings', type: 'action' },
      'settings:branding': { label: 'Branding Settings', type: 'action' },
      'settings:localization': { label: 'Localization Settings', type: 'action' },
      'settings:backup': { label: 'Backup Settings', type: 'action' },
      'settings:security': { label: 'Security Settings', type: 'action' },
      'settings:notifications': { label: 'Notification Settings', type: 'action' }
    }
  },
  audit: {
    label: 'Audit Logs',
    icon: 'JournalText',
    permissions: {
      'audit:view': { label: 'View Audit Logs Page', type: 'page' },
      'audit:list': { label: 'List Audit Logs', type: 'action' },
      'audit:view_details': { label: 'View Log Details', type: 'action' },
      'audit:export': { label: 'Export Audit Logs', type: 'action' },
      'audit:purge': { label: 'Purge Audit Logs', type: 'action' }
    }
  },
  backup: {
    label: 'Backup & Restore',
    icon: 'CloudArrowUp',
    permissions: {
      'backup:view': { label: 'View Backup Page', type: 'page' },
      'backup:create': { label: 'Create Backup', type: 'action' },
      'backup:download': { label: 'Download Backup', type: 'action' },
      'backup:restore': { label: 'Restore Backup', type: 'action' },
      'backup:schedule': { label: 'Schedule Backups', type: 'action' }
    }
  }
};



function PermissionTree({ permissions, selectedPermissions, onPermissionChange, expandedModules, onToggleModule }) {
  const { t } = useTranslations();

  const handleModuleToggle = (moduleKey) => {
    onToggleModule(moduleKey);
  };

  const handlePermissionChange = (permission, checked) => {
    onPermissionChange(permission, checked);
  };

  const handleModuleSelect = (moduleKey, checked) => {
    const modulePermissions = Object.keys(PERMISSION_TREE[moduleKey].permissions);
    modulePermissions.forEach(permission => {
      onPermissionChange(permission, checked);
    });
  };

  const isModuleExpanded = (moduleKey) => expandedModules.includes(moduleKey);
  const isModuleSelected = (moduleKey) => {
    const modulePermissions = Object.keys(PERMISSION_TREE[moduleKey].permissions);
    return modulePermissions.every(permission => selectedPermissions.includes(permission));
  };
  const isModulePartiallySelected = (moduleKey) => {
    const modulePermissions = Object.keys(PERMISSION_TREE[moduleKey].permissions);
    const selectedCount = modulePermissions.filter(permission => selectedPermissions.includes(permission)).length;
    return selectedCount > 0 && selectedCount < modulePermissions.length;
  };

  return (
    <div className="permission-tree">
      {Object.entries(PERMISSION_TREE).map(([moduleKey, moduleData]) => (
        <div key={moduleKey} className="permission-module mb-3">
          <div className="module-header d-flex align-items-center p-2 border rounded">
            <button
              type="button"
              className="btn btn-link btn-sm p-0 me-2"
              onClick={() => handleModuleToggle(moduleKey)}
            >
              {isModuleExpanded(moduleKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            <button
              type="button"
              className="btn btn-link btn-sm p-0 me-2"
              onClick={() => handleModuleSelect(moduleKey, !isModuleSelected(moduleKey))}
            >
              {isModuleSelected(moduleKey) ? (
                <CheckSquare size={16} className="text-primary" />
              ) : isModulePartiallySelected(moduleKey) ? (
                <div className="position-relative">
                  <Square size={16} className="text-primary" />
                  <div className="position-absolute top-0 start-0" style={{ width: '8px', height: '2px', backgroundColor: 'var(--bs-primary)' }}></div>
                </div>
              ) : (
                <Square size={16} />
              )}
            </button>
            
            <span className="fw-semibold">{moduleData.label}</span>
            <span className="badge bg-secondary ms-auto">{Object.keys(moduleData.permissions).length}</span>
          </div>
          
          {isModuleExpanded(moduleKey) && (
            <div className="module-permissions ms-4 mt-2">
              {Object.entries(moduleData.permissions).map(([permission, permissionData]) => (
                <div key={permission} className="permission-item d-flex align-items-center py-1">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`perm-${permission}`}
                      checked={selectedPermissions.includes(permission)}
                      onChange={(e) => handlePermissionChange(permission, e.target.checked)}
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
    </div>
  );
}

function Roles() {
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
  const { t } = useTranslations()
  const { hasAnyPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('info');
  const [saving, setSaving] = useState(false);

  // Check permissions
  const canViewRoles = hasAnyPermission(['roles:view', 'roles:list']);
  const canCreateRoles = hasAnyPermission(['roles:create']);
  const canEditRoles = hasAnyPermission(['roles:edit']);
  const canDeleteRoles = hasAnyPermission(['roles:delete']);

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/roles')
      setRoles(res.data)
    } catch (err) {
      console.error('Failed to load roles', err)
      showToast('Failed to load roles', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (canViewRoles) {
      fetchRoles() 
    }
  }, [canViewRoles])

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
    setForm(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
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
        await axios.put(`/api/roles/${editing.id}`, form)
        showToast('Role updated successfully', 'success')
      } else {
        // Create new role
        await axios.post('/api/roles', form)
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
    } catch (err) {
      console.error('Failed to save role:', err)
      showToast('Failed to save role', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this role?')) return
    try {
      await axios.delete(`/api/roles/${id}`)
      showToast('Role deleted successfully', 'success')
      fetchRoles()
    } catch (err) {
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
    const modulesWithPermissions = Object.keys(PERMISSION_TREE).filter(moduleKey => {
      const modulePermissions = Object.keys(PERMISSION_TREE[moduleKey].permissions);
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
                            permissions={PERMISSION_TREE}
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
    </div>
  )
}

export default Roles 