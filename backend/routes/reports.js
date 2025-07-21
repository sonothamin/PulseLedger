const express = require('express');
const router = express.Router();
const { salesReport, expenseReport, agentPerformance } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/sales', authenticate, authorize(['reports:sales', 'reports:view', 'reports:read']), salesReport);
router.get('/expenses', authenticate, authorize(['reports:expenses', 'reports:view', 'reports:read']), expenseReport);
router.get('/agent-performance', authenticate, authorize(['reports:performance', 'reports:view', 'reports:read']), agentPerformance);

module.exports = router; 