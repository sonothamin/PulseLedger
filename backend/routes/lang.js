const express = require('express');
const router = express.Router();
const { listLanguages, getLanguage } = require('../controllers/langController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['settings:localization']), listLanguages);
router.get('/:lang', authenticate, authorize(['settings:localization']), getLanguage);

module.exports = router; 