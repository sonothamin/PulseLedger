const express = require('express');
const router = express.Router();
const { salesReport, expenseReport, agentPerformance } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/sales', authenticate, authorize(['report:read', '*']), salesReport);
router.get('/expenses', authenticate, authorize(['report:read', '*']), expenseReport);
router.get('/agent-performance', authenticate, authorize(['report:read', '*']), agentPerformance);

module.exports = router; 