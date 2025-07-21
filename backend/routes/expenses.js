const express = require('express');
const router = express.Router();
const { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpensesStats } = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['expenses:list', 'expenses:view', 'expenses:read']), listExpenses);
router.get('/stats', authenticate, authorize(['expenses:list', 'expenses:view', 'expenses:read']), getExpensesStats);
router.get('/:id', authenticate, authorize(['expenses:view_details', 'expenses:view', 'expenses:read']), getExpense);
router.post('/', authenticate, authorize(['expenses:create']), createExpense);
router.put('/:id', authenticate, authorize(['expenses:edit']), updateExpense);
router.delete('/:id', authenticate, authorize(['expenses:delete']), deleteExpense);

module.exports = router; 