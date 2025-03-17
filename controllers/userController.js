const User = require('../models/User');
const bcrypt = require('bcrypt');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Get users managed by current user (Admin and Manager)
exports.getManagedUsers = async (req, res) => {
  try {
    const managerId = req.user.id;
    const managedUsers = await User.find({ managerId });
    
    res.status(200).json(managedUsers);
  } catch (error) {
    console.error('Get managed users error:', error);
    res.status(500).json({ message: 'Server error while fetching managed users' });
  }
};

// Create new user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, name, role, managerId, active } = req.body;
    
    // Check if username or email already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      name,
      role: role || 'user',
      managerId,
      active: active !== undefined ? active : true
    });
    
    await newUser.save();
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error while creating user' });
  }
};

// Update existing user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updates = req.body;
    
    // If updating password, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Admin users cannot be deleted (except by themselves)
    if (user.role === 'admin' && String(req.user.id) !== String(userId)) {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};
