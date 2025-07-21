// Comprehensive Permission Tree Structure
const PERMISSION_TREE = {
  dashboard: {
    label: 'Dashboard',
    icon: 'House',
    permissions: {
      'dashboard:view': {
        label: 'View Dashboard',
        description: 'Access to view dashboard page and analytics',
        type: 'page'
      },
      'dashboard:export': {
        label: 'Export Dashboard Data',
        description: 'Export dashboard reports and data',
        type: 'action'
      }
    }
  },
  pos: {
    label: 'Point of Sale (POS)',
    icon: 'CashStack',
    permissions: {
      'pos:view': {
        label: 'View POS Page',
        description: 'Access to POS interface',
        type: 'page'
      },
      'pos:create_sale': {
        label: 'Create Sale',
        description: 'Create new sales transactions',
        type: 'action'
      },
      'pos:edit_sale': {
        label: 'Edit Sale',
        description: 'Modify existing sales',
        type: 'action'
      },
      'pos:delete_sale': {
        label: 'Delete Sale',
        description: 'Delete sales transactions',
        type: 'action'
      },
      'pos:void_sale': {
        label: 'Void Sale',
        description: 'Void/cancel sales transactions',
        type: 'action'
      },
      'pos:refund': {
        label: 'Process Refunds',
        description: 'Process customer refunds',
        type: 'action'
      }
    }
  },
  sales: {
    label: 'Sales Management',
    icon: 'Receipt',
    permissions: {
      'sales:view': {
        label: 'View Sales Page',
        description: 'Access to sales management page',
        type: 'page'
      },
      'sales:list': {
        label: 'List Sales',
        description: 'View list of all sales',
        type: 'action'
      },
      'sales:view_details': {
        label: 'View Sale Details',
        description: 'View detailed information of a sale',
        type: 'action'
      },
      'sales:create': {
        label: 'Create Sale',
        description: 'Create new sales records',
        type: 'action'
      },
      'sales:edit': {
        label: 'Edit Sale',
        description: 'Modify existing sales',
        type: 'action'
      },
      'sales:delete': {
        label: 'Delete Sale',
        description: 'Delete sales records',
        type: 'action'
      },
      'sales:export': {
        label: 'Export Sales',
        description: 'Export sales data to various formats',
        type: 'action'
      },
      'sales:print_invoice': {
        label: 'Print Invoice',
        description: 'Print sales invoices',
        type: 'action'
      }
    }
  },
  sales_agents: {
    label: 'Sales Agents',
    icon: 'PersonBadge',
    permissions: {
      'sales_agents:view': {
        label: 'View Sales Agents Page',
        description: 'Access to sales agents management',
        type: 'page'
      },
      'sales_agents:list': {
        label: 'List Sales Agents',
        description: 'View list of all sales agents',
        type: 'action'
      },
      'sales_agents:view_details': {
        label: 'View Agent Details',
        description: 'View detailed information of an agent',
        type: 'action'
      },
      'sales_agents:create': {
        label: 'Create Sales Agent',
        description: 'Create new sales agent accounts',
        type: 'action'
      },
      'sales_agents:edit': {
        label: 'Edit Sales Agent',
        description: 'Modify existing sales agent information',
        type: 'action'
      },
      'sales_agents:delete': {
        label: 'Delete Sales Agent',
        description: 'Delete sales agent accounts',
        type: 'action'
      },
      'sales_agents:view_performance': {
        label: 'View Agent Performance',
        description: 'View sales performance metrics for agents',
        type: 'action'
      }
    }
  },
  expenses: {
    label: 'Expenses',
    icon: 'CreditCard',
    permissions: {
      'expenses:view': {
        label: 'View Expenses Page',
        description: 'Access to expenses management page',
        type: 'page'
      },
      'expenses:list': {
        label: 'List Expenses',
        description: 'View list of all expenses',
        type: 'action'
      },
      'expenses:view_details': {
        label: 'View Expense Details',
        description: 'View detailed information of an expense',
        type: 'action'
      },
      'expenses:create': {
        label: 'Create Expense',
        description: 'Create new expense records',
        type: 'action'
      },
      'expenses:edit': {
        label: 'Edit Expense',
        description: 'Modify existing expenses',
        type: 'action'
      },
      'expenses:delete': {
        label: 'Delete Expense',
        description: 'Delete expense records',
        type: 'action'
      },
      'expenses:export': {
        label: 'Export Expenses',
        description: 'Export expenses data',
        type: 'action'
      },
      'expenses:approve': {
        label: 'Approve Expenses',
        description: 'Approve pending expense requests',
        type: 'action'
      }
    }
  },
  products: {
    label: 'Products',
    icon: 'BoxSeam',
    permissions: {
      'products:view': {
        label: 'View Products Page',
        description: 'Access to products management page',
        type: 'page'
      },
      'products:list': {
        label: 'List Products',
        description: 'View list of all products',
        type: 'action'
      },
      'products:view_details': {
        label: 'View Product Details',
        description: 'View detailed information of a product',
        type: 'action'
      },
      'products:create': {
        label: 'Create Product',
        description: 'Create new product records',
        type: 'action'
      },
      'products:edit': {
        label: 'Edit Product',
        description: 'Modify existing products',
        type: 'action'
      },
      'products:delete': {
        label: 'Delete Product',
        description: 'Delete product records',
        type: 'action'
      },
      'products:manage_categories': {
        label: 'Manage Categories',
        description: 'Create and manage product categories',
        type: 'action'
      },
      'products:manage_supplementary': {
        label: 'Manage Supplementary Products',
        description: 'Manage product bundling and supplementary items',
        type: 'action'
      }
    }
  },
  patients: {
    label: 'Patients',
    icon: 'PersonHeart',
    permissions: {
      'patients:view': {
        label: 'View Patients Page',
        description: 'Access to patients management page',
        type: 'page'
      },
      'patients:list': {
        label: 'List Patients',
        description: 'View list of all patients',
        type: 'action'
      },
      'patients:view_details': {
        label: 'View Patient Details',
        description: 'View detailed information of a patient',
        type: 'action'
      },
      'patients:create': {
        label: 'Create Patient',
        description: 'Create new patient records',
        type: 'action'
      },
      'patients:edit': {
        label: 'Edit Patient',
        description: 'Modify existing patient information',
        type: 'action'
      },
      'patients:delete': {
        label: 'Delete Patient',
        description: 'Delete patient records',
        type: 'action'
      },
      'patients:view_history': {
        label: 'View Patient History',
        description: 'View patient medical and purchase history',
        type: 'action'
      }
    }
  },
  accounts: {
    label: 'Accounts',
    icon: 'BarChart',
    permissions: {
      'accounts:view': {
        label: 'View Accounts Page',
        description: 'Access to financial accounts and analytics',
        type: 'page'
      },
      'accounts:view_reports': {
        label: 'View Financial Reports',
        description: 'Access to financial reports and analytics',
        type: 'action'
      },
      'accounts:export_reports': {
        label: 'Export Financial Reports',
        description: 'Export financial data and reports',
        type: 'action'
      },
      'accounts:view_ledger': {
        label: 'View Daily Ledger',
        description: 'Access to daily financial ledger',
        type: 'action'
      },
      'accounts:reconcile': {
        label: 'Reconcile Accounts',
        description: 'Perform account reconciliation',
        type: 'action'
      }
    }
  },
  users: {
    label: 'Users',
    icon: 'People',
    permissions: {
      'users:view': {
        label: 'View Users Page',
        description: 'Access to users management page',
        type: 'page'
      },
      'users:list': {
        label: 'List Users',
        description: 'View list of all users',
        type: 'action'
      },
      'users:view_details': {
        label: 'View User Details',
        description: 'View detailed information of a user',
        type: 'action'
      },
      'users:create': {
        label: 'Create User',
        description: 'Create new user accounts',
        type: 'action'
      },
      'users:edit': {
        label: 'Edit User',
        description: 'Modify existing user information',
        type: 'action'
      },
      'users:delete': {
        label: 'Delete User',
        description: 'Delete user accounts',
        type: 'action'
      },
      'users:change_password': {
        label: 'Change User Password',
        description: 'Change passwords for other users',
        type: 'action'
      },
      'users:activate_deactivate': {
        label: 'Activate/Deactivate Users',
        description: 'Enable or disable user accounts',
        type: 'action'
      }
    }
  },
  roles: {
    label: 'Roles',
    icon: 'ShieldLock',
    permissions: {
      'roles:view': {
        label: 'View Roles Page',
        description: 'Access to roles management page',
        type: 'page'
      },
      'roles:list': {
        label: 'List Roles',
        description: 'View list of all roles',
        type: 'action'
      },
      'roles:view_details': {
        label: 'View Role Details',
        description: 'View detailed information of a role',
        type: 'action'
      },
      'roles:create': {
        label: 'Create Role',
        description: 'Create new roles',
        type: 'action'
      },
      'roles:edit': {
        label: 'Edit Role',
        description: 'Modify existing roles and permissions',
        type: 'action'
      },
      'roles:delete': {
        label: 'Delete Role',
        description: 'Delete roles',
        type: 'action'
      },
      'roles:assign': {
        label: 'Assign Roles',
        description: 'Assign roles to users',
        type: 'action'
      }
    }
  },
  reports: {
    label: 'Reports',
    icon: 'FileText',
    permissions: {
      'reports:view': {
        label: 'View Reports Page',
        description: 'Access to reports and analytics page',
        type: 'page'
      },
      'reports:sales': {
        label: 'Sales Reports',
        description: 'Generate and view sales reports',
        type: 'action'
      },
      'reports:expenses': {
        label: 'Expense Reports',
        description: 'Generate and view expense reports',
        type: 'action'
      },
      'reports:performance': {
        label: 'Performance Reports',
        description: 'Generate and view performance analytics',
        type: 'action'
      },
      'reports:financial': {
        label: 'Financial Reports',
        description: 'Generate and view financial statements',
        type: 'action'
      },
      'reports:export': {
        label: 'Export Reports',
        description: 'Export reports to various formats',
        type: 'action'
      },
      'reports:schedule': {
        label: 'Schedule Reports',
        description: 'Schedule automated report generation',
        type: 'action'
      }
    }
  },
  settings: {
    label: 'Settings',
    icon: 'Gear',
    permissions: {
      'settings:view': {
        label: 'View Settings Page',
        description: 'Access to system settings page',
        type: 'page'
      },
      'settings:general': {
        label: 'General Settings',
        description: 'Modify general system settings',
        type: 'action'
      },
      'settings:branding': {
        label: 'Branding Settings',
        description: 'Modify system branding and appearance',
        type: 'action'
      },
      'settings:localization': {
        label: 'Localization Settings',
        description: 'Configure language and regional settings',
        type: 'action'
      },
      'settings:backup': {
        label: 'Backup Settings',
        description: 'Configure backup and restore settings',
        type: 'action'
      },
      'settings:security': {
        label: 'Security Settings',
        description: 'Configure security and authentication settings',
        type: 'action'
      },
      'settings:notifications': {
        label: 'Notification Settings',
        description: 'Configure system notifications',
        type: 'action'
      }
    }
  },
  audit: {
    label: 'Audit Logs',
    icon: 'JournalText',
    permissions: {
      'audit:view': {
        label: 'View Audit Logs Page',
        description: 'Access to audit logs page',
        type: 'page'
      },
      'audit:list': {
        label: 'List Audit Logs',
        description: 'View system audit logs',
        type: 'action'
      },
      'audit:view_details': {
        label: 'View Log Details',
        description: 'View detailed audit log information',
        type: 'action'
      },
      'audit:export': {
        label: 'Export Audit Logs',
        description: 'Export audit log data',
        type: 'action'
      },
      'audit:purge': {
        label: 'Purge Audit Logs',
        description: 'Delete old audit log entries',
        type: 'action'
      }
    }
  },
  backup: {
    label: 'Backup & Restore',
    icon: 'CloudArrowUp',
    permissions: {
      'backup:view': {
        label: 'View Backup Page',
        description: 'Access to backup and restore page',
        type: 'page'
      },
      'backup:create': {
        label: 'Create Backup',
        description: 'Create system backups',
        type: 'action'
      },
      'backup:download': {
        label: 'Download Backup',
        description: 'Download backup files',
        type: 'action'
      },
      'backup:restore': {
        label: 'Restore Backup',
        description: 'Restore system from backup',
        type: 'action'
      },
      'backup:schedule': {
        label: 'Schedule Backups',
        description: 'Configure automated backup schedules',
        type: 'action'
      }
    }
  }
};

