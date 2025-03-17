const Task = require('../models/Task');
const User = require('../models/User');

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

// Get all tasks (filtered by role)
exports.getTasks = async (req, res) => {
  try {
    let tasks;
    const userId = req.user.id;
    
    switch (req.user.role) {
      case 'admin':
        // Admin can see all tasks
        tasks = await Task.find()
          .populate('creatorId', 'name')
          .populate('assigneeId', 'name');
        break;
      
      case 'manager':
        // Manager can see their tasks and tasks of their team
        const managedUsers = await User.find({ managerId: userId });
        const managedUserIds = managedUsers.map(user => user._id);
        
        tasks = await Task.find({
          $or: [
            { assigneeId: userId },
            { assigneeId: { $in: managedUserIds } }
          ]
        })
        .populate('creatorId', 'name')
        .populate('assigneeId', 'name');
        break;
      
      default:
        // Regular user can only see their own tasks
        tasks = await Task.find({ assigneeId: userId })
          .populate('creatorId', 'name')
          .populate('assigneeId', 'name');
    }
    
    // Format task data for response
    const formattedTasks = tasks.map(formatTaskResponse);
    
    res.status(200).json(formattedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    
    const task = await getPopulatedTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task
    if (req.user.role === 'user' && String(task.assigneeId._id) !== userId) {
      return res.status(403).json({ message: 'You do not have permission to view this task' });
    }
    
    if (req.user.role === 'manager') {
      const managedUsers = await User.find({ managerId: userId });
      const managedUserIds = managedUsers.map(user => String(user._id));
      
      const isAssigneeManaged = managedUserIds.includes(String(task.assigneeId._id));
      const isUserAssignee = String(task.assigneeId._id) === userId;
      
      if (!isUserAssignee && !isAssigneeManaged) {
        return res.status(403).json({ message: 'You do not have permission to view this task' });
      }
    }
    
    res.status(200).json(formatTaskResponse(task));
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching the task' });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, status, dueDate, assigneeId } = req.body;
    
    // Users can only create tasks for themselves
    if (req.user.role === 'user' && assigneeId !== userId) {
      return res.status(403).json({ message: 'Regular users can only create tasks for themselves' });
    }
    
    // Managers can only create tasks for themselves or their team
    if (req.user.role === 'manager' && assigneeId !== userId) {
      const managedUsers = await User.find({ managerId: userId });
      const managedUserIds = managedUsers.map(user => String(user._id));
      
      if (!managedUserIds.includes(String(assigneeId))) {
        return res.status(403).json({ message: 'You can only assign tasks to yourself or your team members' });
      }
    }
    
    // Create the task
    const newTask = new Task({
      title,
      description,
      status,
      dueDate,
      creatorId: userId,
      assigneeId
    });
    
    await newTask.save();
    
    // Get populated task data
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
    const taskId = req.params.id;
    const userId = req.user.id;
    
    // Check if task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check permissions based on role
    if (req.user.role === 'user' && String(task.assigneeId) !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }
    
    if (req.user.role === 'manager') {
      const isCreator = String(task.creatorId) === userId;
      const isAssignee = String(task.assigneeId) === userId;
      
      if (!isCreator && !isAssignee) {
        const managedUsers = await User.find({ managerId: userId });
        const managedUserIds = managedUsers.map(user => String(user._id));
        
        if (!managedUserIds.includes(String(task.assigneeId))) {
          return res.status(403).json({ message: 'You do not have permission to update this task' });
        }
      }
    }
    
    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: req.body },
      { new: true }
    );
    
    // Get populated task data
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
    const taskId = req.params.id;
    const userId = req.user.id;
    
    // Check if task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check permissions based on role
    if (req.user.role === 'user' && String(task.creatorId) !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }
    
    if (req.user.role === 'manager') {
      const isCreator = String(task.creatorId) === userId;
      
      if (!isCreator) {
        const managedUsers = await User.find({ managerId: userId });
        const managedUserIds = managedUsers.map(user => String(user._id));
        
        const isCreatorManaged = managedUserIds.includes(String(task.creatorId));
        
        if (!isCreatorManaged) {
          return res.status(403).json({ message: 'You do not have permission to delete this task' });
        }
      }
    }
    
    // Delete the task
    await Task.findByIdAndDelete(taskId);
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting the task' });
  }
};
