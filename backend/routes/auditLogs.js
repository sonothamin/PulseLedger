const express = require('express');
const router = express.Router();
const { listLogs, getLog, createLog, deleteLog, deleteAllLogs, getFilterOptions } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['audit:list', 'audit:view', 'audit:read']), listLogs);
router.get('/filter-options', authenticate, authorize(['audit:list', 'audit:view', 'audit:read']), getFilterOptions);
router.delete('/delete-all', authenticate, authorize(['audit:purge_all', 'audit:purge']), deleteAllLogs);
router.get('/:id', authenticate, authorize(['audit:view_details', 'audit:view', 'audit:read']), getLog);
router.post('/', authenticate, authorize(['audit:list']), createLog);
router.delete('/:id', authenticate, authorize(['audit:purge']), deleteLog);

module.exports = router; 