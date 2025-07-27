const express = require('express');
const router = express.Router();
const { listSales, getSale, createSale, updateSale, deleteSale, getSalesStats, recalculateSale } = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['sale:read', '*']), listSales);
router.get('/stats', authenticate, authorize(['sale:read', '*']), getSalesStats);
router.get('/:id', authenticate, authorize(['sale:read', '*']), getSale);
router.post('/', authenticate, authorize(['sale:create', '*']), createSale);
router.put('/:id', authenticate, authorize(['sale:update', '*']), updateSale); // Not typically allowed
router.delete('/:id', authenticate, authorize(['sale:delete', '*']), deleteSale);
router.post('/:id/recalculate', authenticate, authorize(['sale:update', '*']), recalculateSale);

module.exports = router; 