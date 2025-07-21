const express = require('express');
const router = express.Router();
const { listSettings, getSetting, createSetting, updateSetting, deleteSetting, uploadLogo, upload } = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['settings:view', 'settings:read']), listSettings);
router.get('/:id', authenticate, authorize(['settings:view', 'settings:read']), getSetting);
router.post('/', authenticate, authorize(['settings:general', 'settings:branding', 'settings:localization', 'settings:backup', 'settings:security', 'settings:notifications']), createSetting);
router.put('/:id', authenticate, authorize(['settings:general', 'settings:branding', 'settings:localization', 'settings:backup', 'settings:security', 'settings:notifications']), updateSetting);
router.delete('/:id', authenticate, authorize(['settings:delete']), deleteSetting);
router.post('/upload-logo', authenticate, authorize(['settings:branding']), upload.single('logo'), uploadLogo);

module.exports = router; 