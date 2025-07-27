const express = require('express');
const router = express.Router();
const { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpensesStats } = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['expense:read', '*']), listExpenses);
router.get('/stats', authenticate, authorize(['expenses:list', 'expenses:view', 'expenses:read']), getExpensesStats);
router.get('/:id', authenticate, authorize(['expense:read', '*']), getExpense);
router.post('/', authenticate, authorize(['expense:create', '*']), createExpense);
router.put('/:id', authenticate, authorize(['expense:update', '*']), updateExpense);
router.delete('/:id', authenticate, authorize(['expense:delete', '*']), deleteExpense);

module.exports = router; 