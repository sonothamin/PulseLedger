const express = require('express');
const router = express.Router();
const { listSales, getSale, createSale, updateSale, deleteSale, getSalesStats, recalculateSale } = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['sales:list', 'sales:view', 'sales:read']), listSales);
router.get('/stats', authenticate, authorize(['sales:list', 'sales:view', 'sales:read']), getSalesStats);
router.get('/:id', authenticate, authorize(['sales:view_details', 'sales:view', 'sales:read']), getSale);
router.post('/', authenticate, authorize(['sales:create']), createSale);
router.put('/:id', authenticate, authorize(['sales:edit']), updateSale); // Not typically allowed
router.delete('/:id', authenticate, authorize(['sales:delete']), deleteSale);
router.post('/:id/recalculate', authenticate, authorize(['sales:edit']), recalculateSale);

module.exports = router; 