const express = require('express');
const router = express.Router();
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['product:read', '*']), listProducts);
router.get('/:id', authenticate, authorize(['product:read', '*']), getProduct);
router.post('/', authenticate, authorize(['product:create', '*']), createProduct);
router.put('/:id', authenticate, authorize(['product:update', '*']), updateProduct);
router.delete('/:id', authenticate, authorize(['product:delete', '*']), deleteProduct);

module.exports = router; 