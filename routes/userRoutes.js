const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All user routes require authentication
// router.use(authenticateToken);

// Get all users (Admin only) - GET /api/users
router.get("/", authenticateToken,roleCheck(["admin"]), userController.getAllUsers);

// Get managed users (Admin and Manager) - GET /api/users/managed
router.get('/managed', authenticateToken, roleCheck(['admin', 'manager']), userController.getManagedUsers);

// Get user by ID (Admin only) - GET /api/users/:id
router.get('/:id',authenticateToken, roleCheck(['admin']), userController.getUserById);

// Create new user (Admin only) - POST /api/users
router.post('/', authenticateToken, roleCheck(['admin']), userController.createUser);

// Update user (Admin only) - PUT /api/users/:id
router.put('/:id', authenticateToken, roleCheck(['admin']), userController.updateUser);

// Delete user (Admin only) - DELETE /api/users/:id
router.delete('/:id',authenticateToken, roleCheck(['admin']), userController.deleteUser);

module.exports = router;
