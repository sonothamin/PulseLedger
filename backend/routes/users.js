const express = require('express');
const router = express.Router();
const { listUsers, createUser, getUser, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['users:list', 'users:view', 'users:read']), listUsers);
router.post('/', authenticate, authorize(['users:create']), createUser);
router.get('/:id', authenticate, authorize(['users:view_details', 'users:view', 'users:read']), getUser);
router.put('/:id', authenticate, authorize(['users:edit']), updateUser);
router.delete('/:id', authenticate, authorize(['users:delete']), deleteUser);
router.post('/:id/password', authenticate, authorize(['users:change_password', 'users:edit']), changePassword);

module.exports = router; 