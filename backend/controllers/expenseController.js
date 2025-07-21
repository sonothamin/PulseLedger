const { Expense, ExpenseCategory, User } = require('../models');
const { Op } = require('sequelize');
const { broadcast } = require('../realtime');
const { createAuditLog } = require('../utils/auditLogger');

const listExpenses = async (req, res) => {
  const { start, end } = req.query;
  const where = {};
  
  if (start && end) {
    where.createdAt = {
      [Op.gte]: new Date(start),
      [Op.lte]: new Date(end + 'T23:59:59.999Z')
    };
  }
  
  const expenses = await Expense.findAll({ 
    where,
    include: [ExpenseCategory, { model: User, as: 'Creator' }, { model: User, as: 'Approver' }],
    order: [['createdAt', 'DESC']]
  });
  res.json(expenses);
};

const getExpensesStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total expenses
    const totalExpensesResult = await Expense.findOne({
      attributes: [
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'totalExpenses']
      ]
    });

    // Get today's expenses
    const todayExpensesResult = await Expense.findOne({
      attributes: [
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'todayExpenses']
      ],
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const totalExpenses = parseFloat(totalExpensesResult?.dataValues?.totalExpenses || 0);
    const todayExpenses = parseFloat(todayExpensesResult?.dataValues?.todayExpenses || 0);

    res.json({
      totalExpenses,
      todayExpenses
    });
  } catch (error) {
    console.error('Error getting expenses stats:', error);
    res.status(500).json({ message: 'Failed to get expenses statistics' });
  }
};

const getExpense = async (req, res) => {
  const expense = await Expense.findByPk(req.params.id, { include: [ExpenseCategory, { model: User, as: 'Creator' }, { model: User, as: 'Approver' }] });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json(expense);
};

const createExpense = async (req, res) => {
  const { amount, categoryId, description, approvedBy, recipient } = req.body;
  const createdBy = req.user.id;
  const expense = await Expense.create({ amount, categoryId, description, createdBy, approvedBy, recipient });
  
  // Create audit log for expense creation
  await createAuditLog(
    createdBy,
    'expense:create',
    {
      description: `Created expense #${expense.id} for $${parseFloat(amount).toFixed(2)}`,
      expenseId: expense.id,
      amount: parseFloat(amount),
      categoryId,
      description,
      recipient,
      approvedBy,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'expenses',
    'Expense',
    expense.id
  );
  
  broadcast('expense:new', { expenseId: expense.id });
  res.status(201).json(expense);
};

const updateExpense = async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  const { amount, categoryId, description, approvedBy, recipient } = req.body;
  await expense.update({ amount, categoryId, description, approvedBy, recipient });
  
  // Create audit log for expense update
  await createAuditLog(
    req.user.id,
    'expense:update',
    {
      description: `Updated expense #${expense.id} for $${parseFloat(amount).toFixed(2)}`,
      expenseId: expense.id,
      amount: parseFloat(amount),
      categoryId,
      description,
      recipient,
      approvedBy,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'expenses',
    'Expense',
    expense.id
  );
  
  res.json(expense);
};

const deleteExpense = async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  
  const expenseId = expense.id;
  const expenseAmount = expense.amount;
  const expenseRecipient = expense.recipient;
  
  await expense.destroy();
  
  // Create audit log for expense deletion
  await createAuditLog(
    req.user.id,
    'expense:delete',
    {
      description: `Deleted expense #${expenseId} for $${expenseAmount.toFixed(2)}`,
      expenseId,
      amount: expenseAmount,
      recipient: expenseRecipient,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'expenses',
    'Expense',
    expenseId
  );
  
  res.json({ message: 'Expense deleted' });
};

module.exports = { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpensesStats }; 