const express = require('express');
const router = express.Router();
const { listCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/expenseCategoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['expenseCategory:read', '*']), listCategories);
router.get('/:id', authenticate, authorize(['expenseCategory:read', '*']), getCategory);
router.post('/', authenticate, authorize(['expenseCategory:create', '*']), createCategory);
router.put('/:id', authenticate, authorize(['expenseCategory:update', '*']), updateCategory);
router.delete('/:id', authenticate, authorize(['expenseCategory:delete', '*']), deleteCategory);

module.exports = router; 