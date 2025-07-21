const { Sale, SaleItem, Product, Expense, ExpenseCategory, SalesAgent, User, Patient } = require('../models');
const { Op } = require('sequelize');

const salesReport = async (req, res) => {
  const { start, end, category } = req.query;
  const where = {};
  if (start && end) where.createdAt = { [Op.between]: [start, end] };
  const sales = await Sale.findAll({ where, include: [SaleItem, Patient, SalesAgent, { model: User, as: 'Cashier' }] });
  let filtered = sales;
  if (category) {
    filtered = sales.filter(sale => sale.SaleItems.some(item => item.category === category));
  }
  const total = filtered.reduce((sum, sale) => sum + sale.total, 0);
  const byDate = {};
  filtered.forEach(sale => {
    const date = sale.createdAt.toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + sale.total;
  });
  res.json({ total, byDate, sales: filtered });
};

const expenseReport = async (req, res) => {
  const { start, end, category } = req.query;
  const where = {};
  if (start && end) where.createdAt = { [Op.between]: [start, end] };
  if (category) where.categoryId = category;
  const expenses = await Expense.findAll({ where, include: [ExpenseCategory] });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byDate = {};
  expenses.forEach(e => {
    const date = e.createdAt.toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + e.amount;
  });
  res.json({ total, byDate, expenses });
};

const agentPerformance = async (req, res) => {
  const { start, end, agentId } = req.query;
  const where = {};
  if (start && end) where.createdAt = { [Op.between]: [start, end] };
  if (agentId) where.salesAgentId = agentId;
  const sales = await Sale.findAll({ where, include: [SalesAgent, SaleItem] });
  const byAgent = {};
  sales.forEach(sale => {
    const agent = sale.SalesAgent ? sale.SalesAgent.name : 'Unassigned';
    byAgent[agent] = (byAgent[agent] || 0) + sale.total;
  });
  res.json({ byAgent, sales });
};

module.exports = { salesReport, expenseReport, agentPerformance }; 