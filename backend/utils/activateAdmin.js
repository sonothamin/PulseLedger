const { sequelize, User, Role } = require('../models');

async function activateAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Find and update admin user
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      await adminUser.update({
        isActive: true,
        lastLoginAt: new Date()
      });
      console.log('Admin user activated and last login updated.');
    } else {
      console.log('Admin user not found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error activating admin user:', err);
    process.exit(1);
  }
}

activateAdmin(); 