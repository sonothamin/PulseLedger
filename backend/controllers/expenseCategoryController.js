const { ExpenseCategory } = require('../models');
const { createAuditLog } = require('../utils/auditLogger');

const listCategories = async (req, res) => {
  const categories = await ExpenseCategory.findAll();
  res.json(categories);
};

const getCategory = async (req, res) => {
  const category = await ExpenseCategory.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

const createCategory = async (req, res) => {
  const { name, description, isActive } = req.body;
  const category = await ExpenseCategory.create({ name, description, isActive });
  
  // Create audit log for category creation
  await createAuditLog(
    req.user.id,
    'expense_category:create',
    {
      description: `Created expense category "${name}"`,
      categoryId: category.id,
      name,
      description,
      isActive,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'expenses',
    'ExpenseCategory',
    category.id
  );
  
  res.status(201).json(category);
};

const updateCategory = async (req, res) => {
  const category = await ExpenseCategory.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const { name, description, isActive } = req.body;
  await category.update({ name, description, isActive });
  
  // Create audit log for category update
  await createAuditLog(
    req.user.id,
    'expense_category:update',
    {
      description: `Updated expense category "${name}"`,
      categoryId: category.id,
      name,
      description,
      isActive,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'expenses',
    'ExpenseCategory',
    category.id
  );
  
  res.json(category);
};

const deleteCategory = async (req, res) => {
  const category = await ExpenseCategory.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  
  const categoryId = category.id;
  const categoryName = category.name;
  
  await category.destroy();
  
  // Create audit log for category deletion
  await createAuditLog(
    req.user.id,
    'expense_category:delete',
    {
      description: `Deleted expense category "${categoryName}"`,
      categoryId,
      name: categoryName,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'expenses',
    'ExpenseCategory',
    categoryId
  );
  
  res.json({ message: 'Category deleted' });
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory }; 