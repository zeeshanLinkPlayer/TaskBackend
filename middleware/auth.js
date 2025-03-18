const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET,"jwtsectetkey")
// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log("Decoded Token:", token);  // Debugging

  // If no token is provided
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("Decoded Token:", decoded);  // Debugging

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
