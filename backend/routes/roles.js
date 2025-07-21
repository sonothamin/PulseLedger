const express = require('express');
const router = express.Router();
const { listRoles, getRole, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/auth');
const { getPermissionTree } = require('../utils/permissions');

router.get('/', authenticate, authorize(['roles:list', 'roles:view', 'roles:read']), listRoles);
router.get('/permissions', authenticate, authorize(['roles:view', 'roles:read']), (req, res) => {
  res.json(getPermissionTree());
});
router.get('/:id', authenticate, authorize(['roles:view_details', 'roles:view', 'roles:read']), getRole);
router.post('/', authenticate, authorize(['roles:create']), createRole);
router.put('/:id', authenticate, authorize(['roles:edit']), updateRole);
router.delete('/:id', authenticate, authorize(['roles:delete']), deleteRole);

module.exports = router; 