const express = require('express');
const router = express.Router();
const { listPatients, getPatient, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['patients:list', 'patients:view', 'patients:read']), listPatients);
router.get('/:id', authenticate, authorize(['patients:view_details', 'patients:view']), getPatient);
router.post('/', authenticate, authorize(['patients:create']), createPatient);
router.put('/:id', authenticate, authorize(['patients:edit']), updatePatient);
router.delete('/:id', authenticate, authorize(['patients:delete']), deletePatient);

module.exports = router; 