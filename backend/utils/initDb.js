const { sequelize, User, Role, Settings } = require('../models');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    await sequelize.sync({ force: true });
    // Ensure default admin role exists
    let adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = await Role.create({ name: 'admin', description: 'Administrator', permissions: ['*'] });
      console.log('Default admin role created.');
    }
    // Ensure default admin user exists
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const hash = await bcrypt.hash(defaultPassword, 10);
      adminUser = await User.create({
        username: 'admin',
        password: hash,
        name: 'Administrator',
        email: 'admin@localhost',
        isActive: true,
        language: 'en',
        roleId: adminRole.id,
      });
      console.log(`Default admin user created. Username: admin, Password: ${defaultPassword}`);
    }
    
    // Ensure default roles exist
    const rolesToCreate = [
      {
        name: 'admin',
        description: 'Administrator',
        permissions: ['*']
      },
      {
        name: 'cashier',
        description: 'Cashier',
        permissions: [
          'dashboard:view', 'pos:view', 'sale:read', 'sale:create',
          'expense:read', 'expense:create', 'product:read', 'patient:read',
          'user:read', 'report:read', 'salesAgent:read', 'expenseCategory:read'
        ]
      },
      {
        name: 'manager',
        description: 'Manager',
        permissions: [
          'dashboard:view', 'pos:view', 'sale:read', 'sale:create', 'sale:update', 'sale:delete',
          'expense:read', 'expense:create', 'expense:update', 'expense:delete',
          'product:read', 'product:create', 'product:update', 'product:delete',
          'patient:read', 'patient:create', 'patient:update', 'patient:delete',
          'user:read', 'user:create', 'user:update', 'user:delete',
          'role:read', 'role:create', 'role:update', 'role:delete',
          'account:read', 'account:manage', 'report:read', 'salesAgent:read', 'salesAgent:create',
          'expenseCategory:read', 'expenseCategory:create',
          'auditLog:read', 'auditLog:create',
          'settings:read', 'settings:create',
          'backup:read', 'backup:restore',
          'lang:read'
        ]
      },
      {
        name: 'accounts',
        description: 'Accounts Department',
        permissions: [
          'account:manage', 'account:read', 'report:read', 'expense:read', 'sale:read',
          'product:read', 'patient:read', 'user:read', 'salesAgent:read', 'expenseCategory:read'
        ]
      }
    ];
    for (const roleData of rolesToCreate) {
      let role = await Role.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = await Role.create(roleData);
        console.log(`Default role created: ${roleData.name}`);
      }
    }

    // Initialize default settings
    const defaultSettings = [
      {
        key: 'localization',
        value: {
          language: process.env.DEFAULT_LANGUAGE || 'en',
          dateFormat: process.env.DEFAULT_DATE_FORMAT || 'DD/MM/YYYY',
          timeFormat: process.env.DEFAULT_TIME_FORMAT || '12h',
          timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Dhaka'
        },
        description: 'Localization settings for language, date/time formats, and timezone'
      },
      {
        key: 'branding',
        value: {
          hospitalName: process.env.DEFAULT_HOSPITAL_NAME || 'PulseLedger Hospital',
          address: process.env.DEFAULT_HOSPITAL_ADDRESS || '123 Medical Center Drive, Dhaka, Bangladesh',
          contact: process.env.DEFAULT_HOSPITAL_CONTACT || '+880 2 1234 5678',
          tagline: process.env.DEFAULT_HOSPITAL_TAGLINE || 'Excellence in Healthcare Management'
        },
        description: 'Hospital branding information including name, address, contact, and tagline'
      },
      {
        key: 'theme',
        value: {
          mode: 'system',
          primaryColor: '#0d6efd',
          accentColor: '#6c757d'
        },
        description: 'Theme settings for light/dark mode and color preferences'
      },
      {
        key: 'currency',
        value: {
          symbol: process.env.DEFAULT_CURRENCY_SYMBOL || '৳',
          code: process.env.DEFAULT_CURRENCY_CODE || 'BDT',
          name: process.env.DEFAULT_CURRENCY_NAME || 'Bangladeshi Taka',
          position: process.env.DEFAULT_CURRENCY_POSITION || 'before'
        },
        description: 'Currency settings for symbol, code, name, and display position'
      }
    ];

    for (const setting of defaultSettings) {
      await Settings.create(setting);
    }
    console.log('Default settings initialized.');
    
    console.log('Database synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing database:', err);
    process.exit(1);
  }
}

initDb(); 