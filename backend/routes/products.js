const express = require('express');
const router = express.Router();
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['products:list', 'products:view', 'products:read']), listProducts);
router.get('/:id', authenticate, authorize(['products:view_details', 'products:view', 'products:read']), getProduct);
router.post('/', authenticate, authorize(['products:create']), createProduct);
router.put('/:id', authenticate, authorize(['products:edit']), updateProduct);
router.delete('/:id', authenticate, authorize(['products:delete']), deleteProduct);

module.exports = router; 