const express = require('express');
const router = express.Router();
const { listUsers, createUser, getUser, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['user:read', '*']), listUsers);
router.post('/', authenticate, authorize(['user:create', '*']), createUser);
router.get('/:id', authenticate, authorize(['user:read', '*']), getUser);
router.put('/:id', authenticate, authorize(['user:update', '*']), updateUser);
router.delete('/:id', authenticate, authorize(['user:delete', '*']), deleteUser);
router.post('/:id/password', authenticate, authorize(['users:change_password', 'users:edit']), changePassword);

module.exports = router; 