const express = require('express');
const router = express.Router();
const { backup, restore } = require('../controllers/backupController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['backup:download', 'backup:view']), backup);
router.post('/restore', authenticate, authorize(['backup:restore']), restore);

module.exports = router; 