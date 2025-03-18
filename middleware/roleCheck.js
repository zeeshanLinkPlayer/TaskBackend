// Middleware for role-based access control
const roleCheck = (roles) => {
  return (req, res, next) => {
    console.log("Middleware hit: roleCheck");

    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Please login first.' });
    }
    console.log(req.user.role,"user")
    console.log(roles,"roles")
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden. You do not have permission to access this resource.' 
      });
    }
    
    // User has the required role
    next();
  };
};

module.exports = roleCheck;
