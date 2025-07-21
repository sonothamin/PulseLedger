const { sequelize, DataTypes } = require('../config/database');

const Role = require('./Role')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const SupplementaryProduct = require('./SupplementaryProduct')(sequelize, DataTypes);
const Patient = require('./Patient')(sequelize, DataTypes);
const SalesAgent = require('./SalesAgent')(sequelize, DataTypes);
const Sale = require('./Sale')(sequelize, DataTypes);
const SaleItem = require('./SaleItem')(sequelize, DataTypes);
const Expense = require('./Expense')(sequelize, DataTypes);
const ExpenseCategory = require('./ExpenseCategory')(sequelize, DataTypes);
const AuditLog = require('./AuditLog')(sequelize, DataTypes);
const Settings = require('./Settings')(sequelize, DataTypes);

// Associations
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

Product.hasMany(SupplementaryProduct, { foreignKey: 'parentProductId' });
Product.hasMany(SupplementaryProduct, { foreignKey: 'supplementaryProductId' });

Sale.belongsTo(Patient, { foreignKey: 'patientId' });
Sale.belongsTo(SalesAgent, { foreignKey: 'salesAgentId' });
Sale.belongsTo(User, { as: 'Cashier', foreignKey: 'cashierId' });
Sale.hasMany(SaleItem, { foreignKey: 'saleId' });

SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });

Expense.belongsTo(ExpenseCategory, { foreignKey: 'categoryId' });
Expense.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });
Expense.belongsTo(User, { as: 'Approver', foreignKey: 'approvedBy' });

AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Role,
  User,
  Product,
  SupplementaryProduct,
  Patient,
  SalesAgent,
  Sale,
  SaleItem,
  Expense,
  ExpenseCategory,
  AuditLog,
  Settings,
}; 