const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// Login route - POST /api/auth/login
router.post('/login', authController.login);

// Get current user - GET /api/auth/me
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
