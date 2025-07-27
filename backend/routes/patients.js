const express = require('express');
const router = express.Router();
const { listPatients, getPatient, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['patient:read', '*']), listPatients);
router.get('/:id', authenticate, authorize(['patient:read', '*']), getPatient);
router.post('/', authenticate, authorize(['patient:create', '*']), createPatient);
router.put('/:id', authenticate, authorize(['patient:update', '*']), updatePatient);
router.delete('/:id', authenticate, authorize(['patient:delete', '*']), deletePatient);

module.exports = router; 