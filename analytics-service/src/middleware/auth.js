const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Verify JWT (issued by User or Operator Service — same secret)
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

// Reports require operator or admin role
const requireAdminOrOperator = (req, res, next) => {
  const operatorRoles = ['admin', 'operator', 'store_manager', 'mall_admin', 'super_admin'];
  if (!req.user || !operatorRoles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Operator or Admin role required' });
  next();
};

// Service-to-service calls must include x-api-key
const authenticateServiceKey = (req, res, next) => {
  if (req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
    logger.warn(`Bad service key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Invalid service API key' });
  }
  next();
};

module.exports = { authenticateToken, requireAdminOrOperator, authenticateServiceKey };
