const express = require('express');
const router = express.Router();
const { listAgents, getAgent, createAgent, updateAgent, deleteAgent } = require('../controllers/salesAgentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['sales_agents:list', 'sales_agents:view', 'sales_agents:read']), listAgents);
router.get('/:id', authenticate, authorize(['sales_agents:view_details', 'sales_agents:view']), getAgent);
router.post('/', authenticate, authorize(['sales_agents:create']), createAgent);
router.put('/:id', authenticate, authorize(['sales_agents:edit']), updateAgent);
router.delete('/:id', authenticate, authorize(['sales_agents:delete']), deleteAgent);

module.exports = router; 