const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Verifies JWT issued by User Service OR Operator Service (same secret)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    logger.warn(`JWT failed: ${error.message}`);
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Operators: role is store_manager / mall_admin / super_admin
const requireOperatorRole = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const operatorRoles = ['store_manager', 'mall_admin', 'super_admin', 'operator', 'admin'];
  if (!operatorRoles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Operator role required' });
  next();
};

// Optional auth — attaches user if token present, continues without error
const optionalAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* ignored */ }
  }
  next();
};

// Service-to-service internal key
const authenticateServiceKey = (req, res, next) => {
  if (req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
    logger.warn(`Bad service key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Invalid service API key' });
  }
  next();
};

module.exports = { authenticateToken, requireOperatorRole, optionalAuth, authenticateServiceKey };
