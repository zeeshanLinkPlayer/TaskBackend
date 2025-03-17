const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All task routes require authentication
router.use(authenticateToken);

// Get all tasks - GET /api/tasks
router.get('/', taskController.getTasks);

// Get task by ID - GET /api/tasks/:id
router.get('/:id', taskController.getTaskById);

// Create new task - POST /api/tasks
router.post('/', taskController.createTask);

// Update task - PUT /api/tasks/:id
router.put('/:id', taskController.updateTask);

// Delete task - DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
