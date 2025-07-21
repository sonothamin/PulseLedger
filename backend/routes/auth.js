const express = require('express');
const router = express.Router();
const { login, refresh, logout, register, me } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/refresh', refresh);
router.get('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.post('/register', authenticate, authorize(['user:create']), register); // Only admin or privileged users
router.get('/me', authenticate, me);

module.exports = router; 