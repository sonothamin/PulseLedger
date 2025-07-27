// Comprehensive Permission Tree Structure
const PERMISSION_TREE = {
  users: {
    label: 'Users',
    icon: 'Person',
    permissions: {
      'user:read': { label: 'Read Users', type: 'action' },
      'user:create': { label: 'Create User', type: 'action' },
      'user:update': { label: 'Update User', type: 'action' },
      'user:delete': { label: 'Delete User', type: 'action' },
    }
  },
  roles: {
    label: 'Roles',
    icon: 'Shield',
    permissions: {
      'role:read': { label: 'Read Roles', type: 'action' },
      'role:create': { label: 'Create Role', type: 'action' },
      'role:update': { label: 'Update Role', type: 'action' },
      'role:delete': { label: 'Delete Role', type: 'action' },
    }
  },
  products: {
    label: 'Products',
    icon: 'BoxSeam',
    permissions: {
      'product:read': { label: 'Read Products', type: 'action' },
      'product:create': { label: 'Create Product', type: 'action' },
      'product:update': { label: 'Update Product', type: 'action' },
      'product:delete': { label: 'Delete Product', type: 'action' },
    }
  },
  sales: {
    label: 'Sales',
    icon: 'Receipt',
    permissions: {
      'sale:read': { label: 'Read Sales', type: 'action' },
      'sale:create': { label: 'Create Sale', type: 'action' },
    }
  },
  expenses: {
    label: 'Expenses',
    icon: 'CreditCard',
    permissions: {
      'expense:read': { label: 'Read Expenses', type: 'action' },
      'expense:create': { label: 'Create Expense', type: 'action' },
    }
  },
  expenseCategories: {
    label: 'Expense Categories',
    icon: 'Tag',
    permissions: {
      'expenseCategory:read': { label: 'Read Expense Categories', type: 'action' },
      'expenseCategory:create': { label: 'Create Expense Category', type: 'action' },
    }
  },
  salesAgents: {
    label: 'Sales Agents',
    icon: 'PersonBadge',
    permissions: {
      'salesAgent:read': { label: 'Read Sales Agents', type: 'action' },
      'salesAgent:create': { label: 'Create Sales Agent', type: 'action' },
    }
  },
  patients: {
    label: 'Patients',
    icon: 'PersonHeart',
    permissions: {
      'patient:read': { label: 'Read Patients', type: 'action' },
      'patient:create': { label: 'Create Patient', type: 'action' },
    }
  },
  auditLogs: {
    label: 'Audit Logs',
    icon: 'ClipboardData',
    permissions: {
      'auditLog:read': { label: 'Read Audit Logs', type: 'action' },
      'auditLog:create': { label: 'Create Audit Log', type: 'action' },
    }
  },
  settings: {
    label: 'Settings',
    icon: 'Gear',
    permissions: {
      'settings:read': { label: 'Read Settings', type: 'action' },
      'settings:create': { label: 'Create Setting', type: 'action' },
    }
  },
  reports: {
    label: 'Reports',
    icon: 'BarChart',
    permissions: {
      'report:read': { label: 'Read Reports', type: 'action' },
    }
  },
  backup: {
    label: 'Backup & Restore',
    icon: 'ArrowUpCircle',
    permissions: {
      'backup:read': { label: 'Download Backup', type: 'action' },
      'backup:restore': { label: 'Restore Backup', type: 'action' },
    }
  },
  language: {
    label: 'Language',
    icon: 'Translate',
    permissions: {
      'lang:read': { label: 'Read Languages', type: 'action' },
    }
  },
  accounts: {
    label: 'Accounts',
    icon: 'BarChart',
    permissions: {
      'account:read': { label: 'Read Accounts', type: 'action' },
    }
  },
};

// Helper functions
const getAllPermissions = () => {
  const permissions = [];
  Object.entries(PERMISSION_TREE).forEach(([module, moduleData]) => {
    Object.entries(moduleData.permissions).forEach(([permission, permissionData]) => {
      if (permission !== '*') {
        permissions.push({
          key: permission,
          module,
          ...permissionData
        });
      }
    });
  });
  return permissions;
};

// Expand '*' to all real permissions
const expandPermissions = (permissions) => {
  if (!permissions) return [];
  if (permissions.includes('*')) {
    return getAllPermissions().map(p => p.key);
  }
  return permissions;
};

const getPermissionsByModule = (module) => {
  return PERMISSION_TREE[module]?.permissions || {};
};

const getModulePermissions = (module) => {
  return Object.keys(PERMISSION_TREE[module]?.permissions || {});
};

const hasPermission = (userPermissions, requiredPermission) => {
  const expanded = expandPermissions(userPermissions);
  return expanded.includes(requiredPermission);
};

const hasAnyPermission = (userPermissions, requiredPermissions) => {
  const expanded = expandPermissions(userPermissions);
  return requiredPermissions.some(permission => expanded.includes(permission));
};

const hasAllPermissions = (userPermissions, requiredPermissions) => {
  const expanded = expandPermissions(userPermissions);
  return requiredPermissions.every(permission => expanded.includes(permission));
};

const getVisibleModules = (userPermissions) => {
  const expanded = expandPermissions(userPermissions);
  const visibleModules = [];
  Object.entries(PERMISSION_TREE).forEach(([module, moduleData]) => {
    const modulePermissions = Object.keys(moduleData.permissions);
    if (modulePermissions.some(permission => expanded.includes(permission))) {
      visibleModules.push(module);
    }
  });
  return visibleModules;
};

// Helper: Return permission tree as JSON
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
  getPermissionTree,
  expandPermissions
}; 