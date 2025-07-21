const { AuditLog, User } = require('../models');
const { createAuditLog } = require('../utils/auditLogger');

const sampleActions = [
  { action: 'user:login', context: 'auth', description: 'User logged into the system' },
  { action: 'user:create', context: 'users', description: 'New user account created' },
  { action: 'user:update', context: 'users', description: 'User profile updated' },
  { action: 'product:create', context: 'products', description: 'New product added to inventory' },
  { action: 'product:update', context: 'products', description: 'Product information modified' },
  { action: 'sale:create', context: 'sales', description: 'New sale transaction completed' },
  { action: 'expense:create', context: 'expenses', description: 'New expense recorded' },
  { action: 'expense:approve', context: 'expenses', description: 'Expense approved by manager' },
  { action: 'patient:create', context: 'patients', description: 'New patient registered' },
  { action: 'sales_agent:create', context: 'sales_agents', description: 'New sales agent added' },
  { action: 'settings:update', context: 'settings', description: 'System settings modified' },
  { action: 'role:create', context: 'roles', description: 'New role created' },
  { action: 'role:update', context: 'roles', description: 'Role permissions updated' },
  { action: 'export', context: 'reports', description: 'Data exported to CSV' },
  { action: 'view', context: 'dashboard', description: 'Dashboard accessed' },
  { action: 'print', context: 'invoice', description: 'Invoice printed' },
  { action: 'download', context: 'reports', description: 'Report downloaded' },
  { action: 'user:logout', context: 'auth', description: 'User logged out of the system' }
];

const seedAuditLogs = async () => {
  try {
    // Get all users
    const users = await User.findAll();
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    console.log('Seeding audit logs...');

    // Create sample audit logs for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomAction = sampleActions[Math.floor(Math.random() * sampleActions.length)];
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));

      await createAuditLog(
        randomUser.id,
        randomAction.action,
        {
          description: randomAction.description,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resourceType: randomAction.context === 'users' ? 'User' : 
                       randomAction.context === 'products' ? 'Product' :
                       randomAction.context === 'sales' ? 'Sale' :
                       randomAction.context === 'expenses' ? 'Expense' :
                       randomAction.context === 'patients' ? 'Patient' :
                       randomAction.context === 'sales_agents' ? 'SalesAgent' :
                       randomAction.context === 'roles' ? 'Role' : null,
          resourceId: Math.floor(Math.random() * 1000) + 1
        },
        randomAction.context,
        randomAction.context === 'users' ? 'User' : 
        randomAction.context === 'products' ? 'Product' :
        randomAction.context === 'sales' ? 'Sale' :
        randomAction.context === 'expenses' ? 'Expense' :
        randomAction.context === 'patients' ? 'Patient' :
        randomAction.context === 'sales_agents' ? 'SalesAgent' :
        randomAction.context === 'roles' ? 'Role' : null,
        Math.floor(Math.random() * 1000) + 1
      );

      // Update the createdAt timestamp to the random date
      const latestLog = await AuditLog.findOne({
        where: { userId: randomUser.id },
        order: [['createdAt', 'DESC']]
      });
      
      if (latestLog) {
        await latestLog.update({ createdAt: randomDate });
      }
    }

    console.log('Audit logs seeded successfully!');
  } catch (error) {
    console.error('Error seeding audit logs:', error);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAuditLogs().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedAuditLogs }; 