// Helper functions
const getAllPermissions = () => {
  const permissions = [];
  Object.entries(PERMISSION_TREE).forEach(([module, moduleData]) => {
    Object.entries(moduleData.permissions).forEach(([permission, permissionData]) => {
      permissions.push({
        key: permission,
        module,
        ...permissionData
      });
    });
  });
  return permissions;
};

const getPermissionsByModule = (module) => {
  return PERMISSION_TREE[module]?.permissions || {};
};

const getModulePermissions = (module) => {
  return Object.keys(PERMISSION_TREE[module]?.permissions || {});
};

const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true; // Super admin
  return userPermissions.includes(requiredPermission);
};

const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true; // Super admin
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true; // Super admin
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

const getVisibleModules = (userPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return [];
  if (userPermissions.includes('*')) return Object.keys(PERMISSION_TREE); // Super admin sees all
  
  const visibleModules = [];
  Object.entries(PERMISSION_TREE).forEach(([module, moduleData]) => {
    const modulePermissions = Object.keys(moduleData.permissions);
    if (modulePermissions.some(permission => userPermissions.includes(permission))) {
      visibleModules.push(module);
    }
  });
  return visibleModules;
};

const getPermissionTree = () => PERMISSION_TREE;

module.exports = {
  PERMISSION_TREE,
  getAllPermissions,
  getPermissionsByModule,
  getModulePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getVisibleModules,
  getPermissionTree
}; 