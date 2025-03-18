const User = require("../models/User");
const jwt = require("jsonwebtoken");
const dotenv=require("dotenv")
dotenv.config()
// JWT Config
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "1d";
console.log(JWT_SECRET,"jwtsecret")
// Login controller
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: "This account has been deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name, email: user.email, managerId: user.managerId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(200).json({ success: true, message: "Login successful", token, user: user.toJSON() });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.log(user,"user")
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Get current user error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching user profile" });
  }
};
