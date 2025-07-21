const { AuditLog } = require('../models');

// Action mappings for friendly display
const ACTION_MAPPINGS = {
  // User actions
  'user:login': 'User Login',
  'user:logout': 'User Logout',
  'user:create': 'Create User',
  'user:update': 'Update User',
  'user:delete': 'Delete User',
  'user:password_change': 'Change Password',
  
  // Role actions
  'role:create': 'Create Role',
  'role:update': 'Update Role',
  'role:delete': 'Delete Role',
  
  // Product actions
  'product:create': 'Create Product',
  'product:update': 'Update Product',
  'product:delete': 'Delete Product',
  
  // Sale actions
  'sale:create': 'Create Sale',
  'sale:update': 'Update Sale',
  'sale:delete': 'Delete Sale',
  'sale:refund': 'Process Refund',
  
  // Expense actions
  'expense:create': 'Create Expense',
  'expense:update': 'Update Expense',
  'expense:delete': 'Delete Expense',
  'expense:approve': 'Approve Expense',
  'expense_category:create': 'Create Expense Category',
  'expense_category:update': 'Update Expense Category',
  'expense_category:delete': 'Delete Expense Category',
  
  // Patient actions
  'patient:create': 'Create Patient',
  'patient:update': 'Update Patient',
  'patient:delete': 'Delete Patient',
  
  // Sales Agent actions
  'sales_agent:create': 'Create Sales Agent',
  'sales_agent:update': 'Update Sales Agent',
  'sales_agent:delete': 'Delete Sales Agent',
  
  // Settings actions
  'settings:update': 'Update Settings',
  'settings:backup': 'Create Backup',
  'settings:restore': 'Restore Backup',
  
  // System actions
  'system:startup': 'System Startup',
  'system:shutdown': 'System Shutdown',
  'system:error': 'System Error',
  
  // Audit actions
  'audit:purge_all': 'Purge All Audit Logs',
  
  // Generic actions
  'view': 'View Data',
  'export': 'Export Data',
  'import': 'Import Data',
  'print': 'Print Document',
  'download': 'Download File',
  'upload': 'Upload File'
};

// Context mappings for friendly display
const CONTEXT_MAPPINGS = {
  'users': 'User Management',
  'roles': 'Role Management',
  'products': 'Product Management',
  'sales': 'Sales Management',
  'expenses': 'Expense Management',
  'patients': 'Patient Management',
  'sales_agents': 'Sales Agent Management',
  'settings': 'System Settings',
  'reports': 'Reports',
  'dashboard': 'Dashboard',
  'pos': 'Point of Sale',
  'accounts': 'Accounts',
  'auth': 'Authentication',
  'system': 'System'
};

/**
 * Create an audit log entry
 * @param {number} userId - The ID of the user performing the action
 * @param {string} action - The action being performed
 * @param {object} details - Additional details about the action
 * @param {string} context - The context/module where the action occurred
 * @param {string} resourceType - Type of resource being acted upon
 * @param {number} resourceId - ID of the resource being acted upon
 */
const createAuditLog = async (userId, action, details = {}, context = null, resourceType = null, resourceId = null) => {
  try {
    const enhancedDetails = {
      ...details,
      context: context || 'system',
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      friendlyAction: ACTION_MAPPINGS[action] || action,
      friendlyContext: CONTEXT_MAPPINGS[context] || context
    };

    await AuditLog.create({
      userId,
      action,
      details: enhancedDetails
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Get friendly action name
 * @param {string} action - The action code
 * @returns {string} - Friendly action name
 */
const getFriendlyAction = (action) => {
  return ACTION_MAPPINGS[action] || action;
};

/**
 * Get friendly context name
 * @param {string} context - The context code
 * @returns {string} - Friendly context name
 */
const getFriendlyContext = (context) => {
  return CONTEXT_MAPPINGS[context] || context;
};

module.exports = {
  createAuditLog,
  getFriendlyAction,
  getFriendlyContext,
  ACTION_MAPPINGS,
  CONTEXT_MAPPINGS
}; 