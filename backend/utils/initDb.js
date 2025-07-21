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