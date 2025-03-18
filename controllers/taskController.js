const Task = require('../models/Task');
const User = require('../models/User');
const mongoose=require("mongoose")
// Helper to get populated task with creator and assignee info
const getPopulatedTask = async (taskId) => {
  return await Task.findById(taskId)
    .populate('creatorId', 'name')
    .populate('assigneeId', 'name');
};

// Format task for API response
const formatTaskResponse = (task) => {
  return {
    ...task.toObject(),
    creator: task.creatorId ? { id: task.creatorId._id, name: task.creatorId.name } : null,
    assignee: task.assigneeId ? { id: task.assigneeId._id, name: task.assigneeId.name } : null,
    creatorId: task.creatorId ? task.creatorId._id : null,
    assigneeId: task.assigneeId ? task.assigneeId._id : null
  };
};

// Helper: Check if user has permission for a task
const checkPermissions = async (user, task) => {
  if (user.role === 'admin') return true;

  if (user.role === 'user' && String(task.assigneeId) === user._id) return true;

  if (user.role === 'manager') {
    const managedUserIds = await User.find({ managerId: user._id }).distinct('_id');
    if (managedUserIds.includes(String(task.assigneeId)) || String(task.assigneeId) === user._id) return true;
  }

  return false;
};

// Get all tasks (filtered by role)
exports.getTasks = async (req, res) => {
  try {
    let tasks = [];
    const userId = req.user.id;
    console.log(userId,"userID")

    console.log("Fetching tasks for user:", req.user);

    switch (req.user.role) {
      case 'admin':
        tasks = await Task.find()
          .populate('creatorId', 'name')
          .populate('assigneeId', 'name');
        break;

      case 'manager':
        // Find all users managed by the manager
        const managedUserIds = await User.find({ managerId: userId }).distinct('_id');

        console.log("Managed Users:", managedUserIds);

        tasks = await Task.find({
          $or: [{ assigneeId: userId }, { assigneeId: { $in: managedUserIds } }]
        })
          .populate('creatorId', 'name')
          .populate('assigneeId', 'name');
        break;

      default:
        // Ensure userId is an ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        tasks = await Task.find({ assigneeId: userObjectId })
          .populate('creatorId', 'name')
          .populate('assigneeId', 'name');

        console.log("Tasks found:", tasks);
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};
// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await getPopulatedTask(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasPermission = await checkPermissions(req.user, task);
    if (!hasPermission) return res.status(403).json({ message: 'Access denied' });

    res.status(200).json(formatTaskResponse(task));
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching the task' });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, assigneeId, priority } = req.body;
    const userId = req.user._id;

    let finalAssigneeId = assigneeId || userId;

    if (req.user.role === 'user' && assigneeId && assigneeId !== userId) {
      return res.status(403).json({ message: 'Users can only create tasks for themselves' });
    }

    if (req.user.role === 'manager' && assigneeId !== userId) {
      const validAssignee = await User.findOne({ _id: assigneeId, role: { $in: ['user', 'manager'] } });
      if (!validAssignee) {
        return res.status(403).json({ message: 'Managers can only assign tasks to users or other managers' });
      }
    }

    const newTask = new Task({ title, description, status, dueDate, creatorId: userId, assigneeId: finalAssigneeId, priority });
    await newTask.save();

    const populatedTask = await getPopulatedTask(newTask._id);
    res.status(201).json(formatTaskResponse(populatedTask));
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating the task' });
  }
};

// Update existing task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasPermission = await checkPermissions(req.user, task);
    if (!hasPermission) return res.status(403).json({ message: 'Access denied' });

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    const populatedTask = await getPopulatedTask(updatedTask._id);

    res.status(200).json(formatTaskResponse(populatedTask));
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating the task' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasPermission = await checkPermissions(req.user, task);
    if (!hasPermission) return res.status(403).json({ message: 'Access denied' });

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting the task' });
  }
};