const express = require('express');
const router = express.Router();
const { listAgents, getAgent, createAgent, updateAgent, deleteAgent } = require('../controllers/salesAgentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['salesAgent:read', '*']), listAgents);
router.get('/:id', authenticate, authorize(['salesAgent:read', '*']), getAgent);
router.post('/', authenticate, authorize(['salesAgent:create', '*']), createAgent);
router.put('/:id', authenticate, authorize(['salesAgent:update', '*']), updateAgent);
router.delete('/:id', authenticate, authorize(['salesAgent:delete', '*']), deleteAgent);

module.exports = router; 