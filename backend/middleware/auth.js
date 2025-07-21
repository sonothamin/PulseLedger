const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../utils/permissions');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies['access_token'] || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { 
      include: [{ 
        model: Role, 
        attributes: ['id', 'name', 'permissions'] 
      }] 
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid or inactive user',
        code: 'INVALID_USER'
      });
    }
    
    // Add user and permissions to request
    req.user = user;
    req.userPermissions = user.Role?.permissions || [];
    
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

const authorize = (requiredPermissions = []) => (req, res, next) => {
  try {
    const userPermissions = req.userPermissions || [];
    
    // Super admin bypass
    if (userPermissions.includes('*')) {
      return next();
    }
    
    // No permissions required
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }
    
    // Check if user has any of the required permissions
    if (hasAnyPermission(userPermissions, requiredPermissions)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
      required: requiredPermissions,
      userPermissions: userPermissions
    });
  } catch (err) {
    console.error('Authorization error:', err);
    return res.status(500).json({ 
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_FAILED'
    });
  }
};

const requireAllPermissions = (requiredPermissions = []) => (req, res, next) => {
  try {
    const userPermissions = req.userPermissions || [];
    
    // Super admin bypass
    if (userPermissions.includes('*')) {
      return next();
    }
    
    // No permissions required
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }
    
    // Check if user has all required permissions
    if (hasAllPermissions(userPermissions, requiredPermissions)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Insufficient permissions - all required permissions needed',
      code: 'INSUFFICIENT_PERMISSIONS_ALL',
      required: requiredPermissions,
      userPermissions: userPermissions
    });
  } catch (err) {
    console.error('Authorization error:', err);
    return res.status(500).json({ 
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_FAILED'
    });
  }
};

const requirePermission = (permission) => (req, res, next) => {
  try {
    const userPermissions = req.userPermissions || [];
    
    // Super admin bypass
    if (userPermissions.includes('*')) {
      return next();
    }
    
    // Check if user has the specific permission
    if (hasPermission(userPermissions, permission)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
      required: [permission],
      userPermissions: userPermissions
    });
  } catch (err) {
    console.error('Authorization error:', err);
    return res.status(500).json({ 
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_FAILED'
    });
  }
};

module.exports = { 
  authenticate, 
  authorize, 
  requireAllPermissions, 
  requirePermission 
}; 